'use client';
import React, { useEffect } from 'react';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function ScanlineOverlay() {
  const shouldReduceMotion = useReducedMotion();
  const mouseY = useMotionValue(0);
  const smoothY = useSpring(mouseY, { damping: 30, stiffness: 100, mass: 1 });
  const parallaxY = useTransform(smoothY, [-1, 1], [-8, 8]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseY.set(ny);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [shouldReduceMotion, mouseY]);

  return (
    <motion.div 
      className="fixed inset-[-20px] pointer-events-none z-[9999]"
      style={{
        background: `linear-gradient(to bottom, transparent 50%, var(--color-scanline, rgba(0,0,0,0.15)) 51%)`,
        backgroundSize: '100% 4px',
        y: shouldReduceMotion ? 0 : parallaxY
      }}
      aria-hidden="true"
    />
  );
}
