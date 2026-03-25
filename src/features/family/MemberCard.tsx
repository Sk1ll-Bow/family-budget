import React from 'react';
import { cn } from '../../core/cn';
import type { IFamilyMemberProfile } from './familyService';

interface IMemberCardProps {
  member: IFamilyMemberProfile;
  isCurrentUser: boolean;
}

/** Extracts initials from a display name for the avatar fallback. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * A card representing a single family member.
 * Displays an avatar (gradient bg + initials), display name and an optional "You" badge.
 */
export const MemberCard = React.memo(function MemberCard({ member, isCurrentUser }: IMemberCardProps) {
  const initials = getInitials(member.displayName);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-4 p-5 rounded-[28px] border transition-all duration-300',
        'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10',
        isCurrentUser && 'border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10'
      )}
    >
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-[22px] flex items-center justify-center text-white text-xl font-black tracking-tight shadow-2xl border-2 border-white/10 select-none"
        style={{ background: member.avatarBg }}
      >
        {initials}
      </div>

      {/* Name */}
      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-black text-surface-50 truncate tracking-tight leading-snug">
          {member.displayName}
        </p>
      </div>

      {/* "You" badge */}
      {isCurrentUser && (
        <span className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-brand-primary text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/30">
          You
        </span>
      )}
    </div>
  );
});
