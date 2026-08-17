import React from 'react';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

export function StatusChip({ label, variant = 'default', className = '' }: { label: React.ReactNode, variant?: StatusVariant, className?: string }) {
  const colors = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    default: 'bg-surface-container text-text-muted border-border'
  };
  
  const dotColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-primary',
    default: 'bg-text-muted'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium ${colors[variant]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      {label}
    </div>
  );
}
