import { useState, useEffect, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DollarSign, Tag, CreditCard, Calendar, FileText,
  Camera, QrCode, Loader2, Check,
} from 'lucide-react';
import { PortalModal } from '../../components/PortalModal';
import { useAuthStore } from '../../core/useAuthStore';
import { addExpense } from './expenseService';
import { getCategories } from '../categories/categoryService';
import { getAccounts } from '../accounts/accountService';
import type { ICategory, IAccount } from '../../core/types';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { useModalStore } from '../../core/useModalStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../core/db';
import { ReceiptScanner, MODAL_RECEIPT_SCANNER } from '../ocr/ReceiptScanner';
import { QrScanner, MODAL_QR_SCANNER } from '../ocr/QrScanner';
import { AccountSelector } from '../accounts/AccountSelector';

export const MODAL_ADD_EXPENSE = 'add-expense';

const expenseSchema = z.object({
  amount: z.string().min(1, 'Введите сумму').refine(
    (v) => !isNaN(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) > 0,
    'Сумма должна быть больше 0'
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
 * date picker, and OCR/QR entry points.
 */
export function AddExpenseModal({ onAdded }: IAddExpenseModalProps) {
  const { user, familyId } = useAuthStore();
  const { closeModal, stack, openModal } = useModalStore();
  const isOpen = stack.some((m) => m.id === MODAL_ADD_EXPENSE);

  const categories = useLiveQuery(() => familyId ? getCategories(familyId) : [], [familyId]) || [];
  const accounts = useLiveQuery(() => familyId ? getAccounts(familyId) : [], [familyId]) || [];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
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
    }
  }, [isOpen, reset]);

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
        description: data.description ?? '',
        spentAt: new Date(data.spentAt).toISOString(),
      });

      toast.success('Расход добавлен');
      closeModal();
      onAdded?.();
    } catch {
      toast.error('Ошибка при добавлении');
    } finally {
      setSubmitting(false);
    }
  };

  /** Called from OCR/QR scanner to auto-fill amount */
  const handleAmountDetected = useCallback((amount: number) => {
    setValue('amount', amount.toString());
    toast.success(`Сумма распознана: ${amount}`);
  }, [setValue]);

  return (
    <PortalModal modalId={MODAL_ADD_EXPENSE} title="Новый расход" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Amount Input — Big & Prominent */}
        <div>
          <label htmlFor="expense-amount" className="block text-sm font-medium text-surface-300 mb-1.5">
            Сумма
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              id="expense-amount"
              type="text"
              inputMode="decimal"
              className={cn(
                'glass-input w-full pl-11 pr-4 py-4 text-2xl font-bold focus-ring',
                errors.amount && 'border-danger'
              )}
              placeholder="0.00"
              autoFocus
              {...register('amount')}
            />
          </div>
          {errors.amount && (
            <p className="text-danger text-xs mt-1">{errors.amount.message}</p>
          )}

          {/* Quick OCR/QR buttons */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm flex-1"
              onClick={() => {
                openModal(MODAL_RECEIPT_SCANNER, { onAmountDetected: handleAmountDetected });
              }}
            >
              <Camera className="w-4 h-4" />
              Фото чека
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm flex-1"
              onClick={() => {
                openModal(MODAL_QR_SCANNER, { onAmountDetected: handleAmountDetected });
              }}
            >
              <QrCode className="w-4 h-4" />
              QR-код
            </button>
          </div>
        </div>

        {/* Category Grid */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            <Tag className="inline w-4 h-4 mr-1 -mt-0.5" />
            Категория
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-150 cursor-pointer',
                  selectedCategory === cat.id
                    ? 'bg-brand-primary/20 border border-brand-primary/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                    : 'glass-card border-transparent hover:bg-glass-hover'
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {cat.name.charAt(0)}
                </div>
                <span className="text-[10px] text-surface-300 truncate max-w-full">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Selection */}

        {/* Account Selector */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            <CreditCard className="inline w-4 h-4 mr-1 -mt-0.5" />
            Счёт
          </label>
          <AccountSelector
            accounts={accounts}
            selectedId={selectedAccount}
            onSelect={setSelectedAccount}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="expense-desc" className="block text-sm font-medium text-surface-300 mb-1.5">
            <FileText className="inline w-4 h-4 mr-1 -mt-0.5" />
            Комментарий
          </label>
          <input
            id="expense-desc"
            type="text"
            className="glass-input w-full px-4 py-2.5 text-sm focus-ring"
            placeholder="Необязательно"
            {...register('description')}
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="expense-date" className="block text-sm font-medium text-surface-300 mb-1.5">
            <Calendar className="inline w-4 h-4 mr-1 -mt-0.5" />
            Дата и время
          </label>
          <input
            id="expense-date"
            type="datetime-local"
            className="glass-input w-full px-4 py-2.5 text-sm focus-ring"
            {...register('spentAt')}
          />
        </div>

          {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-lg w-full"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Добавить расход'
          )}
        </button>
      </form>

      {/* Nested Scanner Modals */}
      <ReceiptScanner onAmountDetected={handleAmountDetected} />
      <QrScanner onAmountDetected={handleAmountDetected} />
    </PortalModal>
  );
}
