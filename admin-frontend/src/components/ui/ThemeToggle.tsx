"use client";

import { useEffect } from 'react';

export function ThemeToggle() {
  useEffect(() => {
    // Read from local storage if exists
    const storedTheme = localStorage.getItem('forge-theme');
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle theme with Cmd/Ctrl + Shift + T
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'copper';
        const themes = ['copper', 'verdigris', 'noir'];
        const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
        const newTheme = themes[nextIndex];
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('forge-theme', newTheme);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
