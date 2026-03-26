import { memo, useMemo } from 'react';
import { 
  CreditCard, Wallet, Landmark, PiggyBank, Banknote, Check 
} from 'lucide-react';
import { cn } from '../../core/cn';
import type { IAccount, AccountType } from '../../core/types';
import { formatCurrency } from '../../core/formatters';

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
  blue: 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.15)]',
  emerald: 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.15)]',
  rose: 'bg-rose-600/10 border-rose-500/20 text-rose-400 shadow-[0_4px_12px_rgba(244,63,94,0.15)]',
  amber: 'bg-amber-600/10 border-amber-500/20 text-amber-400 shadow-[0_4px_12px_rgba(245,158,11,0.15)]',
  purple: 'bg-purple-600/10 border-purple-500/20 text-purple-400 shadow-[0_4px_12px_rgba(168,85,247,0.15)]',
  slate: 'bg-slate-600/10 border-slate-500/20 text-slate-400 shadow-[0_4px_12px_rgba(100,116,139,0.15)]',
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
    return formatCurrency(spentAmount);
  }, [spentAmount]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start p-4 rounded-[24px] border transition-all duration-300 text-left overflow-hidden min-w-0 w-full group outline-none',
        isSelected 
          ? 'bg-brand-primary border-brand-primary shadow-[0_8px_30px_rgba(59,130,246,0.4)] scale-105 z-10' 
          : 'glass border-white/5 hover:bg-white/5 active:scale-95',
        className
      )}
    >
      <div className="flex items-center justify-between w-full mb-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
          isSelected ? 'bg-white/20 text-white' : 'bg-surface-900 border border-white/5 text-surface-400'
        )}>
          <Icon size={20} />
        </div>
        {isSelected && (
          <div className="bg-white/20 rounded-full p-1 border border-white/30">
            <Check size={10} className="text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-w-0 mb-3">
        <h3 className={cn(
          "text-[10px] font-black uppercase tracking-[0.15em] mb-1 truncate leading-none",
          isSelected ? "text-white/80" : "text-surface-500"
        )}>
          {account.name}
        </h3>
        <p className={cn(
          "text-sm font-black truncate leading-none",
          isSelected ? "text-white" : "text-surface-50"
        )}>
          {formattedAmount}
        </p>
      </div>

      <div className={cn(
        "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
        isSelected ? "bg-white/20 text-white" : "bg-surface-800 text-surface-500"
      )}>
        {account.type}
      </div>
    </button>
  );
});


AccountCard.displayName = 'AccountCard';
