'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clientToken = localStorage.getItem('clientToken');
      const enquiryToken = localStorage.getItem('forge_enquiry_token');
      setHasToken(Boolean(clientToken || enquiryToken));
    }
  }, [pathname]);

  // Hide the global navbar on client dashboard (which has its own enterprise header)
  if (pathname?.startsWith('/client/dashboard')) {
    return null;
  }

  const navLinks = [
    { label: 'Overview', href: '/' },
    { label: 'AI Estimator', href: '/estimator' },
    { label: 'Client Portal', href: hasToken ? '/client/dashboard' : '/client/login' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-3 rounded-2xl bg-[#06080C]/80 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo/haizo-icon.png"
            alt="Haizo Workspace"
            width={32}
            height={32}
            className="w-8 h-8 rounded-xl object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.4)] group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-display font-black text-sm tracking-wider text-white group-hover:text-[#38BDF8] transition-colors">
              HAIZO WORKSPACE
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#38BDF8]">
              Client Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-black/40 border border-white/[0.06] rounded-full p-1 px-2 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wide uppercase transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#5CA8C9] text-black font-extrabold shadow-[0_0_15px_rgba(92,168,201,0.3)]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white px-3.5 py-1.5 transition-colors flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Admin</span>
          </a>

          <Link
            href="/estimator"
            className="bg-[#5CA8C9] hover:bg-[#82C4DE] text-black font-extrabold text-xs uppercase px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(92,168,201,0.4)] hover:shadow-[0_0_25px_rgba(92,168,201,0.7)] active:scale-95 flex items-center gap-1.5 font-mono"
          >
            <span>Start Estimate</span>
            <span className="material-symbols-outlined text-[15px] font-bold">arrow_forward</span>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-[22px]">
            {isMobileOpen ? 'close' : 'menu'}
          </span>
        </button>

      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden absolute top-20 left-4 right-4 p-5 rounded-3xl bg-[#080C12] border border-white/[0.1] shadow-2xl backdrop-blur-2xl flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-xs font-mono uppercase text-white hover:bg-white/[0.05]"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
            <Link
              href="/estimator"
              onClick={() => setIsMobileOpen(false)}
              className="text-center py-3 rounded-xl bg-[#5CA8C9] text-black font-extrabold text-xs uppercase font-mono"
            >
              Start Estimate
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
