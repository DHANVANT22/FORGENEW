import React from 'react';
import { Card } from '@/components/ui/Card';
import { SparklineChart } from '@/components/ui/SparklineChart';
import { ClientPulseEntrance } from '@/components/ui/ClientPulseEntrance';
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/pulse/${resolvedParams.token}`, { cache: 'no-store' });
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
  
  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/pulse/${resolvedParams.token}`, { cache: 'no-store' });
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
    <main className="min-h-screen bg-background font-body-md py-16 px-6 animate-fade-in-up text-on-surface">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-12 border-b border-border pb-6">
          <div className="w-12 h-12 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xl text-primary">
            H
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-primary">Delivery Pulse</span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface">{snapshot.projectName}</h1>
          </div>
        </div>

        <ClientPulseEntrance>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-border bg-surface-container/30">
            <h3 className="text-xs font-mono text-on-surface-variant mb-2 uppercase tracking-wider">Current Phase</h3>
            <div className="font-display text-3xl font-bold text-on-surface">{snapshot.phase}</div>
          </Card>

          <Card className="p-6 border-border bg-surface-container/30">
            <h3 className="text-xs font-mono text-on-surface-variant mb-2 uppercase tracking-wider">Status</h3>
            <div className={`font-display text-3xl font-bold capitalize ${snapshot.status === 'on track' ? 'text-success' : snapshot.status === 'delayed' ? 'text-danger' : 'text-warning'}`}>
              {snapshot.status}
            </div>
          </Card>
          
          <Card className="p-6 border-border bg-surface-container/30">
            <h3 className="text-xs font-mono text-on-surface-variant mb-2 uppercase tracking-wider">Completion Rate</h3>
            <div className="flex items-end gap-3">
              <div className="font-display text-3xl font-bold text-primary">{snapshot.completionRate}%</div>
              <div className="w-full bg-surface-container-highest rounded-full h-2 mb-2">
                <div className="bg-primary h-2 rounded-full shadow-[0_0_10px_rgba(var(--shadow-brand-rgb), 0.5)]" style={{ width: `${snapshot.completionRate}%` }}></div>
              </div>
            </div>
          </Card>
        </div>

        {snapshot.budgetAmount && (
          <div className="mb-8">
            <Card className="p-6 border-border bg-surface-container/30 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono text-on-surface-variant mb-1 uppercase tracking-wider">Project Budget</h3>
                <div className="font-display text-2xl font-bold text-on-surface">${Number(snapshot.budgetAmount).toLocaleString()}</div>
              </div>
              {snapshot.budget && (
                <div className="text-right">
                   <h3 className="text-xs font-mono text-on-surface-variant mb-1 uppercase tracking-wider">Spent</h3>
                   <div className="font-display text-2xl font-bold text-primary">{snapshot.budget}</div>
                </div>
              )}
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="p-8 border-l-4 border-l-primary bg-surface-container-low h-full flex flex-col">
            <h3 className="font-display text-xl font-bold mb-4">Next Milestone</h3>
            <div className="flex justify-between items-center mb-auto">
              <span className="text-lg text-on-surface">{snapshot.nextMilestone.title}</span>
              <span className="font-mono text-sm bg-surface-container-high px-4 py-2 rounded text-on-surface-variant border border-border">
                {snapshot.nextMilestone.targetDate}
              </span>
            </div>
          </Card>
          
          {snapshot.coarseState && (
             <Card className="p-8 border-border bg-surface-container/30 h-full flex flex-col">
                <h3 className="font-display text-lg font-bold mb-2">Project Health</h3>
                <div className="flex items-center gap-2 mb-auto">
                   <span className={`w-3 h-3 rounded-full ${snapshot.coarseState === 'Needs Attention' ? 'bg-danger' : snapshot.coarseState === 'Monitoring' ? 'bg-warning' : 'bg-success'}`}></span>
                   <span className="font-mono uppercase tracking-wider text-sm">{snapshot.coarseState}</span>
                </div>
             </Card>
          )}
        </div>

        {/* Velocity and Changelog */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 border-border bg-surface-container/30">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-display text-xl font-bold mb-1">Execution Velocity</h3>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Tasks completed (Last 7 days)</p>
              </div>
              <div className="text-3xl font-display font-bold text-primary">
                {snapshot.velocity.reduce((a: number, b: number) => a + b, 0)}
              </div>
            </div>
            <div className="h-24 w-full opacity-80">
              <SparklineChart data={snapshot.velocity} width={400} height={100} color="#bb1327" />
            </div>
          </Card>

          <Card className="p-8 border-border bg-surface-container/30">
            <h3 className="font-display text-xl font-bold mb-6">Recent Changelog</h3>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              {snapshot.changelog && snapshot.changelog.length > 0 ? (
                snapshot.changelog.map((entry: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start relative pl-6">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-success/80"></div>
                    <div className="absolute left-1 top-3.5 w-px h-full bg-border/50 -z-10"></div>
                    <div>
                      <h4 className="text-sm font-medium text-text-strong leading-tight">{entry.title}</h4>
                      <p className="font-mono text-[10px] text-muted mt-1">{new Date(entry.completedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-on-surface-variant font-mono text-sm italic py-4">No tasks completed in the last 7 days.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="text-center mt-16 pt-8 border-t border-border">
          <p className="font-mono text-on-surface-variant text-sm mb-4">Want to message the team directly?</p>
          <a href="/client/login" className="text-primary hover:text-primary-container transition-colors font-medium hover:underline underline-offset-4">
            Ask us to set up your Client Portal &rarr;
          </a>
        </div>
        </ClientPulseEntrance>
      </div>
    </main>
  );
}
