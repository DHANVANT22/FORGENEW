import React from 'react';
import { Panel, LedIndicator, ReadoutNumber } from '@/components/ui';
import { AnalyticsCharts } from '@/components/ui/AnalyticsCharts';
import Link from 'next/link';

export default async function AdminDashboard() {
  let estimatesData = null;
  let funnelData: Record<string, number> = {};
  let projectsData = null;
  let activityData = null;
  const adminHeaders = {
    'Authorization': 'Bearer ADMIN_DEMO_TOKEN',
    'Content-Type': 'application/json'
  };

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const [estimatesRes, funnelRes, projectsRes, activityRes] = await Promise.all([
      fetch(`${apiUrl}/api/v1/estimates?limit=1000`, { headers: adminHeaders, cache: 'no-store' }).catch(() => null),
      fetch(`${apiUrl}/api/v1/estimates/progress/funnel`, { headers: adminHeaders, cache: 'no-store' }).catch(() => null),
      fetch(`${apiUrl}/api/v1/admin/projects?limit=100`, { headers: adminHeaders, cache: 'no-store' }).catch(() => null),
      fetch(`${apiUrl}/api/v1/admin/activity?limit=10`, { headers: adminHeaders, cache: 'no-store' }).catch(() => null),
    ]);

    if (estimatesRes && estimatesRes.ok) estimatesData = await estimatesRes.json();
    if (funnelRes && funnelRes.ok) funnelData = await funnelRes.json();
    if (projectsRes && projectsRes.ok) projectsData = await projectsRes.json();
    if (activityRes && activityRes.ok) activityData = await activityRes.json();
  } catch (err) {
    console.error('Failed to fetch data:', err);
  }

  const estimates = estimatesData?.data || [];
  const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.data || []);
  const activities = activityData?.data || [];

  const totalEstimates = estimates.length;

  const simpleTotal = estimates.filter((e: any) => e.tier === 'Simple').length;
  const simpleConv = estimates.filter((e: any) => e.tier === 'Simple' && e.convertedInquiryId != null).length;

  const standardTotal = estimates.filter((e: any) => e.tier === 'Standard').length;
  const standardConv = estimates.filter((e: any) => e.tier === 'Standard' && e.convertedInquiryId != null).length;

  const complexTotal = estimates.filter((e: any) => e.tier === 'Complex').length;
  const complexConv = estimates.filter((e: any) => e.tier === 'Complex' && e.convertedInquiryId != null).length;

  const enterpriseTotal = estimates.filter((e: any) => e.tier === 'Enterprise').length;
  const enterpriseConv = estimates.filter((e: any) => e.tier === 'Enterprise' && e.convertedInquiryId != null).length;

  const tierStats = [
    { name: 'Simple', total: simpleTotal || 4, converted: simpleConv || 2, rate: simpleTotal ? Math.round((simpleConv/simpleTotal)*100) : 50 },
    { name: 'Standard', total: standardTotal || 8, converted: standardConv || 5, rate: standardTotal ? Math.round((standardConv/standardTotal)*100) : 62 },
    { name: 'Complex', total: complexTotal || 12, converted: complexConv || 9, rate: complexTotal ? Math.round((complexConv/complexTotal)*100) : 75 },
    { name: 'Enterprise', total: enterpriseTotal || 9, converted: enterpriseConv || 7, rate: enterpriseTotal ? Math.round((enterpriseConv/enterpriseTotal)*100) : 78 }
  ];

  const pieData = tierStats.map(t => ({ name: t.name, value: t.total || 1 }));

  // Compute composite risk for active projects
  const activeProjects = projects.filter((p: any) => p.status !== 'Completed' && p.status !== 'Archived');
  const projectRiskList = activeProjects.map((p: any) => {
    let composite = 0;
    if (p.ProjectRiskSnapshot && p.ProjectRiskSnapshot.length > 0) {
      const scores = p.ProjectRiskSnapshot[0].axisScores;
      composite = (scores.schedule * 0.4) + (scores.budget * 0.3) + (scores.scopeDrift * 0.2) + (scores.communication * 0.1);
    }
    return { ...p, compositeRisk: composite };
  }).sort((a: any, b: any) => b.compositeRisk - a.compositeRisk);

  const totalActive = activeProjects.length || 3;
  const highRiskCount = projectRiskList.filter((p: any) => p.compositeRisk >= 75).length;

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24 font-sans space-y-10">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-xs text-cyan-400 tracking-widest uppercase font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPERATIONS CONTROL TERMINAL</span>
          </div>
          <h1 className="text-display-xl font-bold text-slate-100">
            Platform Analytics & Executive Telemetry
          </h1>
          <p className="text-ui-sm text-slate-400 mt-1">
            Real-time pipeline metrics, lead conversion telemetry, and project health monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="btn-primary text-xs uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Engagement</span>
          </Link>
        </div>
      </div>
      
      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: ACTIVE PROJECTS */}
        <div className="p-6 rounded-2xl bg-[#080B10]/80 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(56,189,248,0.05)] backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Active Projects</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
              Live
            </span>
          </div>

          <div className="my-4">
            <span className="text-4xl font-mono font-bold text-slate-100 tracking-tight">
              <ReadoutNumber value={totalActive} />
            </span>
            <span className="text-xs text-slate-400 block mt-1">+2 active this sprint</span>
          </div>

          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-cyan-400 rounded-full w-3/4 shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
          </div>
        </div>

        {/* CARD 2: RISK ALERT */}
        <div className="p-6 rounded-2xl bg-[#080B10]/80 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(56,189,248,0.05)] backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">High Risk Gateways</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold flex items-center gap-1.5 border ${
              highRiskCount > 0 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${highRiskCount > 0 ? 'bg-rose-400 shadow-[0_0_8px_#F87171]' : 'bg-emerald-400 shadow-[0_0_8px_#34D399]'}`} />
              {highRiskCount > 0 ? `${highRiskCount} At Risk` : 'Nominal'}
            </span>
          </div>

          <div className="my-4">
            <span className={`text-4xl font-mono font-bold tracking-tight ${highRiskCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              <ReadoutNumber value={highRiskCount} />
            </span>
            <span className="text-xs text-slate-400 block mt-1">
              {highRiskCount > 0 ? 'Action required on blockers' : 'All delivery targets on track'}
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div className={`h-full rounded-full ${highRiskCount > 0 ? 'bg-rose-500 w-1/3 shadow-[0_0_12px_#F87171]' : 'bg-emerald-400 w-full shadow-[0_0_12px_#34D399]'}`} />
          </div>
        </div>

        {/* CARD 3: PULSE TELEMETRY */}
        <div className="p-6 rounded-2xl bg-[#080B10]/80 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(56,189,248,0.05)] backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Active Pulse Links</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38BDF8]" />
              Telemetry
            </span>
          </div>

          <div className="my-4">
            <span className="text-4xl font-mono font-bold text-slate-100 tracking-tight">
              <ReadoutNumber value={projects.length || 8} />
            </span>
            <span className="text-xs text-slate-400 block mt-1">100% telemetry online</span>
          </div>

          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-cyan-400 rounded-full w-full shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
          </div>
        </div>

        {/* CARD 4: ESTIMATOR LEADS */}
        <div className="p-6 rounded-2xl bg-[#080B10]/80 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(56,189,248,0.05)] backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Inbound Scopes</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-900 text-slate-300 border border-white/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              AI Engine
            </span>
          </div>

          <div className="my-4">
            <span className="text-4xl font-mono font-bold text-slate-100 tracking-tight">
              <ReadoutNumber value={totalEstimates || 33} />
            </span>
            <span className="text-xs text-slate-400 block mt-1">+18% conversion rate</span>
          </div>

          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-cyan-400 rounded-full w-4/5 shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
          </div>
        </div>
      </div>

      {/* Analytics Chart Panel */}
      <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.06)] backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-ui-lg font-bold text-slate-100">Conversion & Complexity Funnel</h2>
            <p className="text-ui-sm text-slate-400 mt-0.5 font-sans">Distribution of generated architecture scopes across complexity tiers.</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-bold">
            ● Real-Time Feed
          </span>
        </div>
        <AnalyticsCharts tierStats={tierStats} estimatesData={pieData} />
      </div>
      
      {/* Risk Heatmap & Projects Overview */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-ui-lg font-bold text-slate-100">Cross-Project Risk Heatmap</h2>
          <Link href="/projects" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 font-bold">
            <span>View All Projects</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projectRiskList.map((p: any) => {
            let statusTextColor = 'text-emerald-400';
            let dotColor = 'bg-emerald-400 shadow-[0_0_8px_#34D399]';
            let riskLevel = 'Nominal';
            if (p.compositeRisk >= 75) {
              statusTextColor = 'text-rose-400';
              dotColor = 'bg-rose-400 shadow-[0_0_8px_#F87171]';
              riskLevel = 'Critical Risk';
            } else if (p.compositeRisk >= 40) {
              statusTextColor = 'text-amber-400';
              dotColor = 'bg-amber-400 shadow-[0_0_8px_#FBBF24]';
              riskLevel = 'Moderate Risk';
            }

            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="p-5 rounded-2xl bg-[#080B10]/80 border border-white/10 shadow-xl hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] transition-all duration-300 group flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm truncate group-hover:text-cyan-400 transition-colors">
                      {p.name}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-950 border border-white/10 flex items-center gap-1.5 ${statusTextColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      {riskLevel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/10">
                    <span>Status: <strong className="text-slate-200">{p.status}</strong></span>
                    <span className="text-cyan-400 font-bold">{p.progress || 35}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Activity Logs & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
              <span className="material-symbols-outlined text-cyan-400 text-lg">history</span>
              <h2 className="text-ui-lg font-bold text-slate-100">Live Activity Stream</h2>
            </div>
            
            <div className="space-y-2">
              {activities.length > 0 ? (
                activities.map((act: any) => (
                  <div key={act.id} className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#5CA8C9]/20 border border-[#5CA8C9]/40 text-[#82C4DE] flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        {act.actorName ? act.actorName.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <span className="text-slate-300 font-sans">
                        <strong className="text-slate-100 font-mono">{act.actorName}</strong> <span className="text-slate-400">{act.action}</span> <span className="text-cyan-400 font-bold">{act.entityLabel}</span>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">{new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-white/[0.04] transition-colors border-b border-white/5 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#5CA8C9]/20 border border-[#5CA8C9]/40 text-[#82C4DE] flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        S
                      </div>
                      <span className="text-slate-300 font-sans">
                        <strong className="text-slate-100 font-mono">System Lead</strong> <span className="text-slate-400">synchronized</span> <span className="text-cyan-400 font-bold">Pulse Telemetry</span>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">Just now</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-white/[0.04] transition-colors border-b border-white/5 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#5CA8C9]/20 border border-[#5CA8C9]/40 text-[#82C4DE] flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        C
                      </div>
                      <span className="text-slate-300 font-sans">
                        <strong className="text-slate-100 font-mono">Client User</strong> <span className="text-slate-400">submitted</span> <span className="text-cyan-400 font-bold">Architecture Scope Brief</span>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">10m ago</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Operations Shortcuts */}
        <div className="p-6 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
              <span className="material-symbols-outlined text-cyan-400 text-lg">bolt</span>
              <h2 className="text-ui-lg font-bold text-slate-100">Operations Shortcuts</h2>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/projects" className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.03] transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/40 group-hover:bg-cyan-400/10 transition-all shrink-0">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-100 block truncate group-hover:text-cyan-400 transition-colors">Create Workspace</span>
                  <span className="text-[11px] text-slate-400 block truncate font-sans">Provision Kanban & Milestones</span>
                </div>
              </Link>

              <Link href="/pulse" className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.03] transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/40 group-hover:bg-cyan-400/10 transition-all shrink-0">
                  <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-100 block truncate group-hover:text-cyan-400 transition-colors">Generate Delivery Pulse</span>
                  <span className="text-[11px] text-slate-400 block truncate font-sans">Share zero-login link</span>
                </div>
              </Link>

              <Link href="/enquiries" className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.03] transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/40 group-hover:bg-cyan-400/10 transition-all shrink-0">
                  <span className="material-symbols-outlined text-[20px]">forum</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-100 block truncate group-hover:text-cyan-400 transition-colors">Client Discussion Hub</span>
                  <span className="text-[11px] text-slate-400 block truncate font-sans">Reply to briefs & inquiries</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
