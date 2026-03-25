import { supabase } from '../../core/supabase';
import type { IFamily } from '../../core/types';

/** A family member enriched with their profile data. */
export interface IFamilyMemberProfile {
  userId: string;
  displayName: string;
  avatarIcon: string;
  avatarBg: string;
  joinedAt: string;
}

export interface IFamilyDetails {
  family: IFamily;
  members: IFamilyMemberProfile[];
}

/**
 * Fetches family info and all member profiles in a single query.
 * Returns null if the family is not found or an error occurs.
 */
export async function fetchFamilyDetails(familyId: string): Promise<IFamilyDetails | null> {
  // 1. Fetch family row
  const { data: famRow, error: famError } = await supabase
    .from('families')
    .select('id, name, owner_id, invite_code, created_at')
    .eq('id', familyId)
    .maybeSingle();

  if (famError || !famRow) {
    console.error('[familyService] Error fetching family:', famError?.message);
    return null;
  }

  const family: IFamily = {
    id: famRow.id as string,
    name: famRow.name as string,
    ownerId: famRow.owner_id as string,
    inviteCode: famRow.invite_code as string,
    createdAt: famRow.created_at as string,
  };

  // 2. Fetch members joined with profiles
  const { data: memberRows, error: memError } = await supabase
    .from('family_members')
    .select('user_id, joined_at, profiles(display_name, avatar_icon, avatar_bg)')
    .eq('family_id', familyId)
    .order('joined_at', { ascending: true });

  if (memError) {
    console.error('[familyService] Error fetching members:', memError.message);
    // Return family with empty members list rather than null
    return { family, members: [] };
  }

  const members: IFamilyMemberProfile[] = (memberRows ?? []).map((row) => {
    // Supabase can return the joined profile as an object or an array depending on metadata
    const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const profile = profileData as Record<string, unknown> | null;
    return {
      userId: row.user_id as string,
      displayName: (profile?.display_name as string) || 'Unknown Member',
      avatarIcon: (profile?.avatar_icon as string) || 'user',
      avatarBg: (profile?.avatar_bg as string) || 'linear-gradient(135deg, #1d1d2b 0%, #11111d 100%)',
      joinedAt: row.joined_at as string,
    };
  });

  return { family, members };
}
