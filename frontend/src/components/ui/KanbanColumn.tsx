import React from 'react';
import { Task } from './KanbanBoard';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  id: string;
  name: string;
  tasks: Task[];
  clientVisible?: boolean;
  isAdmin?: boolean;
  onToggleVisibility?: (columnId: string, currentStatus: boolean) => void;
  onTaskComment?: (taskId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, name, tasks, clientVisible = true, isAdmin = false, onToggleVisibility, onTaskComment }) => {
  return (
    <div className="flex flex-col bg-surface-container-low rounded-xl p-3 min-w-[280px]">
      <div className="flex items-center justify-between px-1 mb-4">
        <h3 className="text-sm font-bold text-text-strong uppercase tracking-wider">{name}</h3>
        <span className="text-xs font-mono text-muted bg-surface-container py-0.5 px-2 rounded-full">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} id={task.id} title={task.title} priority={task.priority} onComment={onTaskComment} />
        ))}
      </div>
    </div>
  );
};
