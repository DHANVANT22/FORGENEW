'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type PathNode = {
  path: string;
  label: string;
};

const getLabelForPath = (path: string) => {
  if (path === '/') return 'DASHBOARD';
  if (path.startsWith('/projects')) return 'PROJECTS';
  if (path.startsWith('/estimator')) return 'SIMULATOR';
  if (path.startsWith('/pulse')) return 'PULSE';
  if (path.startsWith('/control-centre')) return 'CONTROL_CENTRE';
  
  // Graceful fallback
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split('-')
      .map(word => word.toUpperCase())
      .join(' ');
  }
  
  return 'UNKNOWN';
};

export function FlightPathBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const [history, setHistory] = useState<PathNode[]>([]);

  useEffect(() => {
    // Only run on client
    const saved = sessionStorage.getItem('flight_path');
    let currentHistory: PathNode[] = saved ? JSON.parse(saved) : [];
    
    // Check if we are going back to a previous node
    const existingIndex = currentHistory.findIndex(n => n.path === pathname);
    
    if (existingIndex !== -1) {
      // Truncate forward history if we clicked back
      currentHistory = currentHistory.slice(0, existingIndex + 1);
    } else {
      // Add new node
      currentHistory.push({ path: pathname, label: getLabelForPath(pathname) });
      if (currentHistory.length > 5) {
        currentHistory.shift();
      }
    }

    setHistory(currentHistory);
    sessionStorage.setItem('flight_path', JSON.stringify(currentHistory));
  }, [pathname]);

  if (history.length <= 1) return null;

  return (
    <div className="flex items-center gap-0 mb-4 h-6 animate-fade-in-up">
      <AnimatePresence mode="popLayout">
        {history.map((node, index) => {
          const isLast = index === history.length - 1;
          return (
            <motion.div
              key={node.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center"
            >
              <button 
                onClick={() => !isLast && router.push(node.path)}
                className={`group flex items-center gap-2 ${isLast ? 'cursor-default' : 'cursor-pointer hover:text-text-strong'}`}
              >
                <div className="relative flex items-center justify-center w-4 h-4">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isLast ? 'bg-primary shadow-[0_0_8px_rgba(255,179,175,0.8)]' : 'bg-text-muted group-hover:bg-text-strong'}`} />
                  {isLast && (
                    <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping" />
                  )}
                </div>
                <span className={`font-mono text-[10px] tracking-widest uppercase transition-colors ${isLast ? 'text-primary font-bold' : 'text-text-muted group-hover:text-text-strong'}`}>
                  {node.label}
                </span>
              </button>
              {!isLast && (
                <div className="w-8 h-px bg-border mx-2" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
