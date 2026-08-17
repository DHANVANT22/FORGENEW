'use client';
import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  columnId: string;
  order: number;
}

export interface Column {
  id: string;
  name: string;
  clientVisible: boolean;
  tasks: Task[];
}

export interface KanbanBoardProps {
  initialColumns: Column[];
  projectId: string;
  isAdmin?: boolean;
  onToggleVisibility?: (columnId: string, currentStatus: boolean) => void;
  onTaskMove?: (taskId: string, destColId: string, newOrder: number) => void;
  onTaskComment?: (taskId: string) => void;
}

const SortableTask = ({ task, isAdmin, onTaskComment }: { task: Task, isAdmin: boolean, onTaskComment?: (taskId: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } });

  // 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(y, { stiffness: 300, damping: 30 });
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    const ry = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    x.set(rx * -6); // max 6deg
    y.set(ry * 6);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 1,
    rotateX,
    rotateY,
    transformPerspective: 1000,
  };

  const priorityColors: Record<string, string> = {
    low: 'text-success bg-success/10',
    medium: 'text-warning bg-warning/10',
    high: 'text-danger bg-danger/10'
  };
  const pColor = priorityColors[task.priority.toLowerCase()] || priorityColors.low;

  return (
    <motion.div 
      layout
      initial={false}
      animate={{ 
        scale: isDragging ? 0.98 : 1, 
        opacity: isDragging ? 0.6 : 1, // slightly ghosted while dragging
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.6 }}
      ref={setNodeRef} 
      style={style} 
      {...(isAdmin ? attributes : {})} 
      {...(isAdmin ? listeners : {})} 
      onPointerEnter={() => setIsHovered(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative bg-card-bg p-3 rounded-lg border border-border mb-3 transition-colors bg-surface ${isAdmin ? 'hover:border-primary-container/0' : ''}`}
      data-dnd-sortable="true"
    >
      {/* Ignite/Glow shadow on drag */}
      {isDragging && (
        <div className="absolute inset-0 rounded-lg shadow-glow-red pointer-events-none" />
      )}
      
      {/* Animated gradient trace on hover */}
      {isAdmin && isHovered && !isDragging && (
        <motion.div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ padding: '1px', background: 'linear-gradient(90deg, var(--color-brand-primary), transparent, var(--color-brand-primary-bright))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}
          initial={{ opacity: 0, backgroundPosition: '0% 50%' }}
          animate={{ opacity: 1, backgroundPosition: '100% 50%' }}
          transition={{ duration: 0.8, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
        />
      )}

      <div className="flex justify-between items-start mb-2 relative z-10">
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-container-high">{task.id.substring(0, 6)}</span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${pColor}`}>{task.priority}</span>
      </div>
      <div className="flex justify-between items-center relative z-10">
        <h4 className="text-sm font-medium text-text-strong leading-tight">{task.title}</h4>
        {onTaskComment && (
          <button onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('ember-burst', { detail: { x: e.clientX, y: e.clientY } })); onTaskComment(task.id); }} className="text-muted hover:text-primary pointer-events-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </button>
        )}
      </div>
    </motion.div>
  );
};

