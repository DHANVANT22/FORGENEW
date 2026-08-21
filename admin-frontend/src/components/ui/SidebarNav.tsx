'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function SidebarNav() {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('adminName');
    if (name) {
      setAdminName(name);
    }
  }, []);

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

  return (
    <aside 
      className={`bg-[#06080C]/90 border-r border-white/[0.08] flex flex-col z-30 transition-all duration-300 backdrop-blur-2xl ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div className={`p-5 border-b border-white/[0.08] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5CA8C9] to-[#2E6B87] flex items-center justify-center text-black font-black text-xs font-mono shadow-[0_0_15px_rgba(92,168,201,0.4)]">
              F2
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-wider text-white group-hover:text-[#82C4DE] transition-colors">
                FORGE OPS
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#82C4DE]">
                Management Hub
              </span>
            </div>
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5CA8C9] to-[#2E6B87] flex items-center justify-center text-black font-black text-xs font-mono shadow-[0_0_15px_rgba(92,168,201,0.4)]">
            F2
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isCollapsed ? 'menu_open' : 'menu_open'}
          </span>
        </button>
      </div>

      {/* Nav List */}
      <div className="flex flex-col flex-1 overflow-hidden p-3 gap-1">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 px-3 py-2 ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? '•' : 'Navigation'}
        </span>

        <nav className="flex-1 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 group
                  ${isActive 
                    ? 'neu-pressed text-white font-bold border border-transparent' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-glow"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#5CA8C9] rounded-r-full shadow-[0_0_10px_#5CA8C9]"
                  />
                )}
                
                <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : ''}`}>
                  <span 
                    className={`material-symbols-outlined text-[20px] transition-colors ${
                      isActive ? 'text-[#82C4DE]' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className="pt-3 border-t border-white/[0.08] mt-auto">
          <div className={`p-2.5 rounded-2xl bg-black/60 border border-white/[0.06] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-full bg-[#5CA8C9]/20 border border-[#5CA8C9]/40 text-[#82C4DE] flex items-center justify-center font-mono font-bold text-xs shrink-0">
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
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all"
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
