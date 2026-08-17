import { Button } from '@/components/ui/Button';
import { Panel, LedIndicator } from '@/components/ui';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-bg-deep">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      {/* Animated Glowing Orbs */}
      <div className="absolute top-[-10%] left-[10%] w-[800px] h-[500px] bg-primary-container/20 rounded-full blur-[140px] animate-pulse-slow -z-10" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-primary-bright/10 rounded-full blur-[160px] animate-pulse-slow -z-10" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow -z-10" style={{ animationDelay: '4s' }} />

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-32 pb-24 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="font-mono text-xs text-brand-primary-bright tracking-widest uppercase mb-6 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary-bright animate-pulse"></span>
            SYSTEM // FORGE 2.0 ENTERPRISE
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold font-display tracking-tighter mb-8 max-w-5xl text-text-strong leading-[1.1]">
            Deliver complex scopes <br />
            <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-primary via-brand-primary-bright to-primary-container drop-shadow-[0_0_30px_rgba(var(--shadow-brand-rgb), 0.3)]">
              with absolute clarity.
            </em>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-muted max-w-3xl mb-12 leading-relaxed font-mono">
            An intelligent project lifecycle platform unifying lead estimation, risk simulation, real-time client delivery portals, and advanced team analytics.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/estimator">
              <Button size="lg" className="px-10 py-5 text-lg shadow-[0_0_30px_rgba(var(--shadow-brand-rgb), 0.3)] active:scale-[0.98] transition-transform">
                Try the AI Estimator
              </Button>
            </Link>
            <Link href="/client/login">
              <Button variant="secondary" size="lg" className="px-10 py-5 text-lg bg-bg/50 backdrop-blur-md active:scale-[0.98] transition-transform">
                Client Portal Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="px-6 py-32 relative z-10 border-t border-border bg-bg/30 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">One Engine. Three Frontends.</h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto font-mono text-sm leading-relaxed">
              A unified monorepo powering the public site, internal ops, and the shared backend API.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cards with staggered animation delays */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Panel interactive withRivets className="h-full border-border/50">
                <div className="flex items-center gap-3 mb-6 p-2 bg-bg-deep border border-border/50 rounded-sm inline-flex">
                  <LedIndicator status="active" />
                  <span className="text-text-strong font-mono text-sm font-bold tracking-widest">:3000</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-text-strong mb-3">Public Portal</h3>
                <p className="text-text-muted font-mono text-sm mb-6 leading-relaxed">The credibility-first Next.js 15 marketing site, featuring the public AI-Powered Estimator and engineering blog.</p>
                <div className="h-px w-full bg-gradient-to-r from-border to-transparent my-6"></div>
                <ul className="text-sm font-mono space-y-3 text-text-strong">
                  <li className="flex items-center gap-2"><span className="text-primary">✦</span> Lead Generation</li>
                  <li className="flex items-center gap-2"><span className="text-primary">✦</span> Client WebSockets</li>
                </ul>
              </Panel>
            </div>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Panel interactive withRivets className="h-full border-brand-primary-bright/30 shadow-[0_0_40px_rgba(var(--shadow-brand-rgb), 0.05)]">
                <div className="flex items-center gap-3 mb-6 p-2 bg-brand-primary-bright/10 border border-brand-primary-bright/30 rounded-sm inline-flex">
                  <LedIndicator status="critical" />
                  <span className="text-brand-primary-bright font-mono text-sm font-bold tracking-widest">:3001</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-text-strong mb-3">Admin Ops</h3>
                <p className="text-text-muted font-mono text-sm mb-6 leading-relaxed">The internal Next.js dashboard for PMs to manage leads, re-scope projects, and orchestrate delivery.</p>
                <div className="h-px w-full bg-gradient-to-r from-brand-primary-bright/30 to-transparent my-6"></div>
                <ul className="text-sm font-mono space-y-3 text-text-strong">
                  <li className="flex items-center gap-2"><span className="text-brand-primary-bright">✦</span> Interactive Kanban</li>
                  <li className="flex items-center gap-2"><span className="text-brand-primary-bright">✦</span> Risk Simulation</li>
                </ul>
              </Panel>
            </div>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <Panel interactive withRivets className="h-full border-border/50">
                <div className="flex items-center gap-3 mb-6 p-2 bg-bg-deep border border-border/50 rounded-sm inline-flex">
                  <LedIndicator status="warning" />
                  <span className="text-text-strong font-mono text-sm font-bold tracking-widest">:5001</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-text-strong mb-3">Core API</h3>
                <p className="text-text-muted font-mono text-sm mb-6 leading-relaxed">The unified Express + Prisma backend driving real-time WebSockets and secure HttpOnly auth.</p>
                <div className="h-px w-full bg-gradient-to-r from-border to-transparent my-6"></div>
                <ul className="text-sm font-mono space-y-3 text-text-strong">
                  <li className="flex items-center gap-2"><span className="text-warning">✦</span> Secure JWT Auth</li>
                  <li className="flex items-center gap-2"><span className="text-warning">✦</span> PostgreSQL Database</li>
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
