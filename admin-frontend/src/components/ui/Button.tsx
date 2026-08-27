'use client';
import React from 'react';
import { motion } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '',
  children, 
  ...props 
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-bold tracking-wider transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 leading-none select-none max-w-full';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'bg-rose-500 text-slate-950 font-bold hover:bg-rose-400 border-none shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[32px]',
    md: 'px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl min-h-[40px]',
    lg: 'px-6 py-3.5 text-xs font-mono font-extrabold uppercase tracking-widest rounded-xl min-h-[48px]',
  };

  return (
    <motion.button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ translateY: -1 }}
      whileTap={{ scale: 0.98 }}
      {...(props as any)}
    >
      <span className="relative z-10 inline-flex items-center gap-2 max-w-full truncate">{children}</span>
    </motion.button>
  );
};

