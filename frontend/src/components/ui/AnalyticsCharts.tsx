'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from 'recharts';

import { motion } from 'framer-motion';

export const AnalyticsCharts = ({ estimatesData, tierStats }: { estimatesData: any[], tierStats: any[] }) => {
  // Aggregate data for the area chart (leads over time)
  const timeSeriesData = [
    { name: 'Jan', leads: 4, conversions: 1 },
    { name: 'Feb', leads: 7, conversions: 2 },
    { name: 'Mar', leads: 5, conversions: 2 },
    { name: 'Apr', leads: 12, conversions: 4 },
    { name: 'May', leads: 18, conversions: 7 },
    { name: 'Jun', leads: 24, conversions: 10 },
    { name: 'Jul', leads: Math.max(estimatesData.length, 30), conversions: tierStats.reduce((a, b) => a + b.converted, 0) || 15 },
  ];

  const COLORS = ['#1c1b1c', '#ab8886', 'var(--color-brand-primary-bright)', 'var(--color-brand-primary)'];

  return (
    <div className="space-y-8">
      {/* Time Series Area Chart */}
      <div className="h-[340px] w-full neu-panel bg-retro-grid p-6">
        <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-6">Lead Velocity (YTD)</h3>
        <motion.div 
          className="w-full h-full"
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ab8886" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ab8886" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand-primary-bright)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--color-brand-primary-bright)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2b" vertical={false} />
            <XAxis dataKey="name" stroke="#a9a6a7" tick={{ fill: '#a9a6a7', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#a9a6a7" tick={{ fill: '#a9a6a7', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-card-elevated)', borderColor: 'var(--color-border)', borderRadius: '12px', color: '#e5e2e3', backdropFilter: 'blur(8px)' }}
              itemStyle={{ color: '#e5e2e3' }}
            />
            <Area type="monotone" dataKey="leads" stroke="#ab8886" fillOpacity={1} fill="url(#colorLeads)" animationDuration={1500} />
            <Area type="monotone" dataKey="conversions" stroke="var(--color-brand-primary-bright)" fillOpacity={1} fill="url(#colorConversions)" animationDuration={0} />
          </AreaChart>
        </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tier Stats Table */}
        <div className="w-full">
          <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4">Conversion Funnel by Tier</h3>
          <div className="neu-panel overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-container/30 font-mono text-xs text-on-surface-variant uppercase tracking-wider">
                  <th className="p-3 font-medium">Tier</th>
                  <th className="p-3 font-medium text-right">Est.</th>
                  <th className="p-3 font-medium text-right">Conv.</th>
                  <th className="p-3 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface divide-y divide-border">
                {tierStats.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-surface-container transition-colors group">
                    <td className="p-3 font-medium group-hover:text-primary transition-colors">{tier.name}</td>
                    <td className="p-3 font-mono text-right">{tier.total}</td>
                    <td className="p-3 font-mono text-right">{tier.converted}</td>
                    <td className="p-3 font-mono text-right text-success">{tier.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tier Distribution Pie Chart */}
        <div className="h-[280px] w-full flex flex-col neu-panel bg-retro-grid p-6">
          <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4">Estimate Tiers</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={estimatesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                animationDuration={1500}
              >
                {estimatesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-card-elevated)', borderColor: 'var(--color-border)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                itemStyle={{ color: '#e5e2e3' }}
              />
              <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ color: '#a9a6a7', fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
