import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check, Store } from 'lucide-react';
import { PortalModal } from '../../components/PortalModal';
import { useAuthStore } from '../../core/useAuthStore';
import { updateExpense } from './expenseService';
import { getCategories } from '../categories/categoryService';
import { getAccounts } from '../accounts/accountService';
import { getStores, addStore } from '../stores/storeService';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { useModalStore } from '../../core/useModalStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { AccountSelector } from '../accounts/AccountSelector';
import { StoreSelector } from '../stores/StoreSelector';
import { LucideIcon } from '../../components/LucideIcon';
import type { IExpense } from '../../core/types';

export const MODAL_EDIT_EXPENSE = 'edit-expense';

const expenseSchema = z.object({
  amount: z.string().min(1, 'Enter amount').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be greater than 0'
  ),
  description: z.string().optional(),
  spentAt: z.string().min(1),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface IEditExpenseModalProps {
  onSaved?: () => void;
}

/**
 * Edit Expense Modal — prefilled with existing expense data.
 */
export function EditExpenseModal({ onSaved }: IEditExpenseModalProps) {
  const { familyId } = useAuthStore();
  const { closeModal, stack } = useModalStore();
  
  // Get payload from modal stack
  const modalData = stack.find((m) => m.id === MODAL_EDIT_EXPENSE);
  const isOpen = !!modalData;
  const expenseToEdit = modalData?.props?.expense as IExpense | undefined;

  const categories = useLiveQuery(() => familyId ? getCategories(familyId) : [], [familyId]) || [];
  const accounts = useLiveQuery(() => familyId ? getAccounts(familyId) : [], [familyId]) || [];
  const stores = useLiveQuery(() => familyId ? getStores(familyId) : [], [familyId]) || [];
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  // Pre-fill form when modal opens with an expense
  useEffect(() => {
    if (isOpen && expenseToEdit) {
      // Local datetime-local inputs require YYYY-MM-DDTHH:mm format
      const dateLocal = new Date(expenseToEdit.spentAt);
      const tzOffset = dateLocal.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateLocal.getTime() - tzOffset)).toISOString().slice(0, 16);

      reset({
        amount: expenseToEdit.amount.toString(),
        description: expenseToEdit.description,
        spentAt: localISOTime,
      });
      setSelectedCategory(expenseToEdit.categoryId);
      setSelectedAccount(expenseToEdit.accountId);
      setSelectedStore(expenseToEdit.storeId || null);
    }
  }, [isOpen, expenseToEdit, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!expenseToEdit) return;
    setSubmitting(true);

    try {
      await updateExpense(expenseToEdit.id, {
        amount: Number(data.amount.replace(',', '.')),
        categoryId: selectedCategory,
        accountId: selectedAccount,
        storeId: selectedStore,
        description: data.description,
        // Convert local back to UTC
        spentAt: new Date(data.spentAt).toISOString(),
      });

      toast.success('Expense updated');
      closeModal();
      onSaved?.();
    } catch {
      toast.error('Error updating expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !expenseToEdit) return null;

  return (
    <PortalModal modalId={MODAL_EDIT_EXPENSE} title="Edit Expense" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Input */}
        <div className="bg-brand-primary/10 rounded-[32px] p-8 border border-white/5 shadow-inner-lg">
          <label htmlFor="edit-expense-amount" className="block text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4 text-center">
            Amount
          </label>
          <div className="relative flex justify-center">
            <span className="text-4xl font-black text-brand-primary/40 mr-2 mt-1">€</span>
            <input
              id="edit-expense-amount"
              type="text"
              inputMode="decimal"
              className={cn(
                'w-full max-w-[200px] bg-transparent border-none text-6xl font-black focus:outline-none focus:ring-0 placeholder:text-surface-800 p-0 transition-all text-center tracking-tighter',
                errors.amount ? 'text-danger' : 'text-surface-50'
              )}
              placeholder="0"
              {...register('amount')}
            />
          </div>
        </div>

        {/* Category Grid */}
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest px-1">
            Category
          </label>
          <div className="grid grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center gap-2 group outline-none"
              >
                <div
                  className={cn(
                    "w-full aspect-square rounded-3xl flex items-center justify-center transition-all duration-300",
                    selectedCategory === cat.id 
                      ? "bg-brand-primary shadow-[0_8px_20px_rgba(59,130,246,0.4)] scale-105" 
                      : "glass group-hover:bg-white/5"
                  )}
                >
                  <LucideIcon 
                    name={cat.icon || 'Circle'} 
                    className={cn(
                      "w-6 h-6 transition-colors",
                      selectedCategory === cat.id ? "text-white" : "text-surface-400"
                    )}
                    style={{ color: selectedCategory === cat.id ? undefined : cat.color }}
                  />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest truncate max-w-full",
                  selectedCategory === cat.id ? "text-surface-50" : "text-surface-500"
                )}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest px-1 mb-2">
              Store
            </label>
            <StoreSelector 
              stores={stores}
              selectedId={selectedStore}
              onSelect={setSelectedStore}
              onAddCustom={async (name) => {
                if (familyId) {
                   const newStore = await addStore(familyId, name);
                   if (newStore) setSelectedStore(newStore.id);
                }
              }}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-3 pl-1">
              Select Account
            </label>
            <AccountSelector
              accounts={accounts}
              selectedId={selectedAccount}
              onSelect={setSelectedAccount}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="edit-expense-desc" className="block text-[10px] font-black text-surface-500 uppercase tracking-widest pl-1">
                Note
              </label>
              <input
                id="edit-expense-desc"
                type="text"
                className="glass w-full px-4 py-4 text-xs focus:ring-1 focus:ring-brand-primary/50 outline-none rounded-2xl font-black text-surface-50 placeholder:text-surface-700 placeholder:font-bold"
                placeholder="What for?"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-expense-date" className="block text-[10px] font-black text-surface-500 uppercase tracking-widest pl-1">
                Date
              </label>
              <input
                id="edit-expense-date"
                type="datetime-local"
                className="glass w-full px-4 py-4 text-xs focus:ring-1 focus:ring-brand-primary/50 outline-none rounded-2xl font-black text-surface-50"
                {...register('spentAt')}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-primary flex items-center justify-center gap-3 text-white font-black hover:bg-brand-primary/90 text-base py-5 rounded-[24px] shadow-2xl shadow-brand-primary/20 active:scale-[0.98] transition-all group"
        >
          {submitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span className="uppercase tracking-[0.2em] ml-6">Save Changes</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Check className="w-5 h-5" />
              </div>
            </>
          )}
        </button>
      </form>
    </PortalModal>
  );
}
