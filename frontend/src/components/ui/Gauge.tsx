"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
  value: number; // 0 to 100
  label?: string;
  className?: string;
}

export function Gauge({ value, label, className = '' }: GaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  // Needle rotation: -90deg is 0, 90deg is 100
  const rotation = (clampedValue / 100) * 180 - 90;

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Semi-circle background */}
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[8px] border-border border-b-transparent border-l-transparent -rotate-45 box-border" />
        
        {/* Ticks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickRot = (tick / 100) * 180 - 90;
          return (
            <div 
              key={tick} 
              className="absolute bottom-0 left-1/2 w-0.5 h-16 origin-bottom -translate-x-1/2"
              style={{ transform: `translateX(-50%) rotate(${tickRot}deg)` }}
            >
              <div className="w-0.5 h-2 bg-text-muted opacity-50" />
            </div>
          );
        })}

        {/* Needle */}
        <motion.div
          className="absolute bottom-0 left-1/2 w-1 h-14 bg-brand-primary-bright origin-bottom rounded-t-full shadow-[0_0_6px_rgba(var(--shadow-brand-rgb), 0.6)]"
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 60, damping: 12 }}
          style={{ x: "-50%" }}
        />
        
        {/* Center dot */}
        <div className="absolute bottom-[-6px] left-1/2 w-4 h-4 bg-border rounded-full transform -translate-x-1/2 shadow-[inset_1px_1px_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.5)] z-10" />
      </div>

      <div className="mt-2 flex flex-col items-center">
        <span className="text-xl font-[family-name:var(--font-mono-readout)] text-text-strong tracking-wider leading-none">
          {Math.round(clampedValue)}
        </span>
        {label && (
          <span className="text-xs text-text-muted uppercase tracking-widest mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
