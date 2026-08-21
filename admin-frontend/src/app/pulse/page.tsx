'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function PulsePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [pulseLink, setPulseLink] = useState('');
  const [pulseFinancialsVisible, setPulseFinancialsVisible] = useState(false);
  const [existingTokens, setExistingTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('adminToken') || 'ADMIN_DEMO_TOKEN';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/admin/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) {
          setSelectedProjectId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        setPulseFinancialsVisible(proj.pulseFinancialsVisible || false);
        setExistingTokens(proj.PulseToken || []);
        if (proj.PulseToken && proj.PulseToken.length > 0) {
          setPulseLink(`http://localhost:3000/pulse/${proj.PulseToken[0].token}`);
        } else {
          setPulseLink('');
        }
      }
    }
  }, [selectedProjectId, projects]);

  const generatePulse = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const tokenStr = localStorage.getItem('adminToken') || 'ADMIN_DEMO_TOKEN';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/projects/${selectedProjectId}/pulse-token`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenStr}` }
      });
      if (res.ok) {
        const data = await res.json();
        const link = `http://localhost:3000/pulse/${data.token}`;
        setPulseLink(link);
        setExistingTokens([data]);
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to generate pulse', err);
    } finally {
      setLoading(false);
    }
  };

  const rotatePulse = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const tokenStr = localStorage.getItem('adminToken') || 'ADMIN_DEMO_TOKEN';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/projects/${selectedProjectId}/pulse-token/rotate`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenStr}` }
      });
      if (res.ok) {
        const data = await res.json();
        const link = `http://localhost:3000/pulse/${data.token}`;
        setPulseLink(link);
        setExistingTokens([data]);
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to rotate pulse', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePulseFinancials = async (visible: boolean) => {
    if (!selectedProjectId) return;
    try {
      const tokenStr = localStorage.getItem('adminToken') || 'ADMIN_DEMO_TOKEN';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/admin/projects/${selectedProjectId}/pulse-financials`, { 
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStr}` 
        },
        body: JSON.stringify({ visible })
      });
      if (res.ok) {
        setPulseFinancialsVisible(visible);
      }
    } catch (err) {
      console.error('Failed to toggle pulse financials', err);
    }
  };

  const handleCopyLink = async (link: string) => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up pb-24 font-sans space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-[#82C4DE] tracking-widest uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>EXECUTIVE STAKEHOLDER TRANSPARENCY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
            Delivery Pulse Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans mt-0.5">
            Generate secure, zero-login snapshot telemetry links for clients, board members, and external stakeholders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            ● Telemetry Hub Live
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Project Configuration (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="p-6 rounded-3xl bg-[#080C12] border border-white/[0.08] shadow-xl space-y-6">
            
            {/* Target Project Dropdown */}
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 font-bold mb-2">
                Target Project
              </label>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex justify-between items-center bg-black border border-white/[0.1] hover:border-[#5CA8C9]/50 p-3.5 rounded-2xl text-left transition-all text-xs font-sans"
                >
                  <span className={`font-medium truncate ${selectedProject ? 'text-white' : 'text-neutral-500'}`}>
                    {selectedProject ? selectedProject.name : 'Select a project...'}
                  </span>
                  <span className="material-symbols-outlined text-neutral-400 text-sm">expand_more</span>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-[#0C121A] border border-white/[0.1] rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto p-1.5 space-y-1">
                    {projects.length === 0 ? (
                      <div className="p-3 text-xs font-mono text-neutral-500">No projects found.</div>
                    ) : (
                      projects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.05] transition-colors text-left text-xs ${
                            p.id === selectedProjectId ? 'bg-[#5CA8C9]/20 text-[#82C4DE] font-bold' : 'text-neutral-300'
                          }`}
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <span className="truncate pr-2">{p.name}</span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.05] text-neutral-400">
                            {p.status}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Financials Exposure Toggle */}
            {selectedProjectId && (
              <div className="pt-6 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase text-white">Financials Exposure</h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Include budget & spend breakdown in client snapshot</p>
                  </div>
                  <button 
                    type="button"
                    aria-label="Toggle Financials Exposure"
                    className={`relative inline-flex items-center w-12 h-6 rounded-full neu-pressed px-0.5 transition-all cursor-pointer ${
                      pulseFinancialsVisible ? 'shadow-[inset_2px_2px_4px_rgba(0,0,0,0.7),0_0_12px_rgba(92,168,201,0.4)]' : ''
                    }`}
                    onClick={() => togglePulseFinancials(!pulseFinancialsVisible)}
                  >
                    <span className={`inline-block w-5 h-5 rounded-full neu-button transition-transform duration-200 ${
                      pulseFinancialsVisible 
                        ? 'translate-x-6 bg-brand-primary shadow-[0_0_8px_#5CA8C9]' 
                        : 'translate-x-0 bg-neutral-600'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* Project Status Snapshot */}
            {selectedProject && (
              <div className="pt-6 border-t border-white/[0.08] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Current Phase:</span>
                  <span className="text-white font-bold">{selectedProject.status}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Sprint Velocity:</span>
                  <span className="text-[#82C4DE] font-bold">{selectedProject.progress || 35}%</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Assigned Client:</span>
                  <span className="text-neutral-200">{selectedProject.Client?.contactName || 'Acme Stakeholder'}</span>
                </div>
              </div>
            )}

          </div>

          {/* Quick Explainer Card */}
          <div className="p-5 rounded-3xl bg-[#080C12] border border-white/[0.08] shadow-lg text-xs space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#82C4DE] font-bold block">
              🛡️ How Zero-Login Pulse Works
            </span>
            <p className="text-neutral-400 leading-relaxed font-sans">
              Delivery Pulse links use cryptographic tokens allowing clients to view live progress, sprint health, and upcoming milestones without passwords or friction.
            </p>
          </div>

        </div>

        {/* Right Column: Live Link & Snapshot Preview (8 Cols) */}
        <div className="lg:col-span-8">
          
          {!pulseLink && existingTokens.length === 0 ? (
            /* EMPTY / GENERATE STATE */
            <div className="p-12 rounded-3xl bg-[#080C12] border border-white/[0.08] shadow-2xl flex flex-col items-center justify-center text-center gap-6 h-full min-h-[400px]">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#5CA8C9]/20 to-[#82C4DE]/10 border border-[#5CA8C9]/30 text-[#82C4DE] flex items-center justify-center shadow-[0_0_25px_rgba(92,168,201,0.3)]">
                <span className="material-symbols-outlined text-3xl">generating_tokens</span>
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-2xl font-display font-bold text-white">Generate Secure Pulse Link</h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Provision an active zero-login access token for <strong>{selectedProject?.name || 'this project'}</strong> to share with client stakeholders.
                </p>
              </div>

              <button
                type="button"
                onClick={generatePulse}
                disabled={loading || !selectedProjectId}
                className="px-8 py-4 rounded-2xl bg-[#5CA8C9] hover:bg-[#82C4DE] text-black font-extrabold text-xs uppercase tracking-wider font-mono shadow-[0_0_25px_rgba(92,168,201,0.4)] active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Provisioning Token...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">bolt</span>
                    <span>Generate Pulse Link</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ACTIVE PULSE STATE */
            <div className="space-y-6">
              
              {/* Active Link Box */}
              <div className="p-8 rounded-3xl bg-[#080C12] border border-white/[0.08] shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-[#5CA8C9] to-transparent" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      Active Telemetry Pulse Link
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 bg-black/60 px-3 py-1 rounded-full border border-white/[0.06]">
                    Expires in 30 days
                  </span>
                </div>

                {/* URL Bar & Copy Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 px-4 py-3.5 rounded-2xl bg-black border border-white/[0.1] font-mono text-xs text-[#82C4DE] select-all truncate">
                    {pulseLink}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(pulseLink)}
                    className="px-6 py-3.5 rounded-2xl bg-[#5CA8C9] hover:bg-[#82C4DE] text-black font-extrabold text-xs uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(92,168,201,0.3)] transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={pulseLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>Open Live View</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>

                {/* Telemetry Metrics Strip */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/[0.08]">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Client Opens</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1 block">12</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Last Viewed</span>
                    <span className="text-xs font-mono text-[#82C4DE] mt-2 block">Today, 10:45 AM</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Security State</span>
                    <span className="text-xs font-mono text-emerald-400 mt-2 block font-bold">● Active TLS 1.3</span>
                  </div>
                </div>

                {/* Revoke / Rotate Action */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={rotatePulse}
                    disabled={loading}
                    className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>Revoke & Rotate Token</span>
                  </button>
                </div>

              </div>

              {/* Client Snapshot Live Preview */}
              <div className="p-8 rounded-3xl bg-[#080C12] border border-white/[0.08] shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <h3 className="text-lg font-display font-bold text-white">Client Portal Live Telemetry View</h3>
                  <span className="text-xs font-mono text-neutral-400">Live Client Rendition</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block">Current Phase</span>
                    <span className="text-xl font-bold font-display text-white mt-1 block">{selectedProject?.status || 'Active'}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block">Health State</span>
                    <span className="text-xl font-bold font-display text-emerald-400 mt-1 block">Nominal (On Track)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block">Completion Rate</span>
                    <span className="text-xl font-bold font-display text-[#82C4DE] mt-1 block">{selectedProject?.progress || 35}%</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
