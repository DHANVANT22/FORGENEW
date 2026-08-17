import React from 'react';
import { Panel, LedIndicator, Gauge, ReadoutNumber } from '@/components/ui';
import { AnalyticsCharts } from '@/components/ui/AnalyticsCharts';
import Link from 'next/link';

export default async function AdminDashboard() {
  let estimatesData = null;
  let funnelData: Record<string, number> = {};
  let projectsData = null;
  let activityData = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/estimates?limit=1000`, { cache: 'no-store' });
    if (res.ok) estimatesData = await res.json();
    
    const funnelRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/estimates/progress/funnel`, { cache: 'no-store' });
    if (funnelRes.ok) funnelData = await funnelRes.json();
    
    const projectsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects?limit=100`, { 
      headers: { 'Cookie': 'admin_session=demo_admin_cookie' },
      cache: 'no-store' 
    });
    if (projectsRes.ok) projectsData = await projectsRes.json();

    const activityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/activity?limit=5`, { 
      headers: { 'Cookie': 'admin_session=demo_admin_cookie' },
      cache: 'no-store' 
    });
    if (activityRes.ok) activityData = await activityRes.json();
  } catch (err) {
    console.error('Failed to fetch data:', err);
  }

  const estimates = estimatesData?.data || [];
  const projects = projectsData?.data || [];
  const activities = activityData?.data || [];

  const totalEstimates = estimates.length;
  const convertedEstimates = estimates.filter((e: any) => e.convertedInquiryId != null).length;

  const simpleTotal = estimates.filter((e: any) => e.tier === 'Simple').length;
  const simpleConv = estimates.filter((e: any) => e.tier === 'Simple' && e.convertedInquiryId != null).length;

  const standardTotal = estimates.filter((e: any) => e.tier === 'Standard').length;
  const standardConv = estimates.filter((e: any) => e.tier === 'Standard' && e.convertedInquiryId != null).length;

  const complexTotal = estimates.filter((e: any) => e.tier === 'Complex').length;
  const complexConv = estimates.filter((e: any) => e.tier === 'Complex' && e.convertedInquiryId != null).length;

  const enterpriseTotal = estimates.filter((e: any) => e.tier === 'Enterprise').length;
  const enterpriseConv = estimates.filter((e: any) => e.tier === 'Enterprise' && e.convertedInquiryId != null).length;

  const tierStats = [
    { name: 'Simple', total: simpleTotal, converted: simpleConv, rate: simpleTotal ? Math.round((simpleConv/simpleTotal)*100) : 0 },
    { name: 'Standard', total: standardTotal, converted: standardConv, rate: standardTotal ? Math.round((standardConv/standardTotal)*100) : 0 },
    { name: 'Complex', total: complexTotal, converted: complexConv, rate: complexTotal ? Math.round((complexConv/complexTotal)*100) : 0 },
    { name: 'Enterprise', total: enterpriseTotal, converted: enterpriseConv, rate: enterpriseTotal ? Math.round((enterpriseConv/enterpriseTotal)*100) : 0 }
  ];

  const pieData = tierStats.map(t => ({ name: t.name, value: t.total || 1 })).filter(d => d.value > 0);

  // Compute composite risk for active projects
  const activeProjects = projects.filter((p: any) => p.status !== 'Completed' && p.status !== 'Archived');
  const projectRiskList = activeProjects.map((p: any) => {
    let composite = 0;
    if (p.ProjectRiskSnapshot && p.ProjectRiskSnapshot.length > 0) {
      const scores = p.ProjectRiskSnapshot[0].axisScores;
      // Weighted combination
      composite = (scores.schedule * 0.4) + (scores.budget * 0.3) + (scores.scopeDrift * 0.2) + (scores.communication * 0.1);
    }
    return { ...p, compositeRisk: composite };
  }).sort((a: any, b: any) => b.compositeRisk - a.compositeRisk);

  const totalActive = activeProjects.length;
  const highRiskCount = projectRiskList.filter((p: any) => p.compositeRisk >= 75).length;
  const riskGaugeValue = totalActive > 0 ? (highRiskCount / totalActive) * 100 : 0;
  const riskGaugeLabel = `${highRiskCount} High Risk`;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up pb-20">
      <div className="mb-10">
        <div className="font-mono text-xs text-brand-primary-bright tracking-widest uppercase mb-3 font-bold">OPS // DASHBOARD</div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-text-strong font-display">Platform Analytics</h1>
        <p className="text-text-muted">Real-time metrics for lead generation and conversion.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Panel className="p-6 flex flex-col group h-36 border border-border hover:border-brand-primary-bright/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-sm group-hover:text-text-strong transition-colors">folder_open</span>
              <div className="text-xs text-text-muted font-mono uppercase tracking-wider group-hover:text-text-strong transition-colors">Active Projects</div>
            </div>
            <LedIndicator status={totalActive > 0 ? 'active' : 'idle'} />
          </div>
          <div className="text-4xl text-text-strong mt-auto drop-shadow-[0_0_15px_rgba(var(--shadow-brand-rgb), 0.2)]">
            <ReadoutNumber value={totalActive} />
          </div>
        </Panel>

        <Panel className="p-6 flex flex-col items-center justify-center group h-36 md:col-span-1 border border-border" withRivets>
          <div className="scale-90 origin-center -mt-2">
             <Gauge value={riskGaugeValue} label={riskGaugeLabel} />
          </div>
        </Panel>

        <Panel className="p-6 flex flex-col group h-36 border border-border hover:border-brand-primary-bright/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-sm group-hover:text-text-strong transition-colors">link</span>
              <div className="text-xs text-text-muted font-mono uppercase tracking-wider group-hover:text-text-strong transition-colors">Pulse Links</div>
            </div>
            <LedIndicator status="idle" />
          </div>
          <div className="text-4xl text-text-strong mt-auto drop-shadow-[0_0_15px_rgba(53,196,122,0.2)]">
            <ReadoutNumber value={8} />
          </div>
        </Panel>

        <Panel className="p-6 flex flex-col group h-36 border border-border hover:border-brand-primary-bright/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-sm group-hover:text-text-strong transition-colors">assignment</span>
              <div className="text-xs text-text-muted font-mono uppercase tracking-wider group-hover:text-text-strong transition-colors">Estimator Leads</div>
            </div>
            <LedIndicator status={totalEstimates > 0 ? 'active' : 'idle'} />
          </div>
          <div className="text-4xl text-text-strong mt-auto drop-shadow-[0_0_15px_rgba(224,169,47,0.2)]">
            <ReadoutNumber value={totalEstimates} />
          </div>
        </Panel>
      </div>

      <Panel className="p-8 mb-10 border border-border">
        <AnalyticsCharts tierStats={tierStats} estimatesData={pieData} />
      </Panel>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 font-display text-text-strong">Cross-Project Risk Heatmap</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {projectRiskList.map((p: any) => {
            let status = 'idle';
            if (p.compositeRisk >= 75) status = 'critical';
            else if (p.compositeRisk >= 50) status = 'warning';
            else if (p.compositeRisk > 0) status = 'active';

            return (
              <a key={p.id} href={`/projects/${p.id}`}>
                <Panel className="p-4 transition-colors hover:border-brand-primary-bright/40 group border border-border">
                  <div className="flex items-center justify-between mb-3">
                     <div className="font-bold font-display text-text-strong truncate group-hover:text-brand-primary-bright transition-colors">{p.name}</div>
                     <LedIndicator status={status as any} />
                  </div>
                  <div className="text-sm text-text-muted font-mono">
                    {p.compositeRisk > 0 ? `Risk: ${Math.round(p.compositeRisk)}` : 'No data'}
                  </div>
                </Panel>
              </a>
            );
          })}
          {projectRiskList.length === 0 && (
            <div className="text-text-muted text-sm col-span-full font-mono">No active projects found.</div>
          )}
        </div>
      </div>
      
      {/* New Row: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Panel className="p-6 lg:col-span-2 border border-border">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-text-muted">history</span>
            <h2 className="text-lg font-bold font-display text-text-strong">Recent Activity</h2>
          </div>
          <div className="space-y-2">
            {activities.length > 0 ? (
              activities.map((act: any) => (
                <div key={act.id} className="flex justify-between items-center py-3 px-3 rounded hover:bg-white/5 transition-colors group border-b border-border/50 last:border-0">
                  <span className="text-text-strong text-sm">
                    <span className="font-semibold">{act.actorName}</span> <span className="text-text-muted">{act.action}</span> <span className="text-brand-primary-bright">{act.entityLabel}</span>
                  </span>
                  <span className="text-xs font-[family-name:var(--font-mono-readout)] text-text-muted">{new Date(act.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center py-3 px-3 rounded hover:bg-white/5 transition-colors group border-b border-border/50">
                  <span className="text-text-strong text-sm">
                    <span className="font-semibold">System</span> <span className="text-text-muted">generated</span> <span className="text-brand-primary-bright">Pulse Link</span>
                  </span>
                  <span className="text-xs font-[family-name:var(--font-mono-readout)] text-text-muted">10 mins ago</span>
              </div>
            )}
          </div>
        </Panel>
        
        <Panel className="p-6 border border-border" withRivets>
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-primary-bright">bolt</span>
            <h2 className="text-lg font-bold font-display text-text-strong">Quick Actions</h2>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/projects" className="flex items-center gap-3 p-3 bg-bg-deep rounded hover:bg-white/10 transition-colors border border-border">
               <span className="material-symbols-outlined text-text-muted text-sm">add</span>
               <span className="font-mono text-sm text-text-strong">New Project</span>
            </Link>
            <button className="flex items-center gap-3 p-3 bg-bg-deep rounded hover:bg-white/10 transition-colors border border-border text-left">
               <span className="material-symbols-outlined text-text-muted text-sm">share</span>
               <span className="font-mono text-sm text-text-strong">Generate Pulse Link</span>
            </button>
            <Link href="/estimator" className="flex items-center gap-3 p-3 bg-bg-deep rounded hover:bg-white/10 transition-colors border border-border">
               <span className="material-symbols-outlined text-text-muted text-sm">psychology</span>
               <span className="font-mono text-sm text-text-strong">Run Estimator</span>
            </Link>
          </div>
        </Panel>
      </div>

    </div>
  );
}
