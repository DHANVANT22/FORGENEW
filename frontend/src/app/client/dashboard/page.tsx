'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { KanbanBoard } from '@/components/ui/KanbanBoard';
import { MilestoneTracker } from '@/components/ui/MilestoneTracker';
import { Button } from '@/components/ui/Button';

type Tab = 'Board' | 'Milestones' | 'Discussion';

export default function ClientDashboard() {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Board');
  const [clientUserId, setClientUserId] = useState<string>('');
  
  // Chat state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [commentContext, setCommentContext] = useState<{ type: 'task' | 'milestone'; id: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({ frequency: 'instant' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/client/project`, {credentials: 'include'})
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then(data => {
        setProject(data);
        setClientUserId(data.clientId || 'mock-client-id');
        
        const clientAccount = data.ClientAccount?.[0];
        if (clientAccount) {
          if (!clientAccount.hasSeenOnboarding) {
            setShowOnboarding(true);
          }
          if (clientAccount.notificationPrefs) {
            setNotificationPrefs(clientAccount.notificationPrefs as any);
          }
        }
        
        setLoading(false);
        return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${data.id}/messages`, {credentials: 'include'});
      })
      .then(res => res?.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load project or not logged in.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!project) return;
    
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}`);
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      newSocket.emit('join_project', project.id);
      newSocket.emit('client_online', project.id);
    });

    newSocket.on('receive_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      if (activeTab === 'Discussion') {
        newSocket.emit('mark_read', { projectId: project.id, userId: clientUserId });
      }
    });

    newSocket.on('task_moved', (data: any) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/client/project`, {credentials: 'include'})
        .then(res => res.json())
        .then(data => setProject(data))
        .catch(console.error);
    });

    newSocket.on('user_typing', (data: { senderName: string, isTyping: boolean }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (data.isTyping) next.add(data.senderName);
        else next.delete(data.senderName);
        return next;
      });
    });

    newSocket.on('messages_read', (data: { userId: string, time: string }) => {
      if (data.userId !== clientUserId) {
        setLastReadAt(data.time);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [project, activeTab, clientUserId]);

  useEffect(() => {
    if (activeTab === 'Discussion') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (socket && project) {
        socket.emit('mark_read', { projectId: project.id, userId: clientUserId });
      }
    }
  }, [messages, activeTab, socket, project, clientUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (socket && project) {
      socket.emit('typing', { projectId: project.id, senderName: 'Client', isTyping: true });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { projectId: project.id, senderName: 'Client', isTyping: false });
      }, 1500);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socket || !project) return;
    const payload: any = {
      projectId: project.id,
      senderName: 'Client',
      text: messageInput
    };
    if (commentContext) {
      if (commentContext.type === 'task') payload.taskId = commentContext.id;
      if (commentContext.type === 'milestone') payload.milestoneId = commentContext.id;
    }
    
    socket.emit('send_message', payload);
    socket.emit('typing', { projectId: project.id, senderName: 'Client', isTyping: false });
    setMessageInput('');
    setCommentContext(null);
  };

  const handleAnchorComment = (type: 'task' | 'milestone', id: string) => {
    setCommentContext({ type, id });
  };

  const handleApproveMilestone = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/client/milestones/${id}/approve`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (res.ok) {
        // Refresh project data
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/client/project`, {credentials: 'include'})
          .then(res => res.json())
          .then(data => setProject(data))
          .catch(console.error);
      } else {
        alert('Failed to approve milestone');
      }
    } catch (e) {
      console.error(e);
      alert('Error approving milestone');
    }
  };

  const finishOnboarding = async () => {
    setShowOnboarding(false);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/client/onboarding/complete`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch(e) { console.error(e) }
  };

  const saveSettings = async () => {
    setShowSettings(false);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/client/settings/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefs: notificationPrefs }),
        credentials: 'include'
      });
    } catch(e) { console.error(e) }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-on-surface">Loading...</div>;

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="text-danger">{error}</div>
        <Button onClick={() => window.location.href = '/client/login'}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md animate-fade-in-up">
      {/* Top Navigation */}
      <header className="h-auto md:h-[60px] py-4 md:py-0 border-b border-outline-variant/20 bg-surface-container-low flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10 shadow-[0_0_10px_rgba(var(--shadow-brand-rgb), 0.1)] gap-4 md:gap-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0">H</div>
          <div>
            <h1 className="text-sm font-display font-bold text-on-surface leading-none tracking-tight break-all">{project.name}</h1>
            <span className="font-mono text-[10px] text-primary uppercase tracking-widest">Client Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>Settings</Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/client/login'}>Sign Out</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-container-max mx-auto w-full px-4 md:px-8 py-8 flex flex-col">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
          {(['Board', 'Milestones', 'Discussion'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 font-mono text-sm tracking-wider uppercase border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'Board' && (
            <div className="h-[calc(100vh-250px)]">
              {project.columns && project.columns.length > 0 ? (
                <KanbanBoard 
                  initialColumns={project.columns} 
                  projectId={project.id} 
                  isAdmin={false}
                  onTaskComment={(id) => handleAnchorComment('task', id)}
                />
              ) : (
                <div className="text-on-surface-variant font-mono text-sm italic p-12 text-center bg-surface-container/30 rounded-xl border border-border border-dashed">
                  No visible columns available.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Milestones' && (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-display font-bold text-on-surface mb-6">Project Milestones</h2>
              {project.Milestone && project.Milestone.length > 0 ? (
                <MilestoneTracker 
                  milestones={project.Milestone.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    date: m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'TBD',
                    status: m.status === 'Current' ? 'current' : m.status === 'Completed' ? 'completed' : 'upcoming',
                    requiresApproval: m.requiresApproval
                  }))} 
                  onComment={(id) => handleAnchorComment('milestone', id)}
                  onApprove={(id) => handleApproveMilestone(id)}
                />
              ) : (
                <div className="text-on-surface-variant font-mono text-sm italic p-12 text-center bg-surface-container/30 rounded-xl border border-border border-dashed">
                  No milestones defined yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Discussion' && (
            <div className="flex flex-col h-[calc(100vh-250px)] min-h-[400px] bg-[#16161A] rounded-xl overflow-hidden border border-[#242428]">
              <div className="p-4 border-b border-[#242428] bg-surface-container-low flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">forum</span>
                  <h2 className="font-display text-lg text-on-surface">Team Discussion</h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#0A0A0B]">
                {messages.length === 0 && (
                  <div className="text-center text-on-surface-variant text-sm py-8 font-mono">No messages yet. Start the conversation!</div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.senderName === 'Client';
                  const isLastMessage = idx === messages.length - 1;
                  const isRead = isLastMessage && isMe && lastReadAt && new Date(lastReadAt) >= new Date(msg.createdAt);
                  
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'items-end self-end' : 'items-start'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                        {!isMe && <span className="font-mono text-[12px] text-on-surface-variant">{msg.senderName}</span>}
                        <span className="font-mono text-[10px] text-tertiary-container">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {isMe && <span className="font-mono text-[12px] text-primary">You</span>}
                      </div>
                      <div className={`p-4 text-sm font-body-md ${
                        isMe 
                          ? 'bg-[rgba(var(--shadow-brand-rgb), 0.10)] border border-primary/30 rounded-2xl rounded-tr-sm text-on-surface' 
                          : 'bg-[#16161A] border border-[#242428] rounded-2xl rounded-tl-sm text-on-surface'
                      }`}>
                        {(msg.taskId || msg.milestoneId) && (
                          <div className="mb-2 text-[10px] font-mono uppercase bg-black/30 px-2 py-1 rounded inline-block text-primary">
                            Re: {msg.taskId ? 'Task' : 'Milestone'} {msg.taskId || msg.milestoneId}
                          </div>
                        )}
                        <div className="break-words">{msg.text}</div>
                      </div>
                      {isRead && (
                        <div className="text-[10px] text-primary/70 font-mono mt-1 pr-1">Read</div>
                      )}
                    </div>
                  );
                })}
                {typingUsers.size > 0 && (
                  <div className="flex items-center gap-2 text-on-surface-variant italic font-mono text-xs mb-2">
                    <span className="flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce" style={{animationDelay: '100ms'}}>.</span>
                      <span className="animate-bounce" style={{animationDelay: '200ms'}}>.</span>
                    </span>
                    {Array.from(typingUsers).join(', ')} {typingUsers.size > 1 ? 'are' : 'is'} typing
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-3 md:p-4 border-t border-[#242428] bg-surface-container-low flex flex-col gap-2">
                {commentContext && (
                  <div className="flex justify-between items-center bg-primary/10 border border-primary/20 px-3 py-2 rounded">
                    <span className="text-xs font-mono text-primary">
                      Replying to {commentContext.type} {commentContext.id}
                    </span>
                    <button onClick={() => setCommentContext(null)} className="text-xs text-muted hover:text-on-surface">&times; Cancel</button>
                  </div>
                )}
                <div className="flex gap-2 md:gap-4">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 bg-[#0A0A0B] border border-[#242428] rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md transition-all" 
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button className="btn-primary px-8 flex items-center gap-2" onClick={sendMessage}>
                    Send
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="bg-surface-container border border-border p-6 md:p-8 rounded-xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-display font-bold text-on-surface mb-4">Welcome to your Portal!</h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Here you can track your project's progress in real-time.
              <br/><br/>
              • <strong>Board:</strong> See active tasks and what's coming next.<br/>
              • <strong>Milestones:</strong> Track major deliverables and approve them.<br/>
              • <strong>Discussion:</strong> Chat directly with our team.
            </p>
            <Button className="w-full btn-primary" onClick={finishOnboarding}>Get Started</Button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="bg-surface-container border border-border p-6 md:p-8 rounded-xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-display font-bold text-on-surface mb-4">Notification Preferences</h2>
            <div className="flex flex-col gap-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="freq" 
                  checked={notificationPrefs.frequency === 'instant'} 
                  onChange={() => setNotificationPrefs({ frequency: 'instant' })}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-on-surface">Instant Notifications (Notify on every message)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="freq" 
                  checked={notificationPrefs.frequency === 'daily'} 
                  onChange={() => setNotificationPrefs({ frequency: 'daily' })}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-on-surface">Daily Digest (Batch notifications)</span>
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button className="btn-primary" onClick={saveSettings}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Thread Modal */}
      {commentContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="bg-[#16161A] border border-[#242428] rounded-xl max-w-xl w-full h-[min(600px,85vh)] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#242428] bg-surface-container-low flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">forum</span>
                <h2 className="font-display text-lg text-on-surface">Thread: {commentContext.type} {commentContext.id.substring(0, 6)}</h2>
              </div>
              <button onClick={() => setCommentContext(null)} className="text-muted hover:text-on-surface p-2">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#0A0A0B]">
              {messages.filter(m => commentContext.type === 'task' ? m.taskId === commentContext.id : m.milestoneId === commentContext.id).length === 0 ? (
                <div className="text-center text-on-surface-variant text-sm py-8 font-mono">No comments on this {commentContext.type} yet.</div>
              ) : (
                messages.filter(m => commentContext.type === 'task' ? m.taskId === commentContext.id : m.milestoneId === commentContext.id).map(msg => (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.senderName === 'Client' ? 'items-end self-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.senderName !== 'Client' && <span className="font-mono text-[10px] text-on-surface-variant">{msg.senderName}</span>}
                      <span className="font-mono text-[9px] text-tertiary-container">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className={`p-3 text-sm font-body-md break-words ${msg.senderName === 'Client' ? 'bg-[rgba(var(--shadow-brand-rgb), 0.10)] border border-primary/30 rounded-2xl rounded-tr-sm' : 'bg-[#16161A] border border-[#242428] rounded-2xl rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 md:p-4 border-t border-[#242428] bg-surface-container-low flex gap-2 md:gap-3 shrink-0">
              <input 
                type="text" 
                placeholder="Reply to thread..." 
                className="flex-1 bg-[#0A0A0B] border border-[#242428] rounded-lg px-4 py-2 text-sm text-on-surface outline-none focus:border-primary" 
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button className="btn-primary px-6" onClick={sendMessage}>Reply</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
