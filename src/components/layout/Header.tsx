import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  timeframe: 'weekly' | 'monthly';
  onTimeframeChange: (tf: 'weekly' | 'monthly') => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  timeframe,
  onTimeframeChange,
  activeTabTitle,
}) => {
  const { user, logout } = useAuth();

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'A';
  const roleDisplay = user?.role || 'Admin';

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{activeTabTitle}</h2>
        <p className="text-xs text-slate-400">View-only analytics and management console</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Weekly / Monthly Report Switch */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
          <button
            onClick={() => onTimeframeChange('weekly')}
            className={`px-3 py-1 rounded-md transition-all ${
              timeframe === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => onTimeframeChange('monthly')}
            className={`px-3 py-1 rounded-md transition-all ${
              timeframe === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Monthly Report
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200"></div>

        {/* Admin Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1 justify-end">
              <Shield className="w-3.5 h-3.5 text-slate-700" />
              {user?.username || 'Admin'}
              <span className="ml-1 text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono uppercase text-slate-600">
                {roleDisplay}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">{user?.email || 'user@centrix.dev'}</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-800">
            {userInitial}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={logout}
            title="Log Out"
            className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 ml-1"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
