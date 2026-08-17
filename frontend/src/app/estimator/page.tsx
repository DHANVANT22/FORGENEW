'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Panel, LedIndicator } from '@/components/ui';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

const INTEGRATIONS_LIST = ['Stripe', 'CRM (Salesforce/HubSpot)', 'Auth0 / Okta', 'ERP (NetSuite/SAP)', 'Custom Internal API'];

const questions = [
  {
    id: 'users',
    text: 'Who will use this software?',
    options: [
      { label: 'Just my team internally', score: 1 },
      { label: 'My customers / general public', score: 2 },
      { label: 'Both internal staff and external customers', score: 3 },
      { label: 'Not sure', score: null }
    ]
  },
  {
    id: 'data',
    text: 'Does this need to connect to existing systems?',
    options: [
      { label: 'No, it stands alone', score: 0 },
      { label: 'Yes, just one or two (like Stripe or a CRM)', score: 2 },
      { label: 'Yes, it needs to sync with many legacy systems', score: 4 },
      { label: 'Not sure', score: null }
    ]
  },
  {
    id: 'compliance',
    text: 'What level of compliance or security is required?',
    options: [
      { label: 'Standard web security', score: 1 },
      { label: 'Payments or e-commerce (PCI)', score: 2 },
      { label: 'Healthcare (HIPAA) or Enterprise (SOC2)', score: 4 },
      { label: 'Not sure', score: null }
    ]
  },
  {
    id: 'urgency',
    text: 'What is your expected timeline?',
    options: [
      { label: 'Flexible (6+ months)', score: 1 },
      { label: 'Standard (3-6 months)', score: 2 },
      { label: 'Urgent (ASAP / < 3 months)', score: 3 },
      { label: 'Not sure', score: null }
    ]
  },
  {
    id: 'scale',
    text: 'What is the expected scale of the application?',
    options: [
      { label: 'Hundreds of users', score: 1 },
      { label: 'Thousands of users', score: 2 },
      { label: 'Millions of users / High traffic', score: 4 },
      { label: 'Not sure', score: null }
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
  const [website, setWebsite] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let storedSessionId = localStorage.getItem('estimator_session_id');
    if (!storedSessionId) {
      storedSessionId = crypto.randomUUID();
      localStorage.setItem('estimator_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);

    // Fetch existing draft if any
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/estimates/draft/${storedSessionId}`)
      .then(res => res.ok ? res.json() : null)
      .then(draft => {
        if (draft && draft.answers) {
          setAnswers(draft.answers);
          setCurrentStep(draft.step);
        }
      })
      .catch(() => {});
  }, []);

  const saveDraft = async (newAnswers: any, step: number) => {
    if (!sessionId) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/estimates/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers: newAnswers, step })
      });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      // Ignore errors for drafting
    }
  };

  const trackProgress = async (questionKey: string) => {
    if (!sessionId) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/estimates/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionKey })
      });
    } catch (err) {
      // Ignore errors for tracking
    }
  };

  const handleSelect = async (score: number | null, index: number) => {
    setSelectedOptionIndex(index);
    const q = questions[currentStep];

    // small delay for UI selection flash
    setTimeout(async () => {
      setSelectedOptionIndex(null);
      if (q.id === 'data' && (score === 2 || score === 4)) {
        setAnswers(prev => ({ ...prev, [q.id]: score }));
        setShowIntegrations(true);
        return;
      }
      await completeStep(q.id, score);
    }, 400);
  };

  const completeStep = async (questionId: string, score: number | null, integrationList?: string[]) => {
    const newAnswers = { ...answers, [questionId]: score };
    if (integrationList) {
      newAnswers['integrations'] = integrationList;
    }
    setAnswers(newAnswers);

    trackProgress(questionId);

    if (currentStep < questions.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveDraft(newAnswers, nextStep);
      setShowIntegrations(false);
      setSelectedIntegrations([]);
    } else {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/estimates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientEmail: 'demo@example.com',
            answers: newAnswers,
            website
          })
        });
        if (res.ok) {
          const data = await res.json();
          setResult({ id: data.id, tier: data.tier, axisScores: data.axisScores, similarProjectsCount: data.similarProjectsCount });
        } else {
          setResult({ tier: 'Error' });
        }
      } catch (err) {
        console.error('Failed to submit estimate', err);
        setResult({ tier: 'Error' });
      }
    }
  };

  const handleIntegrationsSubmit = () => {
    completeStep('data', answers['data'], selectedIntegrations);
  };

  const toggleIntegration = (item: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const downloadImage = async () => {
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#131315' });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'project-fingerprint.png';
      link.href = dataUrl;
      link.click();
    }
  };

  const getChartData = () => {
    if (!result?.axisScores) return [];
    return [
      { subject: 'Role Complexity', A: result.axisScores.roleComplexity, fullMark: 10 },
      { subject: 'Integration Load', A: result.axisScores.integrationLoad, fullMark: 15 },
      { subject: 'Realtime Demand', A: result.axisScores.realtimeDemand, fullMark: 10 },
      { subject: 'Compliance Load', A: result.axisScores.complianceLoad, fullMark: 10 },
    ];
  };

  return (
    <main className="min-h-screen bg-bg-deep py-20 px-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      <div className="max-w-2xl w-full relative z-10 animate-fade-in-up">
        <div className="text-center mb-12">
          <div className="font-mono text-xs text-brand-primary-bright tracking-widest uppercase mb-3 font-bold inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary-bright animate-pulse"></span>
            SYSTEM // ESTIMATOR
          </div>
          <h1 className="text-4xl font-display font-extrabold mb-4 text-text-strong tracking-tight">Project Estimator</h1>
          <p className="text-text-muted text-lg font-mono">Answer a few questions to get an instant complexity tier.</p>
        </div>

        {!result ? (
          <Panel className="p-8 border border-border">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-text-muted">
                  Milestone {currentStep + 1} / {questions.length}
                </span>
                <AnimatePresence>
                  {showSaved && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] font-mono text-primary flex items-center gap-2 uppercase tracking-widest"
                    >
                      <LedIndicator status="active" />
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Progress Timeline */}
              <div className="flex items-center w-full gap-1 mb-10">
                {questions.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1.5 rounded-full overflow-hidden bg-bg relative">
                     {idx < currentStep ? (
                       <div className="absolute inset-0 bg-primary"></div>
                     ) : idx === currentStep ? (
                       <motion.div 
                         className="absolute inset-0 bg-brand-primary-bright origin-left" 
                         initial={{ scaleX: 0 }}
                         animate={{ scaleX: 1 }}
                         transition={{ duration: 0.5, ease: "easeInOut" }}
                       />
                     ) : null}
                  </div>
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-3xl font-display font-bold mb-8 text-text-strong">{questions[currentStep].text}</h2>
                  <input 
                    type="text" 
                    name="website" 
                    value={website} 
                    onChange={(e) => setWebsite(e.target.value)} 
                    style={{ display: 'none' }} 
                    tabIndex={-1} 
                    autoComplete="off" 
                  />
                  
                  {!showIntegrations ? (
                    <div className="flex flex-col gap-4">
                      {questions[currentStep].options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelect(opt.score, i)}
                          className={`text-left px-6 py-5 rounded text-sm font-mono transition-all border outline-none 
                            ${selectedOptionIndex === i 
                              ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,179,175,0.4)] text-text-strong' 
                              : 'bg-bg border-border text-text-muted hover:border-brand-primary-bright hover:bg-surface-container hover:text-text-strong'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="opacity-50 text-xs">[{i + 1}]</span>
                            {opt.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <h3 className="text-lg font-mono text-text-muted mb-4">Which integrations do you anticipate? <br/><span className="text-xs">(Select all that apply)</span></h3>
                      {INTEGRATIONS_LIST.map((item, i) => {
                         const isSelected = selectedIntegrations.includes(item);
                         return (
                          <label key={i} className={`flex items-center gap-3 p-4 rounded cursor-pointer transition-colors border ${isSelected ? 'bg-primary/10 border-primary shadow-[0_0_10px_rgba(255,179,175,0.2)]' : 'bg-bg border-border hover:border-brand-primary-bright'}`}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleIntegration(item)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-border bg-bg-deep'}`}>
                               {isSelected && <span className="material-symbols-outlined text-[12px] text-bg-deep font-bold">check</span>}
                            </div>
                            <span className={`font-mono text-sm ${isSelected ? 'text-primary' : 'text-text-muted'}`}>{item}</span>
                          </label>
                        );
                      })}
                      <div className="mt-8 flex justify-end gap-4">
                         <Button variant="outline" className="active:scale-95" onClick={() => setShowIntegrations(false)}>Back</Button>
                         <Button className="active:scale-95" onClick={handleIntegrationsSubmit}>Continue <span className="material-symbols-outlined text-[18px] ml-2">arrow_forward</span></Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Panel>
        ) : (
          <Panel className="p-10 text-center" withRivets>
            <div ref={chartRef} className="bg-bg-deep p-6 rounded relative">
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-border bg-bg rounded">
                  <LedIndicator status="active" />
                  <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Estimate Complete</span>
                </div>
              </div>
              <h2 className="text-3xl font-display font-bold mb-4 text-text-strong">
                Project Tier: <span className="text-brand-primary-bright drop-shadow-[0_0_15px_rgba(var(--shadow-brand-rgb), 0.3)]">{result.tier}</span>
              </h2>
              
              {result.axisScores && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.8, ease: "easeOut" }}
                   className="my-12 w-full h-[320px] flex justify-center pb-8" // pb-8 gives extra space at bottom
                 >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={getChartData()}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#ab8886', fontSize: 11, fontFamily: 'monospace' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar 
                          name="Project Fingerprint" 
                          dataKey="A" 
                          stroke="var(--color-brand-primary-bright)" 
                          strokeWidth={2}
                          fill="var(--color-brand-primary)" 
                          fillOpacity={0.3} 
                          style={{ filter: 'drop-shadow(0 0 10px rgba(var(--shadow-brand-rgb), 0.5))' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                 </motion.div>
              )}

              <p className="text-text-muted mb-10 max-w-md mx-auto font-mono text-sm leading-relaxed">
                This gives us a baseline to start from. Based on <span className="text-text-strong font-bold">{result.similarProjectsCount || 0}</span> similar projects we've scoped, this is highly accurate.
              </p>
            </div>
            
            <div className="flex justify-center gap-4 flex-wrap mt-8">
              <Button onClick={() => {
                let initialComplexity = 50;
                if (result.axisScores) {
                  const raw = (result.axisScores.roleComplexity || 0) + (result.axisScores.integrationLoad || 0) + (result.axisScores.realtimeDemand || 0) + (result.axisScores.complianceLoad || 0);
                  initialComplexity = Math.min(100, Math.round((raw / 45) * 100));
                }
                window.location.href = `http://localhost:3001/estimator?estimateId=${result.id || ''}&c=${initialComplexity}`;
              }} size="lg" className="active:scale-[0.98] transition-transform">
                Open in Control Centre
              </Button>
              <Button variant="outline" className="active:scale-[0.98] transition-transform flex items-center gap-2" onClick={downloadImage}>
                <span className="material-symbols-outlined text-[18px]">download</span>
                Save Image
              </Button>
              <Button variant="outline" className="active:scale-[0.98] transition-transform flex items-center gap-2 border-danger/30 text-danger hover:bg-danger/10" onClick={() => {
                setResult(null);
                setCurrentStep(0);
                setAnswers({});
                const newSessionId = crypto.randomUUID();
                setSessionId(newSessionId);
                localStorage.setItem('estimator_session_id', newSessionId);
              }}>
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Restart
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}
