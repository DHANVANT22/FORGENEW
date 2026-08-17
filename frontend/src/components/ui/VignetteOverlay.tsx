'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const VignetteOverlay = () => {
  const [target, setTarget] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const panel = (e.target as HTMLElement).closest('.group-panel');
      if (panel) {
        const rect = panel.getBoundingClientRect();
        setTarget({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          w: rect.width,
          h: rect.height,
        });
      }
    };
    
    const handleMouseLeave = (e: MouseEvent) => {
      if (!(e.relatedTarget as HTMLElement)?.closest('.group-panel')) {
        setTarget(null);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-300" style={{ opacity: target ? 1 : 0 }}>
      {target && (
        <div 
          className="absolute inset-0 bg-black/40 transition-all duration-300 ease-out"
          style={{
            maskImage: `radial-gradient(ellipse ${target.w * 0.8}px ${target.h * 0.8}px at ${target.x}px ${target.y}px, transparent 40%, black 100%)`,
            WebkitMaskImage: `radial-gradient(ellipse ${target.w * 0.8}px ${target.h * 0.8}px at ${target.x}px ${target.y}px, transparent 40%, black 100%)`
          }}
        />
      )}
    </div>
  );
};