const DroppableColumn = ({ col, isOver, children }: { col: Column, isOver: boolean, children: React.ReactNode }) => {
  const { setNodeRef } = useSortable({ id: col.id, data: { type: 'Column', col } });
  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 overflow-y-auto rounded-lg transition-colors duration-500 ${isOver ? 'bg-brand-primary/5' : ''}`} 
      style={{ minHeight: '150px' }}
    >
      {children}
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialColumns, projectId, isAdmin = false, onToggleVisibility, onTaskMove, onTaskComment }) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColId, setOverColId] = useState<string | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    if (!isAdmin) return;
    document.body.setAttribute('data-molten', 'true');
    const { active } = event;
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragOver = (event: any) => {
    if (!isAdmin) return;
    const { active, over } = event;
    if (!over) {
      setOverColId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    // Track over column for glow pulse
    if (isOverColumn) {
      setOverColId(overId);
    } else if (isOverTask) {
      const colId = columns.find(c => c.tasks.some(t => t.id === overId))?.id;
      if (colId) setOverColId(colId);
    }

    if (activeId === overId) return;
    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setColumns((cols) => {
        const activeColIndex = cols.findIndex(c => c.tasks.some(t => t.id === activeId));
        const overColIndex = cols.findIndex(c => c.tasks.some(t => t.id === overId));
        if (activeColIndex === -1 || overColIndex === -1) return cols;

        const newCols = [...cols];
        const activeTaskIndex = newCols[activeColIndex].tasks.findIndex(t => t.id === activeId);
        const overTaskIndex = newCols[overColIndex].tasks.findIndex(t => t.id === overId);

        if (activeColIndex === overColIndex) {
          newCols[activeColIndex] = {
            ...newCols[activeColIndex],
            tasks: arrayMove(newCols[activeColIndex].tasks, activeTaskIndex, overTaskIndex)
          };
        } else {
          const removed = newCols[activeColIndex].tasks[activeTaskIndex];
          const updatedRemoved = { ...removed, columnId: newCols[overColIndex].id };
          newCols[activeColIndex] = {
            ...newCols[activeColIndex],
            tasks: newCols[activeColIndex].tasks.filter(t => t.id !== activeId)
          };
          const newTasks = [...newCols[overColIndex].tasks];
          newTasks.splice(overTaskIndex, 0, updatedRemoved);
          newCols[overColIndex] = {
            ...newCols[overColIndex],
            tasks: newTasks
          };
        }
        return newCols;
      });
    } else if (isActiveTask && isOverColumn) {
      setColumns((cols) => {
        const activeColIndex = cols.findIndex(c => c.tasks.some(t => t.id === activeId));
        const overColIndex = cols.findIndex(c => c.id === overId);
        if (activeColIndex === -1 || overColIndex === -1 || activeColIndex === overColIndex) return cols;

        const newCols = [...cols];
        const activeTaskIndex = newCols[activeColIndex].tasks.findIndex(t => t.id === activeId);
        const removed = newCols[activeColIndex].tasks[activeTaskIndex];
        const updatedRemoved = { ...removed, columnId: newCols[overColIndex].id };

        newCols[activeColIndex] = {
          ...newCols[activeColIndex],
          tasks: newCols[activeColIndex].tasks.filter(t => t.id !== activeId)
        };
        newCols[overColIndex] = {
          ...newCols[overColIndex],
          tasks: [...newCols[overColIndex].tasks, updatedRemoved]
        };
        return newCols;
      });
    }
  };

  const handleDragEnd = (event: any) => {
    if (!isAdmin) return;
    document.body.removeAttribute('data-molten');
    setOverColId(null);
    setActiveTask(null);

    const { active, over } = event;

    // Trigger drop shockwave using the active element's final translated position
    if (active.rect.current.translated) {
      const rect = active.rect.current.translated;
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      window.dispatchEvent(new CustomEvent('ember-burst', { detail: { x, y } }));
    }

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let targetColId = '';
    let newOrder = 0;

    if (over.data.current?.type === 'Column') {
      targetColId = overId;
      const col = columns.find(c => c.id === overId);
      newOrder = col ? col.tasks.length : 0;
    } else {
      const col = columns.find(c => c.tasks.some(t => t.id === overId));
      if (col) {
        targetColId = col.id;
        newOrder = col.tasks.findIndex(t => t.id === overId);
      }
    }

    if (targetColId && onTaskMove) {
      onTaskMove(activeId, targetColId, newOrder);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map(col => (
          <div key={col.id} className="bg-surface-container-low rounded-xl p-4 min-w-[85vw] md:min-w-[300px] flex flex-col base-card border-none shrink-0 h-max relative overflow-hidden">
            {/* Flash column background on drop logic handled by Drop Column background color */}
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="font-bold text-sm tracking-wider uppercase text-text-strong">{col.name}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted bg-surface-container py-0.5 px-2 rounded-full">{col.tasks.length}</span>
                {isAdmin && onToggleVisibility && (
                  <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer hover:text-text-strong transition-colors">
                    <input type="checkbox" checked={col.clientVisible} onChange={() => onToggleVisibility(col.id, col.clientVisible)} className="accent-primary" />
                    Visible
                  </label>
                )}
              </div>
            </div>

            <SortableContext items={col.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn col={col} isOver={overColId === col.id}>
                <AnimatePresence>
                  {col.tasks.map(task => (
                    <SortableTask key={task.id} task={task} isAdmin={isAdmin} onTaskComment={onTaskComment} />
                  ))}
                </AnimatePresence>
              </DroppableColumn>
            </SortableContext>
          </div>
        ))}
        {columns.length === 0 && (
          <div className="text-muted text-sm italic">No visible columns available.</div>
        )}
      </div>

      {isAdmin && (
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeTask ? (
            <motion.div 
              initial={{ scale: 1, rotate: 0 }} 
              animate={{ scale: 1.05, rotate: 3, boxShadow: '0 0 20px rgba(var(--shadow-brand-rgb), 0.4)' }} 
              transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.6 }}
              className="opacity-90"
            >
              <SortableTask task={activeTask} isAdmin={true} />
            </motion.div>
          ) : null}
        </DragOverlay>
      )}
    </DndContext>
  );
};
