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
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated');
      setIsEditingProfile(false);
    }
    setSavingProfile(false);
  };

  const handleExitFamily = async () => {
    if (!window.confirm('Are you sure you want to leave the family? All local data for this family will be cleared.')) {
      return;
    }
    const { error } = await exitFamily();
    if (error) {
      toast.error('Error leaving: ' + error);
    } else {
      toast.success('Left family');
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
    toast.success('Category added');
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    toast.success('Category deleted');
  };

  const handleAddAccount = async () => {
    if (!newAccName.trim() || !familyId) return;
    setAddingAcc(true);
    try {
      await addAccount(familyId, newAccName.trim(), 'credit-card', newAccColor, newAccType);
      setNewAccName('');
      toast.success('Account added');
    } catch (err) {
      console.error('[AddAccount] Failed:', err);
      toast.error('Failed to create account');
    } finally {
      setAddingAcc(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    await deleteAccount(id);
    toast.success('Account deleted');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = profile?.displayName || user?.email || '';

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="glass overflow-hidden rounded-[32px]">
        <div className="bg-brand-primary/10 px-6 py-10 flex flex-col items-center text-center relative">
          <div className={cn(
            "w-28 h-28 rounded-[40px] flex items-center justify-center mb-5 shadow-2xl border-4 border-white/10 relative group transition-transform hover:scale-105",
            online ? "ring-4 ring-success/20" : "ring-4 ring-surface-700/20"
          )} style={{ background: profile?.avatarBg || 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
            <SettingsIcon className="w-12 h-12 text-white" />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-surface-900 flex items-center justify-center shadow-lg",
              online ? "bg-success" : "bg-surface-500"
            )}>
              {online ? <Wifi className="w-3.5 h-3.5 text-white" /> : <WifiOff className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          <div className="space-y-2">
            {isEditingProfile ? (
              <div className="flex flex-col items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-surface-900 text-center w-full max-w-[240px] px-4 py-3 rounded-2xl font-black text-surface-50 outline-none border border-white/10 focus:border-brand-primary"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
                />
                <div className="flex gap-4">
                  <button onClick={handleUpdateProfile} disabled={savingProfile} className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:opacity-80 transition-opacity">
                    {savingProfile ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditingProfile(false)} className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] hover:text-surface-300 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black text-surface-50 tracking-tighter">{displayName}</h2>
                <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.3em]">{user?.email}</p>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-4 px-6 py-2 rounded-full glass text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:bg-white/5 active:scale-95 transition-all"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Family & Invite Code */}
      <div className="glass p-8 rounded-[32px] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-surface-600 uppercase tracking-[0.2em] leading-none mb-2">My Family</p>
              <h3 className="text-xl font-black text-surface-50 tracking-tight">{familyName || 'Family Space'}</h3>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1 text-center">Invite Members</p>
          <div className="flex items-center gap-3">
            <div className="bg-surface-900/50 flex-1 px-6 py-4 text-2xl font-black tracking-[0.4em] text-brand-primary rounded-[20px] border border-white/5 shadow-inner select-all text-center">
              {inviteCode.toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className={cn(
                "w-14 h-14 rounded-[20px] flex items-center justify-center transition-all active:scale-90 shadow-2xl",
                copied ? "bg-success text-white shadow-success/20" : "bg-brand-primary text-white shadow-brand-primary/30"
              )}
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>
          <p className="text-[10px] font-bold text-surface-600 px-1 text-center opacity-70">Tap the code to copy and share with your family members.</p>
        </div>
      </div>

      {/* Categories */}
      <div className="glass p-8 rounded-[32px] space-y-6">
        <div className="flex items-center gap-4 px-1">
          <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center">
            <Tag className="w-6 h-6 text-brand-secondary" />
          </div>
          <h3 className="text-xl font-black text-surface-50 tracking-tight uppercase">Categories</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 bg-white/5 rounded-[20px] p-4 border border-white/5 group hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl font-black shadow-inner" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                {cat.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-black text-surface-100 flex-1 truncate uppercase tracking-widest">{cat.name}</span>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-danger/40 hover:text-danger hover:bg-danger/10 transition-all active:scale-95"
                aria-label={`Delete ${cat.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 bg-surface-900/40 p-2.5 rounded-[24px] border border-white/5">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="bg-transparent flex-1 min-w-0 px-5 py-3 text-xs text-surface-50 placeholder:text-surface-700 outline-none font-black uppercase tracking-widest"
            placeholder="New Category Name..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={addingCat || !newCatName.trim()}
            className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all active:scale-90"
          >
            {addingCat ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Accounts */}
      <div className="glass p-8 rounded-[32px] space-y-6">
        <div className="flex items-center gap-4 px-1">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-brand-primary" />
          </div>
          <h3 className="text-xl font-black text-surface-50 tracking-tight uppercase">Accounts</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-4 bg-white/5 rounded-[20px] p-4 border border-white/5 group transition-all hover:bg-white/10">
              <div className={cn(
                "w-14 h-14 rounded-[14px] flex items-center justify-center shrink-0 shadow-inner",
                acc.color === 'blue' && "bg-blue-500/10 text-blue-400",
                acc.color === 'emerald' && "bg-emerald-500/10 text-emerald-400",
                acc.color === 'rose' && "bg-rose-500/10 text-rose-400",
                acc.color === 'amber' && "bg-amber-500/10 text-amber-400",
                acc.color === 'purple' && "bg-purple-500/10 text-purple-400",
                acc.color === 'slate' && "bg-slate-500/10 text-slate-400",
              )}>
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-surface-50 truncate uppercase tracking-widest leading-none mb-1.5">{acc.name}</p>
                <p className="text-[10px] font-black text-surface-600 uppercase tracking-[0.2em]">{acc.type}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAccount(acc.id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-danger/40 hover:text-danger hover:bg-danger/10 transition-all active:scale-95"
                aria-label={`Delete ${acc.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-5 pt-4 border-t border-white/5 bg-surface-900/20 p-6 rounded-[28px]">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">New Account Name</p>
            <input
              type="text"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              className="bg-surface-900/80 w-full px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-surface-50 border border-white/5 outline-none focus:border-brand-primary"
              placeholder="e.g. My Wallet..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
            />
          </div>
          
          <div className="space-y-3">
            <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">Account Type</p>
            <div className="flex flex-wrap gap-2">
              {(['card', 'cash', 'bank', 'savings', 'credit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewAccType(t)}
                  className={cn(
                    "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    newAccType === t ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" : "bg-white/5 text-surface-600 hover:bg-white/10 hover:text-surface-400"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">Pick Decoration</p>
            <div className="flex items-center gap-4">
              <div className="flex flex-1 items-center gap-1.5 bg-surface-950/50 p-3 rounded-[20px] justify-between border border-white/5">
                {(['blue', 'emerald', 'rose', 'amber', 'purple', 'slate'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewAccColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all border-4",
                      newAccColor === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-40 hover:opacity-100",
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
              </div>
              <button
                type="button"
                onClick={handleAddAccount}
                disabled={addingAcc || !newAccName.trim()}
                className="w-14 h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-2xl shadow-brand-primary/30 disabled:opacity-50 transition-all active:scale-90 group"
              >
                {addingAcc ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4 pt-6 pb-4">
        <button
          type="button"
          onClick={handleExitFamily}
          className="w-full py-5 rounded-[24px] bg-danger/5 border border-danger/10 text-danger text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-danger/10 active:scale-[0.98]"
        >
          <Users className="w-5 h-5 opacity-60" />
          Leave Family Space
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-5 rounded-[24px] bg-surface-900/50 border border-white/5 text-surface-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-white/5 hover:text-surface-300 active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5 opacity-40" />
          Sign Out of Account
        </button>
      </div>

      {/* Bottom Padding for Nav */}
      <div className="h-28" />
    </div>
  );
}

