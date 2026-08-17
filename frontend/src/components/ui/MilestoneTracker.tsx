import React from 'react';
import { motion } from 'framer-motion';

interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
  requiresApproval?: boolean;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  onApprove?: (id: string) => void;
  onComment?: (id: string) => void;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ milestones, onApprove, onComment }) => {
  // Find the index of the first upcoming item, or default to all completed
  const upcomingIndex = milestones.findIndex(m => m.status === 'upcoming');
  const fillPercentage = upcomingIndex === -1 ? 100 : (upcomingIndex / Math.max(1, milestones.length - 1)) * 100;

  return (
    <div className="relative ml-3 mt-4 space-y-6 pb-2">
      {/* Background Line */}
      <div className="absolute top-2 bottom-2 left-[-1px] w-[2px] bg-surface-container-highest" />
      {/* Animated Fill Line */}
      <motion.div 
        className="absolute top-2 left-[-1px] w-[2px] bg-gradient-to-b from-brand-primary to-brand-primary-bright"
        initial={{ height: 0 }}
        animate={{ height: `${fillPercentage}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {milestones.map((m, idx) => (
        <div key={idx} className="relative pl-6">
          <div 
            className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-surface ${
              m.status === 'completed' 
                ? 'border-brand-primary bg-brand-primary' 
                : m.status === 'current' 
                ? 'border-brand-primary-bright bg-brand-primary-bright' 
                : 'border-surface-container-highest bg-surface'
            }`}
            style={m.status === 'current' ? { boxShadow: '0 0 12px var(--color-brand-primary-bright)' } : {}}
          />
          <div className="flex flex-col">
            <h4 className={`text-sm font-bold ${m.status === 'upcoming' ? 'text-muted' : 'text-text-strong'}`}>{m.title}</h4>
            <span className="text-xs text-muted mt-1 font-mono">{m.date}</span>
            <div className="flex gap-3 mt-2">
              {m.status !== 'upcoming' && onComment && (
                <button onClick={() => onComment(m.id)} className="text-[10px] text-primary hover:underline uppercase tracking-wider font-mono">
                  Comment
                </button>
              )}
              {m.status === 'current' && m.requiresApproval && onApprove && (
                <button onClick={() => onApprove(m.id)} className="text-[10px] bg-primary/10 text-primary px-2 py-1 border border-primary/20 rounded hover:bg-primary/20 uppercase tracking-wider font-mono transition-colors">
                  Approve Milestone
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
