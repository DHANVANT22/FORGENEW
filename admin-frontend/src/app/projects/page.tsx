'use client';

import { useState, useEffect } from 'react';
import { Panel, LedIndicator, Gauge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// Helper for relative timestamps
function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return `1 day ago`;
  if (diffInDays < 30) return `${diffInDays} days ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} years ago`;
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects?page=${page}&limit=10`, {
      headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
    })
      .then(res => res.json())
      .then(json => {
        setProjects(json.data);
        setTotalPages(json.meta?.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [page]);

  if (loading) return <div className="p-8">Loading projects...</div>;

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-8 px-6 animate-fade-in-up pb-20">
      <div className="flex justify-between items-center pb-4 border-b border-border mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-tighter text-on-surface mb-2 font-bold text-text-strong">Projects</h1>
          <p className="font-mono text-xs text-text-muted uppercase tracking-wider">Active Engagements</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm font-mono text-text-muted">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
          <Button className="flex items-center gap-2 transition-transform active:scale-[0.97] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
            <span className="material-symbols-outlined text-sm">add</span>
            New Project
          </Button>
        </div>
      </div>

      {/* Grid wrapper constrained and responsive to prevent stretching */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {projects.map(project => {
          const latestRisk = project.ProjectRiskSnapshot?.[0]?.axisScores || { schedule: 0, budget: 0, communication: 0, scopeDrift: 0 };
          const maxRisk = Math.max(latestRisk.schedule, latestRisk.budget, latestRisk.communication, latestRisk.scopeDrift);
          
          let statusLed: 'active' | 'warning' | 'critical' | 'idle' = 'idle';
          if (project.status === 'Active') statusLed = 'active';
          if (project.status === 'Planning') statusLed = 'warning';

          return (
            <Link key={project.id} href={`/projects/${project.id}`} className="block h-full">
              <Panel 
                withRivets 
                className="p-5 h-full flex flex-col group border border-border/50 hover:border-brand-primary-bright/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h3 className="font-display text-lg font-bold text-text-strong group-hover:text-brand-primary-bright transition-colors leading-tight line-clamp-2">{project.name}</h3>
                  <div className="flex items-center gap-2 shrink-0 bg-bg-deep px-2 py-1 rounded border border-border shadow-sm">
                    <LedIndicator status={statusLed} />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-text-strong">{project.status}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                   <span className="inline-block px-2 py-1 bg-surface-container rounded-sm border border-border text-[10px] font-mono tracking-widest text-text-muted uppercase">
                     {project.type || 'CLIENT'}
                   </span>
                </div>
                
                <div className="mt-auto space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center bg-bg-deep p-3 rounded border border-border shadow-sm">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Max Risk</span>
                       <span className="font-[family-name:var(--font-mono-readout)] text-sm font-bold text-text-strong">{Math.round(maxRisk)}%</span>
                    </div>
                    {/* Very slim gauge representation or progress bar */}
                    <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden border border-border/50">
                       <div 
                         className="h-full bg-gradient-to-r from-warning to-brand-primary-bright transition-all" 
                         style={{ width: `${Math.max(0, Math.min(100, maxRisk))}%` }}
                       />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Last Touched</span>
                    <span className="text-xs font-[family-name:var(--font-mono-readout)] text-text-strong">{getRelativeTime(project.updatedAt)}</span>
                  </div>
                </div>
              </Panel>
            </Link>
          );
        })}

        {/* Ghost Panel for New Project */}
        <button className="block h-full text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-bright rounded-[6px]" onClick={() => { /* Trigger New Project flow */ }}>
          <Panel 
            className="p-5 h-[280px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 hover:border-brand-primary-bright/50 hover:bg-brand-primary-bright/5 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-full bg-bg-deep border border-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(var(--shadow-brand-rgb), 0.3)] transition-all">
              <span className="material-symbols-outlined text-text-muted group-hover:text-brand-primary-bright transition-colors">add</span>
            </div>
            <span className="font-mono text-sm text-text-muted uppercase tracking-widest group-hover:text-text-strong transition-colors">Add New Project</span>
          </Panel>
        </button>

      </div>
    </div>
  );
}
