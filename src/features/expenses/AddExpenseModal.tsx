import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Camera, QrCode, Loader2, Check, Store,
} from 'lucide-react';
import { PortalModal } from '../../components/PortalModal';
import { useAuthStore } from '../../core/useAuthStore';
import { addExpense, addBatchExpenses } from './expenseService';
import { getCategories, addCategory } from '../categories/categoryService';
import { getAccounts } from '../accounts/accountService';
import { getStores, addStore } from '../stores/storeService';
import type { ICategory, IAccount, IStore } from '../../core/types';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { useModalStore } from '../../core/useModalStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../core/db';
import { ReceiptScanner, MODAL_RECEIPT_SCANNER } from '../ocr/ReceiptScanner';
import { QrScanner, MODAL_QR_SCANNER } from '../ocr/QrScanner';
import { AccountSelector } from '../accounts/AccountSelector';
import { StoreSelector } from '../stores/StoreSelector';
import { LucideIcon } from '../../components/LucideIcon';
import type { IReceiptPosition } from '../ocr/geminiService';


export const MODAL_ADD_EXPENSE = 'add-expense';

const expenseSchema = z.object({
  amount: z.string().min(1, 'Enter amount').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be greater than 0'
  ),
  description: z.string().optional(),
  spentAt: z.string().min(1),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface IAddExpenseModalProps {
  onAdded?: () => void;
}

/**
 * Add Expense Modal — glassmorphism modal with category grid, account selector,
 * date picker, store name, and OCR/QR entry points.
 */
export function AddExpenseModal({ onAdded }: IAddExpenseModalProps) {
  const { user, familyId } = useAuthStore();
  const { closeModal, stack, openModal } = useModalStore();
  const isOpen = stack.some((m) => m.id === MODAL_ADD_EXPENSE);

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
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      spentAt: new Date().toISOString().slice(0, 16),
    },
  });

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      reset({ spentAt: new Date().toISOString().slice(0, 16) });
      setSelectedCategory(null);
      setSelectedStore(null);
    }
  }, [isOpen, reset]);

  /** Build the full description string from form data */
  const buildDescription = (data: ExpenseFormData): string => {
    return data.description || '';
  };

  const onSubmit = async (data: ExpenseFormData) => {
    if (!familyId || !user) return;
    setSubmitting(true);

    try {
      await addExpense({
        familyId,
        userId: user.id,
        amount: Number(data.amount.replace(',', '.')),
        categoryId: selectedCategory,
        accountId: selectedAccount,
        storeId: selectedStore,
        description: buildDescription(data),
        spentAt: new Date(data.spentAt).toISOString(),
      });

      toast.success('Expense added');
      closeModal();
      onAdded?.();
    } catch {
      toast.error('Error adding expense');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Batch-add all receipt positions as separate expenses in one atomic operation.
   */
  const handlePositionsConfirmed = useCallback(async (positions: IReceiptPosition[]) => {
    if (!familyId || !user || positions.length === 0) return;

    try {
      // 1. Refresh categories and stores to avoid stale state
      const currentCategories = await getCategories(familyId);
      const currentStores = await getStores(familyId);

      const paramsList = [];
      
      for (const pos of positions) {
        let posCategoryId = selectedCategory;
        let posStoreId: string | null = null;
        let posAccountId = selectedAccount;

        // Auto-match Account based on paymentMethod
        if (pos.paymentMethod && pos.paymentMethod !== 'Unknown') {
          const method = pos.paymentMethod.toLowerCase();
          const matchedAccount = accounts.find(acc => {
            const name = acc.name.toLowerCase();
            if (method === 'card') {
              return name.includes('card') || name.includes('карт') || name.includes('банк') || name.includes('visa') || name.includes('mastercard');
            }
            if (method === 'cash') {
              return name.includes('cash') || name.includes('налич') || name.includes('кошелек') || name.includes('wallet');
            }
            return false;
          });
          if (matchedAccount) {
            posAccountId = matchedAccount.id;
          }
        }

        // Auto-match or auto-create store
        if (pos.storeName) {
          const storeNameLower = pos.storeName.toLowerCase().trim();
          let storeMatch: IStore | undefined | null = currentStores.find(s => s.name.toLowerCase() === storeNameLower);
          
          if (!storeMatch) {
            // Create a new store on the fly
            storeMatch = await addStore(familyId, pos.storeName.trim());
            if (storeMatch) {
               currentStores.push(storeMatch);
            }
          }
          if (storeMatch) {
             posStoreId = storeMatch.id;
          }
        }

        // Auto-match or auto-create category
        if (pos.categorySuggestion) {
          const catNameLower = pos.categorySuggestion.toLowerCase().trim();
          let catMatch = currentCategories.find(c => c.name.toLowerCase() === catNameLower);
          
          if (!catMatch) {
            // Create a new category on the fly (using a default icon)
            const newCat = await addCategory(familyId, pos.categorySuggestion.trim(), 'Tag', '#94a3b8');
            // Re-fetch to get the IDs of the newly created category
            const updatedCategories = await getCategories(familyId);
            catMatch = updatedCategories.find(c => c.name.toLowerCase() === catNameLower);
            if (catMatch) {
              currentCategories.push(catMatch);
            }
          }
          if (catMatch) {
            posCategoryId = catMatch.id;
          }
        }

        const descParts: string[] = [];
        descParts.push(pos.name);
        if (pos.details) descParts.push(`(${pos.details})`);

        paramsList.push({
          familyId,
          userId: user.id,
          amount: pos.amount,
          categoryId: posCategoryId,
          accountId: posAccountId,
          storeId: posStoreId,
          description: descParts.join(' '),
          spentAt: pos.spentAt,
        });
      }

      await addBatchExpenses(paramsList);

      toast.success(`${positions.length} expense${positions.length > 1 ? 's' : ''} added from receipt`);
      closeModal();
      onAdded?.();
    } catch {
      toast.error('Error adding expenses from receipt');
    }
  }, [familyId, user, selectedCategory, selectedAccount, closeModal, onAdded]);

  /** Called from QR scanner to auto-fill amount */
  const handleAmountDetected = useCallback((amount: number) => {
    setValue('amount', amount.toString());
    toast.success(`Amount recognized: ${amount}`);
  }, [setValue]);

  return (
    <PortalModal modalId={MODAL_ADD_EXPENSE} title="Add Expense" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Input — Big & Prominent */}
        <div className="bg-brand-primary/10 rounded-[32px] p-8 border border-white/5 shadow-inner-lg">
          <label htmlFor="expense-amount" className="block text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4 text-center">
            Enter Amount
          </label>
          <div className="relative flex justify-center">
            <span className="text-4xl font-black text-brand-primary/40 mr-2 mt-1">€</span>
            <input
              id="expense-amount"
              type="text"
              inputMode="decimal"
              className={cn(
                'w-full max-w-[200px] bg-transparent border-none text-6xl font-black focus:outline-none focus:ring-0 placeholder:text-surface-800 p-0 transition-all text-center tracking-tighter',
                errors.amount ? 'text-danger' : 'text-surface-50'
              )}
              placeholder="0"
              autoFocus
              {...register('amount')}
            />
          </div>
          {errors.amount && (
            <p className="text-danger text-[10px] mt-3 font-black uppercase tracking-widest text-center">{errors.amount.message}</p>
          )}
        </div>

        {/* Quick OCR/QR buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 glass py-4 rounded-2xl flex items-center justify-center gap-2 group active:scale-95 transition-all"
            onClick={() => {
              openModal(MODAL_RECEIPT_SCANNER);
            }}
          >
            <Camera className="w-5 h-5 text-surface-400 group-hover:text-brand-primary transition-colors" />
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Receipt</span>
          </button>
          <button
            type="button"
            className="flex-1 glass py-4 rounded-2xl flex items-center justify-center gap-2 group active:scale-95 transition-all"
            onClick={() => {
              openModal(MODAL_QR_SCANNER, { onAmountDetected: handleAmountDetected });
            }}
          >
            <QrCode className="w-5 h-5 text-surface-400 group-hover:text-brand-secondary transition-colors" />
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">QR Order</span>
          </button>
        </div>

        {/* Category Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest">
              Category
            </label>
            <button type="button" className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Manage</button>
          </div>
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
            <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest mb-3 pl-1">
              Select Account
            </label>
            <AccountSelector
              accounts={accounts}
              selectedId={selectedAccount}
              onSelect={setSelectedAccount}
            />
          </div>

          {/* Store Name */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-surface-500 uppercase tracking-widest pl-1">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="expense-desc" className="block text-[10px] font-black text-surface-500 uppercase tracking-widest pl-1">
                Note
              </label>
              <input
                id="expense-desc"
                type="text"
                className="glass w-full px-4 py-4 text-xs focus:ring-1 focus:ring-brand-primary/50 outline-none rounded-2xl font-black text-surface-50 placeholder:text-surface-700 placeholder:font-bold"
                placeholder="What for?"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="expense-date" className="block text-[10px] font-black text-surface-500 uppercase tracking-widest pl-1">
                Date
              </label>
              <input
                id="expense-date"
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
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black text-base py-5 rounded-[24px] shadow-2xl shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 group"
        >
          {submitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span className="uppercase tracking-[0.2em] ml-6">Save Transaction</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Check className="w-5 h-5" />
              </div>
            </>
          )}
        </button>
      </form>


      {/* Nested Scanner Modals */}
      <ReceiptScanner 
        onPositionsConfirmed={handlePositionsConfirmed}
        existingCategoryNames={categories.map(c => c.name)}
        existingStoreNames={stores.map(s => s.name)}
      />
      <QrScanner onAmountDetected={handleAmountDetected} />
    </PortalModal>
  );
}
