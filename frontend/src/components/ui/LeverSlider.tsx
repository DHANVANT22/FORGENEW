"use client";

import React from 'react';

interface LeverSliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  className?: string;
  readoutLabel?: string;
}

export function LeverSlider({ value, onChange, min = 0, max = 100, className = '', readoutLabel, ...props }: LeverSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`relative flex items-center h-12 w-full ${className}`}>
      {/* Hidden native input for a11y & keyboard controls */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={readoutLabel || props['aria-label']}
        {...props}
      />
      
      {/* Track */}
      <div className="absolute inset-x-0 h-4 neu-pressed overflow-hidden flex items-center px-1">
        {/* Tick marks (retro fader) */}
        <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none opacity-20">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="w-[1px] h-2 bg-white" />
          ))}
        </div>
        {/* Fill */}
        <div 
          className="h-2 rounded-full bg-brand-primary opacity-80 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(92,168,201,0.5)]"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Thumb / Fader */}
      <div 
        className="absolute h-8 w-6 neu-button flex items-center justify-center transition-all duration-75 ease-out pointer-events-none z-10"
        style={{ left: `calc(${percent}% - 12px)` }}
      >
        <div className="w-4 h-1 bg-black/80 rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)]" />
      </div>
    </div>
  );
}
