'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function EnquiryDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [enquiry, setEnquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchEnquiry = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/admin/enquiries/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'ADMIN_DEMO_TOKEN'}` }
      });
      if (res.ok) {
        setEnquiry(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiry();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [enquiry?.messages]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/admin/enquiries/${id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'ADMIN_DEMO_TOKEN'}`
        },
        body: JSON.stringify({ body: reply })
      });
      if (res.ok) {
        setReply('');
        await fetchEnquiry();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleConvertToProject = async () => {
    setIsConverting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/admin/enquiries/${id}/convert`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'ADMIN_DEMO_TOKEN'}`
        }
      });
      if (res.ok) {
        // Refresh to show converted state
        await fetchEnquiry();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  if (loading) return <div className="p-8 text-on-surface">Loading enquiry...</div>;
  if (!enquiry) return <div className="p-8 text-on-surface">Enquiry not found.</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-6 animate-fade-in-up font-body-md h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-4xl tracking-tighter text-text-strong">{enquiry.clientName}</h1>
            <span className={`px-2 py-1 rounded text-[10px] font-mono border ${enquiry.status === 'new' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-variant text-text-muted border-border'}`}>
              {enquiry.status.toUpperCase()}
            </span>
          </div>
          <p className="font-mono text-xs text-text-muted">{enquiry.clientEmail}</p>
        </div>
        
        {enquiry.status !== 'converted' ? (
          <Button onClick={handleConvertToProject} disabled={isConverting} variant="primary">
            {isConverting ? 'Converting...' : 'Convert to Project'}
          </Button>
        ) : (
          <Button onClick={() => router.push('/projects')} variant="outline">
            View Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Context */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto">
          <Card className="p-6 border-border">
            <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-widest mb-4 border-b border-border pb-2">Estimate Context</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-text-muted font-mono mb-1">Assigned Tier</p>
                <p className="text-xl font-display font-bold text-brand-primary-bright">{enquiry.estimateData?.tier || 'Unknown'}</p>
              </div>
            </div>
          </Card>
          
          {enquiry.estimateData?.axisScores && (
            <Card className="p-6 border-border">
              <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-widest mb-4 border-b border-border pb-2">Complexity Axis</h3>
              <div className="space-y-3">
                {Object.entries(enquiry.estimateData.axisScores).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm font-mono">
                    <span className="text-text-muted capitalize">{key}</span>
                    <span className="text-text-strong">{String(value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Thread */}
        <div className="lg:col-span-2 flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-container shrink-0 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-text-strong uppercase tracking-widest">Client Thread</span>
            <span className="font-mono text-xs text-text-muted">{enquiry.token}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg/50">
            {enquiry.messages?.map((msg: any) => (
              <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === 'admin' ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1 mx-1">
                  {msg.sender === 'admin' ? 'You' : msg.sender}
                </span>
                <div className={`p-4 rounded-lg font-mono text-sm shadow-sm ${msg.sender === 'admin' ? 'bg-primary-container/20 border border-primary/30 text-text-strong rounded-tr-sm' : 'bg-surface-container border border-border text-text-strong rounded-tl-sm'}`}>
                  {msg.body}
                </div>
                <span className="text-[10px] text-text-muted/50 mt-1 mx-1">{new Date(msg.createdAt).toLocaleString()}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-surface-container shrink-0">
            <div className="flex gap-4">
              <input 
                type="text" 
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 bg-bg-deep border border-border rounded p-3 font-mono text-sm text-text-strong focus:outline-none focus:border-brand-primary-bright/50"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleReply();
                }}
              />
              <Button onClick={handleReply} disabled={isSending || !reply.trim()}>
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
