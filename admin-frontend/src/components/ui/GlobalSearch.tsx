'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ projects: any[], clients: any[], blogs: any[] } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': 'Bearer ADMIN_DEMO_TOKEN' }
          });
          if (res.ok) {
            const data = await res.json();
            setResults(data);
            setIsOpen(true);
          }
        } catch (e) {
          console.error('Search failed', e);
        }
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalResults = results ? results.projects.length + results.clients.length + results.blogs.length : 0;

  return (
    <div ref={wrapperRef} className="relative z-50 w-full max-w-md">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl">search</span>
        <input 
          type="text" 
          placeholder="Search projects, clients, blogs..." 
          className="w-full bg-surface-container border border-border/50 text-on-surface placeholder:text-muted rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
        />
      </div>

      {isOpen && results && (
        <div className="absolute top-full mt-2 w-full bg-surface-container border border-border rounded-xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto">
          {totalResults === 0 ? (
            <div className="p-4 text-center text-sm text-muted">No results found for "{query}"</div>
          ) : (
            <div className="p-2 space-y-4">
              {results.projects.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant px-2 mb-1">Projects</h4>
                  {results.projects.map(p => (
                    <Link key={p.id} href={`/projects/${p.id}`} onClick={() => setIsOpen(false)}>
                      <div className="px-3 py-2 rounded hover:bg-white/5 cursor-pointer flex flex-col">
                        <span className="text-sm font-medium text-on-surface">{p.name}</span>
                        <span className="text-xs text-muted">{p.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.clients.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant px-2 mb-1">Clients</h4>
                  {results.clients.map(c => (
                    <Link key={c.id} href={`/clients`} onClick={() => setIsOpen(false)}>
                      <div className="px-3 py-2 rounded hover:bg-white/5 cursor-pointer flex flex-col">
                        <span className="text-sm font-medium text-on-surface">{c.email}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.blogs.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant px-2 mb-1">Blog Posts</h4>
                  {results.blogs.map(b => (
                    <Link key={b.id} href={`/blog`} onClick={() => setIsOpen(false)}>
                      <div className="px-3 py-2 rounded hover:bg-white/5 cursor-pointer flex flex-col">
                        <span className="text-sm font-medium text-on-surface">{b.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
