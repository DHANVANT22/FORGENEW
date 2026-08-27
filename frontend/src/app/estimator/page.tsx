'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const INTEGRATIONS_LIST = ['Stripe / Payments', 'Salesforce / HubSpot CRM', 'Auth0 / SSO', 'AWS / Cloud Infrastructure', 'Custom Legacy API'];

const questions = [
  {
    id: 'users',
    text: 'Who is the primary audience for this platform?',
    subtitle: 'Select the operational boundary of the application',
    icon: 'group',
    options: [
      { label: 'Internal Organization Team Only', score: 1, desc: 'Low concurrency, strict RBAC' },
      { label: 'External Customers & Public Users', score: 2, desc: 'High concurrency, public auth' },
      { label: 'Hybrid (Enterprise Staff + Global Public)', score: 3, desc: 'Multi-tenant, granular roles' },
      { label: 'Explore Default Profile', score: 2, desc: 'Standard baseline estimate' }
    ]
  },
  {
    id: 'data',
    text: 'Does this platform integrate with external APIs or databases?',
    subtitle: 'System architecture interoperability requirements',
    icon: 'sync_alt',
    options: [
      { label: 'Standalone Green-Field Application', score: 0, desc: 'Self-contained PostgreSQL / Prisma' },
      { label: '1–2 Core Webhook Services (Stripe, Resend)', score: 2, desc: 'Transactional events' },
      { label: 'Deep Integration with Legacy ERP / CRM Mesh', score: 4, desc: 'Continuous sync & failover' },
      { label: 'Standard Web Integrations', score: 2, desc: 'OAuth + Payment Gateway' }
    ]
  },
  {
    id: 'compliance',
    text: 'What regulatory & compliance level is demanded?',
    subtitle: 'Security controls, audit logs, and data sovereignty',
    icon: 'verified_user',
    options: [
      { label: 'Standard Web & API Security Protocols', score: 1, desc: 'JWT + HTTPS + CORS' },
      { label: 'Financial / PCI-DSS Payment Handling', score: 2, desc: 'Encrypted tokens, audit logs' },
      { label: 'SOC2 Type II / HIPAA Healthcare Tier', score: 4, desc: 'Zero-trust, immutable audit' },
      { label: 'Standard Commercial Tier', score: 2, desc: 'Production hardened' }
    ]
  },
  {
    id: 'urgency',
    text: 'What is your targeted delivery velocity?',
    subtitle: 'Sprint scheduling and dedicated engineering allocation',
    icon: 'speed',
    options: [
      { label: 'Flexible Engineering Schedule (4+ Months)', score: 1, desc: 'Standard phased rollouts' },
      { label: 'Standard Sprint Cadence (2–3 Months)', score: 2, desc: 'Bi-weekly release gates' },
      { label: 'Expedited Priority Sprint (< 6 Weeks)', score: 3, desc: 'Dedicated daily CI/CD push' },
      { label: 'Standard 8-Week Build', score: 2, desc: 'Optimized delivery cycle' }
    ]
  },
  {
    id: 'scale',
    text: 'What is the projected concurrency scale?',
    subtitle: 'Infrastructure provisioning and caching layer',
    icon: 'cloud_queue',
    options: [
      { label: 'Initial Launch (< 5,000 Active Users)', score: 1, desc: 'Single-region serverless' },
      { label: 'Scaling Production (50,000+ Active Users)', score: 2, desc: 'Edge CDN + Redis cache' },
      { label: 'Enterprise Global Mesh (Millions of Events)', score: 4, desc: 'Distributed multi-region cluster' },
      { label: 'Scalable Cloud Baseline', score: 2, desc: 'Auto-scaling Kubernetes' }
    ]
  }
];

