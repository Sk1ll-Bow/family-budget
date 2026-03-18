import { memo, useMemo } from 'react';
import { 
  CreditCard, Wallet, Landmark, PiggyBank, Banknote, Check 
} from 'lucide-react';
import { cn } from '../../core/cn';
import type { IAccount, AccountType } from '../../core/types';

interface IAccountCardProps {
  account: IAccount;
  spentAmount?: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const TYPE_ICONS: Record<AccountType, any> = {
  card: CreditCard,
  cash: Wallet,
  bank: Landmark,
  savings: PiggyBank,
  credit: Banknote,
};

const COLOR_MAP: Record<string, string> = {
  blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/30 text-blue-400',
  emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
  rose: 'from-rose-600/20 to-rose-600/5 border-rose-500/30 text-rose-400',
  amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/30 text-amber-400',
  purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30 text-purple-400',
  slate: 'from-slate-600/20 to-slate-600/5 border-slate-500/30 text-slate-400',
};

/**
 * AccountCard — visually rich card for a spending source.
 * Displays name, icon, type, and total spent.
 */
export const AccountCard = memo(({ 
  account, 
  spentAmount = 0, 
  isSelected, 
  onClick,
  className 
}: IAccountCardProps) => {
  const Icon = TYPE_ICONS[account.type] || CreditCard;
  const colorClasses = COLOR_MAP[account.color] || COLOR_MAP.blue;

  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(spentAmount);
  }, [spentAmount]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden min-w-0 w-full',
        'bg-gradient-to-br hover:scale-[1.02] active:scale-[0.98]',
        colorClasses,
        isSelected 
          ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-surface-900 border-brand-primary/50' 
          : 'glass-card hover:bg-white/5',
        className
      )}
    >
      {/* Background Icon Glow */}
      <div className="absolute -right-2 -bottom-2 opacity-5">
        <Icon size={80} />
      </div>

      <div className="flex items-center justify-between w-full mb-3">
        <div className={cn(
          'p-2 rounded-lg bg-white/10 flex items-center justify-center shrink-0',
          isSelected && 'bg-brand-primary/20'
        )}>
          <Icon size={20} />
        </div>
        {isSelected && (
          <div className="bg-brand-primary rounded-full p-1 shadow-glow animate-scale-in shrink-0">
            <Check size={12} className="text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-w-0">
        <h3 className="text-sm font-semibold text-surface-100 truncate">
          {account.name}
        </h3>
        <p className="text-[10px] uppercase tracking-wider opacity-60 font-medium">
          {account.type}
        </p>
      </div>

      <div className="mt-2 pt-2 border-t border-white/5 w-full">
        <span className="text-lg font-bold text-white tracking-tight">
          {formattedAmount}
        </span>
      </div>
    </button>
  );
});

AccountCard.displayName = 'AccountCard';
