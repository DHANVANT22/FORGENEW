'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandPaletteHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if we've shown it this session
    const hasSeenHint = sessionStorage.getItem('forge_cmd_hint');
    if (!hasSeenHint) {
      // Small delay before showing
      const showTimer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      
      // Auto-hide after 8 seconds
      const hideTimer = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem('forge_cmd_hint', 'true');
      }, 9500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute top-20 right-6 z-[var(--z-chrome)] bg-surface-container border border-border rounded-lg shadow-lg p-3 flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-primary text-xl">terminal</span>
          <div className="text-sm text-text-strong font-mono">
            Press <kbd className="px-1.5 py-0.5 bg-bg-deep border border-border rounded shadow-sm mx-1">Cmd/Ctrl + K</kbd> to open command palette
          </div>
          <button 
            onClick={() => {
              setVisible(false);
              sessionStorage.setItem('forge_cmd_hint', 'true');
            }} 
            className="ml-2 text-text-muted hover:text-text-strong transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
