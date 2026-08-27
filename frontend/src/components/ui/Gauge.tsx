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

  // Determine risk band color and text label
  let strokeColor = '#34D399'; // Green (Low Risk)
  let riskBandLabel = 'LOW RISK';

  if (clampedValue > 35 && clampedValue <= 69) {
    strokeColor = '#FBBF24'; // Amber (Medium Risk)
    riskBandLabel = 'MEDIUM RISK';
  } else if (clampedValue > 69) {
    strokeColor = '#F87171'; // Red (High Risk)
    riskBandLabel = 'HIGH RISK';
  }

  // SVG Radial Arc calculation
  // Radius R = 65, Center X = 90, Center Y = 80
  const radius = 65;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // Half circle arc length (~204.2)
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 card-level-1 ${className}`}>
      <div className="relative w-48 h-28 flex justify-center overflow-hidden">
        <svg viewBox="0 0 180 100" className="w-full h-full">
          {/* Background Track Arc */}
          <path
            d="M 25 85 A 65 65 0 0 1 155 85"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Value Progress Arc */}
          <motion.path
            d="M 25 85 A 65 65 0 0 1 155 85"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          
          {/* Ticks around arc */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angleDeg = -180 + (tick / 100) * 180;
            const angleRad = (angleDeg * Math.PI) / 180;
            const innerR = radius - 12;
            const outerR = radius - 6;
            const x1 = 90 + innerR * Math.cos(angleRad);
            const y1 = 85 + innerR * Math.sin(angleRad);
            const x2 = 90 + outerR * Math.cos(angleRad);
            const y2 = 85 + outerR * Math.sin(angleRad);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        {/* Dynamic Needle */}
        <motion.div
          className="absolute bottom-4 left-1/2 w-0.5 h-14 bg-slate-200 origin-bottom shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 50, damping: 14 }}
          style={{ x: "-50%" }}
        >
          <div className="w-2 h-2 -translate-x-[3px] -translate-y-1 bg-slate-100 rounded-full" />
        </motion.div>
        
        {/* Center Pivot Dot */}
        <div className="absolute bottom-2 left-1/2 w-4 h-4 bg-slate-900 border-2 border-slate-400 rounded-full -translate-x-1/2 z-10" />
      </div>

      {/* Numerical Readout & Label */}
      <div className="flex flex-col items-center mt-1">
        <span className="text-3xl font-mono font-bold text-slate-100 tracking-tight leading-none">
          {Math.round(clampedValue)}
        </span>
        <span 
          className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 mt-2 rounded-full border"
          style={{ 
            color: strokeColor, 
            borderColor: `${strokeColor}40`,
            backgroundColor: `${strokeColor}10` 
          }}
        >
          {label || riskBandLabel}
        </span>
      </div>
    </div>
  );
}
