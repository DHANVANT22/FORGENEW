import React from 'react';
import { Card } from '@/components/ui/Card';
import { SparklineChart } from '@/components/ui/SparklineChart';
import { ClientPulseEntrance } from '@/components/ui/ClientPulseEntrance';
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  try {
    const res = await fetch(`${apiUrl}/api/v1/pulse/${resolvedParams.token}`, { cache: 'no-store' });
    if (res.ok) {
      const snapshot = await res.json();
      return {
        title: `Delivery Pulse: ${snapshot.projectName}`,
        description: `Project Health: ${snapshot.coarseState}. Next milestone: ${snapshot.nextMilestone?.title}`,
        openGraph: {
          title: `Delivery Pulse: ${snapshot.projectName}`,
          description: `Project Health: ${snapshot.coarseState}. Next milestone: ${snapshot.nextMilestone?.title}`,
          images: ['/pulse-og.png'],
        }
      };
    }
  } catch (err) {}
  
  return {
    title: 'Delivery Pulse',
    description: 'Track project delivery pulse.',
    openGraph: {
      title: 'Delivery Pulse',
      description: 'Track project delivery pulse.',
      images: ['/pulse-og.png'],
    }
  };
}

export default async function PulsePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  
  let snapshot = null;
  let error = null;
  
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  try {
    const res = await fetch(`${apiUrl}/api/v1/pulse/${resolvedParams.token}`, { cache: 'no-store' });
    if (!res.ok) {
      error = 'Snapshot not found or expired.';
    } else {
      snapshot = await res.json();
    }
  } catch (err) {
    error = 'Failed to connect to API.';
  }

  // If API down or token invalid
  if (error || !snapshot) {
    return (
      <main className="min-h-screen bg-background font-body-md py-16 px-6 flex items-center justify-center animate-fade-in-up bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-lowest via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none"></div>
        <div className="p-10 max-w-md w-full text-center border border-border/50 bg-surface-container/30 backdrop-blur-md rounded-2xl shadow-2xl relative z-10">
          <div className="w-16 h-16 mx-auto bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(187,19,39,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface mb-3">Link Expired or Invalid</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
            This delivery pulse link is no longer active. It may have been rotated or expired. Please contact your project manager for a new link.
          </p>
          <a href="/" className="inline-block bg-surface-container-high text-on-surface hover:text-primary font-medium px-6 py-3 rounded-lg hover:bg-surface-container-highest transition-colors border border-border">
            Return to Homepage
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#040608] font-sans py-16 px-6 animate-fade-in-up text-slate-100 selection:bg-cyan-400 selection:text-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center font-bold text-xl text-cyan-400 font-mono shadow-[0_0_20px_rgba(56,189,248,0.2)] shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-bold">Secure Delivery Pulse Telemetry</span>
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-white">{snapshot.projectName}</h1>
          </div>
        </div>

        <ClientPulseEntrance>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl backdrop-blur-2xl">
              <h3 className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider font-bold">Current Phase</h3>
              <div className="font-display text-2xl font-bold text-white">{snapshot.phase}</div>
            </div>

            <div className="p-6 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl backdrop-blur-2xl">
              <h3 className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider font-bold">Status</h3>
              <div className={`font-display text-2xl font-bold capitalize ${snapshot.status === 'on track' ? 'text-emerald-400' : snapshot.status === 'delayed' ? 'text-rose-400' : 'text-amber-400'}`}>
                ● {snapshot.status}
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl backdrop-blur-2xl">
              <h3 className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider font-bold">Completion Rate</h3>
              <div className="flex items-end gap-3">
                <div className="font-display text-2xl font-bold text-cyan-400 font-mono">{snapshot.completionRate}%</div>
                <div className="w-full bg-black/60 border border-white/10 rounded-full h-2 mb-2 p-0.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-sky-400 h-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.6)]" style={{ width: `${snapshot.completionRate}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {snapshot.budgetAmount && (
            <div className="mb-8">
              <div className="p-6 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl backdrop-blur-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider font-bold">Project Budget</h3>
                  <div className="font-display text-2xl font-bold text-white">${Number(snapshot.budgetAmount).toLocaleString()}</div>
                </div>
                {snapshot.budget && (
                  <div className="text-right">
                     <h3 className="text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider font-bold">Spent</h3>
                     <div className="font-display text-2xl font-bold text-cyan-400">{snapshot.budget}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="p-8 rounded-3xl border-l-4 border-l-cyan-400 bg-[#080B10]/90 border border-white/10 shadow-xl backdrop-blur-2xl h-full flex flex-col justify-between">
              <h3 className="font-display text-xl font-bold mb-4 text-white">Next Milestone</h3>
              <div className="flex justify-between items-center">
                <span className="text-base text-slate-200 font-semibold">{snapshot.nextMilestone.title}</span>
                <span className="font-mono text-xs bg-cyan-400/10 text-cyan-400 px-3.5 py-1.5 rounded-full border border-cyan-400/20 font-bold">
                  {snapshot.nextMilestone.targetDate}
                </span>
              </div>
            </div>
            
            {snapshot.coarseState && (
               <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl backdrop-blur-2xl h-full flex flex-col justify-between">
                  <h3 className="font-display text-xl font-bold mb-2 text-white">Project Health</h3>
                  <div className="flex items-center gap-2.5">
                     <span className={`w-3 h-3 rounded-full ${snapshot.coarseState === 'Needs Attention' ? 'bg-rose-400 shadow-[0_0_8px_#F87171]' : snapshot.coarseState === 'Monitoring' ? 'bg-amber-400 shadow-[0_0_8px_#FBBF24]' : 'bg-emerald-400 shadow-[0_0_8px_#34D399]'}`}></span>
                     <span className="font-mono uppercase tracking-wider text-sm font-bold text-slate-200">{snapshot.coarseState}</span>
                  </div>
               </div>
            )}
          </div>

          {/* Velocity and Changelog */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl backdrop-blur-2xl">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold mb-1 text-white">Execution Velocity</h3>
                  <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Tasks completed (Last 7 days)</p>
                </div>
                <div className="text-3xl font-display font-mono font-bold text-cyan-400">
                  {snapshot.velocity.reduce((a: number, b: number) => a + b, 0)}
                </div>
              </div>
              <div className="h-24 w-full opacity-90">
                <SparklineChart data={snapshot.velocity} width={400} height={100} color="#38BDF8" />
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-xl backdrop-blur-2xl">
              <h3 className="font-display text-xl font-bold mb-6 text-white">Recent Changelog</h3>
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                {snapshot.changelog && snapshot.changelog.length > 0 ? (
                  snapshot.changelog.map((entry: any, i: number) => (
                    <div key={i} className="flex gap-4 items-start relative pl-6">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]"></div>
                      <div className="absolute left-1 top-3.5 w-px h-full bg-white/10 -z-10"></div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 leading-tight">{entry.title}</h4>
                        <p className="font-mono text-[10px] text-slate-400 mt-1">{new Date(entry.completedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 font-mono text-sm italic py-4">No tasks completed in the last 7 days.</div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mt-16 pt-8 border-t border-white/10">
            <p className="font-mono text-slate-400 text-sm mb-4">Want to message the engineering team directly?</p>
            <a href="/client/login" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-bold text-sm hover:underline underline-offset-4 font-mono">
              <span>Ask us to set up your Client Portal</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </ClientPulseEntrance>
      </div>
    </main>
  );
}
