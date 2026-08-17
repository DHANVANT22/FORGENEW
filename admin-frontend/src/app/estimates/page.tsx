'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

export default function StaleEstimatesList() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/estimates/stale?days=14`, {
      headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
    })
      .then(res => res.json())
      .then(data => {
        setEstimates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-on-surface">Loading stale estimates...</div>;

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-8 px-6 animate-fade-in-up font-body-md">
      <div className="flex justify-between items-center pb-4 border-b border-border mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-tighter text-on-surface mb-2">Stale Estimates</h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Unconverted Leads &gt; 14 Days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {estimates.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-border border-dashed rounded-xl bg-surface-container/30">
            <span className="font-mono text-on-surface-variant italic">No stale estimates found.</span>
          </div>
        ) : estimates.map(estimate => (
          <Card key={estimate.id} className="p-6 h-full flex flex-col group border-border transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display text-xl text-on-surface group-hover:text-primary transition-colors">{estimate.tier} Estimate</h3>
              <span className={`px-2 py-1 rounded text-[10px] font-mono border bg-surface-variant text-on-surface-variant border-border`}>
                {new Date(estimate.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="mt-auto space-y-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-on-surface-variant">Low Confidence?</span>
                <span className={`text-sm font-bold ${estimate.confidenceLow ? 'text-danger' : 'text-success'}`}>{estimate.confidenceLow ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
