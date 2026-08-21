'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { LeverSlider } from '@/components/ui/LeverSlider';
import { Gauge } from '@/components/ui/Gauge';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function SimulatorContent() {
  const searchParams = useSearchParams();
  const initialComplexity = parseInt(searchParams.get('c') || '50');
  const estimateId = searchParams.get('estimateId') || '';
  
  const [complexity, setComplexity] = useState(initialComplexity);
  const [urgency, setUrgency] = useState(50);
  
  useEffect(() => {
    setComplexity(initialComplexity);
  }, [initialComplexity]);

  // Simple computed risk band
  const riskScore = (complexity * 0.6) + (urgency * 0.4);
  
  let riskBand = 'Low Risk';
  let bandColor = 'text-success';
  if (riskScore > 75) {
    riskBand = 'High Risk';
    bandColor = 'text-danger';
  } else if (riskScore > 40) {
    riskBand = 'Medium Risk';
    bandColor = 'text-warning';
  }

  return (
    <main className="min-h-screen bg-background py-20 px-6 bg-retro-grid">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2 font-mono text-xs text-brand-primary-bright uppercase tracking-widest font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MISSION CONTROL // STEP 02</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-text-strong font-display">Risk &amp; Scope Simulator</h1>
          <p className="text-text-muted text-base">Adjust the hardware fader levers to see how scope and timeline impact your project risk profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Panel withRivets={true} className="p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-8 border-b border-border/50 pb-4">
                <span className="material-symbols-outlined text-text-muted text-lg">tune</span>
                <h3 className="text-lg font-bold font-display text-text-strong">Scenario Levers</h3>
              </div>
              
              <div className="mb-6 group">
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold font-mono uppercase tracking-wider text-text-strong group-hover:text-brand-primary-bright transition-colors">
                    Technical Complexity
                  </label>
                  <span className="font-mono text-xs text-brand-primary font-bold">{complexity}%</span>
                </div>
                <LeverSlider 
                  min={0} 
                  max={100} 
                  value={complexity} 
                  onChange={setComplexity}
                  readoutLabel="Technical Complexity"
                />
                <p className="text-[11px] text-text-muted mt-2 font-mono">Integrations, legacy systems, scaling needs.</p>
              </div>

              <div className="h-px w-full bg-white/[0.06] my-6" />

              <div className="mb-6 group">
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold font-mono uppercase tracking-wider text-text-strong group-hover:text-brand-primary-bright transition-colors">
                    Timeline Urgency
                  </label>
                  <span className="font-mono text-xs text-brand-primary font-bold">{urgency}%</span>
                </div>
                <LeverSlider 
                  min={0} 
                  max={100} 
                  value={urgency} 
                  onChange={setUrgency}
                  readoutLabel="Timeline Urgency"
                />
                <p className="text-[11px] text-text-muted mt-2 font-mono">Target go-to-market speed.</p>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4"
              onClick={async () => {
                try {
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/scenarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      inputs: { complexity, urgency },
                      computedBand: riskBand,
                      estimateId: estimateId || undefined
                    })
                  });
                  alert('Enquiry sent successfully!');
                } catch (e) {
                  alert('Failed to send enquiry');
                }
              }}
            >
              Send as Enquiry Brief
            </Button>
          </Panel>

          <Panel withRivets={true} className="p-8 flex flex-col justify-between items-center text-center overflow-hidden relative">
            <div className="w-full flex items-center justify-between border-b border-border/50 pb-4 mb-6">
              <span className="label-eyebrow">Computed Risk Telemetry</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase neu-pressed ${
                riskBand.includes('High') ? 'text-danger' : riskBand.includes('Medium') ? 'text-warning' : 'text-success'
              }`}>
                {riskBand}
              </span>
            </div>

            {/* Retro Analog VU Meter / Radar Dish Gauge */}
            <div className="my-4 py-4 w-full flex flex-col items-center justify-center">
              <Gauge value={riskScore} label="Risk Score Index" />
            </div>

            <div className="w-full pt-4 border-t border-border/50 text-xs text-text-muted font-mono min-h-[60px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={riskBand}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {riskBand === 'High Risk' && '⚠️ Aggressive timelines with high complexity require phased rollouts & risk gates.'}
                  {riskBand === 'Medium Risk' && '⚡ Balanced execution scope. Standard agile sprint cadence applies.'}
                  {riskBand === 'Low Risk' && '✓ Nominal execution path with minimal architectural unknowns.'}
                </motion.p>
              </AnimatePresence>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background font-mono text-xs text-text-muted">Loading Simulator Telemetry...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}

