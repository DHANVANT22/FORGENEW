'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

export default function ClientsList() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/clients?page=${page}&limit=10`, {
      headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
    })
      .then(res => res.json())
      .then(json => {
        setClients(Array.isArray(json.data) ? json.data : []);
        setTotalPages(json.meta?.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [page]);

  if (loading) return <div className="p-8 text-on-surface">Loading clients...</div>;

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-8 px-6 animate-fade-in-up font-body-md">
      <div className="flex justify-between items-center pb-4 border-b border-border mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-tighter text-on-surface mb-2">Client Accounts</h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Manage Portal Access</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-surface-container rounded border border-border text-sm disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="text-sm font-mono text-muted">{page} / {totalPages}</span>
            <button className="px-3 py-1 bg-surface-container rounded border border-border text-sm disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">person_add</span>
            Invite Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-border border-dashed rounded-xl bg-surface-container/30">
            <span className="font-mono text-on-surface-variant italic">No client accounts found.</span>
          </div>
        ) : clients.map(client => (
          <Card key={client.id} className="p-6 h-full flex flex-col group border-border hover:border-primary transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display text-xl text-on-surface group-hover:text-primary transition-colors">{client.email}</h3>
              <span className={`px-2 py-1 rounded text-[10px] font-mono border ${
                client.passwordHash ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'
              }`}>
                {client.passwordHash ? 'Active' : 'Invited'}
              </span>
            </div>
            
            <div className="mt-auto space-y-4 pt-4 border-t border-border">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono text-on-surface-variant">Linked Project</span>
                <span className="text-sm text-on-surface">{client.project?.name || 'Unknown Project'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-on-surface-variant">Created On</span>
                <span className="text-xs font-mono text-on-surface">{new Date(client.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
