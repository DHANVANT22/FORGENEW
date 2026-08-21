'use client';

import React, { useState } from 'react';
import { Panel, LeverSlider, Gauge, ReadoutNumber } from '@/components/ui';
import { Button } from '@/components/ui/Button';

export default function AdminRiskSimulator() {
  const [complexity, setComplexity] = useState(50);
  const [urgency, setUrgency] = useState(50);
  const [roles, setRoles] = useState(2);
  const [integrations, setIntegrations] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Computed risk score (0-100 normalized)
  const rawScore = (complexity * 0.4) + (urgency * 0.3) + (roles * 10) + (integrations * 5);
  const riskScore = Math.min(100, Math.round((rawScore / 165) * 100));
  const normalizedRisk = riskScore;

  let riskBand = 'Low Risk';
  let bandColorClass = 'text-success';
  if (riskScore > 75) {
    riskBand = 'High Risk';
    bandColorClass = 'text-danger';
  } else if (riskScore > 45) {
    riskBand = 'Medium Risk';
    bandColorClass = 'text-warning';
  }

  const handleCreateProject = async () => {
    setIsProvisioning(true);
    
    // Brief "settle" animation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: projectName || 'New Scoped Project', tier: riskBand })
      });
      if (res.ok) {
        const proj = await res.json();
        alert(`Project created successfully! ID: ${proj.id}`);
      } else {
        alert('Failed to create project (make sure you are logged in)');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-10">
        <div className="font-mono text-xs text-brand-primary-bright tracking-widest uppercase mb-3 font-bold">OPS // SIMULATOR</div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-text-strong font-display">Scoped Risk Simulator</h1>
        <p className="text-text-muted">Run what-if scenarios to compute risk bands and provision projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Panel className="p-8 glass-panel border-0">
          <div className="flex items-center gap-2 mb-8 border-b border-border/50 pb-4">
             <span className="material-symbols-outlined text-text-muted">tune</span>
             <h3 className="text-xl font-bold font-display text-text-strong">Scenario Levers</h3>
          </div>
          
          <div className="">
            <div className="group">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-text-strong group-hover:text-primary transition-colors">Technical Complexity</label>
              </div>
              <LeverSlider 
                min={0} max={100} value={complexity} 
                onChange={setComplexity}
                readoutLabel="%"
              />
            </div>

            <div className="h-px w-full bg-white/[0.08] my-5" />

            <div className="group">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-text-strong group-hover:text-primary transition-colors">Timeline Urgency</label>
              </div>
              <LeverSlider 
                min={0} max={100} value={urgency} 
                onChange={setUrgency}
                readoutLabel="%"
              />
            </div>

            <div className="h-px w-full bg-white/[0.08] my-5" />

            <div className="group">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-text-strong group-hover:text-primary transition-colors">User Roles</label>
              </div>
              <LeverSlider 
                min={1} max={10} value={roles} 
                onChange={setRoles}
              />
            </div>

            <div className="h-px w-full bg-white/[0.08] my-5" />

            <div className="group">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold text-text-strong group-hover:text-primary transition-colors">3rd-Party Integrations</label>
              </div>
              <LeverSlider 
                min={0} max={10} value={integrations} 
                onChange={setIntegrations}
              />
            </div>
          </div>
        </Panel>

        <Panel className="p-8 flex flex-col justify-between glass-panel border-0" withRivets>
          <div className="flex flex-col items-center">
            <h3 className="label-eyebrow mb-4 text-center">Computed Risk Band</h3>
            
            <div className="relative w-full max-w-[180px] aspect-[2/1] mb-6 flex flex-col items-center justify-center">
               <Gauge 
                 value={normalizedRisk} 
                 label="" 
               />
               <div className="absolute bottom-0 w-full flex justify-center transition-all duration-700 ease-in-out">
                 <span className={`text-xl font-bold font-display drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-colors duration-500 ${bandColorClass}`}>
                   {riskBand}
                 </span>
               </div>
            </div>
            
            {/* Structured Findings Box */}
            <div className="rounded-xl border border-white/[0.06] bg-black/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden mb-6">
              <div className="p-3.5 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
                <span className="label-eyebrow">Risk Score</span>
                <div className="text-xl font-bold text-text-strong font-[family-name:var(--font-mono-readout)]">
                   <ReadoutNumber value={Math.round(riskScore)} />
                </div>
              </div>
              <div className="p-3.5 bg-black/40">
                <p className="text-xs text-text-muted font-sans leading-relaxed">
                  Based on current inputs, this falls in the <span className="font-bold text-text-strong">{riskBand.toLowerCase()}</span> band — {riskScore > 75 ? 'rigorous risk mitigation and sprint controls apply.' : riskScore > 45 ? 'standard milestone sign-off and timeline applies.' : 'accelerated delivery timeline applies.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-border/50 pt-8">
            <input 
              type="text" 
              placeholder="Project Name..." 
              className="w-full bg-surface-container border border-border p-4 rounded mb-4 focus:outline-none focus:border-brand-primary-bright font-mono text-sm text-text-strong placeholder:text-text-muted transition-colors"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <Button 
              className={`w-full py-4 text-base font-bold flex items-center justify-center gap-2 transition-all ${
                isProvisioning 
                  ? 'bg-success hover:bg-success text-bg-deep shadow-[0_0_20px_rgba(53,196,122,0.4)]' 
                  : 'active:scale-[0.98] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)]'
              }`}
              onClick={handleCreateProject}
              disabled={isProvisioning}
            >
              {isProvisioning ? (
                <>
                   <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                   Provisioning...
                </>
              ) : (
                <>
                   <span className="material-symbols-outlined text-lg">bolt</span>
                   Provision Project
                </>
              )}
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
