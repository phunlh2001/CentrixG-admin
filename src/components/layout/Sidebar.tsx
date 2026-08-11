import React from 'react';
import { LayoutDashboard, Package, FolderKanban, FileText, Users, Newspaper, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'overview' | 'products' | 'categories' | 'bills' | 'accounts' | 'blog';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderKanban },
    { id: 'bills', label: 'Bills Management', icon: FileText },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'blog', label: 'Blog & News', icon: Newspaper },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-base">Centrix Admin</h1>
            <span className="text-[11px] text-slate-400 font-medium">Rental Games Hub</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Management Core
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as TabType)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all text-left",
                  isActive
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100">
        <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3 text-xs">
          <div className="flex items-center justify-between text-slate-600 font-medium">
            <span>System Node</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Centrix Steam API v2.4</p>
        </div>
      </div>
    </aside>
  );
};
