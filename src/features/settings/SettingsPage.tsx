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
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../core/db';

/**
 * Settings page: family info, invite code, category/account management, logout.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, familyId, logout, updateProfile, exitFamily } = useAuthStore();
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const categories = useLiveQuery(
    () => familyId ? getCategories(familyId) : [],
    [familyId]
  ) || [];
  const accounts = useLiveQuery(
    () => familyId ? getAccounts(familyId) : [],
    [familyId]
  ) || [];
  const [copied, setCopied] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // ... existing states ...
  const [newCatName, setNewCatName] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [addingAcc, setAddingAcc] = useState(false);
  const [newAccType, setNewAccType] = useState<'card' | 'cash' | 'bank' | 'savings' | 'credit'>('card');
  const [newAccColor, setNewAccColor] = useState('blue');

  useEffect(() => {
    if (profile) setEditName(profile.displayName);
  }, [profile]);

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
        .maybeSingle();
      if (fam) {
        setFamilyName(fam.name as string);
        setInviteCode(fam.invite_code as string);
      }
    };
    load();
  }, [familyId]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    setSavingProfile(true);
    const { error } = await updateProfile({ displayName: editName.trim() });
    if (error) {
      toast.error('Ошибка обновления профиля');
    } else {
      toast.success('Профиль обновлен');
      setIsEditingProfile(false);
    }
    setSavingProfile(false);
  };

  const handleExitFamily = async () => {
    if (!window.confirm('Вы уверены, что хотите выйти из семьи? Все данные этой семьи будут удалены с устройства (но останутся в облаке).')) {
      return;
    }
    const { error } = await exitFamily();
    if (error) {
      toast.error('Ошибка выхода: ' + error);
    } else {
      toast.success('Вы вышли из семьи');
      navigate('/setup');
    }
  };

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
    setNewCatName('');
    setAddingCat(false);
    toast.success('Категория добавлена');
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    toast.success('Категория удалена');
  };

  const handleAddAccount = async () => {
    if (!newAccName.trim() || !familyId) return;
    setAddingAcc(true);
    try {
      await addAccount(familyId, newAccName.trim(), 'credit-card', newAccColor, newAccType);
      setNewAccName('');
      toast.success('Счёт добавлен');
    } catch (err) {
      console.error('[AddAccount] Failed:', err);
      toast.error('Ошибка при создании счёта');
    } finally {
      setAddingAcc(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    toast.success('Счёт удалён');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = profile?.displayName || user?.email || '';

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/10" style={{ background: profile?.avatarBg }}>
            <SettingsIcon className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            {isEditingProfile ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
              />
            ) : (
              <p className="font-semibold text-surface-100 truncate text-lg">{displayName}</p>
            )}
            <p className="text-sm text-surface-400 truncate">{user?.email}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold', online ? 'bg-success/10 text-success' : 'bg-surface-700 text-surface-400')}>
              {online ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              {online ? 'Online' : 'Offline'}
            </div>
            <button
              onClick={() => isEditingProfile ? handleUpdateProfile() : setIsEditingProfile(true)}
              className="text-xs text-brand-primary hover:underline"
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving...' : isEditingProfile ? 'Save' : 'Edit'}
            </button>
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

        {/* Account selection list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="relative group">
              <div className="flex items-center gap-3 p-3 glass-card bg-white/5 border-white/10 rounded-xl group-hover:bg-white/10 transition-all">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  acc.color === 'blue' && "bg-blue-500/20 text-blue-400",
                  acc.color === 'emerald' && "bg-emerald-500/20 text-emerald-400",
                  acc.color === 'rose' && "bg-rose-500/20 text-rose-400",
                  acc.color === 'amber' && "bg-amber-500/20 text-amber-400",
                  acc.color === 'purple' && "bg-purple-500/20 text-purple-400",
                  acc.color === 'slate' && "bg-slate-500/20 text-slate-400",
                )}>
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-100 truncate">{acc.name}</p>
                  <p className="text-[10px] text-surface-400 uppercase tracking-wider">{acc.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="btn btn-ghost btn-icon rounded-full opacity-60 hover:opacity-100 hover:bg-danger/10"
                  aria-label={`Удалить ${acc.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-danger" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2 border-t border-white/5">
          <input
            type="text"
            value={newAccName}
            onChange={(e) => setNewAccName(e.target.value)}
            className="glass-input w-full px-4 py-2.5 text-sm focus-ring"
            placeholder="Название нового счёта"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
          />
          
          <div className="flex flex-wrap gap-2">
            {(['card', 'cash', 'bank', 'savings', 'credit'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewAccType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  newAccType === t ? "bg-brand-primary text-white" : "bg-white/5 text-surface-400 hover:bg-white/10"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {(['blue', 'emerald', 'rose', 'amber', 'purple', 'slate'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewAccColor(c)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  newAccColor === c ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100",
                  c === 'blue' && "bg-blue-500",
                  c === 'emerald' && "bg-emerald-500",
                  c === 'rose' && "bg-rose-500",
                  c === 'amber' && "bg-amber-500",
                  c === 'purple' && "bg-purple-500",
                  c === 'slate' && "bg-slate-500",
                )}
                aria-label={c}
              />
            ))}
            <button
              type="button"
              onClick={handleAddAccount}
              disabled={addingAcc || !newAccName.trim()}
              className="btn btn-primary flex-1 py-2.5 ml-2"
            >
              {addingAcc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Добавить
            </button>
          </div>
        </div>
      </div>

      {/* Exit Family */}
      <button
        type="button"
        onClick={handleExitFamily}
        className="btn btn-secondary btn-lg w-full border-danger/30 text-danger hover:bg-danger/10"
      >
        <Users className="w-5 h-5 text-danger" />
        Выйти из семьи
      </button>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="btn btn-ghost btn-lg w-full text-surface-400"
      >
        <LogOut className="w-5 h-5" />
        Выйти из аккаунта
      </button>

      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
  );
}
