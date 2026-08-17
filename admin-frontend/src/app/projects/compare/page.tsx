'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function CompareProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects`, {
      headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data.filter((p: any) => p.status !== 'Completed' && p.status !== 'Archived'));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleProject = (id: string) => {
    if (selectedProjectIds.includes(id)) {
      setSelectedProjectIds(selectedProjectIds.filter(pid => pid !== id));
    } else {
      if (selectedProjectIds.length >= 3) {
        alert('You can only compare up to 3 projects at once.');
        return;
      }
      setSelectedProjectIds([...selectedProjectIds, id]);
    }
  };

  const getChartData = () => {
    const axes = ['schedule', 'budget', 'communication', 'scopeDrift'];
    
    return axes.map(axis => {
      const dataPoint: any = { axis: axis.replace('Drift', ' Drift').toUpperCase() };
      selectedProjectIds.forEach(id => {
        const proj = projects.find(p => p.id === id);
        if (proj && proj.ProjectRiskSnapshot && proj.ProjectRiskSnapshot.length > 0) {
          dataPoint[proj.name] = proj.ProjectRiskSnapshot[0].axisScores[axis] || 0;
        } else {
          dataPoint[proj?.name || 'Unknown'] = 0;
        }
      });
      return dataPoint;
    });
  };

  const colors = ['#bb1327', '#4285F4', '#34A853']; // Red, Blue, Green

  if (loading) return <div className="p-8">Loading projects...</div>;

  return (
    <div className="p-8 max-w-container-max mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-on-surface mb-2">Project Risk Comparison</h1>
        <p className="text-sm font-mono text-on-surface-variant uppercase tracking-wider">Select up to 3 projects to compare their current risk profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 p-6 bg-surface-container/50 border border-border h-fit">
          <h2 className="text-sm font-mono font-bold text-on-surface uppercase tracking-wider mb-4">Active Projects</h2>
          <div className="space-y-2">
            {projects.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-container-high transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedProjectIds.includes(p.id)}
                  onChange={() => toggleProject(p.id)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-on-surface truncate">{p.name}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3 p-6 bg-[#131314] border border-[#242428] min-h-[500px] flex flex-col">
          <h2 className="text-sm font-mono font-bold text-on-surface uppercase tracking-wider mb-6 pb-4 border-b border-[#242428]">
            Multi-Project Overlay
          </h2>
          
          {selectedProjectIds.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm italic">
              Select projects from the sidebar to view comparison
            </div>
          ) : (
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getChartData()}>
                  <PolarGrid stroke="#242428" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#626166', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131314', borderColor: '#242428', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  
                  {selectedProjectIds.map((id, index) => {
                    const proj = projects.find(p => p.id === id);
                    if (!proj) return null;
                    return (
                      <Radar 
                        key={id}
                        name={proj.name}
                        dataKey={proj.name}
                        stroke={colors[index % colors.length]}
                        fill={colors[index % colors.length]}
                        fillOpacity={0.4}
                      />
                    );
                  })}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
