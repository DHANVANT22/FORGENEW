import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  withRivets?: boolean;
  interactive?: boolean;
}

export function Panel({ children, className = '', withRivets = false, interactive = false, ...props }: PanelProps) {
  return (
    <div
      className={`group-panel relative bg-card rounded-[6px] transition-all shadow-[inset_1px_1px_0_var(--color-panel-bezel-light),inset_-1px_-1px_0_var(--color-panel-bezel-dark),0_4px_12px_rgba(0,0,0,0.3)] ${interactive ? 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),var(--shadow-glow-red)] hover:border-brand-primary-bright/50' : ''} ${className}`}
      {...props}
    >
      {withRivets && (
        <>
          <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-border shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.1)]"></div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-border shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.1)]"></div>
          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-border shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.1)]"></div>
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-border shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.1)]"></div>
        </>
      )}
      {children}
    </div>
  );
}
