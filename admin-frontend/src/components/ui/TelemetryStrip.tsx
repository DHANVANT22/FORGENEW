'use client';

import React, { useEffect, useState } from 'react';
import { LedIndicator } from './LedIndicator';

export function TelemetryStrip() {
  const [time, setTime] = useState<string>('');
  const [ping, setPing] = useState<number>(0);
  const [activeProjects, setActiveProjects] = useState(0);

  useEffect(() => {
    // Initial fetch for mock telemetry
    setPing(Math.floor(Math.random() * 20) + 15);
    setActiveProjects(Math.floor(Math.random() * 5) + 3);

    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().split('T')[1].substring(0, 8) + ' UTC');
      
      // Simulate ping jitter
      if (Math.random() > 0.7) {
        setPing(prev => Math.max(5, prev + (Math.floor(Math.random() * 10) - 5)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-6 bg-bg-deep border-t border-border flex items-center justify-between px-4 shrink-0 z-50">
      <div className="flex items-center gap-6 h-full">
        <div className="flex items-center gap-2">
           <LedIndicator status={ping > 100 ? 'warning' : 'active'} />
           <span className="font-mono text-[10px] text-text-muted tracking-widest">API_LINK: <span className={ping > 100 ? 'text-warning' : 'text-success'}>{ping}ms</span></span>
        </div>
        <div className="w-px h-3 bg-border/50"></div>
        <div className="flex items-center gap-2">
           <span className="font-mono text-[10px] text-text-muted tracking-widest">ACTIVE_SCOPES: <span className="text-text-strong">{activeProjects}</span></span>
        </div>
      </div>
      <div className="flex items-center gap-4 h-full">
        <span className="font-mono text-[10px] text-text-muted tracking-widest">{time}</span>
      </div>
    </div>
  );
}
