'use client';

import React, { useEffect } from 'react';

export const CopyButtonScript = () => {
  useEffect(() => {
    // Find all <pre> elements that don't have a copy button yet
    const pres = document.querySelectorAll('pre:not(.has-copy-btn)');
    
    pres.forEach((pre) => {
      // Mark as processed
      pre.classList.add('has-copy-btn');
      
      // Ensure the pre has relative positioning so the absolute button aligns correctly
      (pre as HTMLElement).style.position = 'relative';
      
      const btn = document.createElement('button');
      btn.innerText = 'Copy';
      btn.className = 'absolute top-2 right-2 px-3 py-1 bg-surface-container border border-border rounded text-xs text-on-surface-variant hover:text-on-surface hover:border-primary transition-colors font-mono opacity-0 group-hover:opacity-100 focus:opacity-100';
      
      pre.classList.add('group');
      pre.appendChild(btn);
      
      btn.addEventListener('click', () => {
        // Find code element inside or use pre text
        const code = pre.querySelector('code');
        const textToCopy = code ? (code as HTMLElement).innerText : (pre as HTMLElement).innerText.replace('Copy', '').trim();
        
        navigator.clipboard.writeText(textToCopy).then(() => {
          btn.innerText = 'Copied!';
          btn.classList.add('text-primary', 'border-primary');
          setTimeout(() => {
            btn.innerText = 'Copy';
            btn.classList.remove('text-primary', 'border-primary');
          }, 2000);
        });
      });
    });
  }, []);

  return null;
};
