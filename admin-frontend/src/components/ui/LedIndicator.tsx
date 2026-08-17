import React from 'react';

interface LedIndicatorProps {
  status?: 'active' | 'warning' | 'critical' | 'idle';
  className?: string;
}

export function LedIndicator({ status = 'idle', className = '' }: LedIndicatorProps) {
  const getStatusClasses = () => {
    switch (status) {
      case 'active':
        return 'bg-[var(--color-led-active)] shadow-[0_0_8px_var(--color-led-active)] animate-pulse';
      case 'warning':
        return 'bg-[var(--color-led-warning)] shadow-[0_0_8px_var(--color-led-warning)]';
      case 'critical':
        return 'bg-[var(--color-led-critical)] shadow-[0_0_8px_var(--color-led-critical)]';
      case 'idle':
      default:
        return 'bg-border';
    }
  };

  return (
    <div
      className={`w-2 h-2 rounded-full transition-colors duration-300 ${getStatusClasses()} ${className}`}
      aria-hidden="true"
    />
  );
}
