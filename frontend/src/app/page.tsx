import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#040608] text-slate-100 selection:bg-cyan-400 selection:text-slate-950 font-sans">
      {/* Ambient Radial Mesh Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-b from-cyan-500/15 via-sky-500/5 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-32 pb-20 flex flex-col items-center justify-center text-center">
        <div className="max-w-5xl mx-auto flex flex-col items-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-cyan-400/40 transition-all shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38BDF8]" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              FORGE 2.0 // ENTERPRISE DELIVERY ENGINE
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-display-3xl font-extrabold tracking-tight text-slate-100 leading-[1.05] max-w-4xl">
            Architect Complex Scopes. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-white">
              Deliver With Precision.
            </span>
          </h1>
          
          <p className="text-ui-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-sans">
            A unified software delivery lifecycle platform bringing together instant AI scope estimation, live client stakeholder transparency, and real-time telemetry analytics.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/estimator">
              <Button variant="primary" size="lg" className="shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                <span>Start AI Scope Estimation</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Button>
            </Link>
            <Link href="/client/login">
              <Button variant="secondary" size="lg" className="border-white/20 hover:border-cyan-400/50">
                <span>Client Executive Gateway</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </Button>
            </Link>
          </div>

          {/* Real-time Metrics Banner */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl">
            <div className="p-4 rounded-2xl bg-[#080B10]/80 border border-white/10 backdrop-blur-md text-center">
              <span className="block text-2xl font-mono font-bold text-cyan-400">300+</span>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-1 block">Scopes Calculated</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#080B10]/80 border border-white/10 backdrop-blur-md text-center">
              <span className="block text-2xl font-mono font-bold text-emerald-400">99.9%</span>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-1 block">Delivery Precision</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#080B10]/80 border border-white/10 backdrop-blur-md text-center">
              <span className="block text-2xl font-mono font-bold text-sky-400">&lt; 16ms</span>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-1 block">Telemetry Latency</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#080B10]/80 border border-white/10 backdrop-blur-md text-center">
              <span className="block text-2xl font-mono font-bold text-amber-400">WebSocket</span>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-1 block">Live Sync Engine</span>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="px-6 py-24 relative z-10 border-t border-white/10 bg-[#06080C]/95 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold block">
              ENGINEERED FOR STAKEHOLDER TRANSPARENCY
            </span>
            <h2 className="text-display-2xl font-bold text-slate-100">
              Three pillars of flawless delivery.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* PILLAR 1 */}
            <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.06)] hover:shadow-[0_0_40px_rgba(56,189,248,0.15)] hover:border-cyan-400/50 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden backdrop-blur-2xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">psychology</span>
                </div>
                <h3 className="text-ui-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                  AI Architecture Estimator
                </h3>
                <p className="text-ui-sm text-slate-400 leading-relaxed font-sans">
                  Generates instant multi-factor technical complexity models, budget bands, and compliance breakdown radar charts in seconds.
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 mt-8">
                <ul className="space-y-2.5 text-xs font-mono text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">✓</span> Multi-Factor Cost & Timeline Radar
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">✓</span> Integration & Compliance Weights
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">✓</span> Instant Scope Proposal Transmission
                  </li>
                </ul>
              </div>
            </div>

            {/* PILLAR 2 */}
            <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(52,211,153,0.06)] hover:shadow-[0_0_40px_rgba(52,211,153,0.15)] hover:border-emerald-400/50 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden backdrop-blur-2xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">monitor_heart</span>
                </div>
                <h3 className="text-ui-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                  Live Client Executive Portal
                </h3>
                <p className="text-ui-sm text-slate-400 leading-relaxed font-sans">
                  Real-time stakeholder cockpit featuring live Kanban pipelines, milestone sign-off gates, environment telemetry, and direct chat.
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 mt-8">
                <ul className="space-y-2.5 text-xs font-mono text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Real-Time WebSocket Synchronization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Milestone Sign-Off & Approvals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span> Zero-Login Secure Delivery Pulse Links
                  </li>
                </ul>
              </div>
            </div>

            {/* PILLAR 3 */}
            <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.06)] hover:shadow-[0_0_40px_rgba(56,189,248,0.15)] hover:border-cyan-400/50 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden backdrop-blur-2xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">insights</span>
                </div>
                <h3 className="text-ui-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                  Operations Control Terminal
                </h3>
                <p className="text-ui-sm text-slate-400 leading-relaxed font-sans">
                  Comprehensive dashboard for engineering leadership: cross-project risk simulations, lead velocity tracking, and enquiry management.
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 mt-8">
                <ul className="space-y-2.5 text-xs font-mono text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">✓</span> Dynamic Risk Heatmap Simulations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">✓</span> Cross-Project Health Scorecard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">✓</span> Centralized Client Account Directory
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}

