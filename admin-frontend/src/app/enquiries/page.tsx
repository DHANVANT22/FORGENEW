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
              <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#5CA8C9]/20 border border-[#5CA8C9]/40 text-[#82C4DE] font-bold font-mono text-[11px] mb-2 shadow-[0_0_12px_rgba(92,168,201,0.2)]">
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
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-white/[0.08] text-xs gap-1">
                  <span className="text-neutral-400 font-medium text-[11px]">{key}</span>
                  <span className="text-white font-bold">{val}</span>
                </div>
              );
            }
          }

          return (
            <p key={idx} className="text-neutral-200 font-sans leading-relaxed">
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
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up pb-24 font-sans space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-[#82C4DE] tracking-widest uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>REAL-TIME DISCUSSION INBOX</span>
          </div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight">
            Client Inquiries & Scope Proposals
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Synchronized live messaging thread with client workspaces and inbound scope requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#5CA8C9]/15 text-[#82C4DE] border border-[#5CA8C9]/30">
            {enquiries.length} Active Channels
          </span>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        
        {/* Left Side: Thread Directory (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full neu-panel overflow-hidden">
          
          {/* Filter Bar & Search */}
          <div className="p-4 border-b border-white/[0.08] flex flex-col gap-3 bg-black/40">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-500 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search leads, clients, keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="neu-input w-full pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 font-sans"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto font-mono text-[10px]">
              {(['ALL', 'NEW', 'SCOPE', 'REPLIED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg font-bold uppercase transition-all ${
                    filter === f
                      ? 'neu-button-primary text-black shadow-md'
                      : 'neu-button text-neutral-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-2 space-y-1">
            {loading ? (
              <div className="text-center py-20 text-xs font-mono text-neutral-500">
                Loading client inquiries...
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="text-center py-20 text-xs font-mono text-neutral-500">
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
                    className={`w-full text-left p-4 rounded-2xl transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'neu-pressed !border-[#5CA8C9]/50 shadow-[0_0_20px_rgba(92,168,201,0.15)]'
                        : 'hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {isNew && <span className="w-2 h-2 rounded-full bg-[#5CA8C9] animate-ping" />}
                        <span className="font-display font-bold text-sm text-white truncate">
                          {e.clientName || 'Client Lead'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase neu-pressed ${
                        e.status === 'REPLIED' ? 'text-emerald-400' : 'text-[#82C4DE]'
                      }`}>
                        {e.status}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-neutral-400 truncate">
                      {e.clientEmail}
                    </span>

                    <p className="text-xs text-neutral-300 line-clamp-2 font-sans">
                      {e.latestMessage || 'No preview text available'}
                    </p>

                    <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 pt-1">
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
        <div className="lg:col-span-7 flex flex-col h-full neu-panel overflow-hidden">
          {selectedEnquiry ? (
            <>
              {/* Studio Header */}
              <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5CA8C9]/20 to-[#82C4DE]/20 border border-[#5CA8C9]/40 text-[#82C4DE] flex items-center justify-center font-bold font-mono text-sm shrink-0 shadow-[0_0_15px_rgba(92,168,201,0.2)]">
                    {(selectedEnquiry.clientName || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate font-display">
                      {selectedEnquiry.clientName || 'Client User'}
                    </h3>
                    <span className="text-[11px] font-mono text-[#82C4DE] truncate block">
                      {selectedEnquiry.clientEmail}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold neu-pressed text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
                    Live Channel Open
                  </span>
                </div>
              </div>

              {/* Message Feed Area */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-black/60">
                <div className="flex justify-center mb-8 mt-4">
                  <span className="label-eyebrow px-4 py-1.5 rounded-full neu-pressed">Start of Conversation</span>
                </div>
                
                {(!selectedEnquiry.messages || selectedEnquiry.messages.length === 0) ? (
                  <div className="p-4 neu-panel text-xs text-neutral-200">
                    {renderFormattedText(selectedEnquiry.latestMessage)}
                  </div>
                ) : (
                  selectedEnquiry.messages.map((m, idx) => {
                    const isClient = m.senderName === 'Client' || m.clientNonce === 'CLIENT_MSG' || m.text?.startsWith('📋');
                    const isEnquiry = m.text?.includes('[ESTIMATE ENQUIRY]') || m.text?.includes('[NEW PROJECT BRIEF');

                    return (
                      <div key={m.id || idx} className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-2 mb-1 text-[10px] font-mono">
                          <span className="font-bold text-neutral-400">
                            {isClient ? (selectedEnquiry.clientName || 'Client') : 'You (Admin Operations)'}
                          </span>
                          {!isClient && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold">
                              VERIFIED
                            </span>
                          )}
                          <span className="text-neutral-600">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className={`p-4 rounded-2xl max-w-xl text-xs font-sans leading-relaxed ${
                          isEnquiry
                            ? 'neu-panel text-white shadow-[0_0_25px_rgba(92,168,201,0.2)] border-[#5CA8C9]/60'
                            : isClient
                            ? 'neu-panel text-neutral-100 rounded-tl-sm'
                            : 'neu-panel text-[#82C4DE] rounded-tr-sm border-[#5CA8C9]/30'
                        }`}
                        style={{ background: isEnquiry ? 'var(--color-card)' : isClient ? '#12141A' : '#0A121A' }}>
                          {renderFormattedText(m.text)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Studio Footer */}
              <div className="p-4 border-t border-white/[0.08] bg-black/40 flex flex-col gap-3">
                {/* Quick Reply Chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] font-sans">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold py-1">Quick:</span>
                  {[
                    "We'd love to schedule a technical discovery call.",
                    "The projected budget and timeline look feasible.",
                    "We can expedite this delivery sprint as requested."
                  ].map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleSendReply(chip)}
                      className="px-3 py-1.5 rounded-full neu-button text-[#82C4DE] whitespace-nowrap transition-all text-xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                    placeholder="Reply directly to client regarding requirements or scope..."
                    className="neu-input flex-1 px-5 py-3 text-xs text-white placeholder-neutral-500 font-sans"
                  />
                  <Button
                    onClick={() => handleSendReply()}
                    disabled={sending || !replyText.trim()}
                    className="px-6 py-3 neu-button-primary uppercase disabled:opacity-40"
                  >
                    {sending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-neutral-500 text-center font-mono text-xs">
              <span className="material-symbols-outlined text-4xl mb-2 text-neutral-600">forum</span>
              <span>Select an inquiry thread on the left to view the live discussion stream.</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
