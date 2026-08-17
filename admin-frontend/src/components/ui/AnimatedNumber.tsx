'use client';
import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export const AnimatedNumber = ({ value, duration = 1.5, className = '' }: { value: number, duration?: number, className?: string }) => {
  const [mounted, setMounted] = useState(false);
  const spring = useSpring(0, { stiffness: 50, damping: 20, mass: 1 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    setMounted(true);
    spring.set(value);
  }, [value, spring]);

  if (!mounted) return <span className={className}>{value.toLocaleString()}</span>;

  return <motion.span className={className}>{display}</motion.span>;
};
