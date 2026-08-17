'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAudio } from '@/components/ui/AudioProvider';
import { setCursorState } from '@/components/ui/VortexCursor';

export function TransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const { playWarp } = useAudio();

  useEffect(() => {
    if (!shouldReduceMotion) {
      playWarp();
      setCursorState('idle'); 
    }
  }, [pathname, shouldReduceMotion, playWarp]);

  if (shouldReduceMotion) {
    return <div className="min-h-full w-full flex flex-col">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname} // unique per route — this is what lets AnimatePresence detect a real change
        initial={{ clipPath: 'inset(50% 0% 50% 0%)', opacity: 0 }}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
        exit={{ clipPath: 'inset(50% 0% 50% 0%)', opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.65, 0, 0.35, 1] }}
        className="min-h-full w-full flex flex-col origin-center relative z-[var(--z-warp)]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
