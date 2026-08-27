'use client';

import React, { useState, useEffect } from 'react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { LedIndicator } from '@/components/ui/LedIndicator';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
}

interface ClientAccount {
  id: string;
  email: string;
  name?: string;
  companyName?: string;
  projectId?: string;
  project?: Project;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New Client Form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const token = 'ADMIN_DEMO_TOKEN';

  const fetchData = async () => {
    try {
      const [clientsRes, projectsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/clients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/v1/admin/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.data || []);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : projectsData.data || []);
      }
    } catch (e) {
      console.error('Error fetching admin client data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newEmail.trim()) {
      setFormError('Client email is required.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/admin/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim() || 'Client User',
          companyName: newCompany.trim() || undefined,
          password: newPassword || 'ClientPassword123!',
          projectId: selectedProjectId || undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create client account.');
      }

      setShowModal(false);
      setNewEmail('');
      setNewName('');
      setNewCompany('');
      setNewPassword('');
      setSelectedProjectId('');
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create client.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const query = searchQuery.toLowerCase();
    return (c.email.toLowerCase().includes(query) ||
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.companyName && c.companyName.toLowerCase().includes(query)) ||
            (c.project?.name && c.project.name.toLowerCase().includes(query)));
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8 px-6 font-sans text-slate-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display-xl font-bold text-slate-100">Registered Client Accounts</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              {clients.length} Registered
            </span>
          </div>
          <p className="text-ui-sm text-slate-400 mt-1 font-sans">
            Client portal directory, project access control, and active session telemetry.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowModal(true)}
            variant="primary"
            size="md"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Provision Client Account</span>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center card-level-1">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search client name, email, company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="neu-input w-full pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-sans"
          />
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <LedIndicator status="active" />
          <span>REAL-TIME ACCOUNT REGISTRATION FEED</span>
        </div>
      </div>

      {/* Clients Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-16 text-slate-400 font-mono text-xs">
            Loading registered clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-16 card-level-1 rounded-2xl text-slate-400 font-mono text-xs">
            No registered client accounts found.
          </div>
        ) : (
          filteredClients.map(client => {
            const isActive = !!client.lastLoginAt;
            return (
              <div key={client.id} className="p-6 flex flex-col justify-between gap-5 relative overflow-hidden card-level-1 hover:-translate-y-1 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-xs font-mono border ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400 border-white/5'
                      }`}>
                        {(client.name || client.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h3 className="font-semibold text-base text-slate-100 truncate" title={client.name || 'Client User'}>
                          {client.name || 'Client User'}
                        </h3>
                        <p className="font-mono text-xs text-cyan-400 truncate" title={client.email}>
                          {client.email}
                        </p>
                      </div>
                    </div>

                    <span 
                      className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase bg-slate-900 text-slate-400 border border-white/5 max-w-[120px] truncate" 
                      title={client.companyName || 'Individual'}
                    >
                      {client.companyName || 'Individual'}
                    </span>
                  </div>

                {/* Project Relation Badge */}
                <div className="mt-2 p-3 rounded-lg bg-slate-900/60 border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Assigned Project</span>
                  {client.project ? (
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-xs font-semibold text-slate-100 truncate" title={client.project.name}>{client.project.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0">
                        {client.project.status} ({client.project.progress}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 italic">No active project linked</span>
                  )}
                </div>
              </div>

              {/* Login Telemetry Footprint */}
              <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <div>
                  <span className="block text-[9px] uppercase font-semibold text-slate-400">Last Login</span>
                  <span className="text-slate-200">
                    {client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase font-semibold text-slate-400">Registered</span>
                  <span className="text-slate-200">
                    {new Date(client.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              </div>
            );
          })
        )}
      </div>

      {/* Provision Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-level-2 max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h2 className="text-ui-lg font-semibold text-slate-100">Provision Client Account</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-rose-400">warning</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Michael Vance"
                  className="neu-input w-full px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="e.g. Nexus Dynamics"
                  className="neu-input w-full px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="client@nexus.com"
                  className="neu-input w-full px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Defaults to ClientPassword123!"
                  className="neu-input w-full px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1">Assign Project (Optional)</label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="neu-input w-full px-3.5 py-2.5 text-xs text-slate-100 font-mono"
                >
                  <option value="">No Project Link</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} variant="primary">
                  {submitting ? 'Provisioning...' : 'Provision Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
