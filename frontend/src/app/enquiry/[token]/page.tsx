'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Panel, LedIndicator } from '@/components/ui';
import { Button } from '@/components/ui/Button';

export default function EnquiryPage() {
  const { token } = useParams() as { token: string };
  const [enquiry, setEnquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchEnquiry = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/enquiries/${token}`);
      if (res.ok) {
        const data = await res.json();
        setEnquiry(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiry();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchEnquiry();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [token]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSending(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/enquiries/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        await fetchEnquiry();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-deep py-20 px-6 flex items-center justify-center text-text-muted font-mono">
        Loading enquiry context...
      </main>
    );
  }

  if (!enquiry) {
    return (
      <main className="min-h-screen bg-bg-deep py-20 px-6 flex items-center justify-center text-text-muted font-mono">
        Enquiry not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-deep py-12 px-6 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      <div className="max-w-4xl w-full mx-auto relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Context & Estimate Data */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <div className="font-mono text-xs text-brand-primary-bright tracking-widest uppercase mb-3 font-bold inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-primary-bright animate-pulse"></span>
              ENQUIRY // {enquiry.token.substring(0, 8)}
            </div>
            <h1 className="text-3xl font-display font-bold text-text-strong mb-2">Project Context</h1>
          </div>

          <Panel className="p-6 border border-border">
            <h3 className="text-sm font-bold text-text-strong font-mono uppercase tracking-widest mb-4 border-b border-border pb-2">Client Details</h3>
            <div className="space-y-3 font-mono text-sm">
              <div>
                <span className="text-text-muted">Name:</span> <span className="text-text-strong">{enquiry.clientName}</span>
              </div>
              <div>
                <span className="text-text-muted">Email:</span> <span className="text-text-strong">{enquiry.clientEmail}</span>
              </div>
            </div>
          </Panel>

          <Panel className="p-6 border border-border">
            <h3 className="text-sm font-bold text-text-strong font-mono uppercase tracking-widest mb-4 border-b border-border pb-2">Estimate Context</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">Tier</div>
                <div className="text-xl font-display font-bold text-brand-primary-bright drop-shadow-[0_0_10px_rgba(var(--shadow-brand-rgb),0.3)]">
                  {enquiry.estimateData?.tier || 'Unknown'}
                </div>
              </div>
            </div>
          </Panel>

          {enquiry.pulseToken && (
            <Panel className="p-6 border border-brand-primary-bright bg-brand-primary-bright/5 cursor-pointer hover:bg-brand-primary-bright/10 transition-colors" onClick={() => window.open(`/pulse/${enquiry.pulseToken}`, '_blank')}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-brand-primary-bright font-mono uppercase tracking-widest flex items-center gap-2">
                  <LedIndicator status="active" /> Delivery Pulse
                </h3>
                <span className="material-symbols-outlined text-brand-primary-bright">open_in_new</span>
              </div>
              <p className="text-xs font-mono text-text-muted mt-2">
                Your project has been provisioned. Click to view live delivery status.
              </p>
            </Panel>
          )}
        </div>

        {/* Right Column: Chat Thread */}
        <div className="md:col-span-2">
          <Panel className="h-full flex flex-col border border-border min-h-[600px]">
            <div className="p-4 border-b border-border bg-surface-container flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <LedIndicator status="active" />
                <span className="font-mono text-sm font-bold text-text-strong tracking-widest uppercase">Communication Thread</span>
              </div>
              <span className="text-xs font-mono text-text-muted px-2 py-1 bg-bg-deep rounded border border-border/50">Status: {enquiry.status}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
              {enquiry.messages?.map((msg: any) => (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === 'client' ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1 mx-1">
                    {msg.sender === 'client' ? 'You' : 'Forge Team'}
                  </span>
                  <div className={`p-4 rounded-lg font-mono text-sm shadow-sm ${msg.sender === 'client' ? 'bg-primary-container/20 border border-primary/30 text-text-strong rounded-tr-sm' : 'bg-surface-container border border-border text-text-strong rounded-tl-sm'}`}>
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-text-muted/50 mt-1 mx-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-border shrink-0 bg-surface-container">
              <form onSubmit={sendMessage} className="relative">
                <span className="absolute left-4 top-4 text-brand-primary-bright/50 font-mono text-sm select-none">&gt;</span>
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a follow-up message..."
                  className="w-full bg-bg-deep border border-border rounded p-4 pl-8 min-h-[100px] font-mono text-sm text-text-strong focus:outline-none focus:border-brand-primary-bright/50 transition-colors resize-y"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e as unknown as React.FormEvent);
                    }
                  }}
                />
                <div className="absolute right-3 bottom-3">
                  <Button type="submit" disabled={isSending || !newMessage.trim()} className="h-8 px-4 text-xs active:scale-95 transition-transform" size="sm">
                    {isSending ? 'Sending...' : 'Send'}
                    <span className="material-symbols-outlined text-[14px] ml-1">send</span>
                  </Button>
                </div>
              </form>
            </div>
          </Panel>
        </div>
        
      </div>
    </main>
  );
}
