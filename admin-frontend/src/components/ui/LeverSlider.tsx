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
      <div className="absolute inset-x-0 h-4 bg-bg-deep rounded-sm shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8),inset_-1px_-1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
        {/* Fill */}
        <div 
          className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-bright transition-all duration-75 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Thumb / Fader */}
      <div 
        className="absolute h-8 w-6 bg-border rounded-sm shadow-[inset_1px_1px_0_rgba(255,255,255,0.1),inset_-1px_-1px_0_rgba(0,0,0,0.4),0_2px_5px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-75 ease-out pointer-events-none z-10"
        style={{ left: `calc(${percent}% - 12px)` }}
      >
        <div className="w-3 h-0.5 bg-bg-deep shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)] opacity-50" />
      </div>
    </div>
  );
}
