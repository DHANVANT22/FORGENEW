"use client";

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface ReadoutNumberProps {
  value: number;
  className?: string;
}

export function ReadoutNumber({ value, className = '' }: ReadoutNumberProps) {
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });
  const displayValue = useTransform(springValue, (current) => Math.round(current));

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  return (
    <motion.span className={`font-[family-name:var(--font-mono-readout)] ${className}`}>
      {displayValue}
    </motion.span>
  );
}