export default function EstimatorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<{ id?: string; tier: string; axisScores?: any; similarProjectsCount?: number } | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [scopeDetails, setScopeDetails] = useState('');
  const [submittedEnquiry, setSubmittedEnquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  useEffect(() => {
    let storedSessionId = localStorage.getItem('estimator_session_id');
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem('estimator_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const handleSelectOption = (questionId: string, option: any) => {
    const nextAnswers = { ...answers, [questionId]: option };
    setAnswers(nextAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult(nextAnswers);
    }
  };

  const calculateResult = (finalAnswers: Record<string, any>) => {
    let totalScore = 0;
    Object.values(finalAnswers).forEach(ans => {
      totalScore += (ans.score || 1);
    });

    let tier = 'Tier 1 — Core App';
    if (totalScore >= 12) {
      tier = 'Tier 3 — Scaled Cloud Mesh';
    } else if (totalScore >= 7) {
      tier = 'Tier 2 — High-Performance Cloud';
    }

    const radarScores = [
      { axis: 'Architecture', value: Math.min(100, (finalAnswers.data?.score || 1) * 25 + 20) },
      { axis: 'Compliance', value: Math.min(100, (finalAnswers.compliance?.score || 1) * 25 + 15) },
      { axis: 'Scale', value: Math.min(100, (finalAnswers.scale?.score || 1) * 25 + 20) },
      { axis: 'Velocity', value: Math.min(100, (finalAnswers.urgency?.score || 1) * 30 + 10) },
      { axis: 'Multi-Tenant', value: Math.min(100, (finalAnswers.users?.score || 1) * 30 + 10) },
    ];

    setResult({
      tier,
      axisScores: radarScores,
      similarProjectsCount: 14
    });
  };

  const handleSubmitScopeEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail || !result) return;
    setSubmitting(true);

    const enquiryPayload = {
      clientName: clientName || 'Enterprise Lead',
      clientEmail: clientEmail.trim(),
      type: 'SCOPE_ESTIMATE',
      text: `📋 [NEW PROJECT BRIEF / SCOPE REQUEST]\nTitle: ${clientName || 'Inbound Project'}\nComplexity Tier: ${result.tier}\nRequirements: ${scopeDetails || 'Estimated via AI Architecture Estimator'}\nSelected Integrations: ${selectedIntegrations.join(', ') || 'Standard stack'}`
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiryPayload)
      });

      if (res.ok) {
        setSubmittedEnquiry(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = Math.round(((currentStep + (result ? 1 : 0)) / questions.length) * 100);

  return (
    <main className="min-h-screen bg-[#05070A] text-slate-100 pt-28 pb-24 px-6 relative overflow-hidden font-sans selection:bg-cyan-400 selection:text-slate-950">
      {/* Background Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Step Indicator Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.03] border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              AI ARCHITECTURAL SCOPING MATRIX
            </span>
          </div>

          <h1 className="text-display-2xl font-bold text-slate-100">
            {result ? 'Architectural Fingerprint' : 'Software Scope Estimator'}
          </h1>
          <p className="text-ui-sm text-slate-400 max-w-xl mx-auto font-sans">
            {result 
              ? 'Multi-dimensional technical breakdown and immediate budget band modeling.'
              : 'Answer 5 quick architecture questions to simulate complexity, timeline, and budget.'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Progress</span>
            <span className="text-cyan-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        {!result ? (
          <div className="p-8 rounded-3xl bg-[#080B10]/90 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.06)] backdrop-blur-2xl space-y-8 relative overflow-hidden">
            
            {/* Question Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">{questions[currentStep].icon}</span>
                <span>Question {currentStep + 1} of {questions.length}</span>
              </div>
              <h2 className="text-ui-lg font-bold text-slate-100">
                {questions[currentStep].text}
              </h2>
              <p className="text-ui-sm text-slate-400 font-sans">
                {questions[currentStep].subtitle}
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {questions[currentStep].options.map((opt, oIdx) => {
                const isSelected = answers[questions[currentStep].id]?.score === opt.score;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(questions[currentStep].id, opt)}
                    className={`p-6 rounded-2xl text-left group flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-950/80 border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm transition-colors ${
                        isSelected ? 'text-cyan-400' : 'text-slate-100 group-hover:text-cyan-400'
                      }`}>
                        {opt.label}
                      </span>
                      <span className={`material-symbols-outlined text-base transition-colors shrink-0 ${
                        isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'
                      }`}>
                        {isSelected ? 'check_circle' : 'arrow_forward'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step Navigation Footprint */}
            {currentStep > 0 && (
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-xs font-mono text-slate-400 hover:text-slate-100 flex items-center gap-1.5 transition-colors font-bold"
                >
                  <span className="material-symbols-outlined text-sm shrink-0">arrow_back</span>
                  <span>Previous Question</span>
                </button>
              </div>
            )}

          </div>
        ) : (
          /* RESULT STUDIO */
          <div className="space-y-8">
            
            {/* Top Fingerprint Card */}
            <div className="p-8 card-level-1 grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative overflow-hidden">
              
              <div className="md:col-span-7 space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold block mb-1">
                    ESTIMATED COMPLEXITY CLASSIFICATION
                  </span>
                  <h2 className="text-display-xl font-bold text-slate-100">
                    {result.tier}
                  </h2>
                  <p className="text-ui-sm text-slate-400 font-sans mt-2 leading-relaxed">
                    Based on your multi-axis selections, your architecture falls in the top efficiency percentile for modern cloud delivery.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Estimated Budget Band</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {result.tier.includes('Tier 3') ? '$25k – $50k' : result.tier.includes('Tier 2') ? '$12k – $25k' : '$5k – $12k'}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Estimated Delivery Sprint</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">
                      {result.tier.includes('Tier 3') ? '8–12 Weeks' : result.tier.includes('Tier 2') ? '4–6 Weeks' : '2–4 Weeks'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['React 19 / Next.js', 'PostgreSQL / Prisma', 'Tailwind CSS v4', 'Socket.IO Telemetry', 'Docker Deployment'].map((tag, tIdx) => (
                    <span key={tIdx} className="px-3 py-1 rounded-full text-[10px] font-mono bg-slate-900 text-slate-300 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Radar Chart */}
              <div className="md:col-span-5 flex flex-col items-center justify-center h-64 p-2 bg-slate-900/60 rounded-xl border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.axisScores}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                    <PolarAngleAxis dataKey="axis" stroke="#38BDF8" tick={{ fill: '#38BDF8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" />
                    <Radar name="Complexity" dataKey="value" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Scope Proposal Submission Card */}
            <div className="p-8 card-level-1">
              {submittedEnquiry ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                  </div>
                  <h3 className="text-ui-lg font-semibold text-slate-100">Scope Proposal Transmitted!</h3>
                  <p className="text-ui-sm text-slate-400 max-w-md mx-auto font-sans">
                    Our lead engineering team has received your architecture brief. You can track progress or discuss requirements directly in the Client Portal.
                  </p>
                  <Link href="/client/login">
                    <Button variant="primary" size="md">
                      Proceed to Client Portal
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitScopeEnquiry} className="space-y-6">
                  <div>
                    <h3 className="text-ui-lg font-semibold text-slate-100">
                      Transmit Scope Brief to Engineering Team
                    </h3>
                    <p className="text-ui-sm text-slate-400 font-sans mt-1">
                      Lock in this architectural estimate and initiate a private discussion channel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">Your Name / Organization</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Corp Lead"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        className="neu-input w-full px-4 py-3 text-xs text-slate-100 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        className="neu-input w-full px-4 py-3 text-xs text-slate-100 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">Additional Technical Notes or Requirements (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Needs single sign-on (SSO), data residency in EU, and dedicated test suite."
                      value={scopeDetails}
                      onChange={e => setScopeDetails(e.target.value)}
                      className="neu-input w-full p-4 text-xs text-slate-100 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Integrations Picker */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowIntegrations(!showIntegrations)}
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">{showIntegrations ? 'expand_less' : 'add'}</span>
                      <span>{showIntegrations ? 'Hide Specific Integrations' : 'Specify Third-Party APIs / Integrations (Optional)'}</span>
                    </button>

                    {showIntegrations && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {INTEGRATIONS_LIST.map((integ, iIdx) => {
                          const isSelected = selectedIntegrations.includes(integ);
                          return (
                            <button
                              key={iIdx}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedIntegrations(selectedIntegrations.filter(i => i !== integ));
                                } else {
                                  setSelectedIntegrations([...selectedIntegrations, integ]);
                                }
                              }}
                              className={`p-3 rounded-xl text-left text-xs font-mono transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'card-level-2 border-cyan-400 text-cyan-400'
                                  : 'card-level-1 text-slate-400 hover:text-slate-100'
                              }`}
                            >
                              <span>{integ}</span>
                              <span className="material-symbols-outlined text-sm">{isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <Button
                      type="submit"
                      disabled={submitting}
                      variant="primary"
                      size="lg"
                    >
                      {submitting ? 'Transmitting Scope...' : 'Transmit Scope Proposal'}
                      <span className="material-symbols-outlined text-sm">send</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
