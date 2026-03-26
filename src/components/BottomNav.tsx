import { NavLink, useLocation } from 'react-router-dom';
import { Home, Plus, BarChart3, Settings, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../core/cn';
import { useModalStore } from '../core/useModalStore';

const MODAL_ADD_EXPENSE = 'add-expense';

interface INavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  action?: () => void;
}

/**
 * Mobile-first bottom navigation bar with central FAB for quick expense adding.
 */
export function BottomNav() {
  const { openModal } = useModalStore();
  const location = useLocation();

  const navItems: INavItem[] = [
    { to: '/', icon: <Home className="w-6 h-6" />, label: 'Home' },
    { to: '/analytics', icon: <BarChart3 className="w-6 h-6" />, label: 'Stats' },
    { to: '/family', icon: <Users className="w-6 h-6" />, label: 'Family' },
    { to: '/settings', icon: <Settings className="w-6 h-6" />, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-8 inset-x-0 mx-auto px-5 w-full max-w-lg z-50 pointer-events-none xl:hidden">
      <nav className="glass border border-white/10 shadow-card rounded-[32px] flex items-center justify-between px-2 py-3 pointer-events-auto relative overflow-hidden h-20">
        {/* Subtle inner glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Left items */}
        <div className="flex items-center flex-1 justify-evenly">
          {navItems.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-400 group',
                  isActive ? 'text-brand-primary' : 'text-surface-500 hover:text-surface-300'
                )
              }
            >
              <div className={cn(
                "transition-transform duration-400 group-active:scale-90",
                location.pathname === item.to && "drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest transition-all",
                location.pathname === item.to ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              )}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>

        {/* Reimagined Hero FAB */}
        <div className="relative -mt-6 px-2 pb-2">
          {/* External Glow Layer */}
          <div className="absolute inset-0 bg-brand-primary/20 blur-[32px] rounded-full scale-110 animate-pulse" />
          
          <button
            type="button"
            onClick={() => openModal(MODAL_ADD_EXPENSE)}
            className={cn(
              'relative w-18 h-18 rounded-[28px]', // Slightly larger, more squircle
              'bg-brand-primary overflow-hidden',
              'flex items-center justify-center',
              'shadow-[0_12px_48px_rgba(59,130,246,0.6),inset_0_2px_4px_rgba(255,255,255,0.3)]',
              'transition-all duration-500 cursor-pointer active:scale-90',
              'hover:-translate-y-2 hover:shadow-[0_16px_56px_rgba(59,130,246,0.8)]',
              'group'
            )}
            aria-label="Add transaction"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-white/5 to-white/20" />
            <div className="absolute inset-3 rounded-[20px] border border-white/20 pointer-events-none" />
            
            <motion.div
              initial={false}
              animate={{ rotate: 0 }}
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Plus className="w-8 h-8 text-white relative z-10 drop-shadow-md" />
            </motion.div>

            {/* Micro-shimmer sweep animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
          </button>
        </div>

        {/* Right items */}
        <div className="flex items-center flex-1 justify-evenly">
          {navItems.slice(2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-400 group',
                  isActive ? 'text-brand-primary' : 'text-surface-500 hover:text-surface-300'
                )
              }
            >
              <div className={cn(
                "transition-transform duration-400 group-active:scale-90",
                location.pathname === item.to && "drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest transition-all",
                location.pathname === item.to ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              )}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>

  );
}

