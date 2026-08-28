'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export function SidebarNav() {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const name = localStorage.getItem('adminName');
    if (name) {
      setAdminName(name);
    }
  }, []);

  // Minimize sidebar when user clicks outside sidebar or performs action on website
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (isPinned) return;
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [isPinned]);

  // Minimize sidebar on route change unless pinned
  useEffect(() => {
    if (!isPinned) {
      setIsCollapsed(true);
      setIsHovered(false);
    }
  }, [pathname, isPinned]);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'Enquiries', href: '/enquiries', icon: 'forum' },
    { name: 'Clients', href: '/clients', icon: 'group' },
    { name: 'Projects', href: '/projects', icon: 'folder' },
    { name: 'Estimates', href: '/estimates', icon: 'receipt_long' },
    { name: 'Risk Simulator', href: '/estimator', icon: 'psychology' },
    { name: 'Delivery Pulse', href: '/pulse', icon: 'monitor_heart' },
    { name: 'Control Centre', href: '/control-centre', icon: 'admin_panel_settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    window.location.href = '/login';
  };

  const effectiveCollapsed = isPinned ? false : (isCollapsed && !isHovered);

  return (
    <aside 
      ref={sidebarRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-[#06080C]/95 border-r border-white/[0.08] flex flex-col z-40 transition-all duration-300 ease-in-out backdrop-blur-2xl shadow-[5px_0_30px_rgba(0,0,0,0.5)] ${
        effectiveCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`p-5 border-b border-white/[0.08] flex items-center ${effectiveCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!effectiveCollapsed ? (
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo/haizo-icon.png"
              alt="Haizo Workspace"
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.4)] shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-display font-black text-sm tracking-wider text-white group-hover:text-[#38BDF8] transition-colors truncate">
                HAIZO WORKSPACE
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#38BDF8] truncate">
                Ops Console
              </span>
            </div>
          </Link>
        ) : (
          <Image
            src="/logo/haizo-icon.png"
            alt="Haizo Workspace"
            width={32}
            height={32}
            className="w-8 h-8 rounded-xl object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.4)] shrink-0"
          />
        )}

        {!effectiveCollapsed && (
          <button 
            onClick={() => {
              setIsPinned(!isPinned);
              if (isPinned) setIsCollapsed(true);
            }} 
            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
              isPinned ? 'text-[#38BDF8] bg-[#38BDF8]/20 border border-[#38BDF8]/40' : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            title={isPinned ? "Unpin Sidebar (Auto-Minimize)" : "Pin Sidebar Always Open"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPinned ? 'push_pin' : 'keep'}
            </span>
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex flex-col flex-1 overflow-hidden p-3 gap-1">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 px-3 py-2 ${effectiveCollapsed ? 'text-center' : ''}`}>
          {effectiveCollapsed ? '•' : 'Navigation'}
        </span>

        <nav className="flex-1 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (!isPinned) setIsCollapsed(true);
                }}
                className={`
                  relative flex items-center px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 group
                  ${isActive 
                    ? 'bg-[#38BDF8]/15 text-white font-bold border border-[#38BDF8]/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }
                `}
                title={effectiveCollapsed ? item.name : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-glow"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#38BDF8] rounded-r-full shadow-[0_0_10px_#38BDF8]"
                  />
                )}
                
                <div className={`flex items-center gap-3 w-full ${effectiveCollapsed ? 'justify-center' : ''}`}>
                  <span 
                    className={`material-symbols-outlined text-[20px] transition-colors shrink-0 ${
                      isActive ? 'text-[#38BDF8]' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!effectiveCollapsed && <span className="truncate whitespace-nowrap">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className="pt-3 border-t border-white/[0.08] mt-auto">
          <div className={`p-2.5 rounded-2xl bg-black/60 border border-white/[0.06] flex items-center ${effectiveCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!effectiveCollapsed && (
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate font-display">
                    {adminName || 'Super Admin'}
                  </span>
                  <span className="block text-[10px] font-mono text-emerald-400">
                    ● Online
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all shrink-0"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

