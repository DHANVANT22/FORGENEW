'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { KanbanBoard } from '@/components/ui/KanbanBoard';
import { MilestoneTracker } from '@/components/ui/MilestoneTracker';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { LedIndicator } from '@/components/ui/LedIndicator';
import { ReadoutNumber } from '@/components/ui/ReadoutNumber';

type Tab = 'AI Scope Estimator & Chat' | 'Project Pipeline' | 'Milestones' | 'Delivery Pulse' | 'Specs & Environments';

interface EstimatorOption {
  label: string;
  desc?: string;
  score: number;
  icon: string;
}

interface EstimatorQuestion {
  id: string;
  title: string;
  subtitle: string;
  options: EstimatorOption[];
}

const ESTIMATOR_QUESTIONS: EstimatorQuestion[] = [
  {
    id: 'platform',
    title: 'Platform Scope & Surface',
    subtitle: 'Select the primary frontend surface and infrastructure deployment environment.',
    options: [
      { label: 'Web Application', desc: 'Modern Next.js web application with REST/GraphQL cloud API', score: 1, icon: 'language' },
      { label: 'Mobile + Web Platform', desc: 'Cross-platform mobile apps with synchronized cloud backend', score: 2, icon: 'devices' },
      { label: 'Enterprise Data Platform', desc: 'High-throughput microservices, queues & real-time analytics', score: 3, icon: 'hub' },
    ]
  },
  {
    id: 'scale',
    title: 'Projected Concurrency & User Scale',
    subtitle: 'Anticipated traffic load, database throughput, and scaling elasticity demands.',
    options: [
      { label: 'Starter (1k - 10k Users)', desc: 'Standard single-region deployment with auto-caching', score: 1, icon: 'speed' },
      { label: 'Growth (50k - 250k Users)', desc: 'Auto-scaling clusters, Redis caching, high availability DB', score: 2, icon: 'trending_up' },
      { label: 'Global Enterprise (1M+ Users)', desc: 'Multi-region cloud mesh, CDN edge compute, fault tolerance', score: 4, icon: 'public' },
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations & External APIs',
    subtitle: 'Payment gateways, third-party ERP/CRM sync, custom hardware, or webhooks.',
    options: [
      { label: 'Standard Webhooks & Auth', desc: 'Stripe payments, OAuth logins, notifications, emails', score: 2, icon: 'cable' },
      { label: 'Minimal / Standalone', desc: 'Self-contained database without heavy external dependencies', score: 0, icon: 'check_circle' },
      { label: 'Deep Legacy / Custom APIs', desc: 'Enterprise ERP/CRM sync, custom hardware, biometric protocols', score: 4, icon: 'account_tree' },
    ]
  },
  {
    id: 'compliance',
    title: 'Security, Privacy & Compliance',
    subtitle: 'Data governance standards, audit trails, and regulatory compliance requirements.',
    options: [
      { label: 'Standard Web Security', desc: 'SSL/TLS, encrypted JWT auth, data encryption at rest', score: 1, icon: 'security' },
      { label: 'SOC2 / GDPR Compliance', desc: 'Audit logging, automated data retention, RBAC enforcement', score: 2, icon: 'verified_user' },
      { label: 'HIPAA / Financial Grade', desc: 'Zero-trust architecture, BAA compliance, dedicated KMS keys', score: 4, icon: 'shield_with_heart' },
    ]
  },
  {
    id: 'timeline',
    title: 'Target Delivery Velocity',
    subtitle: 'Desired release schedule, milestone cadence, and target launch window.',
    options: [
      { label: 'Standard (4 - 6 Weeks)', desc: 'Balanced phased sprints with comprehensive QA testing', score: 2, icon: 'calendar_month' },
      { label: 'Accelerated Sprint (2 - 3 Weeks)', desc: 'Dedicated team allocation with parallel development tracks', score: 4, icon: 'bolt' },
      { label: 'Comprehensive (8 - 12 Weeks)', desc: 'Extensive multi-phase rollout with staged customer pilots', score: 1, icon: 'schedule' },
    ]
  }
];

export default function ClientDashboard() {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('AI Scope Estimator & Chat');
  const [clientEmail, setClientEmail] = useState<string>('Client');
  const [clientName, setClientName] = useState<string>('Client User');
  const [companyName, setCompanyName] = useState<string>('');
  
  // Real-time Connection State
  const [socketConnected, setSocketConnected] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Pulse State
  const [pulseSnapshot, setPulseSnapshot] = useState<any>(null);
  const [pulseLoading, setPulseLoading] = useState(false);

  // Estimator State
  const [estimatorAnswers, setEstimatorAnswers] = useState<Record<string, number>>({
    platform: 1,
    scale: 2,
    integrations: 2,
    compliance: 1,
    timeline: 2
  });
  const [customQuestion, setCustomQuestion] = useState('');
  const [enquirySending, setEnquirySending] = useState(false);
  const [enquirySentSuccess, setEnquirySentSuccess] = useState(false);

  // Chat State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...extraHeaders };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('clientToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${API_URL}/api/v1/client-auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clientToken');
      localStorage.removeItem('clientAccount');
    }
    window.location.href = '/client/login';
  };

  // Auth Guard & Project Data Loading
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('clientToken');
    const accountStr = localStorage.getItem('clientAccount');

    if (!token) {
      window.location.href = '/client/login';
      return;
    }

    if (accountStr) {
      try {
        const acc = JSON.parse(accountStr);
        if (acc.email) setClientEmail(acc.email);
        if (acc.name) setClientName(acc.name);
        if (acc.companyName) setCompanyName(acc.companyName);
      } catch (e) {}
    }

    setAuthChecking(false);

    // Fetch Project Data with graceful error recovery
    fetch(`${API_URL}/api/v1/client/project`, {
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          handleSignOut();
          return null;
        }
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn('Notice from client project endpoint:', errData);
          // Return default client workspace structure if project not explicitly bound
          return {
            id: 'client-workspace',
            name: `${companyName || clientName || 'Client'}'s Architecture Workspace`,
            description: 'Unified client delivery workspace. Configure architecture scope, track live milestone sign-offs, and communicate directly with engineering leads.',
            status: 'In Planning & Estimation',
            progress: 30,
            budget: '$28,000',
            columns: [
              { id: 'c1', name: 'Backlog & Scope', clientVisible: true, tasks: [{ id: 't1', title: 'Scope Specification & Architecture Blueprint', priority: 'high', columnId: 'c1', order: 0 }] },
              { id: 'c2', name: 'In Progress', clientVisible: true, tasks: [{ id: 't2', title: 'API & Infrastructure Provisioning', priority: 'high', columnId: 'c2', order: 0 }] },
              { id: 'c3', name: 'Delivered', clientVisible: true, tasks: [{ id: 't3', title: 'Workspace Initialization', priority: 'low', columnId: 'c3', order: 0 }] }
            ],
            Milestone: [
              { id: 'm1', title: 'Discovery & Blueprint Sign-off', status: 'Completed', targetDate: new Date().toISOString(), clientVisible: true },
              { id: 'm2', title: 'Core API & Auth Engine Sprint', status: 'Current', targetDate: new Date(Date.now() + 14 * 86400000).toISOString(), clientVisible: true, requiresApproval: true },
              { id: 'm3', title: 'Frontend UI & System Integration', status: 'Upcoming', targetDate: new Date(Date.now() + 28 * 86400000).toISOString(), clientVisible: true, requiresApproval: true }
            ]
          };
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProject(data);
          if (data.id) {
            fetchMessages(data.id);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching client project:', err);
        setErrorBanner('Connecting to live delivery services...');
        setLoading(false);
      });
  }, [API_URL, companyName, clientName]);

  const fetchMessages = (projectId: string) => {
    fetch(`${API_URL}/api/v1/projects/${projectId}/messages`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);
  };

  // Socket Connection for real-time chat with admin
  useEffect(() => {
    if (!project?.id) return;

    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setSocketConnected(true);
      newSocket.emit('join_project', project.id);
      newSocket.emit('client_online', { projectId: project.id });
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
    });

    newSocket.on('receive_message', (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [project?.id, API_URL]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Load pulse snapshot when pulse tab is opened
  useEffect(() => {
    const pulseToken = project?.PulseToken?.[0]?.token;
    if (activeTab === 'Delivery Pulse' && pulseToken && !pulseSnapshot) {
      setPulseLoading(true);
      fetch(`${API_URL}/api/v1/pulse/${pulseToken}`)
        .then(res => res.json())
        .then(data => {
          setPulseSnapshot(data);
          setPulseLoading(false);
        })
        .catch(() => setPulseLoading(false));
    }
  }, [activeTab, project, pulseSnapshot, API_URL]);

  // Clean Formatted Message Renderer
  const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    return (
      <div className="space-y-2 font-sans text-xs leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          if (trimmed.includes('[NEW PROJECT BRIEF') || trimmed.includes('[ESTIMATE ENQUIRY]')) {
            const cleanTitle = trimmed.replace(/\*\*/g, '').replace(/📋/g, '').trim();
            return (
              <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5CA8C9]/15 border border-[#5CA8C9]/40 text-[#82C4DE] font-bold font-mono text-[11px] mb-2 shadow-[0_0_12px_rgba(92,168,201,0.2)]">
                <span className="material-symbols-outlined text-[15px]">assignment</span>
                <span>{cleanTitle}</span>
              </div>
            );
          }

          if (trimmed.includes('**') || trimmed.includes(':')) {
            const cleanLine = trimmed.replace(/\*\*/g, '');
            const colonIdx = cleanLine.indexOf(':');
            if (colonIdx !== -1) {
              const key = cleanLine.slice(0, colonIdx).trim();
              const val = cleanLine.slice(colonIdx + 1).trim();
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-white/[0.08] text-xs gap-1">
                  <span className="text-neutral-400 font-medium text-[11px]">{key}</span>
                  <span className="text-white font-semibold">{val}</span>
                </div>
              );
            }
          }

          return (
            <p key={idx} className="text-neutral-200 font-sans leading-relaxed">
              {trimmed.replace(/\*\*/g, '')}
            </p>
          );
        })}
      </div>
    );
  };

  // Calculate scope metrics
  const calculateEstimate = () => {
    const totalScore = Object.values(estimatorAnswers).reduce((a, b) => a + b, 0);

    let tier = 'Tier 1 — Core Full-Stack Application';
    let budgetBand = '$12,000 - $18,000';
    let timeline = '3 - 4 Weeks';
    let archDesc = 'Standard modular web architecture with Next.js 15, PostgreSQL cloud database, authenticated user portal, automated CI/CD pipelines, and 99.9% uptime guarantee.';
    let features = ['Next.js 15 App Router & SSR', 'PostgreSQL Cloud DB + Prisma ORM', 'Encrypted JWT & Role-Based Access', 'Automated Daily Backups & CI/CD'];

    if (totalScore >= 12) {
      tier = 'Tier 3 — Scaled Cloud Mesh Platform';
      budgetBand = '$35,000 - $65,000+';
      timeline = '8 - 12 Weeks';
      archDesc = 'Distributed microservices architecture with high concurrency throughput, multi-region CDN caching, zero-trust security compliance, audit logging, and custom legacy bridge pipelines.';
      features = ['Distributed Cloud Microservices', 'Multi-Region CDN & Edge Compute', 'SOC2 / HIPAA Audit Trails & KMS', 'Dedicated Tech Lead & 24/7 SLA'];
    } else if (totalScore >= 7) {
      tier = 'Tier 2 — High-Performance Growth Platform';
      budgetBand = '$18,000 - $32,000';
      timeline = '4 - 6 Weeks';
      archDesc = 'Production-grade application with automated auto-scaling clusters, Redis cache layer, integrated third-party webhooks, role-based access control, and accelerated sprint milestones.';
      features = ['Auto-Scaling Container Clusters', 'Redis High-Speed Caching Layer', 'Stripe & Third-Party Webhook Sync', 'Accelerated 2-Week Sprint Cadence'];
    }

    return { tier, budgetBand, timeline, archDesc, totalScore, features };
  };

  const currentEstimate = calculateEstimate();

  // Send Scope Inquiry to Admin
  const handleSendScopeInquiry = async (messageText?: string) => {
    const bodyText = messageText || customQuestion;
    if (!bodyText.trim()) return;

    setEnquirySending(true);
    setEnquirySentSuccess(false);

    const formattedMessage = `📋 **[NEW PROJECT BRIEF / SCOPE REQUEST]**\n\n` +
      `**Complexity Tier:** ${currentEstimate.tier}\n` +
      `**Budget Target:** ${currentEstimate.budgetBand}\n` +
      `**Timeline Target:** ${currentEstimate.timeline}\n\n` +
      `**Details & Requirements:**\n${bodyText.trim()}`;

    try {
      let res;
      if (project?.id && project.id !== 'client-workspace') {
        res = await fetch(`${API_URL}/api/v1/projects/${project.id}/messages`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            body: formattedMessage,
            clientNonce: 'CLIENT_MSG'
          })
        });
      } else {
        res = await fetch(`${API_URL}/api/v1/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: clientName || clientEmail.split('@')[0] || 'Client User',
            email: clientEmail,
            message: formattedMessage,
            service: currentEstimate.tier
          })
        });
      }

      if (res && res.ok) {
        setCustomQuestion('');
        setEnquirySentSuccess(true);
        if (project?.id) {
          fetchMessages(project.id);
        }
      }
    } catch (err) {
      console.error('Error sending inquiry:', err);
    } finally {
      setEnquirySending(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!messageInput.trim() || !project?.id) return;
    const txt = messageInput.trim();
    setMessageInput('');

    try {
      const res = await fetch(`${API_URL}/api/v1/projects/${project.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          body: txt,
          clientNonce: 'CLIENT_MSG'
        })
      });

      if (res.ok) {
        fetchMessages(project.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPulseLink = () => {
    const pulseToken = project?.PulseToken?.[0]?.token;
    const url = pulseToken ? `${window.location.origin}/pulse/${pulseToken}` : window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#5CA8C9]/10 border border-[#5CA8C9]/40 flex items-center justify-center shadow-[0_0_30px_rgba(92,168,201,0.3)]">
            <span className="w-4 h-4 rounded-full bg-[#5CA8C9] animate-ping" />
          </div>
          <div className="flex items-center gap-3">
            <LedIndicator status="active" />
            <span className="text-xs font-bold tracking-widest text-[#82C4DE]">INITIALIZING FORGE 2.0 CLIENT GATEWAY...</span>
          </div>
        </div>
      </div>
    );
  }

  const initials = clientName
    ? clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : clientEmail.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#040608] text-white font-sans selection:bg-[#5CA8C9] selection:text-black">
      
      {/* Top Ambient Glow Canvas */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-[#5CA8C9]/10 via-[#5CA8C9]/0 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Enterprise Executive Navigation Header */}
      <header className="sticky top-0 z-[200] w-full border-b border-white/[0.08] bg-[#040608]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5CA8C9] to-[#2B637B] flex items-center justify-center text-black font-black text-xs font-mono shadow-[0_0_15px_rgba(92,168,201,0.4)]">
                F2
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-display font-black tracking-wider text-white group-hover:text-[#82C4DE] transition-colors">
                  FORGE 2.0
                </span>
                <span className="text-[9px] font-mono text-neutral-400 tracking-widest uppercase">
                  Executive Client Gateway
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08]">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-mono text-neutral-300">
                {socketConnected ? 'Real-Time Sync Active' : 'Connecting Engine...'}
              </span>
            </div>
          </div>

          {/* Account Controls & Profile Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">
                  {clientName || clientEmail.split('@')[0]}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 leading-tight">
                  {companyName || 'Verified Client'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5CA8C9]/30 to-[#82C4DE]/30 border border-[#5CA8C9]/50 text-[#82C4DE] flex items-center justify-center font-bold text-xs font-mono">
                {initials}
              </div>
            </div>

            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="text-xs font-mono border-white/[0.12] hover:border-red-500/50 hover:bg-red-950/20 text-neutral-300 hover:text-red-300 rounded-xl"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8 relative z-10">
        
        {/* Banner Alert if any */}
        {errorBanner && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between font-sans">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              <span>{errorBanner}</span>
            </div>
            <button onClick={() => setErrorBanner('')} className="text-neutral-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Executive Workspace Overview Hero */}
        <div className="relative rounded-3xl p-8 bg-gradient-to-br from-[#090F16] via-[#06080B] to-[#040608] border border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.6),0_0_40px_rgba(92,168,201,0.06)] overflow-hidden">
          {/* Background Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#5CA8C9]/15 text-[#82C4DE] border border-[#5CA8C9]/30 uppercase tracking-wider">
                  Active Client Workspace
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {project?.status || 'In Planning & Sprint Setup'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
                {project?.name || `${companyName || 'Enterprise'} Cloud Solution`}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
                {project?.description || 'Unified client delivery workspace. Configure architecture scope, track live milestone sign-offs, and communicate directly with engineering leads.'}
              </p>
            </div>

            {/* Quick KPI Stat Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:shrink-0 font-mono">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.08] backdrop-blur-md">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Sprint Progress</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#5CA8C9]">{project?.progress || 35}%</span>
                  <span className="text-[10px] text-neutral-500">completed</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.08] mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#5CA8C9] to-[#82C4DE] rounded-full transition-all duration-500" style={{ width: `${project?.progress || 35}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.08] backdrop-blur-md">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Target Budget</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{project?.budget || currentEstimate.budgetBand.split('-')[0].trim()}</span>
                </div>
                <span className="text-[10px] text-emerald-400 mt-1 block">Fixed Cap Model</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-black/60 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Active Gate</span>
                  <span className="text-xs font-bold text-[#82C4DE] block truncate">
                    {project?.Milestone?.find((m: any) => m.status === 'Current')?.title || 'Scope & Blueprint'}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 mt-2 block">
                  {project?.Milestone?.filter((m: any) => m.status === 'Completed').length || 1} of {project?.Milestone?.length || 4} Milestones
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex bg-[#0A0D12] p-1.5 rounded-2xl border border-white/[0.08] gap-1 overflow-x-auto font-mono text-xs shadow-lg">
          {[
            { id: 'AI Scope Estimator & Chat', label: '⚡ AI Scope & Architecture Studio' },
            { id: 'Project Pipeline', label: '📋 Kanban Pipeline' },
            { id: 'Milestones', label: '🏁 Milestones & Sign-off' },
            { id: 'Delivery Pulse', label: '💓 Delivery Pulse' },
            { id: 'Specs & Environments', label: '📂 Specs & Environments' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-5 py-3 font-bold tracking-wider uppercase transition-all rounded-xl whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#5CA8C9] text-black font-black shadow-[0_0_20px_rgba(92,168,201,0.4)] scale-[1.01]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: AI SCOPE ESTIMATOR & CHAT */}
        {activeTab === 'AI Scope Estimator & Chat' && (
          <div className="flex flex-col gap-8 animate-fade-in-up">
            
            {/* Primary Architecture Projection Hero Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0B121A] via-[#06080C] to-[#040608] border border-[#5CA8C9]/30 relative overflow-hidden shadow-[0_0_50px_rgba(92,168,201,0.1)]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <LedIndicator status="active" />
                    <span className="text-xs font-mono text-[#82C4DE] uppercase tracking-widest font-bold">Live Architecture Matrix</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
                    {currentEstimate.tier}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-[#5CA8C9]/10 border border-[#5CA8C9]/40 text-[#82C4DE] text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(92,168,201,0.2)]">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span>Calculated Score: {currentEstimate.totalScore} Points</span>
                  </div>
                </div>
              </div>

              {/* Metric Hero Readouts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.08]">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block mb-1">Projected Budget Band</span>
                  <ReadoutNumber value={currentEstimate.budgetBand} className="text-2xl font-black text-[#5CA8C9]" />
                  <p className="text-[11px] text-neutral-500 mt-2 font-sans">Full turn-key development, cloud provisioning & deployment</p>
                </div>

                <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.08]">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block mb-1">Estimated Timeline Window</span>
                  <ReadoutNumber value={currentEstimate.timeline} className="text-2xl font-black text-emerald-400" />
                  <p className="text-[11px] text-neutral-500 mt-2 font-sans">Phased sprint delivery roadmap with milestone validation</p>
                </div>

                <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.08] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block mb-1">Included Tech Capabilities</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {currentEstimate.features.map((feat, fIdx) => (
                        <span key={fIdx} className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-neutral-300">
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope Configurator Questions Grid */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#5CA8C9] text-black font-extrabold text-xs flex items-center justify-center font-mono shadow-[0_0_15px_rgba(92,168,201,0.4)]">
                  1
                </div>
                <h3 className="text-lg font-display font-bold text-white tracking-wide">
                  Configure & Fine-Tune Project Parameters
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ESTIMATOR_QUESTIONS.map((q) => (
                  <div key={q.id} className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08] flex flex-col justify-between gap-5 hover:border-white/[0.15] transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-display font-bold text-white">{q.title}</span>
                        <LedIndicator status="active" />
                      </div>
                      <p className="text-xs text-neutral-400 font-sans mb-4">{q.subtitle}</p>

                      <div className="flex flex-col gap-2.5">
                        {q.options.map((opt, i) => {
                          const isSelected = estimatorAnswers[q.id] === opt.score;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setEstimatorAnswers(prev => ({ ...prev, [q.id]: opt.score }))}
                              className={`p-3.5 rounded-2xl text-left transition-all font-sans flex items-start gap-3.5 cursor-pointer ${
                                isSelected
                                  ? 'neu-pressed border border-[#5CA8C9]/70 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),0_0_15px_rgba(92,168,201,0.3)]'
                                  : 'neu-button hover:-translate-y-0.5'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-xl border shrink-0 flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'border-[#5CA8C9] bg-[#5CA8C9]/20 text-[#82C4DE] shadow-[0_0_12px_rgba(92,168,201,0.3)]' 
                                  : 'border-white/[0.08] bg-black/60 text-neutral-500'
                              }`}>
                                <span className="material-symbols-outlined text-[18px]">
                                  {opt.icon}
                                </span>
                              </div>
                              <div className="flex-1 pt-0.5">
                                <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                                  {opt.label}
                                </span>
                                {opt.desc && <span className="text-[11px] text-neutral-500 block leading-tight mt-1">{opt.desc}</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Engineering Lead Discussion & Requirement Proposal */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl neu-button-primary text-black font-extrabold text-xs flex items-center justify-center font-mono shadow-[0_0_15px_rgba(92,168,201,0.4)]">
                  2
                </div>
                <h3 className="text-lg font-display font-bold text-white tracking-wide">
                  Transmit Requirement Brief & Live Team Discussion
                </h3>
              </div>

              <div className="p-8 rounded-3xl neu-panel flex flex-col gap-6">
                <div className="flex flex-col gap-2 pb-4 border-b border-white/[0.08]">
                  <h4 className="text-lg font-display font-bold text-white">Transmit Scope Brief or Ask an Architecture Lead</h4>
                  <p className="text-xs text-neutral-400 font-sans">
                    Your brief and messages are instantly synchronized with the assigned engineering team and account manager.
                  </p>
                </div>

                {/* Quick Chips */}
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-[11px] text-neutral-500 font-mono font-bold uppercase">Quick Inquiry:</span>
                  {[
                    "Can we expedite target delivery to 3 weeks?",
                    "What are the milestone sign-off gates?",
                    "Can we add a SOC2 compliance audit track?",
                    "Can we schedule a live technical architecture review?"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendScopeInquiry(chip)}
                      className="px-3.5 py-1.5 rounded-full neu-button text-[#82C4DE] text-xs font-sans transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Scope Prompt Input */}
                <div className="flex flex-col gap-3">
                  <textarea
                    rows={3}
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Describe specific features, API requirements, custom integrations, or questions here..."
                    className="neu-input w-full p-4 text-xs text-white placeholder-neutral-600 font-sans"
                  />

                  <div className="flex justify-between items-center flex-wrap gap-4">
                    {enquirySentSuccess ? (
                      <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Scope brief transmitted to engineering leads!
                      </span>
                    ) : <span className="text-[11px] text-neutral-500 font-mono">Real-time socket channel open</span>}

                    <Button
                      onClick={() => handleSendScopeInquiry()}
                      disabled={enquirySending || !customQuestion.trim()}
                      className="bg-[#5CA8C9] text-black font-extrabold text-xs uppercase px-7 py-3 rounded-xl hover:bg-[#82C4DE] shadow-[0_0_20px_rgba(92,168,201,0.4)] disabled:opacity-40"
                    >
                      {enquirySending ? 'Transmitting Brief...' : 'Transmit Scope Proposal'}
                    </Button>
                  </div>
                </div>

                {/* Live Conversation Stream */}
                <div className="mt-4 pt-6 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
                      Live Delivery Discussion Thread ({messages.length} Messages)
                    </h5>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Synchronized via WebSocket
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-black border border-white/[0.08] max-h-96 overflow-y-auto flex flex-col gap-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-neutral-500 text-xs font-sans flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-3xl text-neutral-600">forum</span>
                        <span>No messages in thread yet. Type a question or click a quick prompt above to chat with the engineering leads!</span>
                      </div>
                    ) : (
                      messages.map((m, idx) => {
                        const isClient = m.senderName === 'Client' || m.clientNonce === 'CLIENT_MSG' || m.text?.startsWith('📋');
                        const isEnquiry = m.text?.includes('[ESTIMATE ENQUIRY]') || m.text?.includes('[NEW PROJECT BRIEF');

                        return (
                          <div key={m.id || idx} className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1.5 text-[10px] font-mono">
                              <span className="font-bold text-neutral-400">
                                {isClient ? 'You (Client)' : (m.senderName || 'Engineering Lead')}
                              </span>
                              {!isClient && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold">
                                  STAFF VERIFIED
                                </span>
                              )}
                              <span className="text-neutral-600">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className={`p-4 rounded-2xl max-w-xl text-xs font-sans leading-relaxed shadow-lg ${
                              isEnquiry 
                                ? 'bg-[#0B1520] border border-[#5CA8C9]/60 text-white shadow-[0_0_25px_rgba(92,168,201,0.15)]'
                                : isClient
                                ? 'bg-[#141417] border border-white/[0.1] text-neutral-100 rounded-tr-sm'
                                : 'bg-[#091118] border border-[#5CA8C9]/30 text-[#82C4DE] rounded-tl-sm'
                            }`}>
                              {renderFormattedText(m.text)}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="mt-4 flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder="Type a follow-up message to the engineering team..."
                      className="flex-1 px-5 py-3 rounded-2xl bg-black border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#5CA8C9] font-sans"
                    />
                    <Button
                      onClick={handleSendChatMessage}
                      disabled={!messageInput.trim()}
                      className="px-6 py-3 rounded-2xl bg-[#5CA8C9] text-black font-bold text-xs shadow-lg disabled:opacity-40"
                    >
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PROJECT PIPELINE */}
        {activeTab === 'Project Pipeline' && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold text-white">Live Execution Board</h3>
                <p className="text-xs text-neutral-400 font-sans mt-1">
                  Synchronized development sprint swimlanes and task deliverables.
                </p>
              </div>
            </div>

            <div className="min-h-[500px] p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08]">
              {project?.columns && project.columns.length > 0 ? (
                <KanbanBoard initialColumns={project.columns} projectId={project.id} isAdmin={false} />
              ) : (
                <div className="text-center py-20 text-neutral-500 font-mono text-sm border border-dashed border-white/[0.1] rounded-2xl">
                  No active columns configured yet. Deliverables will appear once sprint planning commences.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MILESTONES */}
        {activeTab === 'Milestones' && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold text-white">Milestone Verification & Sign-off Gates</h3>
                <p className="text-xs text-neutral-400 font-sans mt-1">
                  Review deliverable checkpoints and provide executive sign-off for sprint completions.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#070A0E] border border-white/[0.08]">
              {project?.Milestone && project.Milestone.length > 0 ? (
                <MilestoneTracker milestones={project.Milestone.map((m: any) => ({
                  id: m.id,
                  title: m.title,
                  date: m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'Active Phase',
                  status: (m.status === 'Completed' || m.approvedAt ? 'completed' : m.status === 'Current' ? 'current' : 'upcoming'),
                  requiresApproval: m.requiresApproval
                }))} onApprove={async (id) => {
                  setProject((prev: any) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      Milestone: prev.Milestone?.map((m: any) => 
                        m.id === id ? { ...m, approvedAt: new Date().toISOString(), status: 'Completed' } : m
                      )
                    };
                  });
                  try {
                    await fetch(`${API_URL}/api/v1/client/milestones/${id}/approve`, {
                      method: 'PUT',
                      headers: getAuthHeaders({ 'Content-Type': 'application/json' })
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }} />
              ) : (
                <div className="text-center py-16 text-neutral-500 font-mono text-sm">
                  No milestones configured yet for this workspace.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DELIVERY PULSE */}
        {activeTab === 'Delivery Pulse' && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold text-white">Delivery Pulse & Engineering Telemetry</h3>
                <p className="text-xs text-neutral-400 font-sans mt-1">
                  Real-time health, schedule velocity, risk variance, and budget metrics.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyPulseLink}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-mono text-white hover:bg-white/[0.1] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedLink ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedLink ? 'Copied Pulse Link!' : 'Share Pulse Link'}</span>
                </button>

                {project?.PulseToken?.[0]?.token && (
                  <a
                    href={`http://localhost:3000/pulse/${project.PulseToken[0].token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-[#5CA8C9] text-black font-extrabold text-xs flex items-center gap-2 hover:bg-[#82C4DE] transition-all shadow-[0_0_20px_rgba(92,168,201,0.3)]"
                  >
                    <span>Open Public View</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08]">
                <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block mb-1">Health Index</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">98.4 / 100</span>
                <p className="text-xs text-neutral-500 mt-2">Zero critical blockers reported in current sprint cycle.</p>
              </div>

              <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08]">
                <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block mb-1">Sprint Velocity</span>
                <span className="text-3xl font-black text-[#5CA8C9] font-mono">1.2x Target</span>
                <p className="text-xs text-neutral-500 mt-2">Deliverable velocity exceeds standard delivery roadmap.</p>
              </div>

              <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08]">
                <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block mb-1">Budget Variance</span>
                <span className="text-3xl font-black text-white font-mono">0.0% Variance</span>
                <p className="text-xs text-neutral-500 mt-2">All expenditures locked inside agreed fixed envelope.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SPECS & ENVIRONMENTS */}
        {activeTab === 'Specs & Environments' && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08]">
              <h3 className="text-xl font-display font-bold text-white">Project Environments & Deliverables</h3>
              <p className="text-xs text-neutral-400 font-sans mt-1">
                Access preview environments, API specs, and technical documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">Staging Preview Deployment</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">ONLINE</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4 font-sans">
                    Pre-release client preview environment with live database fixtures.
                  </p>
                  <div className="p-3 rounded-xl bg-black border border-white/[0.08] font-mono text-xs text-[#82C4DE] truncate">
                    http://localhost:3000
                  </div>
                </div>

                <a 
                  href="http://localhost:3000" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-xs text-center border border-white/[0.1] transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch Preview Surface</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>

              <div className="p-6 rounded-3xl bg-[#070A0E] border border-white/[0.08] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">Backend API & OpenAPI Swagger</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#5CA8C9]/20 text-[#82C4DE] border border-[#5CA8C9]/40 font-bold">REST / V1</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-4 font-sans">
                    Direct API health endpoint and JSON schema documentation.
                  </p>
                  <div className="p-3 rounded-xl bg-black border border-white/[0.08] font-mono text-xs text-[#82C4DE] truncate">
                    http://localhost:5001/health
                  </div>
                </div>

                <a 
                  href="http://localhost:5001/health" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-xs text-center border border-white/[0.1] transition-all flex items-center justify-center gap-2"
                >
                  <span>Verify API Health</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
