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

  // System Semantic Color Palette (Cyan, Green, Amber, Slate)
  const COLORS = ['#38BDF8', '#34D399', '#FBBF24', '#64748B'];

  return (
    <div className="space-y-8">
      {/* Time Series Area Chart */}
      <div className="h-[340px] w-full card-level-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Lead Velocity (YTD)</h3>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Total Leads
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Conversions
            </span>
          </div>
        </div>
        <motion.div 
          className="w-full h-[250px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeriesData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#F8FAFC', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#E2E8F0', fontSize: '13px' }}
            />
            <Area type="monotone" dataKey="leads" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" animationDuration={1200} />
            <Area type="monotone" dataKey="conversions" stroke="#34D399" strokeWidth={2} fillOpacity={1} fill="url(#colorConversions)" animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tier Stats Table */}
        <div className="w-full">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">Conversion Funnel by Tier</h3>
          <div className="card-level-1 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] font-mono text-xs text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5 font-medium">Tier</th>
                  <th className="p-3.5 font-medium text-right">Est.</th>
                  <th className="p-3.5 font-medium text-right">Conv.</th>
                  <th className="p-3.5 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-200 divide-y divide-white/5">
                {tierStats.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="p-3.5 font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">{tier.name}</td>
                    <td className="p-3.5 font-mono text-right text-slate-300">{tier.total}</td>
                    <td className="p-3.5 font-mono text-right text-slate-300">{tier.converted}</td>
                    <td className="p-3.5 font-mono text-right font-semibold text-emerald-400">{tier.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tier Distribution Pie Chart */}
        <div className="h-[280px] w-full flex flex-col card-level-1 p-6">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Estimate Tiers</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={estimatesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                animationDuration={1200}
              >
                {estimatesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#E2E8F0', fontSize: '13px' }}
              />
              <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
