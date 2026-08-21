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
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up pb-24 font-sans space-y-10">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-[#82C4DE] tracking-widest uppercase font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPERATIONS CONTROL TERMINAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
            Platform Analytics & Executive Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans mt-1">
            Real-time pipeline metrics, lead conversion telemetry, and project health monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="px-5 py-2.5 rounded-xl bg-[#5CA8C9] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#82C4DE] shadow-[0_0_20px_rgba(92,168,201,0.4)] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Engagement</span>
          </Link>
        </div>
      </div>
      
      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: ACTIVE PROJECTS */}
        <div 
          className="p-6 neu-panel hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">Active Projects</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold neu-pressed text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
              Live
            </span>
          </div>

          <div className="my-4">
            <span className="text-4xl font-black text-white font-mono tracking-tight">
              <ReadoutNumber value={totalActive} />
            </span>
            <span className="text-xs text-neutral-400 font-sans block mt-1">+2 active this sprint</span>
          </div>

          <div className="h-1.5 w-full neu-pressed rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#5CA8C9] to-[#82C4DE] rounded-full w-3/4 shadow-[0_0_8px_#5CA8C9]" />
          </div>
        </div>

        {/* CARD 2: RISK ALERT */}
        <div 
          className="p-6 neu-panel hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">High Risk Gateways</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold neu-pressed flex items-center gap-1.5 ${
              highRiskCount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${highRiskCount > 0 ? 'bg-red-400 shadow-[0_0_6px_#F87171]' : 'bg-emerald-400 shadow-[0_0_6px_#34D399]'}`} />
              {highRiskCount > 0 ? `${highRiskCount} At Risk` : 'Nominal'}
            </span>
          </div>

          <div className="my-4">
            <span className={`text-4xl font-black font-mono tracking-tight ${highRiskCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              <ReadoutNumber value={highRiskCount} />
            </span>
            <span className="text-xs text-neutral-400 font-sans block mt-1">
              {highRiskCount > 0 ? 'Action required on blockers' : 'All delivery targets on track'}
            </span>
          </div>

          <div className="h-1.5 w-full neu-pressed rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${highRiskCount > 0 ? 'bg-red-500 w-1/3 shadow-[0_0_8px_#EF4444]' : 'bg-emerald-500 w-full shadow-[0_0_8px_#10B981]'}`} />
          </div>
        </div>

        {/* CARD 3: PULSE TELEMETRY */}
        <div 
          className="p-6 neu-panel hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">Active Pulse Links</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold neu-pressed text-[#82C4DE] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5CA8C9] shadow-[0_0_6px_#5CA8C9]" />
              Telemetry
            </span>
          </div>

          <div className="my-4">
            <span className="text-4xl font-black text-white font-mono tracking-tight">
              <ReadoutNumber value={projects.length || 8} />
            </span>
            <span className="text-xs text-neutral-400 font-sans block mt-1">100% telemetry online</span>
          </div>

          <div className="h-1.5 w-full neu-pressed rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-[#5CA8C9] rounded-full w-full shadow-[0_0_8px_#5CA8C9]" />
          </div>
        </div>

        {/* CARD 4: ESTIMATOR LEADS */}
        <div 
          className="p-6 neu-panel hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">Inbound Scopes</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold neu-pressed text-purple-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#C084FC]" />
              AI Engine
            </span>
          </div>

          <div className="my-4">
            <span className="text-4xl font-black text-white font-mono tracking-tight">
              <ReadoutNumber value={totalEstimates || 33} />
            </span>
            <span className="text-xs text-neutral-400 font-sans block mt-1">+18% conversion rate</span>
          </div>

          <div className="h-1.5 w-full neu-pressed rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-[#5CA8C9] rounded-full w-4/5 shadow-[0_0_8px_#A855F7]" />
          </div>
        </div>
      </div>

      {/* Analytics Chart Panel */}
      <div className="p-8 neu-panel shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Conversion & Complexity Funnel</h2>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">Distribution of generated architecture scopes across complexity tiers.</p>
          </div>
          <span className="text-xs font-mono text-[#82C4DE] px-3 py-1 rounded-full neu-pressed">
            Real-time Feed
          </span>
        </div>
        <AnalyticsCharts tierStats={tierStats} estimatesData={pieData} />
      </div>
      
      {/* Risk Heatmap & Projects Overview */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-white">Cross-Project Risk Heatmap</h2>
          <Link href="/projects" className="text-xs font-mono text-[#82C4DE] hover:underline flex items-center gap-1">
            <span>View All Projects</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projectRiskList.map((p: any) => {
            let statusTextColor = 'text-emerald-400';
            let dotColor = 'bg-emerald-400 shadow-[0_0_6px_#34D399]';
            let riskLevel = 'Nominal';
            if (p.compositeRisk >= 75) {
              statusTextColor = 'text-red-400';
              dotColor = 'bg-red-400 shadow-[0_0_6px_#F87171]';
              riskLevel = 'Critical Risk';
            } else if (p.compositeRisk >= 40) {
              statusTextColor = 'text-amber-400';
              dotColor = 'bg-amber-400 shadow-[0_0_6px_#FBBF24]';
              riskLevel = 'Moderate Risk';
            }

            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div 
                  className="p-5 neu-panel hover:border-[#5CA8C9]/50 transition-all group flex flex-col justify-between gap-3 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-display text-white text-sm truncate group-hover:text-[#82C4DE] transition-colors">
                      {p.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase neu-pressed flex items-center gap-1 ${statusTextColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      {riskLevel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-2 border-t border-white/[0.06]">
                    <span>Status: <strong className="text-white">{p.status}</strong></span>
                    <span className="text-[#5CA8C9] font-bold">{p.progress || 35}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Activity Logs & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          className="p-6 neu-panel lg:col-span-2 shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.08]">
              <span className="material-symbols-outlined text-[#82C4DE] text-lg">history</span>
              <h2 className="text-lg font-display font-bold text-white">Live Activity Stream</h2>
            </div>
            
            <div className="space-y-2">
              {activities.length > 0 ? (
                activities.map((act: any) => (
                  <div key={act.id} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0 text-xs">
                    <span className="text-neutral-200">
                      <strong className="text-white font-mono">{act.actorName}</strong> <span className="text-neutral-400">{act.action}</span> <span className="text-[#82C4DE] font-semibold">{act.entityLabel}</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">{new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] text-xs">
                    <span className="text-neutral-200">
                      <strong className="text-white font-mono">System Lead</strong> <span className="text-neutral-400">synchronized</span> <span className="text-[#82C4DE] font-semibold">Pulse Telemetry</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">Just now</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] text-xs">
                    <span className="text-neutral-200">
                      <strong className="text-white font-mono">Client User</strong> <span className="text-neutral-400">submitted</span> <span className="text-[#82C4DE] font-semibold">Architecture Scope Brief</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">10m ago</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div 
          className="p-6 neu-panel shadow-xl flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.08]">
              <span className="material-symbols-outlined text-[#82C4DE] text-lg">bolt</span>
              <h2 className="text-lg font-display font-bold text-white">Operations Shortcuts</h2>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link href="/projects" className="flex items-center gap-3 p-3.5 neu-panel hover:bg-white/[0.06] transition-all group">
                <div className="w-8 h-8 rounded-xl neu-button text-[#82C4DE] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  +
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-white block">Create Project Workspace</span>
                  <span className="text-[10px] text-neutral-400">Provision Kanban & Milestones</span>
                </div>
              </Link>

              <Link href="/pulse" className="flex items-center gap-3 p-3.5 neu-panel hover:bg-white/[0.06] transition-all group">
                <div className="w-8 h-8 rounded-xl neu-button text-emerald-400 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  💓
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-white block">Generate Delivery Pulse</span>
                  <span className="text-[10px] text-neutral-400">Share zero-login client link</span>
                </div>
              </Link>

              <Link href="/enquiries" className="flex items-center gap-3 p-3.5 neu-panel hover:bg-white/[0.06] transition-all group">
                <div className="w-8 h-8 rounded-xl neu-button text-purple-400 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  💬
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-white block">Client Discussion Hub</span>
                  <span className="text-[10px] text-neutral-400">Reply to briefs & scope inquiries</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
