import { useState, useEffect, useCallback } from 'react';
import { Users, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../core/useAuthStore';
import { fetchFamilyDetails } from './familyService';
import type { IFamilyDetails } from './familyService';
import { MemberCard } from './MemberCard';
import { cn } from '../../core/cn';
import { toast } from 'sonner';

/**
 * Family Management page – shows invite code and a grid of all family members.
 */
export function FamilyManagementPage() {
  const { familyId, user } = useAuthStore();
  const [details, setDetails] = useState<IFamilyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    const data = await fetchFamilyDetails(familyId);
    setDetails(data);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = async () => {
    if (!details?.family.inviteCode) return;
    await navigator.clipboard.writeText(details.family.inviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div>
          <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.3em] mb-1">
            Manage
          </p>
          <h1 className="text-3xl font-black text-surface-50 tracking-tighter leading-none">
            Family Space
          </h1>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="w-11 h-11 rounded-2xl glass border border-white/10 flex items-center justify-center text-surface-400 hover:text-surface-100 transition-all active:scale-90 cursor-pointer"
          aria-label="Refresh"
        >
          <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
        </button>
      </div>

      {loading && !details ? (
        /* Skeleton state */
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
          <p className="text-[10px] font-black text-surface-600 uppercase tracking-[0.3em]">
            Loading family…
          </p>
        </div>
      ) : !details ? (
        <div className="glass p-8 rounded-[32px] text-center space-y-3">
          <p className="text-surface-400 font-black text-sm uppercase tracking-widest">
            Could not load family data.
          </p>
          <button
            type="button"
            onClick={load}
            className="px-6 py-3 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* ── Family Name + Code ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="glass p-8 rounded-[32px] space-y-6"
          >
            {/* Family name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[20px] bg-brand-primary/10 flex items-center justify-center shrink-0 shadow-glow">
                <Users className="w-7 h-7 text-brand-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-surface-600 uppercase tracking-[0.2em] mb-1">
                  Family Name
                </p>
                <h2 className="text-xl font-black text-surface-50 tracking-tight truncate">
                  {details.family.name}
                </h2>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Invite code */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] text-center">
                Family Code
              </p>
              <div className="flex items-center gap-3">
                <div className="bg-surface-900/50 flex-1 min-w-0 px-6 py-4 text-2xl font-black tracking-[0.5em] text-brand-primary rounded-[20px] border border-white/5 shadow-inner select-all text-center">
                  {details.family.inviteCode.toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    'w-14 h-14 shrink-0 rounded-[20px] flex items-center justify-center transition-all active:scale-90 shadow-2xl cursor-pointer',
                    copied
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                      : 'bg-brand-primary text-white shadow-brand-primary/30'
                  )}
                  aria-label="Copy invite code"
                >
                  {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-[10px] font-bold text-surface-600 text-center opacity-70">
                Share this code to invite members to your family.
              </p>
            </div>
          </motion.div>

          {/* ── Members Grid ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass p-8 rounded-[32px] space-y-5"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-black text-surface-50 tracking-tight uppercase">
                Members
              </h3>
              <span className="px-3 py-1.5 rounded-full bg-white/5 text-[10px] font-black text-surface-400 uppercase tracking-widest">
                {details.members.length}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {details.members.map((member) => (
                <MemberCard
                  key={member.userId}
                  member={member}
                  isCurrentUser={member.userId === user?.id}
                />
              ))}
            </div>

            {details.members.length === 0 && (
              <p className="text-center text-[10px] font-black text-surface-600 uppercase tracking-[0.2em] py-6">
                No members found.
              </p>
            )}
          </motion.div>
        </>
      )}

      {/* Bottom padding for nav */}
      <div className="h-28" />
    </div>
  );
}
