import { useState, useEffect, memo } from 'react';
import { AccountCard } from './AccountCard';
import { getAccountSpentAmount } from './accountService';
import type { IAccount } from '../../core/types';
import { cn } from '../../core/cn';

interface IAccountSelectorProps {
  accounts: IAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * AccountSelector — Grid of account cards for selection.
 * Fetches and displays spent amounts for each account.
 */
export const AccountSelector = memo(({ 
  accounts, 
  selectedId, 
  onSelect,
  className 
}: IAccountSelectorProps) => {
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadStats = async () => {
      const newStats: Record<string, number> = {};
      await Promise.all(
        accounts.map(async (acc) => {
          newStats[acc.id] = await getAccountSpentAmount(acc.id);
        })
      );
      setStats(newStats);
    };

    if (accounts.length > 0) {
      loadStats();
    }
  }, [accounts]);

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}>
      {accounts.map((acc) => (
        <AccountCard
          key={acc.id}
          account={acc}
          spentAmount={stats[acc.id] || 0}
          isSelected={selectedId === acc.id}
          onClick={() => onSelect(acc.id)}
        />
      ))}
    </div>
  );
});

AccountSelector.displayName = 'AccountSelector';
