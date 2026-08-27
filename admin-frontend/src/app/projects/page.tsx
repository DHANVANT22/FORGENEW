'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/admin/projects?page=${page}&limit=12`, {
      headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
    })
      .then(res => res.json())
      .then(json => {
        setProjects(json.data || []);
        setTotalPages(json.meta?.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [page]);

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    const clientName = (p.Client?.contactName || p.Client?.organization || '').toLowerCase();
    return p.name.toLowerCase().includes(q) || clientName.includes(q);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up pb-24 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-[#82C4DE] tracking-widest uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ENGAGEMENTS PORTFOLIO</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
            Active Project Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans mt-0.5">
            Deliver client sprints, manage milestone approvals, and supervise Kanban pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 border border-white/[0.08] rounded-xl p-1 px-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs font-mono text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/[0.04]"
            >
              Prev
            </button>
            <span className="text-xs font-mono text-neutral-400">{page} / {totalPages}</span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs font-mono text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/[0.04]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-[#080B10]/90 border border-white/10 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-2xl">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-neutral-500 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 font-sans outline-none transition-colors"
          />
        </div>

        <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
          <span>{filteredProjects.length} PROJECT WORKSPACES INITIALIZED</span>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-24 text-neutral-500 font-mono text-xs">
            Loading active engagements...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-24 bg-[#080B10]/60 border border-white/10 rounded-3xl text-neutral-500 font-mono text-xs">
            No projects found matching search.
          </div>
        ) : (
          filteredProjects.map(project => {
            const clientName = project.Client?.contactName || project.Client?.organization || 'Enterprise Stakeholder';
            const progress = project.progress || 35;

            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="block h-full group">
                <div className="p-6 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] group-hover:border-cyan-400/50 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] transition-all duration-300 h-full flex flex-col justify-between gap-6 relative overflow-hidden group-hover:-translate-y-1 backdrop-blur-2xl">
                  
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-white/[0.04] border border-white/10 text-cyan-400">
                        {project.status || 'Active'}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400 font-semibold">
                        Sprint 3
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-xl text-white group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-xs font-mono text-neutral-400">
                      Client: <strong className="text-neutral-200">{clientName}</strong>
                    </p>
                  </div>

                  {/* Progress Meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-neutral-400">
                      <span>Sprint Velocity</span>
                      <span className="text-cyan-400 font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/60 border border-white/10 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-cyan-400 shrink-0">view_kanban</span>
                      <span>Kanban Active</span>
                    </div>
                    <span className="text-neutral-300 group-hover:text-cyan-400 flex items-center gap-1 transition-colors font-bold">
                      Open Workspace <span className="material-symbols-outlined text-sm shrink-0">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

    </div>
  );
}
