'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KanbanBoard } from '@/components/ui/KanbanBoard';
import { io } from 'socket.io-client';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function ProjectsDashboard({ params }: { params: Promise<{ id: string }> }) {
  const [project, setProject] = useState<any>(null);
  
  // Risk Simulator State
  const [riskInputs, setRiskInputs] = useState({
    roles: 0,
    integrations: 0,
    realTime: false,
    compliance: false,
    timelinePressure: 'Low'
  });
  const [riskPreview, setRiskPreview] = useState<any>(null);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);
  const [riskOutcomes, setRiskOutcomes] = useState<any[]>([]);
  const [outcomeText, setOutcomeText] = useState('');
  const [outcomeAxis, setOutcomeAxis] = useState('schedule');
  const [outcomeImpact, setOutcomeImpact] = useState(15);
  const [clientOnline, setClientOnline] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [commentContext, setCommentContext] = useState<{ type: 'task' | 'milestone'; id: string } | null>(null);
  
  const { id: projectId } = React.use(params);

  useEffect(() => {
    // We bypass real auth token for this demo
    const token = 'ADMIN_DEMO_TOKEN';

    // Fetch Project Details
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProject(data))
      .catch(console.error);

    // Fetch Risk History
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${projectId}/risk/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const formattedHistory = data.map((d: any) => ({
          id: d.id,
          date: new Date(d.computedAt).toLocaleDateString(),
          schedule: d.axisScores.schedule,
          budget: d.axisScores.budget,
          communication: d.axisScores.communication,
          scopeDrift: d.axisScores.scopeDrift,
          causeSummary: d.causeSummary
        }));
        setRiskHistory(formattedHistory);
      })
      .catch(console.error);

    // Fetch Risk Outcomes
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}/risk/outcome`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRiskOutcomes(data))
      .catch(console.error);

    // Fetch Messages for Anchored Comments
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(console.error);
  }, [projectId]);

  // Debounce risk preview
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${projectId}/risk/preview`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ADMIN_DEMO_TOKEN'
        },
        body: JSON.stringify(riskInputs)
      })
        .then(res => res.json())
        .then(data => setRiskPreview(data))
        .catch(console.error);
    }, 500);

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}`);
    newSocket.on('connect', () => {
      newSocket.emit('join_project', projectId);
    });

    newSocket.on('milestone_approved', (data: any) => {
      // Reload project when milestone approved by client
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}`, {
        headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
      })
        .then(res => res.json())
        .then(data => setProject(data))
        .catch(console.error);
    });

    newSocket.on('client_status', (data: { online: boolean }) => {
      setClientOnline(data.online);
    });

    return () => {
      newSocket.disconnect();
      clearTimeout(timer);
    };
  }, [riskInputs, projectId]);

  const toggleColumnVisibility = async (columnId: string, currentStatus: boolean) => {
    const token = 'ADMIN_DEMO_TOKEN';
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}/columns/${columnId}/visibility`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clientVisible: !currentStatus })
      });
      setProject((prev: any) => ({
        ...prev,
        columns: prev.columns.map((c: any) => c.id === columnId ? { ...c, clientVisible: !currentStatus } : c)
      }));
    } catch (e) {
      console.error(e);
    }
  };



  const [activeTab, setActiveTab] = useState<'Management' | 'Client Portal Preview'>('Management');
  const currentRisk = riskHistory.length > 0 ? riskHistory[riskHistory.length - 1] : { schedule: 10, budget: 10, communication: 10, scopeDrift: 10 };
  const rawCurrentRisk = riskHistory.length > 0 ? riskHistory[riskHistory.length - 1] : null;

  const sendMessage = async () => {
    if (!messageInput.trim()) return;
    try {
      const payload: any = { text: messageInput };
      if (commentContext?.type === 'task') payload.taskId = commentContext.id;
      if (commentContext?.type === 'milestone') payload.milestoneId = commentContext.id;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setMessageInput('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSnooze = async (axis: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}/risk/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' },
        body: JSON.stringify({ axis, days: 7 }) // default snooze 7 days
      });
      alert(`Snoozed ${axis} risk alerts for 7 days.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogOutcome = async () => {
    if (!outcomeText.trim() || !rawCurrentRisk) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}/risk/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' },
        body: JSON.stringify({ 
          snapshotId: rawCurrentRisk.id, 
          actualOutcome: outcomeText,
          axis: outcomeAxis,
          impact: outcomeImpact
        }) 
      });
      if (res.ok) {
        const newOutcome = await res.json();
        setRiskOutcomes([newOutcome, ...riskOutcomes]);
        setOutcomeText('');
        
        // Optimistically update risk history to reflect immediate penalty
        if (outcomeAxis && outcomeImpact) {
           fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}/risk/history`, {
             headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
           })
           .then(r => r.json())
           .then(data => {
             if(Array.isArray(data)) {
               setRiskHistory(data);
             }
           }).catch(console.error);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-container-max mx-auto animate-fade-in-up">
      <div className="flex justify-between items-center pb-4 border-b border-border mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold text-on-surface">{project ? project.name : 'Loading...'}</h1>
            {clientOnline && (
              <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/30 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-[10px] font-mono text-success uppercase tracking-wider">Client Online</span>
              </div>
            )}
          </div>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Project Details & Risk Control</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">Edit Project</Button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border mb-8">
        {(['Management', 'Client Portal Preview'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 font-mono text-sm tracking-wider uppercase border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Management' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Risk Simulator Panel */}
            <Card className="lg:col-span-2 p-6 flex flex-col h-full bg-surface-container/50 border border-border">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
                <span className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">Forge 02</span>
                <h2 className="text-xl font-display font-bold text-on-surface">Unified Risk Intelligence</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                {/* Chart Area */}
                <div className="flex flex-col h-full min-h-[300px]">
                  <h3 className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-4">Current vs Simulated Risk</h3>
                  <div className="flex-1 w-full bg-surface-container-lowest rounded-xl border border-border p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart 
                        cx="50%" 
                        cy="50%" 
                        outerRadius="70%" 
                        data={[
                          { axis: 'Schedule', current: currentRisk.schedule || 0, simulated: riskPreview?.schedule || currentRisk.schedule || 0 },
                          { axis: 'Budget', current: currentRisk.budget || 0, simulated: riskPreview?.budget || currentRisk.budget || 0 },
                          { axis: 'Comm', current: currentRisk.communication || 0, simulated: riskPreview?.communication || currentRisk.communication || 0 },
                          { axis: 'Scope', current: currentRisk.scopeDrift || 0, simulated: riskPreview?.scopeDrift || currentRisk.scopeDrift || 0 }
                        ]}
                      >
                        <PolarGrid stroke="#242428" />
                        <PolarAngleAxis dataKey="axis" tick={{ fill: '#626166', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Current" dataKey="current" stroke="#bb1327" fill="#bb1327" fillOpacity={0.3} />
                        <Radar name="Simulated" dataKey="simulated" stroke="var(--color-led-critical)" fill="var(--color-led-critical)" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {currentRisk.causeSummary && (
                    <div className="mt-4 p-4 bg-danger/10 border border-danger/30 rounded-xl">
                      <h4 className="text-xs font-mono text-danger uppercase tracking-wider mb-2">Suggested Next Action</h4>
                      <p className="text-sm text-text-strong mb-3">{currentRisk.causeSummary}</p>
                      <div className="flex gap-2">
                        {['schedule', 'budget', 'communication', 'scopeDrift'].map(axis => {
                           if (currentRisk[axis] >= 75) {
                             return (
                               <Button key={axis} size="sm" variant="outline" className="text-[10px] py-1 h-auto border-danger/30 text-danger hover:bg-danger/20" onClick={() => handleSnooze(axis)}>
                                 Snooze {axis} (7d)
                               </Button>
                             )
                           }
                           return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* What-If Panel */}
                <div className="flex flex-col bg-[#131314] rounded-xl border border-[#242428] p-5">
                  <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-6 flex justify-between items-center">
                    <span>What-If Scenario Simulator</span>
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between mb-2"><label className="text-xs font-mono text-on-surface">Timeline Pressure</label></div>
                      <select 
                        className="input-base w-full p-2 text-sm bg-surface-container border border-border rounded text-on-surface focus:outline-none focus:border-primary"
                        value={riskInputs.timelinePressure}
                        onChange={e => setRiskInputs({...riskInputs, timelinePressure: e.target.value})}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2"><label className="text-xs font-mono text-on-surface">External Integrations</label><span className="text-primary font-mono text-xs">{riskInputs.integrations}</span></div>
                      <input type="range" min="0" max="10" className="w-full accent-primary" value={riskInputs.integrations} onChange={e => setRiskInputs({...riskInputs, integrations: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2"><label className="text-xs font-mono text-on-surface">Stakeholder Roles</label><span className="text-primary font-mono text-xs">{riskInputs.roles}</span></div>
                      <input type="range" min="0" max="5" className="w-full accent-primary" value={riskInputs.roles} onChange={e => setRiskInputs({...riskInputs, roles: parseInt(e.target.value)})} />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-mono text-on-surface cursor-pointer">
                        <input type="checkbox" className="accent-primary w-4 h-4" checked={riskInputs.realTime} onChange={e => setRiskInputs({...riskInputs, realTime: e.target.checked})} />
                        Real-time Req
                      </label>
                      <label className="flex items-center gap-2 text-xs font-mono text-on-surface cursor-pointer">
                        <input type="checkbox" className="accent-primary w-4 h-4" checked={riskInputs.compliance} onChange={e => setRiskInputs({...riskInputs, compliance: e.target.checked})} />
                        Strict Compliance
                      </label>
                    </div>
                  </div>

                  {/* Deltas & Current Risk */}
                  <div className="mt-auto bg-surface-container/50 border border-border p-4 rounded-lg">
                    <h4 className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-3">Risk Scores & Deltas</h4>
                    {rawCurrentRisk || riskPreview ? (
                      <div className="grid grid-cols-2 gap-3">
                        {['schedule', 'budget', 'communication', 'scopeDrift'].map(axis => {
                          const prevScore = currentRisk[axis as keyof typeof currentRisk] || 0;
                          const newScore = riskPreview ? riskPreview[axis as keyof typeof riskPreview] : prevScore;
                          const diff = newScore - prevScore;
                          return (
                            <div key={axis} className="flex justify-between items-center text-xs">
                              <span className="capitalize text-on-surface/80">{axis.replace('Drift', ' Drift')}</span>
                              <div className="flex gap-2 items-center">
                                <span className="font-mono text-on-surface">{prevScore}</span>
                                {diff !== 0 && (
                                  <span className={`font-mono font-medium ${diff > 0 ? 'text-danger' : 'text-success'}`}>
                                    {diff > 0 ? '+' : ''}{diff}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted italic">Log outcomes or add tasks to compute baseline risk.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Client Reporting Column */}
            <div className="lg:col-span-1 flex flex-col gap-8 h-full">
              {/* Audit Trail / Outcomes Panel */}
              <Card className="p-6 flex flex-col flex-1 bg-surface-container/50 border border-border">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
                <span className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">Audit</span>
                <h2 className="text-xl font-display font-bold text-on-surface">Outcome Logs</h2>
              </div>
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {riskOutcomes.length === 0 ? (
                  <p className="text-xs text-muted italic">No outcomes logged yet.</p>
                ) : (
                  riskOutcomes.map(o => (
                    <div key={o.id} className="p-3 bg-[#131314] rounded-lg border border-[#242428] text-sm text-on-surface-variant">
                      <p className="mb-1">{o.actualOutcome}</p>
                      <span className="text-[10px] font-mono text-muted">{new Date(o.recordedAt).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto flex gap-2">
                    <div className="flex flex-col gap-2 flex-1">
                      <input 
                        type="text" 
                        value={outcomeText}
                        onChange={(e) => setOutcomeText(e.target.value)}
                        placeholder="Log real-world outcome..." 
                        className="input-base text-sm bg-surface-container border border-border rounded p-2 focus:border-primary text-on-surface outline-none" 
                      />
                      <div className="flex gap-2">
                        <select 
                          value={outcomeAxis} 
                          onChange={(e) => setOutcomeAxis(e.target.value)}
                          className="input-base flex-1 text-sm bg-surface-container border border-border rounded p-2 text-on-surface outline-none"
                        >
                          <option value="schedule">Schedule</option>
                          <option value="budget">Budget</option>
                          <option value="communication">Communication</option>
                          <option value="scopeDrift">Scope Drift</option>
                        </select>
                        <select 
                          value={outcomeImpact} 
                          onChange={(e) => setOutcomeImpact(parseInt(e.target.value))}
                          className="input-base w-24 text-sm bg-surface-container border border-border rounded p-2 text-on-surface outline-none"
                        >
                          <option value={5}>Minor (+5)</option>
                          <option value={15}>Mod (+15)</option>
                          <option value={30}>Major (+30)</option>
                        </select>
                      </div>
                    </div>
                    <Button onClick={handleLogOutcome} className="btn-primary px-6" disabled={!rawCurrentRisk}>Log</Button>
              </div>
            </Card>

            </div>
          </div>
          
          {/* Milestone Manager */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <div>
                <h2 className="text-2xl font-display font-bold text-on-surface mb-1">Milestones</h2>
                <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Client Deliverable Tracking</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project?.Milestone?.length > 0 ? project.Milestone.map((m: any) => (
                <div key={m.id} className="p-4 bg-surface-container rounded-xl border border-border flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-on-surface">{m.title}</h3>
                    <span className="text-xs px-2 py-1 bg-surface-container-high rounded font-mono uppercase text-muted">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{m.description || 'No description'}</p>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2">
                      <span className="text-xs font-mono text-muted">
                        Visible: {m.clientVisible ? 'Yes' : 'No'}
                      </span>
                      <span className="text-xs font-mono text-muted">
                        | Requires Approval: {m.requiresApproval ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setCommentContext({ type: 'milestone', id: m.id })}>
                        Comment
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/milestones/${m.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' },
                          body: JSON.stringify({ status: 'Current', requiresApproval: true })
                        });
                        // refresh logic in real app, we'll just reload
                        window.location.reload();
                      }}>
                        Request Approval
                      </Button>
                      {m.approvedAt && (
                        <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">Approved!</span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 text-on-surface-variant font-mono text-sm italic p-6 text-center bg-surface-container/30 rounded-xl border border-border border-dashed">
                  No milestones defined.
                </div>
              )}
            </div>
          </div>
          
          {/* Kanban Board */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <div>
                <h2 className="text-2xl font-display font-bold text-on-surface mb-1">Execution Pipeline</h2>
                <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Kanban Board (Drag & Drop)</p>
              </div>
            </div>
            <div className="h-[600px]">
              {project?.columns ? (
                <KanbanBoard 
                  initialColumns={project.columns} 
                  projectId={projectId} 
                  isAdmin={true}
                  onToggleVisibility={toggleColumnVisibility}
                  onTaskComment={(id) => setCommentContext({ type: 'task', id })}
                  onTaskMove={async (taskId, destColId, newOrder) => {
                    const token = 'ADMIN_DEMO_TOKEN';
                    try {
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/projects/${projectId}/tasks/reorder`, {
                        method: 'PUT',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ taskId, destinationColumnId: destColId, newOrder })
                      });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              ) : (
                <div className="text-on-surface-variant font-mono text-sm italic p-12 text-center bg-surface-container/30 rounded-xl border border-border border-dashed">
                  Loading pipeline data...
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'Client Portal Preview' && (
        <div className="h-[800px] border border-border rounded-xl overflow-hidden bg-surface-container">
          <iframe 
            src="http://localhost:3000/client/dashboard" 
            className="w-full h-full"
            title="Client Portal Preview"
          />
        </div>
      )}

      {/* Inline Thread Modal for Admin */}
      {commentContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="bg-[#131314] border border-[#242428] rounded-xl max-w-xl w-full h-[600px] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#242428] bg-surface-container-low flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">forum</span>
                <h2 className="font-display text-lg text-on-surface">Thread: {commentContext.type} {commentContext.id.substring(0, 6)}</h2>
              </div>
              <button onClick={() => setCommentContext(null)} className="text-muted hover:text-on-surface p-2">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#0A0A0B]">
              {messages.filter(m => commentContext.type === 'task' ? m.taskId === commentContext.id : m.milestoneId === commentContext.id).length === 0 ? (
                <div className="text-center text-on-surface-variant text-sm py-8 font-mono">No comments on this {commentContext.type} yet.</div>
              ) : (
                messages.filter(m => commentContext.type === 'task' ? m.taskId === commentContext.id : m.milestoneId === commentContext.id).map(msg => (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.senderName !== 'Client' ? 'items-end self-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.senderName === 'Client' && <span className="font-mono text-[10px] text-on-surface-variant">{msg.senderName}</span>}
                      <span className="font-mono text-[9px] text-tertiary-container">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className={`p-3 text-sm font-body-md ${msg.senderName !== 'Client' ? 'bg-[rgba(var(--shadow-brand-rgb), 0.10)] border border-primary/30 rounded-2xl rounded-tr-sm' : 'bg-[#16161A] border border-[#242428] rounded-2xl rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-[#242428] bg-surface-container-low flex gap-3 shrink-0">
              <input 
                type="text" 
                placeholder="Reply to client..." 
                className="flex-1 bg-[#0A0A0B] border border-[#242428] rounded-lg px-4 py-2 text-sm text-on-surface outline-none focus:border-primary" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button className="btn-primary px-6" onClick={sendMessage}>Reply</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
