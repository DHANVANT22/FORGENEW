import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', interactive = false }) => {
  const baseClasses = interactive 
    ? "base-card p-6 rounded-2xl" 
    : "bg-card-bg border border-border rounded-2xl p-6 shadow-card";
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};
