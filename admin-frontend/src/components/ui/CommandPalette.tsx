"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ projects: any[], clients: any[], blogs: any[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
          const res = await fetch(`${apiUrl}/api/v1/admin/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
          });
          if (res.ok) {
            const data = await res.json();
            setResults(data);
          }
        } catch (e) {
          console.error('Search failed', e);
        }
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const totalResults = results ? results.projects.length + results.clients.length + results.blogs.length : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-xl bg-bg-deep border border-border shadow-[0_0_40px_rgba(var(--shadow-brand-rgb), 0.15)] rounded-lg overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle scanline inside palette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, transparent 50%, var(--color-scanline) 51%)`, backgroundSize: '100% 4px' }} />

        <div className="relative p-4 border-b border-border flex items-center">
          <span className="text-brand-primary-bright mr-3 font-mono">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-text-strong font-[family-name:var(--font-mono-readout)] placeholder:text-text-muted focus:outline-none text-lg"
            placeholder="Search projects, clients, pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="relative max-h-[60vh] overflow-y-auto p-2">
          {!query && (
             <div className="p-4 text-center text-sm font-mono text-text-muted">Type to search...</div>
          )}
          {query && totalResults === 0 && (
            <div className="p-4 text-center text-sm font-mono text-text-muted">No results found for "{query}"</div>
          )}
          {results && totalResults > 0 && (
            <div className="space-y-4">
              {results.projects.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted px-3 py-1">Projects</h4>
                  {results.projects.map(p => (
                    <Link key={p.id} href={`/projects/${p.id}`} onClick={() => setIsOpen(false)}>
                      <div className="px-4 py-2 hover:bg-white/5 cursor-pointer flex flex-col font-mono text-sm">
                        <span className="text-text-strong">{p.name}</span>
                        <span className="text-xs text-text-muted">{p.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {results.clients.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted px-3 py-1">Clients</h4>
                  {results.clients.map(c => (
                    <Link key={c.id} href={`/clients`} onClick={() => setIsOpen(false)}>
                      <div className="px-4 py-2 hover:bg-white/5 cursor-pointer font-mono text-sm text-text-strong">
                        {c.email}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {results.blogs.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted px-3 py-1">Pages</h4>
                  {results.blogs.map(b => (
                    <Link key={b.id} href={`/blog`} onClick={() => setIsOpen(false)}>
                      <div className="px-4 py-2 hover:bg-white/5 cursor-pointer font-mono text-sm text-text-strong">
                        {b.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-border flex justify-between items-center text-xs font-mono text-text-muted relative">
          <span><kbd className="px-1.5 py-0.5 bg-border rounded text-text-strong">Enter</kbd> to select</span>
          <span><kbd className="px-1.5 py-0.5 bg-border rounded text-text-strong">Esc</kbd> to close</span>
        </div>
      </div>
      
      {/* Click outside backdrop handler */}
      <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />
    </div>
  );
}
