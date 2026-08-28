'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function EstimatorSettings() {
  const [weights, setWeights] = useState({
    Simple: 1,
    Standard: 2,
    Complex: 4,
    Enterprise: 8
  });
  const [cutoffs, setCutoffs] = useState({
    simple: 8,
    standard: 16,
    complex: 26
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [shifts, setShifts] = useState<Record<string, number>>({});
  const [previewing, setPreviewing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/v1/config/tier-weights`).then(r => r.json()),
      fetch(`${API_URL}/api/v1/config/tier-cutoffs`).then(r => r.json())
    ])
    .then(([weightsData, cutoffsData]) => {
      setWeights(weightsData);
      setCutoffs(cutoffsData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
      setMessage('Failed to load settings.');
    });
  }, [API_URL]);

  useEffect(() => {
    if (loading) return;
    
    setPreviewing(true);
    const timer = setTimeout(() => {
      fetch(`${API_URL}/api/v1/config/tier-weights/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' },
        body: JSON.stringify({ cutoffs })
      })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.shifts) setShifts(data.shifts);
        setPreviewing(false);
      })
      .catch(() => setPreviewing(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [cutoffs, loading, API_URL]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const resWeights = await fetch(`${API_URL}/api/v1/config/tier-weights`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' },
        body: JSON.stringify(weights)
      });
      const resCutoffs = await fetch(`${API_URL}/api/v1/config/tier-cutoffs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' },
        body: JSON.stringify(cutoffs)
      });
      if (resWeights.ok && resCutoffs.ok) {
        setMessage('Settings saved successfully.');
      } else {
        setMessage('Failed to save some settings.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error saving settings.');
    }
    setSaving(false);
  };

  const handleWeightChange = (tier: keyof typeof weights, value: string) => {
    setWeights(prev => ({ ...prev, [tier]: Number(value) }));
  };

  const handleCutoffChange = (tier: keyof typeof cutoffs, value: string) => {
    setCutoffs(prev => ({ ...prev, [tier]: Number(value) }));
  };

  if (loading) {
    return (
      <div className="space-y-12 max-w-4xl mx-auto py-8 px-6 animate-pulse">
        <div className="h-8 w-64 bg-surface-container-high rounded mb-8"></div>
        <div className="h-[400px] w-full bg-surface-container rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-8 px-6">
      <div className="pb-4 border-b border-border/50 mb-8">
        <h1 className="font-display text-4xl font-bold text-on-surface leading-tight">Complexity Estimator Settings</h1>
      </div>

      <section className="space-y-8 flex flex-col gap-6">
        <Card className="p-8 flex flex-col shadow-sm border-border/50 group hover:border-primary/50 transition-colors relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <h3 className="font-display text-2xl font-semibold mb-2 text-on-surface relative z-10">Tier Weights Configuration</h3>
          <p className="text-muted text-sm mb-6 relative z-10">Adjust the numerical weight associated with each project complexity tier. These values are used to score inbound leads.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {Object.entries(weights).map(([tier, weight]) => (
              <div key={tier} className="flex flex-col gap-2">
                <label htmlFor={`weight-${tier}`} className="text-xs font-mono font-medium text-muted uppercase tracking-wider">{tier} Weight</label>
                <input 
                  id={`weight-${tier}`}
                  aria-label={`${tier} Weight`}
                  className="w-full bg-surface-container-lowest border border-border/50 p-3 font-mono text-sm leading-relaxed rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all shadow-sm" 
                  type="number" 
                  value={weight} 
                  onChange={(e) => handleWeightChange(tier as keyof typeof weights, e.target.value)} 
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 flex flex-col shadow-sm border-border/50 group hover:border-primary/50 transition-colors relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <h3 className="font-display text-2xl font-semibold mb-2 text-on-surface relative z-10">Tier Cutoffs Configuration</h3>
          <p className="text-muted text-sm mb-6 relative z-10">Set the maximum total score for each complexity tier. Scores above the 'Complex' cutoff will be assigned 'Enterprise'.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {Object.entries(cutoffs).map(([tier, cutoff]) => (
              <div key={tier} className="flex flex-col gap-2">
                <label htmlFor={`cutoff-${tier}`} className="text-xs font-mono font-medium text-muted uppercase tracking-wider">{tier} Cutoff</label>
                <input 
                  id={`cutoff-${tier}`}
                  aria-label={`${tier} Cutoff`}
                  className="w-full bg-surface-container-lowest border border-border/50 p-3 font-mono text-sm leading-relaxed rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all shadow-sm" 
                  type="number" 
                  value={cutoff} 
                  onChange={(e) => handleCutoffChange(tier as keyof typeof cutoffs, e.target.value)} 
                />
              </div>
            ))}
          </div>
        </Card>

        {message && (
          <div className={`p-4 rounded-xl border text-sm font-medium ${message.includes('success') ? 'bg-success/10 text-success border-success/30' : 'bg-danger/10 text-danger border-danger/30'}`}>
            {message}
          </div>
        )}

        {Object.keys(shifts).length > 0 && (
          <div className="p-4 rounded-xl border border-warning/30 bg-warning/10">
            <h4 className="font-semibold text-warning mb-2">Impact Preview</h4>
            <p className="text-sm text-warning/80 mb-2">Applying these cutoffs would shift existing estimates:</p>
            <ul className="list-disc pl-5 text-sm text-warning/90">
              {Object.entries(shifts).map(([shift, count]) => (
                <li key={shift}>{count} estimate{count !== 1 ? 's' : ''} would move: <strong>{shift}</strong></li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button 
            className="px-8 py-3 shadow-lg shadow-primary/20" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </section>
    </div>
  );
}
