'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
  
  let riskBand = 'Low';
  let bandColor = 'text-success';
  if (riskScore > 75) {
    riskBand = 'High';
    bandColor = 'text-danger';
  } else if (riskScore > 40) {
    riskBand = 'Medium';
    bandColor = 'text-warning';
  }

  return (
    <main className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <span className="text-sm font-mono text-primary mb-2 block uppercase tracking-wider">
            Step 02
          </span>
          <h1 className="text-4xl font-bold mb-4">Risk &amp; Scope Simulator</h1>
          <p className="text-muted text-lg">Adjust the levers to see how scope and timeline impact your risk profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-6">Scenario Levers</h3>
            
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Technical Complexity</label>
                <span className="font-mono text-sm">{complexity}%</span>
              </div>
              <div className="relative w-full h-2 bg-surface-container-high rounded-full overflow-hidden mt-4 mb-2">
                <div className="absolute top-0 left-0 h-full bg-brand-primary transition-all duration-200" style={{ width: `${complexity}%` }} />
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={complexity} 
                  onChange={(e) => setComplexity(parseInt(e.target.value))}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted mt-2">Integrations, legacy systems, scaling needs.</p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Timeline Urgency</label>
                <span className="font-mono text-sm">{urgency}%</span>
              </div>
              <div className="relative w-full h-2 bg-surface-container-high rounded-full overflow-hidden mt-4 mb-2">
                <div className="absolute top-0 left-0 h-full bg-brand-primary transition-all duration-200" style={{ width: `${urgency}%` }} />
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={urgency} 
                  onChange={(e) => setUrgency(parseInt(e.target.value))}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted mt-2">How fast do you need to go to market?</p>
            </div>
            
            <Button 
              className="w-full mt-4"
              onClick={async () => {
                try {
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/scenarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      inputs: { complexity, urgency },
                      computedBand: riskBand,
                      estimateId: estimateId || undefined
                    })
                  });
                  alert('Enquiry sent!');
                } catch (e) {
                  alert('Failed to send enquiry');
                }
              }}
            >
              Send as Enquiry
            </Button>
          </Card>

          <Card className="p-8 flex flex-col justify-center items-center text-center bg-surface-container-low border-none overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 transition-colors duration-500" style={{ backgroundColor: bandColor === 'text-danger' ? 'var(--color-danger)' : bandColor === 'text-warning' ? 'var(--color-warning)' : 'var(--color-success)' }} />
            <h3 className="text-lg text-muted mb-2 font-mono uppercase tracking-wider relative z-10">Computed Risk Band</h3>
            <div className={`text-6xl font-bold mb-4 ${bandColor} transition-colors duration-500 relative z-10 min-h-[80px] flex items-center justify-center`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={riskBand}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {riskBand}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="text-sm text-muted relative z-10 min-h-[60px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={riskBand}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {riskBand === 'High' && 'Aggressive timelines with high complexity usually require phased rollouts to manage risk.'}
                  {riskBand === 'Medium' && 'A balanced approach. Standard delivery processes apply.'}
                  {riskBand === 'Low' && 'Very straightforward execution path with minimal architectural unknowns.'}
                </motion.p>
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Simulator...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
