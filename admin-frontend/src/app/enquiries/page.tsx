'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  senderName: string;
  createdAt: string;
  clientNonce?: string;
}

interface Enquiry {
  id: string;
  projectId?: string | null;
  conversationId?: string | null;
  clientName: string;
  clientEmail: string;
  type: 'SCOPE_ESTIMATE' | 'PROJECT_DISCUSSION' | 'GENERAL_LEAD';
  status: 'NEW' | 'IN_PROGRESS' | 'REPLIED' | 'RESOLVED';
  createdAt: string;
  latestMessage: string;
  messages: Message[];
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'SCOPE' | 'REPLIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const token = 'ADMIN_DEMO_TOKEN';

  const fetchEnquiries = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/enquiries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEnquiries(data);
          if (data.length > 0 && !selectedEnquiryId) {
            setSelectedEnquiryId(data[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching enquiries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();

    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('receive_message', () => {
      fetchEnquiries();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [API_URL]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedEnquiryId, enquiries]);

  const selectedEnquiry = enquiries.find(e => e.id === selectedEnquiryId) || enquiries[0];

  const handleSendReply = async (textToSend?: string) => {
    const text = textToSend || replyText;
    if (!text.trim() || !selectedEnquiry) return;
    setSending(true);

    const payload = {
      text: text.trim(),
      projectId: selectedEnquiry.projectId
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/admin/enquiries/${selectedEnquiry.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setReplyText('');
        fetchEnquiries();
      }
    } catch (e) {
      console.error('Error sending reply:', e);
    } finally {
      setSending(false);
    }
  };

  // Clean Formatted Message Renderer
  const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    return (
      <div className="space-y-1.5 font-sans text-xs leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          if (trimmed.includes('[NEW PROJECT BRIEF') || trimmed.includes('[ESTIMATE ENQUIRY]')) {
            const cleanTitle = trimmed.replace(/\*\*/g, '').replace(/📋/g, '').trim();
            return (
              <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold font-mono text-[11px] mb-2">
                <span className="material-symbols-outlined text-[14px]">assignment</span>
                <span>{cleanTitle}</span>
              </div>
            );
          }

          if (trimmed.includes('**') || trimmed.includes(':')) {
            const cleanLine = trimmed.replace(/\*\*/g, '');
            const colonIdx = cleanLine.indexOf(':');
            if (colonIdx !== -1) {
              const key = cleanLine.slice(0, colonIdx).trim();
              const val = cleanLine.slice(colonIdx + 1).trim();
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-white/5 text-xs gap-1">
                  <span className="text-slate-400 font-medium text-[11px]">{key}</span>
                  <span className="text-slate-100 font-semibold">{val}</span>
                </div>
              );
            }
          }

          return (
            <p key={idx} className="text-slate-300 font-sans leading-relaxed">
              {trimmed.replace(/\*\*/g, '')}
            </p>
          );
        })}
      </div>
    );
  };

  const filteredEnquiries = enquiries.filter(e => {
    if (filter === 'NEW' && e.status !== 'NEW') return false;
    if (filter === 'SCOPE' && e.type !== 'SCOPE_ESTIMATE') return false;
    if (filter === 'REPLIED' && e.status !== 'REPLIED') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.clientName.toLowerCase().includes(q) ||
        e.clientEmail.toLowerCase().includes(q) ||
        e.latestMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24 font-sans space-y-6 text-slate-200">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-xs text-cyan-400 tracking-widest uppercase font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>REAL-TIME DISCUSSION INBOX</span>
          </div>
          <h1 className="text-display-xl font-bold text-slate-100">
            Client Inquiries & Scope Proposals
          </h1>
          <p className="text-ui-sm text-slate-400 mt-0.5">
            Synchronized live messaging thread with client workspaces and inbound scope requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {enquiries.length} Active Channels
          </span>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        
        {/* Left Side: Thread Directory (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full card-level-1 overflow-hidden">
          
          {/* Filter Bar & Search */}
          <div className="p-4 border-b border-white/5 flex flex-col gap-3 bg-slate-950/60">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search leads, clients, keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="neu-input w-full pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-sans"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto font-mono text-[10px]">
              {(['ALL', 'NEW', 'SCOPE', 'REPLIED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg font-semibold uppercase transition-all ${
                    filter === f
                      ? 'btn-primary text-slate-950 shadow-md'
                      : 'btn-secondary text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
            {loading ? (
              <div className="text-center py-20 text-xs font-mono text-slate-400">
                Loading client inquiries...
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="text-center py-20 text-xs font-mono text-slate-400">
                No discussion threads matching filter.
              </div>
            ) : (
              filteredEnquiries.map(e => {
                const isSelected = e.id === selectedEnquiryId;
                const isNew = e.status === 'NEW';
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEnquiryId(e.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'card-level-2 border-cyan-400/60 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                        : 'hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {isNew && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                        <span className="font-semibold text-sm text-slate-100 truncate">
                          {e.clientName || 'Client Lead'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-slate-900 border border-white/5 ${
                        e.status === 'REPLIED' ? 'text-emerald-400' : 'text-cyan-400'
                      }`}>
                        {e.status}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-cyan-400 truncate">
                      {e.clientEmail}
                    </span>

                    <p className="text-xs text-slate-400 line-clamp-2 font-sans">
                      {e.latestMessage || 'No preview text available'}
                    </p>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
                      <span>{e.messages?.length || 1} messages</span>
                      <span>{new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Discussion Studio (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full card-level-1 overflow-hidden">
          {selectedEnquiry ? (
            <>
              {/* Studio Header */}
              <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
                <div>
                  <h2 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                    <span>{selectedEnquiry.clientName}</span>
                    <span className="text-xs font-mono text-slate-400 font-normal">({selectedEnquiry.clientEmail})</span>
                  </h2>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mt-0.5">
                    Channel ID: {selectedEnquiry.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 text-emerald-400 border border-emerald-500/20 font-semibold">
                    ● Live Sync
                  </span>
                </div>
              </div>

              {/* Chat Thread Message Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/30">
                {selectedEnquiry.messages && selectedEnquiry.messages.length > 0 ? (
                  selectedEnquiry.messages.map((msg) => {
                    const isAdmin = msg.senderName === 'Admin' || msg.senderName === 'Engineering Lead';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-semibold text-slate-400">
                            {msg.senderName}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] p-4 rounded-xl shadow-md ${
                            isAdmin
                              ? 'bg-cyan-500/10 border border-cyan-500/30 text-slate-100 rounded-tr-none'
                              : 'card-level-2 text-slate-100 rounded-tl-none'
                          }`}
                        >
                          {renderFormattedText(msg.text)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-20 text-xs font-mono text-slate-400">
                    No message history recorded yet for this inquiry channel.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Box */}
              <div className="p-4 border-t border-white/5 bg-slate-950/60 flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Type response to client..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply();
                  }}
                  className="neu-input flex-1 px-4 py-3 text-xs text-slate-100 placeholder:text-slate-400 font-sans"
                />
                <Button
                  onClick={() => handleSendReply()}
                  disabled={sending || !replyText.trim()}
                  variant="primary"
                  size="md"
                >
                  {sending ? 'Sending...' : 'Send'}
                  <span className="material-symbols-outlined text-sm">send</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs font-mono text-slate-400">
              Select an inquiry thread on the left to begin discussion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
