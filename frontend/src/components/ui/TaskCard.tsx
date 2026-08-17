import React from 'react';
import { Card } from './Card';

interface TaskCardProps {
  title: string;
  id: string;
  priority: 'low' | 'medium' | 'high';
  onComment?: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ title, id, priority, onComment }) => {
  const priorityColors = {
    low: 'text-success bg-success/10',
    medium: 'text-warning bg-warning/10',
    high: 'text-danger bg-danger/10'
  };

  return (
    <Card className="p-4 mb-3 border-border cursor-grab" interactive>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-muted">{id}</span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${priorityColors[priority]}`}>
          {priority}
        </span>
      </div>
      <h4 className="text-sm font-medium text-text-strong leading-tight">{title}</h4>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {/* Mock Avatars */}
          <div className="w-6 h-6 rounded-full bg-surface-container-highest border border-surface flex items-center justify-center text-[10px] text-text-muted">A</div>
          <div className="w-6 h-6 rounded-full bg-surface-container-highest border border-surface flex items-center justify-center text-[10px] text-text-muted">B</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onComment?.(id); }} className="hover:text-primary transition-colors text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </Card>
  );
};
