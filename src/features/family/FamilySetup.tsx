import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowRight, Copy, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../core/supabase';
import { useAuthStore } from '../../core/useAuthStore';
import { cn } from '../../core/cn';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type SetupMode = 'choose' | 'create' | 'join';

/** Default categories seeded when a new family is created. */
const DEFAULT_CATEGORIES = [
  { name: 'Еда', icon: 'utensils', color: '#f59e0b' },
  { name: 'Транспорт', icon: 'car', color: '#3b82f6' },
  { name: 'ЖКХ', icon: 'home', color: '#8b5cf6' },
  { name: 'Здоровье', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Развлечения', icon: 'clapperboard', color: '#ec4899' },
  { name: 'Одежда', icon: 'shirt', color: '#06b6d4' },
  { name: 'Прочее', icon: 'tag', color: '#6b7280' },
];

const DEFAULT_ACCOUNTS = [
  { name: 'Наличные', icon: 'banknote' },
  { name: 'Карта', icon: 'credit-card' },
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

  // Auto-detect existing family on mount is now handled by RequireFamily in App.tsx
  // But we still want to ensure checking is false if we are actually here.
  useEffect(() => {
    setChecking(false);
  }, []);

  const handleCreate = async () => {
    if (!familyName.trim() || !user) return;
    setLoading(true);

    try {
      // Safety check: is user already in a family?
      const existing = await fetchFamilyId(user.id);
      if (existing) {
        toast.error('Вы уже состоите в семье. Перенаправляем...');
        navigate('/', { replace: true });
        return;
      }

      const familyId = uuidv4();

      // Create family
      const { error: famError } = await supabase
        .from('families')
        .insert({ id: familyId, name: familyName.trim(), owner_id: user.id });

      if (famError) throw famError;

      // Add self as member
      const { error: memError } = await supabase
        .from('family_members')
        .insert({ family_id: familyId, user_id: user.id });

      if (memError) throw memError;

      // Seed default categories
      const categories = DEFAULT_CATEGORIES.map((c, i) => ({
        family_id: familyId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        sort_order: i,
      }));
      await supabase.from('categories').insert(categories);

      // Seed default accounts
      const accounts = DEFAULT_ACCOUNTS.map((a) => ({
        family_id: familyId,
        name: a.name,
        icon: a.icon,
      }));
      await supabase.from('accounts').insert(accounts);

      setFamilyId(familyId);
      toast.success('Семья создана!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка создания семьи';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !user) return;
    setLoading(true);

    try {
      // Find family by invite code
      const { data: family, error: findError } = await supabase
        .from('families')
        .select('id, name')
        .eq('invite_code', inviteCode.trim().toLowerCase())
        .single();

      if (findError || !family) {
        toast.error('Семья с таким кодом не найдена');
        setLoading(false);
        return;
      }

      // Join family
      const { error: joinError } = await supabase
        .from('family_members')
        .insert({ family_id: family.id, user_id: user.id });

      if (joinError) {
        if (joinError.code === '23505' || joinError.message.includes('unique')) {
          toast.error('Вы уже состоите в этой или другой семье');
          await fetchFamilyId(user.id);
          navigate('/', { replace: true });
        } else {
          throw joinError;
        }
        setLoading(false);
        return;
      }

      setFamilyId(family.id as string);
      toast.success(`Вы присоединились к "${family.name}"!`);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка присоединения';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative">
      <div className="ambient-glow w-full h-full" />

      <div className="glass-card p-8 w-full max-w-md animate-scale-in relative z-10">
        {mode === 'choose' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/15 mb-4">
                <Sparkles className="w-8 h-8 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-surface-100">Почти готово!</h1>
              <p className="text-surface-400 text-sm mt-1">
                Мы не нашли вашу семью. Давайте создадим новую или присоединимся к существующей.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setMode('create')}
                className="w-full glass-card p-5 flex items-center gap-4 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-primary/15 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/25 transition-colors">
                  <Plus className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-surface-100">Создать семью</p>
                  <p className="text-surface-400 text-sm">Начните отслеживать расходы</p>
                </div>
                <ArrowRight className="w-5 h-5 text-surface-400 ml-auto shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setMode('join')}
                className="w-full glass-card p-5 flex items-center gap-4 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-secondary/15 flex items-center justify-center shrink-0 group-hover:bg-brand-secondary/25 transition-colors">
                  <Users className="w-6 h-6 text-brand-secondary" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-surface-100">Присоединиться</p>
                  <p className="text-surface-400 text-sm">Введите код приглашения</p>
                </div>
                <ArrowRight className="w-5 h-5 text-surface-400 ml-auto shrink-0" />
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-surface-100">Создание семьи</h2>
              <p className="text-surface-400 text-sm mt-1">Выберите название для вашей семьи</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm focus-ring"
                placeholder="Например, Ивановы"
                autoFocus
              />

              <button
                type="button"
                onClick={handleCreate}
                disabled={loading || !familyName.trim()}
                className="btn btn-primary btn-lg w-full"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Создать'}
              </button>

              <button
                type="button"
                onClick={() => setMode('choose')}
                className="btn btn-ghost btn-md w-full"
              >
                Назад
              </button>
            </div>
          </>
        )}

        {mode === 'join' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-surface-100">Присоединиться</h2>
              <p className="text-surface-400 text-sm mt-1">Введите код приглашения от члена семьи</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="glass-input w-full px-4 py-3 text-sm focus-ring font-mono tracking-widest text-center uppercase"
                placeholder="ABCD1234"
                maxLength={8}
                autoFocus
              />

              <button
                type="button"
                onClick={handleJoin}
                disabled={loading || !inviteCode.trim()}
                className="btn btn-primary btn-lg w-full"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Присоединиться'}
              </button>

              <button
                type="button"
                onClick={() => setMode('choose')}
                className="btn btn-ghost btn-md w-full"
              >
                Назад
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
