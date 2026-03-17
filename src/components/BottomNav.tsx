import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlusCircle, BarChart3, Settings } from 'lucide-react';
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
    { to: '/', icon: <Home className="w-5 h-5" />, label: 'Главная' },
    { to: '/analytics', icon: <BarChart3 className="w-5 h-5" />, label: 'Аналитика' },
    { to: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Настройки' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer',
                isActive
                  ? 'text-brand-primary'
                  : 'text-surface-400 hover:text-surface-200'
              )
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Central FAB Button */}
        <button
          type="button"
          onClick={() => openModal(MODAL_ADD_EXPENSE)}
          className={cn(
            'relative -mt-6 w-14 h-14 rounded-full',
            'bg-brand-primary hover:bg-brand-primary-dark',
            'flex items-center justify-center',
            'shadow-[0_4px_20px_rgba(99,102,241,0.4)]',
            'transition-all duration-200 cursor-pointer',
            'hover:shadow-[0_4px_28px_rgba(99,102,241,0.5)]',
            'active:scale-95'
          )}
          aria-label="Добавить расход"
        >
          <PlusCircle className="w-7 h-7 text-white" />
        </button>

        {/* Last nav item */}
        {navItems.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer',
                isActive
                  ? 'text-brand-primary'
                  : 'text-surface-400 hover:text-surface-200'
              )
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
