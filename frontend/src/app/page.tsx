import { Button } from '@/components/ui/Button';
import { Panel, LedIndicator } from '@/components/ui';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#040608] text-white selection:bg-[#5CA8C9] selection:text-black font-sans">
      {/* Ambient Radial Mesh Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#5CA8C9]/20 via-[#255168]/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-[#82C4DE]/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-36 pb-24 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-[0_0_20px_rgba(92,168,201,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#82C4DE]">
              FORGE 2.0 // ENTERPRISE DELIVERY ENGINE
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black tracking-tight mb-8 text-white leading-[1.08]">
            Architect complex scopes. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5CA8C9] via-[#82C4DE] to-[#FFFFFF] drop-shadow-[0_0_35px_rgba(92,168,201,0.4)]">
              Deliver with precision.
            </span>
          </h1>
          
          <p className="text-base sm:text-xl text-neutral-300 max-w-3xl mb-12 leading-relaxed font-sans font-normal">
            A unified software delivery lifecycle platform bringing together instant AI scope estimation, live client stakeholder transparency, and real-time telemetry analytics.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/estimator">
              <button className="px-8 py-4 rounded-2xl bg-[#5CA8C9] hover:bg-[#82C4DE] text-black font-extrabold text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(92,168,201,0.45)] hover:shadow-[0_0_40px_rgba(92,168,201,0.7)] active:scale-95 transition-all duration-200 flex items-center gap-2 font-mono">
                <span>Start AI Scope Estimation</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </Link>
            <Link href="/client/login">
              <button className="px-8 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] hover:border-white/[0.2] font-bold text-sm uppercase tracking-wider backdrop-blur-xl active:scale-95 transition-all duration-200 flex items-center gap-2 font-mono">
                <span>Client Portal Access</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </button>
            </Link>
          </div>

        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="px-6 py-24 relative z-10 border-t border-white/[0.08] bg-[#06080C]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#82C4DE] font-bold block mb-2">
              ENGINEERED FOR STAKEHOLDER TRANSPARENCY
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
              Three pillars of flawless delivery.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* PILLAR 1 */}
            <div className="p-8 rounded-3xl bg-[#080C12] border border-white/[0.08] hover:border-[#5CA8C9]/50 transition-all group flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5CA8C9]/10 border border-[#5CA8C9]/30 text-[#82C4DE] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(92,168,201,0.2)]">
                  <span className="material-symbols-outlined text-2xl">psychology</span>
                </div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#82C4DE] transition-colors">
                  AI Architecture Estimator
                </h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Generates instant multi-factor technical complexity models, budget bands, and compliance breakdown radar charts in seconds.
                </p>
              </div>

              <div className="pt-6 border-t border-white/[0.06] mt-8">
                <ul className="space-y-2 text-xs font-mono text-neutral-300">
                  <li className="flex items-center gap-2">
                    <span className="text-[#5CA8C9]">✓</span> Multi-Factor Cost & Timeline Radar
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#5CA8C9]">✓</span> Integration & Compliance Weights
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#5CA8C9]">✓</span> Instant Scope Proposal Transmission
                  </li>
                </ul>
              </div>
            </div>

            {/* PILLAR 2 */}
            <div className="p-8 rounded-3xl bg-[#080C12] border border-white/[0.08] hover:border-emerald-500/50 transition-all group flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <span className="material-symbols-outlined text-2xl">monitor_heart</span>
                </div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Live Client Executive Portal
                </h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Real-time stakeholder cockpit featuring live Kanban pipelines, milestone sign-off gates, environment telemetry, and direct chat.
                </p>
              </div>

              <div className="pt-6 border-t border-white/[0.06] mt-8">
                <ul className="space-y-2 text-xs font-mono text-neutral-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Real-Time WebSocket Synchronization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Milestone Sign-Off & Approvals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Zero-Login Secure Delivery Pulse Links
                  </li>
                </ul>
              </div>
            </div>

            {/* PILLAR 3 */}
            <div className="p-8 rounded-3xl bg-[#080C12] border border-white/[0.08] hover:border-purple-500/50 transition-all group flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <span className="material-symbols-outlined text-2xl">insights</span>
                </div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-purple-400 transition-colors">
                  Operations Control Terminal
                </h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Comprehensive dashboard for engineering leadership: cross-project risk simulations, lead velocity tracking, and enquiry management.
                </p>
              </div>

              <div className="pt-6 border-t border-white/[0.06] mt-8">
                <ul className="space-y-2 text-xs font-mono text-neutral-300">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> Cross-Project Risk Heatmap
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> Inbound Lead Conversion Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">✓</span> Client Provisioning & Access Control
                  </li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/[0.08] text-center text-xs font-mono text-neutral-500 bg-[#040608]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-300 font-bold">FORGE 2.0 PLATFORM</span>
          </div>
          <span>Precision Engineering & Lifecycle Automation</span>
          <div className="flex items-center gap-4 text-neutral-400">
            <Link href="/estimator" className="hover:text-white transition-colors">Estimator</Link>
            <Link href="/client/login" className="hover:text-white transition-colors">Client Portal</Link>
            <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="hover:text-[#82C4DE] transition-colors">Admin Terminal</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
