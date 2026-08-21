import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', interactive = false, ...props }) => {
  const baseClasses = interactive 
    ? "neu-panel hover:-translate-y-1 p-6" 
    : "neu-panel p-6";
  
  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

