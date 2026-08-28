'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LedIndicator } from './LedIndicator';

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
    { name: 'Dashboard', href: '/', icon: 'grid_view' },
    { name: 'Projects', href: '/projects', icon: 'folder_open' },
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
      className={`bg-surface-container border-r border-border flex flex-col z-10 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className={`p-6 border-b border-border font-display font-bold text-lg text-brand-primary-bright flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <span>Haizo Workspace</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-text-muted hover:text-text-strong transition-colors"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isCollapsed ? 'menu_open' : 'menu_open'}
          </span>
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden relative">
        <nav 
          className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2 mt-1"
          style={{ maskImage: 'linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent 100%)' }}
        >
          <div className="py-4 flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center px-3 py-3 rounded-[4px] text-sm font-medium transition-colors duration-200 h-[48px] shrink-0 z-10
                    shadow-[inset_1px_1px_0_var(--color-panel-bezel-light),inset_-1px_-1px_0_var(--color-panel-bezel-dark),0_2px_4px_rgba(0,0,0,0.2)]
                    ${isActive ? 'text-text-strong' : 'text-text-muted hover:text-text-strong'}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 bg-white/5 rounded-[4px] z-[-1]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 border border-transparent hover:bg-white/5 rounded-[4px] z-[-1] transition-colors duration-150 opacity-0 hover:opacity-100" />
                  )}
                  
                  <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : ''}`}>
                    <LedIndicator status={isActive ? 'active' : 'idle'} className="shrink-0" />
                    <span 
                      className="material-symbols-outlined text-[18px] shrink-0"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate tracking-wide font-mono text-xs uppercase">{item.name}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {adminName && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-auto p-4 border-t border-border shrink-0 bg-surface-container flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}
          >
            <div className="flex items-center gap-3 group/profile">
              <div className="w-9 h-9 rounded-full bg-brand-primary-bright/20 flex items-center justify-center text-brand-primary-bright font-bold shadow-[0_0_8px_rgba(var(--shadow-brand-rgb), 0.3)] shrink-0 font-mono">
                {adminName.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-mono text-text-strong truncate max-w-[120px]">{adminName}</span>
                  <span className="text-[10px] uppercase font-mono text-text-muted tracking-widest">Admin</span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button 
                onClick={handleLogout}
                className="text-text-muted hover:text-brand-primary-bright transition-colors p-2"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            )}
          </motion.div>
        )}
      </div>
    </aside>
  );
}
