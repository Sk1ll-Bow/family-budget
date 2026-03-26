import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../core/useAuthStore';
import { cn } from '../core/cn';

const NAV_ITEMS = [
  { icon: LayoutGrid, label: 'Dashboard', path: '/' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Users, label: 'Family', path: '/family' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

/**
 * Professional desktop sidebar with glassmorphism and modern icons.
 */
export function Sidebar() {
  const { logout, profile } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 xl:w-64 glass border-r border-white/5 z-50 flex flex-col items-center xl:items-stretch py-8 transition-all duration-500 ease-in-out">
      {/* Logo Section */}
      <div className="px-6 mb-12 flex items-center justify-center xl:justify-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center shadow-glow">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <span className="hidden xl:block text-xl font-black text-surface-50 tracking-tighter">
          Antigravity<span className="text-brand-primary">.</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "group relative flex items-center justify-center xl:justify-start gap-4 px-4 py-4 rounded-2xl transition-all duration-300 outline-none",
              isActive 
                ? "bg-brand-primary/10 text-brand-primary shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]" 
                : "text-surface-500 hover:text-surface-200 hover:bg-white/5"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-6 h-6 transition-transform duration-300 group-hover:scale-110",
                  isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                )} />
                <span className="hidden xl:block text-sm font-bold tracking-tight">
                  {item.label}
                </span>
                
                {/* Active Indicator (Mobile-like dot for non-expanded sidebar) */}
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 mt-auto flex flex-col gap-2">
         {/* Profile summary (visible only on full sidebar) */}
         <div className="hidden xl:flex items-center gap-3 p-4 mb-4 rounded-2xl bg-white/5 border border-white/5">
            <div 
              className="w-10 h-10 rounded-full border border-white/10 p-0.5"
              style={{ background: profile?.avatarBg }}
            >
              <div className="w-full h-full rounded-full bg-surface-900 flex items-center justify-center text-xs font-black text-surface-400">
                {profile?.displayName?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-surface-50 truncate">{profile?.displayName || 'User'}</p>
              <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest truncate">Pro Member</p>
            </div>
         </div>

         <button 
          onClick={() => logout()}
          className="group flex items-center justify-center xl:justify-start gap-4 px-4 py-4 rounded-2xl text-surface-500 hover:text-danger hover:bg-danger/10 transition-all duration-300"
         >
           <LogOut className="w-6 h-6 transition-transform group-hover:translate-x-1" />
           <span className="hidden xl:block text-sm font-bold">Logout</span>
         </button>
      </div>
    </aside>
  );
}
