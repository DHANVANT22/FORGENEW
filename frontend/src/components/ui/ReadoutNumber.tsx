"use client";

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface ReadoutNumberProps {
  value: number | string;
  className?: string;
}

export function ReadoutNumber({ value, className = '' }: ReadoutNumberProps) {
  const isNumeric = typeof value === 'number';
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });
  const displayValue = useTransform(springValue, (current) => Math.round(current));

  useEffect(() => {
    if (isNumeric) {
      springValue.set(value as number);
    }
  }, [value, isNumeric, springValue]);

  return (
    <motion.span className={`font-[family-name:var(--font-mono-readout)] ${className}`}>
      {isNumeric ? displayValue : value}
    </motion.span>
  );
}
