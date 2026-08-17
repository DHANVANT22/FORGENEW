'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadialGravity } from './RadialMenu';

// Global cursor state manager
export type CursorState = 'idle' | 'precision' | 'busy';

let currentCursorState: CursorState = 'idle';
const cursorListeners = new Set<(state: CursorState) => void>();

export const setCursorState = (state: CursorState) => {
  currentCursorState = state;
  cursorListeners.forEach(l => l(state));
};

export function useCursorState() {
  const [state, setState] = useState<CursorState>(currentCursorState);
  useEffect(() => {
    cursorListeners.add(setState);
    return () => { cursorListeners.delete(setState); };
  }, []);
  return [state, setCursorState] as const;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  life: number;
}

const TRAIL_LENGTH = 14;

function VortexCore({ size = 28, state }: { size?: number; state: CursorState }) {
  const arms = 6;
  
  let containerClasses = "vortex-core-container";
  if (state === 'precision') containerClasses += " precision";
  if (state === 'busy') containerClasses += " busy";

  return (
    <div className={containerClasses} style={{ width: size, height: size, position: 'relative' }}>
      {/* Counter-rotating faint ring for busy state */}
      <div className="vortex-busy-ring" style={{
         position: 'absolute', inset: -8, borderRadius: '50%',
         border: '2px dashed var(--color-brand-primary-bright)',
         opacity: state === 'busy' ? 0.3 : 0,
         transition: 'opacity 0.2s ease',
         animation: 'vortex-spin-reverse 1.2s linear infinite'
      }} />
      
      {/* Main spinning SVG - two layer glow */}
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }} className="vortex-svg">
        <defs>
          <radialGradient id="vortex-outer-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vortex-inner-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-text-strong)" stopOpacity="1" />
            <stop offset="40%" stopColor="var(--color-brand-primary-bright)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-brand-primary-bright)" stopOpacity="0" />
          </radialGradient>
          <filter id="vortex-blur-outer" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
          <filter id="vortex-blur-inner" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.0" />
          </filter>
        </defs>
        
        {/* Outer Soft Glow */}
        {Array.from({ length: arms }).map((_, i) => {
          const rotation = (360 / arms) * i;
          return (
            <path
              key={`outer-${i}`}
              d="M50,50 C58,35 72,28 85,15 C70,28 58,42 50,50 Z"
              fill="url(#vortex-outer-glow)"
              opacity={0.6}
              filter="url(#vortex-blur-outer)"
              transform={`rotate(${rotation} 50 50)`}
            />
          );
        })}

        {/* Inner Bright Glow */}
        {Array.from({ length: arms }).map((_, i) => {
          const rotation = (360 / arms) * i;
          return (
            <path
              key={`inner-${i}`}
              d="M50,50 C55,40 65,35 72,25 C62,35 55,42 50,50 Z"
              fill="url(#vortex-inner-glow)"
              opacity={0.95}
              filter="url(#vortex-blur-inner)"
              transform={`rotate(${rotation} 50 50)`}
            />
          );
        })}

        <circle cx="50" cy="50" r="5" fill="var(--color-text-strong)" filter="url(#vortex-blur-inner)" />
      </svg>
    </div>
  );
}

