'use client';
import React from 'react';
import { motion } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
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
  const baseClasses = 'relative overflow-hidden inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-bright hover:shadow-[0_0_20px_rgba(var(--shadow-brand-rgb), 0.6)] shadow-[0_0_15px_rgba(var(--shadow-brand-rgb), 0.3)] border border-transparent',
    secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest hover:shadow-lg',
    outline: 'border border-outline text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5',
    danger: 'bg-danger text-black hover:opacity-90 hover:shadow-[0_0_20px_rgba(255,138,128,0.5)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-4 text-lg font-bold',
  };

  return (
    <motion.button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      {...(props as any)}
    >
      <motion.div
        className="absolute top-0 bottom-0 w-12 pointer-events-none skew-x-[-20deg]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          left: 0
        }}
        initial={{ x: '-200%', opacity: 0 }}
        variants={{
          hover: {
            x: ['-200%', '400%'],
            opacity: [0, 1, 1, 0],
            transition: { duration: 0.5, ease: 'easeOut' }
          }
        }}
      />
      <span className="relative z-20 pointer-events-none">{children}</span>
    </motion.button>
  );
};
