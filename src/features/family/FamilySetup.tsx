import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowRight, Copy, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { supabase } from '../../core/supabase';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type SetupMode = 'choose' | 'create' | 'join';

/** Default categories seeded when a new family is created. */
const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'utensils', color: '#f59e0b' },
  { name: 'Transport', icon: 'car', color: '#3b82f6' },
  { name: 'Housing', icon: 'home', color: '#8b5cf6' },
  { name: 'Health', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Leisure', icon: 'clapperboard', color: '#ec4899' },
  { name: 'Shopping', icon: 'shirt', color: '#06b6d4' },
  { name: 'Other', icon: 'tag', color: '#6b7280' },
];

const DEFAULT_ACCOUNTS = [
  { name: 'Cash', icon: 'banknote' },
  { name: 'Card', icon: 'credit-card' },
];

/**
 * Family setup screen shown after first login.
 * Users can create a new family or join an existing one via invite code.
 */
export function FamilySetup() {
  const navigate = useNavigate();
  const { user, setFamilyId } = useAuthStore();
  const [mode, setMode] = useState<SetupMode>('choose');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const fetchFamilyId = useAuthStore((s) => s.fetchFamilyId);

  useEffect(() => {
    setChecking(false);
  }, []);

  const handleCreate = async () => {
    if (!familyName.trim() || !user) return;
    setLoading(true);

    try {
      const existing = await fetchFamilyId(user.id);
      if (existing) {
        toast.error('You are already in a family. Redirecting...');
        navigate('/', { replace: true });
        return;
      }

      const familyId = uuidv4();

      const { error: famError } = await supabase
        .from('families')
        .insert({ id: familyId, name: familyName.trim(), owner_id: user.id });

      if (famError) throw famError;

      const { error: memError } = await supabase
        .from('family_members')
        .insert({ family_id: familyId, user_id: user.id });

      if (memError) throw memError;

      const categories = DEFAULT_CATEGORIES.map((c, i) => ({
        family_id: familyId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        sort_order: i,
      }));
      await supabase.from('categories').insert(categories);

      const accounts = DEFAULT_ACCOUNTS.map((a) => ({
        family_id: familyId,
        name: a.name,
        icon: a.icon,
      }));
      await supabase.from('accounts').insert(accounts);

      setFamilyId(familyId);
      toast.success('Family created!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating family';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !user) return;
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('join_family_by_code', {
        invite_code_param: inviteCode.trim().toUpperCase(),
      });

      if (rpcError) throw rpcError;

      const result = data as { success: boolean; error?: string; family_id?: string; family_name?: string };

      if (!result.success) {
        toast.error(result.error || 'Join error');
        setLoading(false);
        return;
      }

      setFamilyId(result.family_id as string);
      toast.success(`You've joined "${result.family_name}"!`);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Join error';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 relative">
      <div className="ambient-bg" />
      <div className="spotlight" />

      <div className="glass p-10 w-full max-w-md rounded-[40px] shadow-modal border border-white/5 relative z-10 animate-scale-in">
        {mode === 'choose' && (
          <>
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-brand-primary/10 mb-8 shadow-glow relative group transition-transform hover:scale-110 duration-500">
                <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="w-12 h-12 text-brand-primary relative z-10" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-4">Almost Ready!</h1>
              <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] mt-3 max-w-[280px] mx-auto leading-relaxed">
                We couldn't find your team. Create a new family space or join an existing one.
              </p>
            </div>

            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setMode('create')}
                className="w-full glass p-8 rounded-[32px] flex items-center gap-6 cursor-pointer group hover:bg-white/5 transition-all border-white/5"
              >
                <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/20 transition-all shadow-inner">
                  <Plus className="w-8 h-8 text-brand-primary" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-black text-white uppercase tracking-widest">Create Family</p>
                  <p className="text-[10px] font-black text-surface-600 mt-1 uppercase tracking-widest">Start a new story</p>
                </div>
                <ArrowRight className="w-6 h-6 text-surface-601 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => setMode('join')}
                className="w-full glass p-8 rounded-[32px] flex items-center gap-6 cursor-pointer group hover:bg-white/5 transition-all border-white/5"
              >
                <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/20 transition-all shadow-inner">
                  <Users className="w-8 h-8 text-brand-primary" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-black text-white uppercase tracking-widest">Join Family</p>
                  <p className="text-[10px] font-black text-surface-600 mt-1 uppercase tracking-widest">By invite code</p>
                </div>
                <ArrowRight className="w-6 h-6 text-surface-601 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <div className="space-y-8 animate-scale-in">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-brand-primary/10 mb-6 shadow-glow border border-brand-primary/20 group-hover:scale-110 transition-transform duration-500">
                <Plus className="w-10 h-10 text-brand-primary" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Create Space</h2>
              <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em]">Pick a name for your team</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">Family Name</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="bg-surface-900/40 w-full px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white border border-white/5 outline-none focus:border-brand-primary/50 transition-all"
                  placeholder="e.g. The Johnsons"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={loading || !familyName.trim()}
                className="w-full h-16 rounded-[24px] bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-glow flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 group mt-4"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    Create Family
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.4em] text-surface-601 hover:text-white transition-colors"
                disabled={loading}
              >
                Back to Options
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-8 animate-scale-in">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-brand-primary/10 mb-6 shadow-glow border border-brand-primary/20 group-hover:scale-110 transition-transform duration-500">
                <Users className="w-10 h-10 text-brand-primary" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Join Space</h2>
              <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em]">Enter 6-character code</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] px-1">Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="bg-surface-900/40 w-full px-6 py-6 rounded-3xl text-center tracking-[0.5em] font-black text-2xl text-brand-primary border border-white/5 outline-none focus:border-brand-primary/50 transition-all placeholder:text-surface-800"
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleJoin}
                disabled={loading || !inviteCode.trim()}
                className="w-full h-16 rounded-[24px] bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-glow flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 group mt-4"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    Join Family
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.4em] text-surface-601 hover:text-white transition-colors"
                disabled={loading}
              >
                Back to Options
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