export function VortexCursor() {
  const [mounted, setMounted] = useState(false);
  const coreRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [isClicked, setIsClicked] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cursorState] = useCursorState();
  const gravityTarget = useRadialGravity();
  
  const particleId = useRef(0);
  
  const isHovering = useRef(false);
  const history = useRef(Array(TRAIL_LENGTH).fill({ x: -100, y: -100 }));
  const vel = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: -100, y: -100 });
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!mediaQuery.matches || shouldReduceMotion) return;

    setMounted(true);
    document.documentElement.classList.add('vortex-cursor-active');

    let rafId: number;
    let rawX = -100;
    let rawY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      rawX = e.clientX;
      rawY = e.clientY;
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    const handleClick = (e: MouseEvent) => {
      setParticles(prev => [...prev, {
        id: particleId.current++,
        x: e.clientX,
        y: e.clientY,
        angle: 0,
        speed: 0,
        life: 2.0 
      }]);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, [role="button"], [data-dnd-sortable="true"], .hover-target, input, textarea');
      isHovering.current = !!interactive;
      
      if (currentCursorState !== 'busy') {
         setCursorState(interactive ? 'precision' : 'idle');
      }
    };
    
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        isHovering.current = false;
        if (currentCursorState !== 'busy') {
           setCursorState('idle');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleClick);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    const loop = () => {
      let targetX = rawX;
      let targetY = rawY;

      // Apply Gravity
      if (gravityTarget) {
        // smooth pull towards gravityTarget
        const dx = gravityTarget.x - rawX;
        const dy = gravityTarget.y - rawY;
        targetX = rawX + dx * 0.4;
        targetY = rawY + dy * 0.4;
      }

      const dx = targetX - pos.current.x;
      const dy = targetY - pos.current.y;
      
      vel.current.x = dx;
      vel.current.y = dy;
      
      pos.current.x = targetX;
      pos.current.y = targetY;

      history.current.unshift({ x: targetX, y: targetY });
      history.current.pop();
      
      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      }
      
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
        glowRef.current.style.opacity = isHovering.current ? '1' : '0';
      }

      const speed = Math.sqrt(dx * dx + dy * dy);
      const stretch = Math.min(Math.max(speed / 15, 0.3), 3.0); 

      trailRefs.current.forEach((ref, index) => {
        if (!ref) return;
        const historyIndex = Math.min(Math.floor(index * stretch), TRAIL_LENGTH - 1);
        const pt = history.current[historyIndex];
        
        const dotScale = 1 - (index / (TRAIL_LENGTH - 1));
        // Match outer glow color and opacity scale
        const baseOpacity = 0.6; 
        const opacity = (1 - (index / (TRAIL_LENGTH - 1))) * baseOpacity;
        
        ref.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%) scale(${dotScale})`;
        ref.style.opacity = opacity.toString();
      });
      
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove('vortex-cursor-active');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [gravityTarget]);
  
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            life: p.life - 0.04
          }))
          .filter(p => p.life > 0)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (cursorState === 'busy') return;
    setCursorState(isHovering.current ? 'precision' : 'idle');
  }, [cursorState]);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[2147483647] overflow-hidden">
      
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={`trail-${i}`}
          ref={el => { trailRefs.current[i] = el; }}
          className="absolute origin-center rounded-full"
          style={{
            left: 0, top: 0,
            width: 14,
            height: 14,
            backgroundColor: 'var(--color-brand-primary)',
            filter: 'blur(2px)',
            willChange: 'transform, opacity'
          }}
        />
      ))}

      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full border border-brand-primary"
            initial={{ width: 0, height: 0, opacity: 1, x: p.x, y: p.y, translateX: '-50%', translateY: '-50%' }}
            animate={{ width: 60, height: 60, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      <div
        ref={glowRef}
        className="absolute origin-center rounded-full transition-opacity duration-300"
        style={{
          left: 0, top: 0,
          width: 80,
          height: 80,
          background: 'radial-gradient(circle, rgba(var(--shadow-brand-rgb), 0.15) 0%, transparent 70%)',
          willChange: 'transform, opacity',
          opacity: 0
        }}
      />

      {/* Wrapper tracking pointer exactly, no lag */}
      <div
        ref={coreRef}
        data-testid="vortex-cursor-core"
        className="absolute origin-center transition-opacity duration-200"
        style={{ left: 0, top: 0, willChange: 'transform', opacity: cursorState === 'idle' && !isHovering.current ? 0.7 : 1 }}
      >
        {/* Inner container applying the click spring scale independently */}
        <div 
          style={{ 
            transform: `scale(${isClicked ? 0.6 : 1})`, 
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
          }}
        >
          <VortexCore size={40} state={cursorState} />
        </div>
      </div>
      
    </div>,
    document.body
  );
}
