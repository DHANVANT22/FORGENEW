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
    <main className="min-h-screen bg-[#040608] text-white pt-28 pb-24 px-6 relative overflow-hidden font-sans selection:bg-[#5CA8C9] selection:text-black">
      {/* Background Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#5CA8C9]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Step Indicator Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#82C4DE] font-bold">
              AI ARCHITECTURAL SCOPING MATRIX
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
            {result ? 'Architectural Fingerprint' : 'Software Scope Estimator'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans max-w-xl mx-auto">
            {result 
              ? 'Multi-dimensional technical breakdown and immediate budget band modeling.'
              : 'Answer 5 quick architecture questions to simulate complexity, timeline, and budget.'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span>Progress</span>
            <span className="text-[#82C4DE] font-bold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full neu-pressed rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#5CA8C9] to-[#82C4DE] rounded-full transition-all duration-300 shadow-[0_0_8px_#5CA8C9]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        {!result ? (
          <div className="p-8 rounded-3xl neu-panel space-y-8 relative overflow-hidden">
            {/* Rivet Accents */}
            <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-dotted border-white/20 opacity-50 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.8)] pointer-events-none" />
            <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-dotted border-white/20 opacity-50 shadow-[inset_-1px_1px_1px_rgba(0,0,0,0.8)] pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-dotted border-white/20 opacity-50 shadow-[inset_1px_-1px_1px_rgba(0,0,0,0.8)] pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-dotted border-white/20 opacity-50 shadow-[inset_-1px_-1px_1px_rgba(0,0,0,0.8)] pointer-events-none" />
            
            {/* Question Title */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#82C4DE] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">{questions[currentStep].icon}</span>
                <span>Question {currentStep + 1} of {questions.length}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                {questions[currentStep].text}
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
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
                    className={`p-5 rounded-2xl text-left group flex flex-col justify-between gap-3 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'neu-pressed border border-[#5CA8C9]/70 shadow-[inset_3px_3px_8px_rgba(0,0,0,0.8),0_0_20px_rgba(92,168,201,0.3)] scale-[0.99]'
                        : 'neu-button hover:-translate-y-0.5 hover:border-[#5CA8C9]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm font-display transition-colors ${
                        isSelected ? 'text-[#82C4DE]' : 'text-white group-hover:text-[#82C4DE]'
                      }`}>
                        {opt.label}
                      </span>
                      <span className={`material-symbols-outlined text-sm transition-colors ${
                        isSelected ? 'text-[#82C4DE]' : 'text-neutral-600 group-hover:text-[#82C4DE]'
                      }`}>
                        {isSelected ? 'check_circle' : 'arrow_forward'}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step Navigation Footprint */}
            {currentStep > 0 && (
              <div className="pt-4 border-t border-white/[0.06] flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Previous Question</span>
                </button>
              </div>
            )}

          </div>
        ) : (
          /* RESULT STUDIO */
          <div className="space-y-8 animate-fade-in-up">
            
            {/* Top Fingerprint Card */}
            <div className="p-8 rounded-3xl neu-panel grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative overflow-hidden">
              <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-dotted border-white/20 opacity-50 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.8)] pointer-events-none" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-dotted border-white/20 opacity-50 shadow-[inset_-1px_1px_1px_rgba(0,0,0,0.8)] pointer-events-none" />
              
              <div className="md:col-span-7 space-y-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#82C4DE] font-bold block mb-1">
                    ESTIMATED COMPLEXITY CLASSIFICATION
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-display font-black text-white">
                    {result.tier}
                  </h2>
                  <p className="text-xs text-neutral-400 font-sans mt-2 leading-relaxed">
                    Based on your multi-axis selections, your architecture falls in the top efficiency percentile for modern cloud delivery.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl neu-pressed">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Estimated Budget Band</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {result.tier.includes('Tier 3') ? '$25k – $50k' : result.tier.includes('Tier 2') ? '$12k – $25k' : '$5k – $12k'}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl neu-pressed">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Estimated Delivery Sprint</span>
                    <span className="text-xl font-bold font-mono text-[#82C4DE]">
                      {result.tier.includes('Tier 3') ? '8–12 Weeks' : result.tier.includes('Tier 2') ? '4–6 Weeks' : '2–4 Weeks'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['React 19 / Next.js', 'PostgreSQL / Prisma', 'Tailwind CSS v4', 'Socket.IO Telemetry', 'Docker Deployment'].map((tag, tIdx) => (
                    <span key={tIdx} className="px-3 py-1 rounded-full text-[10px] font-mono neu-pressed text-neutral-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Radar Chart */}
              <div className="md:col-span-5 flex flex-col items-center justify-center h-64 p-2 neu-pressed bg-retro-grid rounded-2xl">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.axisScores}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                    <PolarAngleAxis dataKey="axis" stroke="#82C4DE" tick={{ fill: '#82C4DE', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" />
                    <Radar name="Complexity" dataKey="value" stroke="#5CA8C9" fill="#5CA8C9" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Scope Proposal Submission Card */}
            <div className="p-8 rounded-3xl neu-panel">
              {submittedEnquiry ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-full neu-pressed text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white">Scope Proposal Transmitted!</h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto font-sans">
                    Our lead engineering team has received your architecture brief. You can track progress or discuss requirements directly in the Client Portal.
                  </p>
                  <Link href="/client/login">
                    <Button className="px-6 py-3 neu-button-primary uppercase font-mono">
                      Proceed to Client Portal
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitScopeEnquiry} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-display font-bold text-white">
                      Transmit Scope Brief to Engineering Team
                    </h3>
                    <p className="text-xs text-neutral-400 font-sans mt-1">
                      Lock in this architectural estimate and initiate a private discussion channel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5 font-bold">Your Name / Organization</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Corp Lead"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        className="neu-input w-full px-4 py-3 text-xs text-white placeholder-neutral-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5 font-bold">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        className="neu-input w-full px-4 py-3 text-xs text-white placeholder-neutral-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5 font-bold">Additional Technical Notes or Requirements (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Needs single sign-on (SSO), data residency in EU, and dedicated test suite."
                      value={scopeDetails}
                      onChange={e => setScopeDetails(e.target.value)}
                      className="neu-input w-full p-4 text-xs text-white placeholder-neutral-600"
                    />
                  </div>

                  {/* Integrations Picker */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowIntegrations(!showIntegrations)}
                      className="text-xs font-mono text-[#82C4DE] hover:underline flex items-center gap-1"
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
                                  ? 'neu-pressed border border-[#5CA8C9]/60 text-[#82C4DE]'
                                  : 'neu-button text-neutral-400 hover:text-white'
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

                  <div className="pt-4 border-t border-white/[0.08] flex justify-end">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="neu-button-primary px-8 py-4 uppercase font-mono tracking-wider flex items-center gap-2"
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
