import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Users, Copy, Check, Tag, CreditCard,
  Plus, Trash2, Loader2, Settings as SettingsIcon,
  Wifi, WifiOff,
} from 'lucide-react';
import { useAuthStore } from '../../core/useAuthStore';
import { supabase } from '../../core/supabase';
import { getCategories, addCategory, deleteCategory } from '../categories/categoryService';
import { getAccounts, addAccount, deleteAccount } from '../accounts/accountService';
import type { ICategory, IAccount } from '../../core/types';
import { cn } from '../../core/cn';
import { toast } from 'sonner';

/**
 * Settings page: family info, invite code, category/account management, logout.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { user, familyId, logout } = useAuthStore();
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [copied, setCopied] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  // New item inputs
  const [newCatName, setNewCatName] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [addingAcc, setAddingAcc] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!familyId) return;
    const load = async () => {
      // Family info
      const { data: fam } = await supabase
        .from('families')
        .select('name, invite_code')
        .eq('id', familyId)
        .single();
      if (fam) {
        setFamilyName(fam.name as string);
        setInviteCode(fam.invite_code as string);
      }

      setCategories(await getCategories(familyId));
      setAccounts(await getAccounts(familyId));
    };
    load();
  }, [familyId]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !familyId) return;
    setAddingCat(true);
    const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#22c55e'];
    const color = colors[categories.length % colors.length];
    await addCategory(familyId, newCatName.trim(), 'tag', color);
    setCategories(await getCategories(familyId));
    setNewCatName('');
    setAddingCat(false);
    toast.success('Категория добавлена');
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    if (familyId) setCategories(await getCategories(familyId));
    toast.success('Категория удалена');
  };

  const handleAddAccount = async () => {
    if (!newAccName.trim() || !familyId) return;
    setAddingAcc(true);
    await addAccount(familyId, newAccName.trim(), 'credit-card');
    setAccounts(await getAccounts(familyId));
    setNewAccName('');
    setAddingAcc(false);
    toast.success('Счёт добавлен');
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    if (familyId) setAccounts(await getAccounts(familyId));
    toast.success('Счёт удалён');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.user_metadata?.display_name as string || user?.email || '';

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0">
            <SettingsIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-surface-100 truncate">{displayName}</p>
            <p className="text-sm text-surface-400 truncate">{user?.email}</p>
          </div>
          <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs', online ? 'bg-success/10 text-success' : 'bg-surface-700 text-surface-400')}>
            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {online ? 'Онлайн' : 'Оффлайн'}
          </div>
        </div>
      </div>

      {/* Family & Invite Code */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-primary" />
          <h3 className="font-semibold text-surface-100">{familyName || 'Семья'}</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="glass-input flex-1 px-4 py-2.5 text-sm font-mono tracking-widest text-surface-300 min-w-0">
            {inviteCode.toUpperCase()}
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-secondary btn-md shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Скопировано' : 'Скопировать'}
          </button>
        </div>
        <p className="text-xs text-surface-500">Отправьте этот код члену семьи для присоединения</p>
      </div>

      {/* Categories */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-brand-primary" />
          <h3 className="font-semibold text-surface-100">Категории</h3>
        </div>

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 py-1.5">
              <div className="w-6 h-6 rounded-md shrink-0" style={{ backgroundColor: `${cat.color}30`, borderLeft: `3px solid ${cat.color}` }} />
              <span className="text-sm text-surface-200 flex-1 min-w-0 truncate">{cat.name}</span>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                className="btn btn-ghost btn-icon rounded-full opacity-60 hover:opacity-100"
                aria-label={`Удалить ${cat.name}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-danger" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="glass-input flex-1 min-w-0 px-3 py-2 text-sm focus-ring"
            placeholder="Новая категория"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={addingCat || !newCatName.trim()}
            className="btn btn-primary btn-md shrink-0"
          >
            {addingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Accounts */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-brand-primary" />
          <h3 className="font-semibold text-surface-100">Счета</h3>
        </div>

        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-3 py-1.5">
              <CreditCard className="w-4 h-4 text-surface-400 shrink-0" />
              <span className="text-sm text-surface-200 flex-1 min-w-0 truncate">{acc.name}</span>
              <button
                type="button"
                onClick={() => handleDeleteAccount(acc.id)}
                className="btn btn-ghost btn-icon rounded-full opacity-60 hover:opacity-100"
                aria-label={`Удалить ${acc.name}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-danger" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newAccName}
            onChange={(e) => setNewAccName(e.target.value)}
            className="glass-input flex-1 min-w-0 px-3 py-2 text-sm focus-ring"
            placeholder="Новый счёт"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
          />
          <button
            type="button"
            onClick={handleAddAccount}
            disabled={addingAcc || !newAccName.trim()}
            className="btn btn-primary btn-md shrink-0"
          >
            {addingAcc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="btn btn-danger btn-lg w-full"
      >
        <LogOut className="w-5 h-5" />
        Выйти из аккаунта
      </button>

      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
  );
}
