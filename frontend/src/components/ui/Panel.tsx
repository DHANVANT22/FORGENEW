import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  withRivets?: boolean;
  interactive?: boolean;
}

export function Panel({ children, className = '', withRivets = false, interactive = false, ...props }: PanelProps) {
  return (
    <div
      className={`neu-panel group-panel transition-all ${interactive ? 'hover:-translate-y-0.5' : ''} ${className}`}
      {...props}
    >
      {withRivets && (
        <>
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-dotted border-white/20 opacity-50 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.8)] rounded-tl-[2px] pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-dotted border-white/20 opacity-50 shadow-[inset_-1px_1px_1px_rgba(0,0,0,0.8)] rounded-tr-[2px] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-dotted border-white/20 opacity-50 shadow-[inset_1px_-1px_1px_rgba(0,0,0,0.8)] rounded-bl-[2px] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-dotted border-white/20 opacity-50 shadow-[inset_-1px_-1px_1px_rgba(0,0,0,0.8)] rounded-br-[2px] pointer-events-none" />
        </>
      )}
      {children}
    </div>
  );
}
