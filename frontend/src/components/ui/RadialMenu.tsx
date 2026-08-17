'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LedIndicator } from './LedIndicator';

// Global state for radial menu so cursor can read it
export let activeRadialTarget: { x: number, y: number } | null = null;
const gravityListeners = new Set<(target: { x: number, y: number } | null) => void>();

export const useRadialGravity = () => {
  const [target, setTarget] = useState<{ x: number, y: number } | null>(activeRadialTarget);
  useEffect(() => {
    gravityListeners.add(setTarget);
    return () => { gravityListeners.delete(setTarget); };
  }, []);
  return target;
};

const setGravityTarget = (target: { x: number, y: number } | null) => {
  activeRadialTarget = target;
  gravityListeners.forEach(l => l(target));
};

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
  { id: 'projects', label: 'Projects', icon: 'list_alt', path: '/projects' },
  { id: 'simulator', label: 'Risk Simulator', icon: 'tune', path: '/estimator' },
  { id: 'pulse', label: 'Delivery Pulse', icon: 'monitor_heart', path: '/pulse' },
  { id: 'control', label: 'Control Centre', icon: 'terminal', path: '/control-centre/123' },
];

export function RadialMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const router = useRouter();
  
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerKeyRef = useRef(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow normal context menu if shift is held or clicking on an input
      if (e.shiftKey || (e.target as HTMLElement).closest('input, textarea')) return;
      
      e.preventDefault();
      setCenter({ x: e.clientX, y: e.clientY });
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !triggerKeyRef.current) {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        
        triggerKeyRef.current = true;
        setIsOpen(true);
        // We don't have mouse coordinates on keydown, so center on screen or last known
        // For simplicity, we can center on viewport
        setCenter({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        triggerKeyRef.current = false;
        if (isOpen) {
          executeSelection();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2 && isOpen) { // Right click release
        executeSelection();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  const executeSelection = () => {
    if (activeIndex !== null) {
      router.push(MENU_ITEMS[activeIndex].path);
    }
    setIsOpen(false);
    setActiveIndex(null);
    setGravityTarget(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isOpen) return;
    
    // Calculate angle from center to mouse
    const dx = e.clientX - center.x;
    const dy = e.clientY - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Deadzone in the center
    if (distance < 50) {
      setActiveIndex(null);
      setGravityTarget(null);
      return;
    }

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // 5 items = 72 degrees per segment
    // Offset by -90 (top) - half segment (36) = -126 => +234
    // Simplified mapping:
    const segment = 360 / MENU_ITEMS.length;
    // shift angle so 0 is top
    let shiftedAngle = (angle + 90) % 360;
    
    const index = Math.floor(shiftedAngle / segment);
    setActiveIndex(index);
    
    // Set gravity target
    const targetAngle = (index * segment - 90 + (segment/2)) * (Math.PI / 180);
    const radius = 120; // approximate radius of items
    setGravityTarget({
      x: center.x + Math.cos(targetAngle) * radius,
      y: center.y + Math.sin(targetAngle) * radius
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[2147483640] backdrop-blur-[2px] bg-bg/20"
        onMouseMove={handleMouseMove}
        onClick={executeSelection}
        onContextMenu={(e) => { e.preventDefault(); executeSelection(); }}
      >
        <div 
          className="absolute"
          style={{ left: center.x, top: center.y }}
        >
          {/* Hub */}
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-border bg-bg-deep shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center z-10"
          >
            <div className="w-8 h-8 rounded-full border border-border/50 bg-bg"></div>
          </motion.div>

          {/* Segments */}
          {MENU_ITEMS.map((item, i) => {
            const segment = 360 / MENU_ITEMS.length;
            const angle = i * segment - 90 + (segment/2);
            const rad = angle * (Math.PI / 180);
            const radius = 120;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            const isActive = activeIndex === i;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, x, y }}
                transition={{ type: "spring", stiffness: 250, damping: 20, delay: i * 0.02 }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                  isActive 
                    ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(255,179,175,0.2)]' 
                    : 'bg-surface-container border-border/50 opacity-80'
                }`}
                style={{ width: 110 }}
              >
                <LedIndicator status={isActive ? 'active' : 'idle'} />
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'text-text-strong drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-text-muted'}`}>
                  {item.icon}
                </span>
                <span className={`font-mono text-[10px] uppercase tracking-widest text-center ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
