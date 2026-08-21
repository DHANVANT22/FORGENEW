'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Panel, LedIndicator } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';

export default function ControlCentreEditor() {
  const { id } = useParams();
  const [idea, setIdea] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState(0);
  const [slug, setSlug] = useState('');
  const [revisions, setRevisions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'claude' | 'openai' | 'gemini'>('claude');
  const [providerStatus, setProviderStatus] = useState({ claude: false, openai: false, gemini: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, analyzing]);

  // Conflict state
  const [conflict, setConflict] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);

  const fetchIdea = async () => {
    try {
      const [ideaRes, revRes, statusRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}`, { headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}/revisions`, { headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/provider-status`, { headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' } })
      ]);

      if (ideaRes.ok) {
        const data = await ideaRes.json();
        setIdea(data);
        setTitle(data.title);
        setContent(data.content);
        setVersion(data.version);
        setSlug(data.slug);
      }
      if (revRes.ok) {
        setRevisions(await revRes.json());
      }
      if (statusRes.ok) {
        setProviderStatus(await statusRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}/chat`, { headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' } });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.map((m: any) => {
          let parsedTitle = '';
          let parsedContent = m.content;
          if (m.type === 'document') {
            try {
              const parsed = JSON.parse(m.content);
              if (parsed.title) parsedTitle = parsed.title;
              if (parsed.content) parsedContent = parsed.content;
            } catch (e) {}
          }
          return {
            role: m.role,
            type: m.type,
            title: parsedTitle,
            content: parsedContent,
            providerUsed: m.providerUsed,
            author: m.author
          };
        }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchIdea();
    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSave = async (forceOverwrite = false) => {
    setSaving(true);
    try {
      const reqVersion = forceOverwrite ? conflict?.currentVersion || version : version;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ADMIN_DEMO_TOKEN'
        },
        body: JSON.stringify({
          title,
          content,
          version: reqVersion,
          changeSummary: forceOverwrite ? 'Force overwritten conflict' : 'Updated content'
        })
      });

      if (res.status === 409) {
        const conflictData = await res.json();
        setConflict(conflictData);
        setSaving(false);
        return;
      }

      if (res.ok) {
        const updated = await res.json();
        setVersion(updated.version);
        setConflict(null);
        // Refresh revisions
        const revRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}/revisions`, { headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' } });
        if (revRes.ok) setRevisions(await revRes.json());
        
        // Success flash
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 1000);
      } else {
        alert('Failed to save idea');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving idea');
    }
    setSaving(false);
  };

  const handleRestore = async (revId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}/revisions/${revId}`, { headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' } });
      if (res.ok) {
        const revData = await res.json();
        setContent(revData.content);
        setSelectedRevision(null);
        setShowHistory(false);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to load revision');
    }
  };

  const downloadMarkdown = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}/export`, { headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' } });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert('Error downloading');
    }
  };

  const downloadContentAsMarkdown = (fileContent: string, fileName: string) => {
    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const currentInput = chatInput;
    const newMessages = [...chatMessages, { role: 'user', content: currentInput, author: 'You' } as any];
    setChatMessages(newMessages);
    setChatInput('');
    setAnalyzing(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ADMIN_DEMO_TOKEN'
        },
        body: JSON.stringify({ 
            ideaId: id,
            messages: newMessages, 
            currentContent: content,
            provider: selectedProvider
        })
      });

      if (res.ok) {
        const data = await res.json();
        let parsedType: 'chat' | 'document' = 'chat';
        let parsedTitle = '';
        let parsedContent = data.result;
        
        try {
          const parsed = JSON.parse(data.result);
          if (parsed.type) parsedType = parsed.type;
          if (parsed.title) parsedTitle = parsed.title;
          if (parsed.content) parsedContent = parsed.content;
        } catch (e) {}
        
        const newAssistantMsg = { 
          role: 'assistant', 
          type: parsedType, 
          title: parsedTitle, 
          content: parsedContent, 
          providerUsed: data.providerUsed, 
          author: data.providerUsed 
        };
        
        if (data.providerUsed && data.providerUsed !== selectedProvider) {
          setChatMessages((prev) => [
            ...prev, 
            { role: 'system', content: `${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} is unavailable right now — answered by ${data.providerUsed.charAt(0).toUpperCase() + data.providerUsed.slice(1)}.` } as any, 
            newAssistantMsg
          ]);
        } else {
          setChatMessages((prev) => [...prev, newAssistantMsg]);
        }

        if (parsedType === 'document') {
          downloadContentAsMarkdown(parsedContent, `${slug}-v${version + 1}-${new Date().toISOString().split('T')[0]}.md`);
          try {
            const saveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ADMIN_DEMO_TOKEN'
              },
              body: JSON.stringify({
                title,
                content: parsedContent,
                version: version,
                changeSummary: `Auto-generated by ${data.providerUsed} (Prompt: ${currentInput.substring(0, 30)}...)`
              })
            });
            if (saveRes.ok) {
               const updated = await saveRes.json();
               setVersion(updated.version);
               setContent(updated.content);
               const revRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/control-centre/ideas/${id}/revisions`, { headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' } });
               if (revRes.ok) setRevisions(await revRes.json());
            }
          } catch(e) {
            console.error('Auto-save failed:', e);
          }
        }

      } else {
        const data = await res.json().catch(() => ({}));
        const errText = data.error || `Couldn't reach ${selectedProvider.toUpperCase()} — please try again.`;
        setChatMessages(prev => [...prev, { role: 'system', error: true, content: errText }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'system', error: true, content: `Couldn't reach ${selectedProvider.toUpperCase()} — please try again.` }]);
    }
    setAnalyzing(false);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted font-mono animate-fade-in-up">Loading terminal interface...</div>;

  const htmlContent = marked.parse(content) as string;

  return (
    <div className="p-8 max-w-[1800px] mx-auto flex flex-col h-[calc(100vh-2rem)] animate-fade-in-up">
      {conflict && (
        <Panel className="mb-6 bg-brand-primary-bright/10 border border-brand-primary-bright/30 p-6 flex items-center justify-between shadow-[0_4px_24px_rgba(var(--shadow-brand-rgb), 0.15)] animate-fade-in-up">
          <div>
            <h3 className="text-xl font-display font-bold text-brand-primary-bright mb-2">Edit Conflict Detected</h3>
            <p className="text-text-strong font-mono text-sm">This idea was updated by someone else while you were editing.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-brand-primary-bright/30 text-brand-primary-bright hover:bg-brand-primary-bright/10 active:scale-[0.98]" onClick={() => {
              setContent(conflict.currentContent);
              setVersion(conflict.currentVersion);
              setConflict(null);
            }}>Reload and lose my changes</Button>
            <Button className="bg-brand-primary-bright hover:bg-brand-primary-bright text-bg-deep shadow-danger/20 active:scale-[0.98]" onClick={() => handleSave(true)}>Overwrite anyway</Button>
          </div>
        </Panel>
      )}

      <div className="flex justify-between items-center mb-6 pb-4 shrink-0 gap-4">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <input
            type="text"
            placeholder="Idea Title"
            className="w-full bg-transparent border-none text-4xl font-display font-bold focus:outline-none text-text-strong placeholder:text-text-muted truncate"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <LedIndicator status="active" />
            <span className="text-sm font-mono text-text-muted truncate">Version {version} • /ideas/{slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
          <Button variant="outline" onClick={() => { setIsChatOpen(!isChatOpen); setShowHistory(false); }} className={`flex items-center gap-2 border-primary/50 text-primary hover:bg-primary/10 active:scale-[0.98] ${isChatOpen ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Chat with AI
          </Button>
          <Button variant="outline" onClick={downloadMarkdown} className="flex items-center gap-2 active:scale-[0.98] hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download .md
          </Button>
          <Button variant="outline" onClick={() => { setShowHistory(!showHistory); setIsChatOpen(false); }} className={`flex items-center gap-2 active:scale-[0.98] transition-all hover:bg-white/5 ${showHistory ? 'bg-white/5 border-white/50 text-white' : ''}`}>
            <span className="material-symbols-outlined text-[18px]">history</span>
            History
          </Button>
          <Button 
            onClick={() => handleSave(false)} 
            className={`px-6 transition-all active:scale-[0.98] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)] ${saveSuccess ? 'bg-success hover:bg-success text-bg-deep shadow-[0_0_20px_rgba(53,196,122,0.4)]' : ''}`} 
            disabled={saving}
          >
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative items-stretch gap-[2px] bg-border/50 rounded-[6px] p-[2px]">
        {/* Editor Side */}
        <Panel className={`flex flex-col border-0 rounded-r-none transition-all duration-300 relative ${showHistory || isChatOpen ? 'w-1/3' : 'w-1/2'}`}>
          <div className="p-4 border-b border-border bg-bg-deep flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest">Markdown Editor</span>
          </div>
          <textarea
            className="flex-1 w-full p-6 bg-transparent border-none resize-none font-[family-name:var(--font-mono-readout)] text-sm leading-relaxed text-brand-primary-bright/90 focus:outline-none focus:ring-0 placeholder:text-brand-primary-bright/30 selection:bg-brand-primary-bright/30 selection:text-white"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your idea in Markdown..."
            spellCheck={false}
          />
        </Panel>
        
        {/* Physical Divider */}
        <div className="w-[4px] bg-gradient-to-r from-bg-deep via-border to-bg-deep shadow-[inset_0_0_4px_rgba(0,0,0,0.5)] z-10 cursor-col-resize shrink-0"></div>

        {/* Preview Side */}
        <Panel className={`flex flex-col border-0 rounded-l-none overflow-hidden relative transition-all duration-300 ${showHistory || isChatOpen ? 'w-1/3' : 'w-1/2'}`}>
          <div className="p-4 border-b border-border bg-bg-deep flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <LedIndicator status="active" />
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">Live Preview</span>
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto p-8 text-text-strong bg-bg prose prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-white prose-h1:text-2xl prose-h1:border-b prose-h1:border-border/40 prose-h1:pb-2 prose-h2:text-xl prose-h2:text-[#82C4DE] prose-h3:text-base prose-h3:text-neutral-200 prose-strong:text-white prose-strong:font-bold prose-em:text-[#82C4DE] prose-a:text-primary hover:prose-a:text-primary-hover prose-pre:bg-black prose-pre:border-l-2 prose-pre:border-l-[#5CA8C9] prose-pre:border prose-pre:border-border/60 prose-pre:p-4 prose-pre:font-mono prose-code:text-[#82C4DE] prose-code:bg-black/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-border/40 prose-ul:text-neutral-300 prose-li:marker:text-neutral-500 prose-ol:marker:text-neutral-500 prose-blockquote:border-l-2 prose-blockquote:border-l-[#5CA8C9] prose-blockquote:text-neutral-400 prose-blockquote:bg-surface-container/20 prose-blockquote:p-3 prose-blockquote:rounded-r"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </Panel>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '33.333333%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex border-l border-border/50 ml-[2px]"
            >
              <Panel className="w-full flex flex-col border-0 rounded-l-none overflow-hidden">
                <div className="p-4 border-b border-border bg-bg-deep flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-strong uppercase tracking-widest">Version Timeline</span>
                  <button onClick={() => setShowHistory(false)} className="text-text-muted hover:text-text-strong">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-border"></div>
                  <div className="absolute left-[31px] top-6 w-0.5 bg-primary transition-all duration-700" style={{ height: '100%' }}></div>
                  
                  {revisions.map((rev, idx) => (
                    <div
                      key={rev.id}
                      className="relative pl-12 pb-8 last:pb-0 group"
                    >
                      {/* Node */}
                      <div className={`absolute left-3 top-1 w-4 h-4 rounded-full border-2 ${selectedRevision?.id === rev.id ? 'border-primary bg-bg-deep' : 'border-primary bg-primary'} z-10 transition-colors`}></div>
                      
                      <div 
                        className={`p-4 border rounded cursor-pointer transition-colors ${selectedRevision?.id === rev.id ? 'border-primary bg-primary/5' : 'border-border bg-bg-deep hover:border-primary/50'}`}
                        onClick={() => setSelectedRevision(rev)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-mono text-sm font-bold text-text-strong">v{rev.version}</span>
                          <span className="font-mono text-xs text-text-muted">{new Date(rev.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-text-muted mb-2 font-mono">{rev.changeSummary || 'No summary'}</p>
                        
                        {selectedRevision?.id === rev.id && (
                          <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                            <Button size="sm" onClick={() => handleRestore(rev.id)} className="active:scale-[0.98]">Restore</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Panel - Modal Overlay */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-modals)] isolate bg-bg/80 flex items-center justify-center p-8 backdrop-blur-sm"
            >
              <motion.div
                 initial={{ clipPath: 'inset(100% 0 0 0)' }}
                 animate={{ clipPath: 'inset(0% 0 0 0)' }}
                 exit={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}
                 transition={{ duration: 0.3, ease: 'easeOut' }}
                 className="w-full max-w-4xl h-[85vh] flex flex-col pointer-events-auto"
              >
                <Panel className="w-full h-full flex flex-col border border-primary/30 shadow-[0_0_40px_rgba(255,179,175,0.1)] overflow-hidden relative ai-chat-modal-panel">
                  <div className="p-4 border-b border-border bg-bg-deep flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
                      <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">AI Terminal</span>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="text-text-muted hover:text-text-strong transition-colors">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  {/* Provider Selector (Toggle Switch layout) */}
                  <div className="flex border-b border-border/50 p-2 gap-2 justify-center bg-bg relative">
                    {(['claude', 'openai', 'gemini'] as const).map(provider => {
                      const config = {
                        claude: { name: 'Claude', icon: 'auto_awesome' },
                        openai: { name: 'OpenAI', icon: 'radio_button_unchecked' },
                        gemini: { name: 'Gemini', icon: 'diamond' }
                      }[provider];
                      
                      const isActive = selectedProvider === provider;
                      
                      return (
                        <button
                          key={provider}
                          onClick={() => setSelectedProvider(provider)}
                          className={`relative flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all duration-300 rounded ${
                            isActive ? 'text-primary' : 'text-text-muted hover:text-text-strong'
                          }`}
                        >
                          {isActive && (
                             <motion.div 
                               layoutId="provider-highlight"
                               className="absolute inset-0 bg-primary/10 border border-primary/30 rounded"
                             />
                          )}
                          <div className="relative z-10 flex items-center gap-2">
                            <LedIndicator status={providerStatus[provider] ? 'active' : 'idle'} />
                            <span>{config.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-bg">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                        <span className="material-symbols-outlined text-4xl mb-3 text-primary/40">terminal</span>
                        <p className="text-sm font-mono max-w-[250px]">Awaiting input... I can help you structure or expand your notes.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'user' ? (
                            <div className="p-3 px-5 border border-border bg-surface-container text-text-strong font-mono text-sm max-w-[85%]">
                              {msg.content}
                            </div>
                          ) : msg.type === 'document' ? (
                            <Panel className="w-full max-w-[85%] border border-primary/30 text-text-strong text-sm flex flex-col overflow-hidden ai-generated-doc-panel">
                              <div className="bg-bg-deep px-4 py-2 border-b border-primary/30 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                                  <span className="font-bold font-mono uppercase text-[10px] tracking-widest text-primary">{msg.title || 'Generated Document'}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button size="sm" variant="outline" className="text-xs py-1 px-3 h-auto border-border hover:border-primary/50 text-text-strong hover:bg-primary/10 active:scale-[0.96]" onClick={() => { setContent(msg.content); setIsChatOpen(false); }}>Replace</Button>
                                  <Button size="sm" variant="outline" className="text-xs py-1 px-3 h-auto border-border hover:border-primary/50 text-text-strong hover:bg-primary/10 active:scale-[0.96]" onClick={() => { setContent(prev => prev + (prev ? '\n\n' : '') + msg.content); setIsChatOpen(false); }}>Append</Button>
                                  <Button size="sm" variant="outline" className="text-xs py-1 px-2 h-auto border-border active:scale-[0.96]" onClick={() => downloadContentAsMarkdown(msg.content, `${(msg.title || 'document').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`)}>
                                    <span className="material-symbols-outlined text-[14px]">download</span>
                                  </Button>
                                </div>
                              </div>
                              <div className="p-5 overflow-y-auto max-h-96 bg-bg">
                                <div 
                                  className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-bg-deep prose-pre:border prose-pre:border-border prose-pre:font-mono prose-a:text-primary break-words text-sm opacity-90"
                                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                                />
                              </div>
                            </Panel>
                          ) : (
                            <div 
                              className="p-4 bg-bg-deep border border-border border-l-2 border-l-primary text-text-strong font-mono text-sm max-w-[85%] prose prose-invert prose-p:leading-relaxed prose-pre:bg-bg prose-pre:border prose-pre:border-border prose-a:text-primary break-words"
                              dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                            />
                          )}
                        </div>
                      ))
                    )}
                    {analyzing && (
                      <div className="flex justify-start">
                        <div className="px-4 py-3 bg-bg-deep border border-border border-l-2 border-l-primary text-text-muted text-sm flex items-center gap-2 font-mono uppercase tracking-widest">
                           <span className="w-1.5 h-4 bg-primary animate-pulse"></span>
                           Processing...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-border/50 bg-bg-deep">
                    <div className="relative flex items-end gap-2 bg-bg border border-border focus-within:border-primary/50 transition-colors p-2 shadow-inner">
                      <span className="text-primary font-mono pl-2 pt-2 animate-pulse">_</span>
                      <textarea
                        placeholder="CMD > "
                        className="flex-1 bg-transparent py-2 px-1 text-sm font-mono text-text-strong focus:outline-none resize-none max-h-32 min-h-[40px] leading-relaxed scrollbar-hide placeholder:text-text-muted/50"
                        rows={1}
                        value={chatInput}
                        onChange={(e) => {
                          setChatInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                        }}
                        onKeyDown={handleChatKeyDown}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={analyzing || !chatInput.trim()} 
                        className="w-10 h-10 p-0 flex items-center justify-center bg-primary hover:bg-primary text-bg-deep disabled:opacity-50 transition-all active:scale-95 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">keyboard_return</span>
                      </Button>
                    </div>
                  </div>
                </Panel>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
