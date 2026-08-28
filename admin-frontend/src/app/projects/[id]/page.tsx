'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KanbanBoard } from '@/components/ui/KanbanBoard';
import { io, Socket } from 'socket.io-client';
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
  
  // Pulse State
  const [pulseToken, setPulseToken] = useState<string | null>(null);
  const [pulseCopied, setPulseCopied] = useState(false);
  const [pulseGenerating, setPulseGenerating] = useState(false);

  // Chat & Communication State
  const [clientOnline, setClientOnline] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [commentContext, setCommentContext] = useState<{ type: 'task' | 'milestone'; id: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'Management' | 'Client Discussion' | 'Client Portal Preview'>('Management');
  
  const { id: projectId } = React.use(params);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const token = 'ADMIN_DEMO_TOKEN';

  const fetchProjectDetails = () => {
    fetch(`${API_URL}/api/v1/admin/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setProject(data);
        if (data.PulseToken && data.PulseToken.length > 0) {
          setPulseToken(data.PulseToken[0].token);
        }
      })
      .catch(console.error);
  };

  const fetchMessages = () => {
    fetch(`${API_URL}/api/v1/admin/projects/${projectId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchMessages();

    // Fetch Risk History
    fetch(`${API_URL}/api/v1/projects/${projectId}/risk/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
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
        }
      })
      .catch(console.error);

    // Fetch Risk Outcomes
    fetch(`${API_URL}/api/v1/admin/projects/${projectId}/risk/outcome`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRiskOutcomes(data);
      })
      .catch(console.error);
  }, [projectId, API_URL]);

  // Socket Connection & Real-time message reception
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_project', projectId);
    });

    // Real-time message from client or admin
    newSocket.on('receive_message', (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    newSocket.on('client_status', ({ online }: { online: boolean }) => {
      setClientOnline(online);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [projectId, API_URL]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Calculate live preview risk
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`${API_URL}/api/v1/projects/${projectId}/risk/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(riskInputs)
      })
        .then(res => res.json())
        .then(data => setRiskPreview(data))
        .catch(console.error);
    }, 250);

    return () => clearTimeout(timer);
  }, [riskInputs, projectId, API_URL]);

  const handleGeneratePulse = async () => {
    setPulseGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/projects/${projectId}/pulse-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.token) {
        setPulseToken(data.token);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPulseGenerating(false);
    }
  };

  const handleCopyPulseLink = () => {
    if (!pulseToken) return;
    const url = `http://localhost:3000/pulse/${pulseToken}`;
    navigator.clipboard.writeText(url);
    setPulseCopied(true);
    setTimeout(() => setPulseCopied(false), 3000);
  };

  const toggleColumnVisibility = async (colId: string, currentVal: boolean) => {
    try {
      await fetch(`${API_URL}/api/v1/admin/projects/${projectId}/columns/${colId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ clientVisible: !currentVal })
      });
      fetchProjectDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMilestoneVisibility = async (milestoneId: string, currentVal: boolean) => {
    try {
      await fetch(`${API_URL}/api/v1/admin/projects/${projectId}/milestones/${milestoneId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ clientVisible: !currentVal })
      });
      fetchProjectDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSnooze = async (axis: string) => {
    try {
      await fetch(`${API_URL}/api/v1/admin/projects/${projectId}/risk/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ axis, days: 7 })
      });
      fetchProjectDetails();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogOutcome = async () => {
    if (!outcomeText.trim()) return;
    try {
      const latestSnapshot = riskHistory[riskHistory.length - 1];
      const snapshotId = latestSnapshot ? latestSnapshot.id : 'mock-snapshot-id';
      
      const res = await fetch(`${API_URL}/api/v1/admin/projects/${projectId}/risk/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          snapshotId,
          actualOutcome: outcomeText,
          axis: outcomeAxis,
          impact: outcomeImpact
        })
      });
      if (res.ok) {
        setOutcomeText('');
        const updated = await res.json();
        setRiskOutcomes(prev => [updated, ...prev]);
        fetchProjectDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    const payload = {
      text: messageInput,
      taskId: commentContext?.type === 'task' ? commentContext.id : undefined,
      milestoneId: commentContext?.type === 'milestone' ? commentContext.id : undefined,
    };

    // Optimistic UI
    const tempMsg = {
      id: Date.now().toString(),
      senderName: 'Admin',
      text: messageInput,
      createdAt: new Date().toISOString(),
      taskId: payload.taskId,
      milestoneId: payload.milestoneId
    };
    setMessages(prev => [...prev, tempMsg]);
    setMessageInput('');
    setCommentContext(null);

    // Socket emit
    if (socket) {
      socket.emit('send_message', {
        projectId,
        text: payload.text,
        taskId: payload.taskId,
        milestoneId: payload.milestoneId,
        senderId: 'admin-user-id'
      });
    }

    try {
      await fetch(`${API_URL}/api/v1/admin/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const rawCurrentRisk = riskHistory[riskHistory.length - 1];
  const currentRisk = rawCurrentRisk ? {
    schedule: rawCurrentRisk.schedule,
    budget: rawCurrentRisk.budget,
    communication: rawCurrentRisk.communication,
    scopeDrift: rawCurrentRisk.scopeDrift,
    causeSummary: rawCurrentRisk.causeSummary
  } : {
    schedule: 15,
    budget: 15,
    communication: 10,
    scopeDrift: 20,
    causeSummary: null
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background min-h-screen text-foreground font-mono">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container border border-border p-6 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-on-surface">
              {project?.name || 'Loading Project...'}
            </h1>
            <span className="text-xs px-2.5 py-1 bg-brand-primary-bright/10 text-brand-primary-bright border border-brand-primary-bright/20 rounded font-mono uppercase">
              {project?.status || 'Active'}
            </span>
          </div>
          <p className="font-mono text-xs text-on-surface-variant mt-1">
            Project ID: <span className="text-primary">{projectId}</span>
          </p>
        </div>

        {/* Global Controls & Delivery Pulse Token Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {pulseToken ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyPulseLink}
                className="flex items-center gap-2 border-primary/40 text-primary hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {pulseCopied ? 'check' : 'link'}
                </span>
                <span>{pulseCopied ? 'Pulse URL Copied!' : 'Copy Pulse Link'}</span>
              </Button>
              <a 
                href={`http://localhost:3000/pulse/${pulseToken}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-text-muted hover:text-text-strong underline p-2"
                title="View Stakeholder Pulse Page"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </a>
            </div>
          ) : (
            <Button 
              size="sm" 
              onClick={handleGeneratePulse} 
              disabled={pulseGenerating}
              className="flex items-center gap-2 bg-[#5CA8C9] hover:bg-[#82C4DE] text-black font-extrabold"
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              <span>{pulseGenerating ? 'Generating...' : 'Assign Delivery Pulse'}</span>
            </Button>
          )}

          {/* Client Connection Beacon */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-border text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${clientOnline ? 'bg-success animate-pulse' : 'bg-text-muted'}`}></span>
            <span className="text-text-muted">Client Portal:</span>
            <span className={clientOnline ? 'text-success font-bold' : 'text-text-muted'}>
              {clientOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {(['Management', 'Client Discussion', 'Client Portal Preview'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === tab 
                ? 'bg-primary text-on-primary font-bold shadow-[0_0_12px_rgba(var(--shadow-brand-rgb),0.3)]' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            {tab === 'Management' && <span className="material-symbols-outlined text-[16px]">dashboard</span>}
            {tab === 'Client Discussion' && (
              <>
                <span className="material-symbols-outlined text-[16px]">forum</span>
                {messages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black text-primary">
                    {messages.length}
                  </span>
                )}
              </>
            )}
            {tab === 'Client Portal Preview' && <span className="material-symbols-outlined text-[16px]">preview</span>}
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: MANAGEMENT (Risk Simulator & Kanban) */}
      {activeTab === 'Management' && (
        <>
          {/* Main Grid: Telemetry + What-If */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-Time Risk Radar */}
            <Card className="lg:col-span-2 p-6 flex flex-col bg-surface-container border border-border">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-brand-primary-bright/10 text-brand-primary-bright border border-brand-primary-bright/20 rounded">Diagnostic</span>
                  <h2 className="text-xl font-display font-bold text-on-surface">Live Project Risk Signature</h2>
                </div>
                <span className="text-xs font-mono text-muted">Real-time Radar Telemetry</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                {/* Radar Chart */}
                <div className="flex flex-col items-center justify-center p-2 min-h-[300px]">
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
                        <Radar name="Current" dataKey="current" stroke="#5CA8C9" fill="#5CA8C9" fillOpacity={0.3} />
                        <Radar name="Simulated" dataKey="simulated" stroke="#82C4DE" fill="#82C4DE" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {currentRisk.causeSummary && (
                    <div className="mt-4 p-4 bg-danger/10 border border-danger/30 rounded-xl">
                      <h4 className="text-xs font-mono text-danger uppercase tracking-wider mb-2">Suggested Next Action</h4>
                      <p className="text-sm text-text-strong mb-3">{currentRisk.causeSummary}</p>
                      <div className="flex gap-2">
                        {['schedule', 'budget', 'communication', 'scopeDrift'].map(axis => {
                           if ((currentRisk as any)[axis] >= 75) {
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
                        className="input-base w-full p-2 text-sm bg-surface-container border border-border rounded text-on-surface focus:outline-none focus:border-primary font-mono"
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
                      <input type="range" aria-label="External Integrations" min="0" max="10" className="w-full accent-primary" value={riskInputs.integrations} onChange={e => setRiskInputs({...riskInputs, integrations: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2"><label className="text-xs font-mono text-on-surface">Stakeholder Roles</label><span className="text-primary font-mono text-xs">{riskInputs.roles}</span></div>
                      <input type="range" aria-label="Stakeholder Roles" min="0" max="5" className="w-full accent-primary" value={riskInputs.roles} onChange={e => setRiskInputs({...riskInputs, roles: parseInt(e.target.value)})} />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-mono text-on-surface cursor-pointer">
                        <input type="checkbox" aria-label="Real-time Req" className="accent-primary w-4 h-4" checked={riskInputs.realTime} onChange={e => setRiskInputs({...riskInputs, realTime: e.target.checked})} />
                        Real-time Req
                      </label>
                      <label className="flex items-center gap-2 text-xs font-mono text-on-surface cursor-pointer">
                        <input type="checkbox" aria-label="Strict Compliance" className="accent-primary w-4 h-4" checked={riskInputs.compliance} onChange={e => setRiskInputs({...riskInputs, compliance: e.target.checked})} />
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
                            <div key={axis} className="flex justify-between items-center text-xs font-mono">
                              <span className="capitalize text-muted">{axis}:</span>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-on-surface">{newScore}</span>
                                {diff !== 0 && (
                                  <span className={`text-[10px] ${diff > 0 ? 'text-danger' : 'text-success'}`}>
                                    ({diff > 0 ? `+${diff}` : diff})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-muted">No baseline risk telemetry.</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Risk History / Outcomes Feed */}
            <Card className="p-6 flex flex-col h-full bg-surface-container/50 border border-border">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
                <span className="font-mono text-[10px] px-2 py-0.5 bg-brand-primary-bright/10 text-brand-primary-bright border border-brand-primary-bright/20 rounded">Telemetry</span>
                <h2 className="text-xl font-display font-bold text-on-surface">Outcome Logs</h2>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-3 mb-6">
                {riskOutcomes.length === 0 ? (
                  <div className="text-xs font-mono text-muted text-center py-8">No logged outcomes recorded yet.</div>
                ) : (
                  riskOutcomes.map((out: any) => (
                    <div key={out.id} className="p-3 bg-black/40 border border-border rounded-lg text-xs font-mono">
                      <div className="flex justify-between items-center mb-1 text-muted">
                        <span className="uppercase text-[10px] text-primary">{out.axis}</span>
                        <span>{new Date(out.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-text-strong">{out.actualOutcome}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <input 
                  type="text" 
                  value={outcomeText}
                  onChange={(e) => setOutcomeText(e.target.value)}
                  placeholder="Log real-world delivery outcome..." 
                  className="input-base text-xs bg-black border border-border rounded p-2.5 focus:border-primary text-on-surface outline-none font-mono" 
                />
                <div className="flex gap-2">
                  <select 
                    value={outcomeAxis} 
                    onChange={(e) => setOutcomeAxis(e.target.value)}
                    className="input-base flex-1 text-xs bg-black border border-border rounded p-2 text-on-surface outline-none font-mono"
                  >
                    <option value="schedule">Schedule</option>
                    <option value="budget">Budget</option>
                    <option value="communication">Communication</option>
                    <option value="scopeDrift">Scope Drift</option>
                  </select>
                  <select 
                    value={outcomeImpact} 
                    onChange={(e) => setOutcomeImpact(parseInt(e.target.value))}
                    className="input-base w-24 text-xs bg-black border border-border rounded p-2 text-on-surface outline-none font-mono"
                  >
                    <option value={5}>Minor (+5)</option>
                    <option value={15}>Mod (+15)</option>
                    <option value={30}>Major (+30)</option>
                  </select>
                  <Button onClick={handleLogOutcome} size="sm" className="px-4" disabled={!rawCurrentRisk}>Log</Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Milestone Manager */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <div>
                <h2 className="text-2xl font-display font-bold text-on-surface mb-1">Milestones & Approvals</h2>
                <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Client Sign-off Gates</p>
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
                      <Button size="sm" variant="outline" onClick={() => {
                        setCommentContext({ type: 'milestone', id: m.id });
                        setActiveTab('Client Discussion');
                      }}>
                        Comment
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        setProject((prev: any) => ({
                          ...prev,
                          Milestone: prev?.Milestone?.map((item: any) => 
                            item.id === m.id ? { ...item, status: 'Current', requiresApproval: true } : item
                          )
                        }));
                        await fetch(`${API_URL}/api/v1/admin/milestones/${m.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ status: 'Current', requiresApproval: true })
                        });
                        fetchProjectDetails();
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
                <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Drag & Drop Kanban (Syncs to Client)</p>
              </div>
            </div>
            <div className="h-[600px]">
              {project?.columns ? (
                <KanbanBoard 
                  initialColumns={project.columns} 
                  projectId={projectId} 
                  isAdmin={true}
                  onToggleVisibility={toggleColumnVisibility}
                  onTaskComment={(id) => {
                    setCommentContext({ type: 'task', id });
                    setActiveTab('Client Discussion');
                  }}
                  onTaskMove={async (taskId, destColId, newOrder) => {
                    try {
                      await fetch(`${API_URL}/api/v1/admin/projects/${projectId}/tasks/reorder`, {
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

      {/* TAB 2: CLIENT DISCUSSION (Full Persistent Chat Stream) */}
      {activeTab === 'Client Discussion' && (
        <div className="flex flex-col h-[calc(100vh-250px)] min-h-[550px] bg-[#0A0A0A] rounded-xl overflow-hidden border border-border animate-fade-in-up shadow-2xl">
          <div className="p-4 border-b border-border bg-card/70 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">forum</span>
              </div>
              <div>
                <h2 className="font-display font-bold text-sm text-text-strong">Direct Client Communication Stream</h2>
                <span className="font-mono text-[10px] text-text-muted">Real-time socket synchronized with Client Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${clientOnline ? 'bg-success animate-pulse' : 'bg-text-muted'}`}></span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-text-muted">
                Client {clientOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-black/80">
            {messages.length === 0 ? (
              <div className="text-center text-text-muted text-sm py-16 font-mono flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-border">chat_bubble_outline</span>
                <span>No messages in this project thread yet.</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isClientMsg = msg.senderName === 'Client' || msg.clientNonce === 'CLIENT_MSG' || msg.text?.startsWith('📋');
                const isBrief = msg.text?.includes('[NEW PROJECT BRIEF');
                const isEnquiry = msg.text?.includes('[ESTIMATE ENQUIRY]');
                
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${!isClientMsg ? 'items-end self-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1.5 ${!isClientMsg ? 'mr-1' : 'ml-1'}`}>
                      {isClientMsg && (
                        <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                          isEnquiry 
                            ? 'bg-[#5CA8C9]/20 border-[#5CA8C9] text-[#82C4DE]' 
                            : 'bg-primary/10 border-primary/20 text-primary'
                        }`}>
                          {isEnquiry ? 'Client Scope Enquiry' : 'Client'}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-text-muted">
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      {!isClientMsg && (
                        <span className="font-mono text-[11px] text-brand-primary-bright font-bold px-2 py-0.5 bg-brand-primary-bright/10 rounded">
                          You (Admin)
                        </span>
                      )}
                    </div>

                    <div className={`p-4 text-sm font-mono shadow-lg leading-relaxed ${
                      isEnquiry
                        ? 'bg-[#0E1820] border-2 border-[#5CA8C9] rounded-2xl rounded-tl-sm text-white shadow-[0_0_25px_rgba(92,168,201,0.25)]'
                        : isBrief
                        ? 'bg-[#121212] border-2 border-primary rounded-2xl text-text-strong shadow-[0_0_20px_rgba(var(--shadow-brand-rgb),0.2)]'
                        : !isClientMsg 
                          ? 'bg-primary/15 border border-primary/40 rounded-2xl rounded-tr-sm text-text-strong shadow-[0_0_15px_rgba(var(--shadow-brand-rgb),0.1)]' 
                          : 'bg-[#121212] border border-border rounded-2xl rounded-tl-sm text-text-strong'
                    }`}>
                      {(msg.taskId || msg.milestoneId) && (
                        <div className="mb-2 text-[10px] font-mono uppercase bg-black/50 px-2.5 py-1 rounded inline-block text-primary border border-primary/20">
                          Re: {msg.taskId ? 'Task' : 'Milestone'} {msg.taskId || msg.milestoneId}
                        </div>
                      )}
                      <div className="break-words whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input Box */}
          <div className="p-4 border-t border-border bg-card/60 flex flex-col gap-2">
            {commentContext && (
              <div className="flex justify-between items-center bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-mono text-primary font-semibold">
                  Replying to {commentContext.type} {commentContext.id}
                </span>
                <button onClick={() => setCommentContext(null)} className="text-xs text-text-muted hover:text-text-strong">&times; Cancel</button>
              </div>
            )}
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Reply to client regarding scope or project status..." 
                className="flex-1 bg-black border border-border rounded-lg px-4 py-3 text-text-strong placeholder:text-text-muted/60 focus:outline-none focus:border-primary font-mono text-sm transition-all" 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button className="px-6 flex items-center gap-2 shadow-[0_0_15px_rgba(var(--shadow-brand-rgb),0.3)]" onClick={sendMessage}>
                <span>Send Reply</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLIENT PORTAL PREVIEW */}
      {activeTab === 'Client Portal Preview' && (
        <div className="h-[800px] border border-border rounded-xl overflow-hidden bg-surface-container animate-fade-in-up">
          <iframe 
            src="http://localhost:3000/client/dashboard" 
            className="w-full h-full"
            title="Client Portal Preview"
          />
        </div>
      )}
    </div>
  );
}
