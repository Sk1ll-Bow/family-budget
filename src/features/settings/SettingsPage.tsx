import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Users, Tag, CreditCard,
  Plus, Trash2, Loader2, Settings as SettingsIcon,
  Wifi, WifiOff, Pencil, Check, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuthStore } from '../../core/useAuthStore';
import { getCategories, addCategory, deleteCategory, updateCategory } from '../categories/categoryService';
import { getAccounts, addAccount, deleteAccount, updateAccount } from '../accounts/accountService';
import type { ICategory, IAccount, AccountType } from '../../core/types';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { LucideIcon } from '../../components/LucideIcon';
import { IconPicker } from './IconPicker';

// ─────────────────────────────────────────────────────────────
// ColorSwatch — top-level to prevent re-mount on parent re-render
// ─────────────────────────────────────────────────────────────

/**
 * Clickable color swatch that opens a native color picker.
 */
function ColorSwatch({
  value, onChange, size = 'md',
}: {
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sizeClass = size === 'sm' ? 'w-9 h-9 rounded-xl' : 'w-11 h-11 rounded-[14px]';

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(sizeClass, 'border-2 border-white/20 shadow-inner transition-transform hover:scale-105 cursor-pointer focus:outline-none')}
        style={{ backgroundColor: value }}
        aria-label="Pick color"
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SettingsPage
// ─────────────────────────────────────────────────────────────

/**
 * Settings page: profile, category & account management, logout.
 * Desktop: 2-column grid — categories left, accounts right.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, familyId, logout, updateProfile, exitFamily } = useAuthStore();

  const categories = useLiveQuery(
    () => familyId ? getCategories(familyId) : [],
    [familyId]
  ) || [];

  const accounts = useLiveQuery(
    () => familyId ? getAccounts(familyId) : [],
    [familyId]
  ) || [];

  const [online, setOnline] = useState(navigator.onLine);

  // Profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // New category
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatIconOpen, setNewCatIconOpen] = useState(false);
  const [addingCat, setAddingCat] = useState(false);

  // Edit category
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('Tag');
  const [editCatIconOpen, setEditCatIconOpen] = useState(false);
  const [savingCat, setSavingCat] = useState(false);

  // New account
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('card');
  const [newAccColor, setNewAccColor] = useState('#3b82f6');
  const [newAccIcon, setNewAccIcon] = useState('CreditCard');
  const [newAccIconOpen, setNewAccIconOpen] = useState(false);
  const [addingAcc, setAddingAcc] = useState(false);

  // Edit account
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccColor, setEditAccColor] = useState('');
  const [editAccType, setEditAccType] = useState<AccountType>('card');
  const [editAccIcon, setEditAccIcon] = useState('CreditCard');
  const [editAccIconOpen, setEditAccIconOpen] = useState(false);
  const [savingAcc, setSavingAcc] = useState(false);

  useEffect(() => {
    if (profile) setEditName(profile.displayName);
  }, [profile]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  // ── Profile ────────────────────────────────────────────────
  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    setSavingProfile(true);
    const { error } = await updateProfile({ displayName: editName.trim() });
    if (error) toast.error('Failed to update profile');
    else { toast.success('Profile updated'); setIsEditingProfile(false); }
    setSavingProfile(false);
  };

  const handleExitFamily = async () => {
    if (!window.confirm('Are you sure you want to leave the family? All local data for this family will be cleared.')) return;
    const { error } = await exitFamily();
    if (error) toast.error('Error leaving: ' + error);
    else { toast.success('Left family'); navigate('/setup'); }
  };

  // ── Categories ─────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCatName.trim() || !familyId) return;
    setAddingCat(true);
    await addCategory(familyId, newCatName.trim(), newCatIcon, newCatColor);
    setNewCatName('');
    setNewCatIconOpen(false);
    setAddingCat(false);
    toast.success('Category added');
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    toast.success('Category deleted');
  };

  const startEditCat = (cat: ICategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatColor(cat.color);
    setEditCatIcon(cat.icon || 'Tag');
    setEditCatIconOpen(false);
  };

  const handleSaveCategory = async () => {
    if (!editingCatId || !editCatName.trim()) return;
    setSavingCat(true);
    await updateCategory(editingCatId, editCatName.trim(), editCatColor, editCatIcon);
    toast.success('Category updated');
    setEditingCatId(null);
    setSavingCat(false);
  };

  // ── Accounts ───────────────────────────────────────────────
  const handleAddAccount = async () => {
    if (!newAccName.trim() || !familyId) return;
    setAddingAcc(true);
    try {
      await addAccount(familyId, newAccName.trim(), newAccIcon, newAccColor, newAccType);
      setNewAccName('');
      setNewAccIconOpen(false);
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

  const startEditAcc = (acc: IAccount) => {
    setEditingAccId(acc.id);
    setEditAccName(acc.name);
    setEditAccColor(acc.color.startsWith('#') ? acc.color : '#3b82f6');
    setEditAccType(acc.type);
    setEditAccIcon(acc.icon || 'CreditCard');
    setEditAccIconOpen(false);
  };

  const handleSaveAccount = async () => {
    if (!editingAccId || !editAccName.trim()) return;
    setSavingAcc(true);
    await updateAccount(editingAccId, editAccName.trim(), editAccColor, editAccType, editAccIcon);
    toast.success('Account updated');
    setEditingAccId(null);
    setSavingAcc(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = profile?.displayName || user?.email || '';
  const ACC_TYPES = ['card', 'cash', 'bank', 'savings', 'credit'] as const;

  return (
    <div className="space-y-6">

      {/* ── Profile Card ─────────────────────────────────────── */}
      <div className="glass overflow-hidden rounded-[32px]">
        <div className="bg-brand-primary/10 px-6 py-10 flex flex-col items-center text-center">
          <div className={cn(
            "w-28 h-28 rounded-[40px] flex items-center justify-center mb-5 shadow-2xl border-4 border-white/10 relative transition-transform hover:scale-105",
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

          {isEditingProfile ? (
            <div className="flex flex-col items-center gap-3">
              <input
                type="text" value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-surface-900 text-center w-full max-w-[240px] px-4 py-3 rounded-2xl font-black text-surface-50 outline-none border border-white/10 focus:border-brand-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
              />
              <div className="flex gap-4">
                <button onClick={handleUpdateProfile} disabled={savingProfile}
                  className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:opacity-80 transition-opacity">
                  {savingProfile ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setIsEditingProfile(false)}
                  className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] hover:text-surface-300 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-surface-50 tracking-tighter">{displayName}</h2>
              <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.3em]">{user?.email}</p>
              <button onClick={() => setIsEditingProfile(true)}
                className="mt-4 px-6 py-2 rounded-full glass text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:bg-white/5 active:scale-95 transition-all">
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2-column grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ════════════ CATEGORIES ════════════════════════════ */}
        <div className="glass p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-4 px-1">
            <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center">
              <Tag className="w-6 h-6 text-brand-secondary" />
            </div>
            <h3 className="text-xl font-black text-surface-50 tracking-tight uppercase">Categories</h3>
          </div>

          {/* Category list */}
          <div className="grid grid-cols-1 gap-3">
            {categories.map((cat) => (
              <div key={cat.id}>
                {editingCatId === cat.id ? (
                  /* ── Edit mode ──────────────────────────────── */
                  <div className="bg-white/[0.07] rounded-[20px] p-4 border border-white/10 space-y-3">
                    {/* Row: color + icon button + name input */}
                    <div className="flex items-center gap-3">
                      <ColorSwatch value={editCatColor} onChange={setEditCatColor} />
                      {/* Icon selector toggle */}
                      <button
                        type="button"
                        onClick={() => setEditCatIconOpen((v) => !v)}
                        className="w-11 h-11 rounded-[14px] border-2 border-white/10 flex items-center justify-center shrink-0 transition-all hover:border-white/30 hover:bg-white/5"
                        style={{ color: editCatColor }}
                        title="Choose icon"
                      >
                        <LucideIcon name={editCatIcon} className="w-5 h-5" />
                      </button>
                      <input
                        type="text" value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                        className="flex-1 min-w-0 bg-surface-900/80 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-surface-50 border border-white/5 outline-none focus:border-brand-primary"
                        placeholder="Category name..."
                      />
                    </div>
                    {/* Icon picker */}
                    {editCatIconOpen && (
                      <IconPicker
                        value={editCatIcon}
                        onChange={(name) => { setEditCatIcon(name); setEditCatIconOpen(false); }}
                        accentColor={editCatColor}
                      />
                    )}
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => { setEditingCatId(null); setEditCatIconOpen(false); }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-500 hover:text-surface-300 hover:bg-white/5 transition-all active:scale-95">
                        <X className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={handleSaveCategory}
                        disabled={savingCat || !editCatName.trim()}
                        className="px-5 py-2 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all active:scale-95">
                        {savingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ──────────────────────────────── */
                  <div className="flex items-center gap-4 bg-white/5 rounded-[20px] p-4 border border-white/5 group hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-inner shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                      <LucideIcon name={cat.icon || 'Tag'} className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-surface-100 flex-1 truncate uppercase tracking-widest">{cat.name}</span>
                    <button type="button" onClick={() => startEditCat(cat)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-600 hover:text-brand-primary hover:bg-brand-primary/10 transition-all active:scale-95"
                      aria-label={`Edit ${cat.name}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDeleteCategory(cat.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-danger/40 hover:text-danger hover:bg-danger/10 transition-all active:scale-95"
                      aria-label={`Delete ${cat.name}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add category */}
          <div className="space-y-2">
            <div className="flex gap-2 bg-surface-900/40 p-2.5 rounded-[24px] border border-white/5 items-center">
              <div className="ml-1">
                <ColorSwatch value={newCatColor} onChange={setNewCatColor} size="sm" />
              </div>
              {/* Icon button */}
              <button
                type="button"
                onClick={() => setNewCatIconOpen((v) => !v)}
                className="w-9 h-9 rounded-xl border-2 border-white/10 flex items-center justify-center shrink-0 hover:border-white/30 hover:bg-white/5 transition-all"
                style={{ color: newCatColor }}
                title="Choose icon"
              >
                <LucideIcon name={newCatIcon} className="w-4 h-4" />
              </button>
              <input
                type="text" value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="bg-transparent flex-1 min-w-0 px-3 py-3 text-xs text-surface-50 placeholder:text-surface-700 outline-none font-black uppercase tracking-widest"
                placeholder="New Category Name..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button type="button" onClick={handleAddCategory}
                disabled={addingCat || !newCatName.trim()}
                className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all active:scale-90">
                {addingCat ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>
            {/* Icon picker for new category */}
            {newCatIconOpen && (
              <IconPicker
                value={newCatIcon}
                onChange={(name) => { setNewCatIcon(name); setNewCatIconOpen(false); }}
                accentColor={newCatColor}
              />
            )}
          </div>
        </div>

        {/* ════════════ ACCOUNTS ══════════════════════════════ */}
        <div className="glass p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-4 px-1">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-xl font-black text-surface-50 tracking-tight uppercase">Accounts</h3>
          </div>

          {/* Account list */}
          <div className="grid grid-cols-1 gap-3">
            {accounts.map((acc) => {
              const hexColor = acc.color.startsWith('#') ? acc.color : '#3b82f6';
              return (
                <div key={acc.id}>
                  {editingAccId === acc.id ? (
                    /* ── Edit mode ──────────────────────────────── */
                    <div className="bg-white/[0.07] rounded-[20px] p-4 border border-white/10 space-y-3">
                      <div className="flex items-center gap-3">
                        <ColorSwatch value={editAccColor} onChange={setEditAccColor} />
                        {/* Icon selector toggle */}
                        <button
                          type="button"
                          onClick={() => setEditAccIconOpen((v) => !v)}
                          className="w-11 h-11 rounded-[14px] border-2 border-white/10 flex items-center justify-center shrink-0 transition-all hover:border-white/30 hover:bg-white/5"
                          style={{ color: editAccColor }}
                          title="Choose icon"
                        >
                          <LucideIcon name={editAccIcon} className="w-5 h-5" />
                        </button>
                        <input
                          type="text" value={editAccName}
                          onChange={(e) => setEditAccName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveAccount()}
                          className="flex-1 min-w-0 bg-surface-900/80 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-surface-50 border border-white/5 outline-none focus:border-brand-primary"
                          placeholder="Account name..."
                        />
                      </div>
                      {/* Icon picker */}
                      {editAccIconOpen && (
                        <IconPicker
                          value={editAccIcon}
                          onChange={(name) => { setEditAccIcon(name); setEditAccIconOpen(false); }}
                          accentColor={editAccColor}
                        />
                      )}
                      {/* Type chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {ACC_TYPES.map((t) => (
                          <button key={t} type="button" onClick={() => setEditAccType(t)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                              editAccType === t
                                ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105"
                                : "bg-white/5 text-surface-600 hover:bg-white/10 hover:text-surface-400"
                            )}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setEditingAccId(null); setEditAccIconOpen(false); }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-500 hover:text-surface-300 hover:bg-white/5 transition-all active:scale-95">
                          <X className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={handleSaveAccount}
                          disabled={savingAcc || !editAccName.trim()}
                          className="px-5 py-2 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all active:scale-95">
                          {savingAcc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ──────────────────────────────── */
                    <div className="flex items-center gap-4 bg-white/5 rounded-[20px] p-4 border border-white/5 group hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-inner shrink-0"
                        style={{ backgroundColor: `${hexColor}20`, color: hexColor }}>
                        <LucideIcon name={acc.icon || 'CreditCard'} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-surface-100 truncate uppercase tracking-widest leading-none mb-1">{acc.name}</p>
                        <p className="text-[10px] font-black text-surface-600 uppercase tracking-[0.2em]">{acc.type}</p>
                      </div>
                      <button type="button" onClick={() => startEditAcc(acc)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-600 hover:text-brand-primary hover:bg-brand-primary/10 transition-all active:scale-95"
                        aria-label={`Edit ${acc.name}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteAccount(acc.id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-danger/40 hover:text-danger hover:bg-danger/10 transition-all active:scale-95"
                        aria-label={`Delete ${acc.name}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add account */}
          <div className="space-y-2">
            {/* Type chips */}
            <div className="flex flex-wrap gap-1.5 px-1">
              {ACC_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setNewAccType(t)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                    newAccType === t
                      ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105"
                      : "bg-white/5 text-surface-600 hover:bg-white/10 hover:text-surface-400"
                  )}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2 bg-surface-900/40 p-2.5 rounded-[24px] border border-white/5 items-center">
              <div className="ml-1">
                <ColorSwatch value={newAccColor} onChange={setNewAccColor} size="sm" />
              </div>
              {/* Icon button */}
              <button
                type="button"
                onClick={() => setNewAccIconOpen((v) => !v)}
                className="w-9 h-9 rounded-xl border-2 border-white/10 flex items-center justify-center shrink-0 hover:border-white/30 hover:bg-white/5 transition-all"
                style={{ color: newAccColor }}
                title="Choose icon"
              >
                <LucideIcon name={newAccIcon} className="w-4 h-4" />
              </button>
              <input
                type="text" value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                className="bg-transparent flex-1 min-w-0 px-3 py-3 text-xs text-surface-50 placeholder:text-surface-700 outline-none font-black uppercase tracking-widest"
                placeholder="New Account Name..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
              />
              <button type="button" onClick={handleAddAccount}
                disabled={addingAcc || !newAccName.trim()}
                className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all active:scale-90">
                {addingAcc ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>
            {/* Icon picker for new account */}
            {newAccIconOpen && (
              <IconPicker
                value={newAccIcon}
                onChange={(name) => { setNewAccIcon(name); setNewAccIconOpen(false); }}
                accentColor={newAccColor}
              />
            )}
          </div>
        </div>

      </div>{/* end grid */}

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="space-y-4 pt-6 pb-4">
        <button type="button" onClick={handleExitFamily}
          className="w-full py-5 rounded-[24px] bg-danger/5 border border-danger/10 text-danger text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-danger/10 active:scale-[0.98]">
          <Users className="w-5 h-5 opacity-60" />
          Leave Family Space
        </button>
        <button type="button" onClick={handleLogout}
          className="w-full py-5 rounded-[24px] bg-surface-900/50 border border-white/5 text-surface-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-white/5 hover:text-surface-300 active:scale-[0.98]">
          <LogOut className="w-5 h-5 opacity-40" />
          Sign Out of Account
        </button>
      </div>

      <div className="h-28" />
    </div>
  );
}
