import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { db } from './db';
import { 
  type IUserProfile, 
  mapProfileFromRow, 
  mapProfileToRow 
} from './types';

interface IAuthStore {
  user: User | null;
  profile: IUserProfile | null;
  session: Session | null;
  familyId: string | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  setFamilyId: (id: string) => void;
  fetchFamilyId: (userId: string) => Promise<string | null>;
  fetchProfile: (userId: string) => Promise<IUserProfile | null>;
  updateProfile: (updates: Partial<IUserProfile>) => Promise<{ error: string | null }>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  exitFamily: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      familyId: null,
      loading: true,
      initialized: false,

  fetchFamilyId: async (userId: string) => {
    console.log('[AuthStore] Fetching family for user:', userId);
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthStore] Error fetching family:', error.message);
        return null;
      }

      const id = data?.family_id as string || null;
      console.log('[AuthStore] Family found:', id);
      set({ familyId: id });
      return id;
    } catch (err) {
      console.error('[AuthStore] Unexpected error fetching family:', err);
      return null;
    }
  },

  fetchProfile: async (userId: string) => {
    try {
      // 1. Try local cache first
      const cached = await db.profiles.get(userId);
      if (cached) {
        set({ profile: cached });
      }

      // 2. Fetch from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthStore] Error fetching profile:', error.message);
        return cached || null;
      }

      if (data) {
        const profile = mapProfileFromRow(data);
        set({ profile });
        await db.profiles.put(profile); // Update cache
        return profile;
      }

      // 3. If no profile exists, create a default one
      const newProfile: IUserProfile = {
        id: userId,
        email: get().user?.email || '',
        displayName: get().user?.user_metadata?.display_name || get().user?.email || 'User',
        avatarIcon: 'user',
        avatarBg: 'linear-gradient(135deg, #1d1d2b 0%, #11111d 100%)',
        currency: 'EUR',
        language: 'ru',
      };

      const { error: pError } = await supabase
        .from('profiles')
        .insert(mapProfileToRow(newProfile));

      if (pError) {
        console.error('[AuthStore] Error creating default profile:', pError.message);
      } else {
        set({ profile: newProfile });
        await db.profiles.put(newProfile);
        return newProfile;
      }

      return cached || null;
    } catch (err) {
      console.error('[AuthStore] Unexpected error fetching profile:', err);
      return null;
    }
  },

  updateProfile: async (updates: Partial<IUserProfile>) => {
    const { user, profile } = get();
    if (!user || !profile) return { error: 'No user or profile' };

    const updatedProfile = { ...profile, ...updates };

    try {
      // Optimistic update
      set({ profile: updatedProfile });
      await db.profiles.put(updatedProfile);

      // Supabase update
      const { error } = await supabase
        .from('profiles')
        .update(mapProfileToRow(updatedProfile))
        .eq('id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('[AuthStore] Profile update failed:', err);
      // Rollback
      set({ profile });
      await db.profiles.put(profile);
      return { error: err.message };
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
      });

      // If user exists, restore profile and family
      if (session?.user) {
        await get().fetchProfile(session.user.id);
        await get().fetchFamilyId(session.user.id);
      }

      set({ loading: false, initialized: true });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthStore] Auth event:', event);
        
        const user = session?.user ?? null;
        
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && user) {
          // Double ensure state is updated
          set({ session, user, loading: true });
          await Promise.all([
            get().fetchProfile(user.id),
            get().fetchFamilyId(user.id)
          ]);
          set({ loading: false });
        } else if (event === 'SIGNED_OUT') {
          set({ session: null, user: null, familyId: null, profile: null, loading: false });
        } else {
          set({ session, user });
        }
      });
    } catch (err) {
      console.error('[AuthStore] Initialization failed:', err);
      set({ loading: false, initialized: true });
    }
  },

  setFamilyId: (id: string) => set({ familyId: id }),

  login: async (email: string, password: string) => {
    set({ loading: true });
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      set({ loading: false });
      return { error: error.message };
    }

    if (data.user) {
      await get().fetchProfile(data.user.id);
      await get().fetchFamilyId(data.user.id);
    }

    set({ loading: false });
    return { error: null };
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile record
        const newProfile: IUserProfile = {
          id: data.user.id,
          email,
          displayName,
          avatarIcon: 'user',
          avatarBg: 'linear-gradient(135deg, #1d1d2b 0%, #11111d 100%)',
          currency: 'EUR',
          language: 'ru',
        };

        const { error: pError } = await supabase
          .from('profiles')
          .insert(mapProfileToRow(newProfile));

        if (pError) console.error('[AuthStore] Profile creation failed:', pError.message);
        
        set({ profile: newProfile });
        await db.profiles.put(newProfile);
      }

      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      set({ loading: false });
      return { error: err.message };
    }
  },

  verifyOtp: async (email: string, token: string) => {
    set({ loading: true });
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    
    if (error) {
      set({ loading: false });
      return { error: error.message };
    }

    set({
      session,
      user: session?.user ?? null,
    });

    if (session?.user) {
      await get().fetchProfile(session.user.id);
      await get().fetchFamilyId(session.user.id);
    }

    set({ loading: false });
    return { error: null };
  },

  exitFamily: async () => {
    const { user, familyId } = get();
    if (!user || !familyId) return { error: 'Not in a family' };

    set({ loading: true });
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('user_id', user.id)
        .eq('family_id', familyId);

      if (error) throw error;

      // 1. Clear state
      set({ familyId: null });

      // 2. Clear local cache (except profile)
      await Promise.all([
        db.families.clear(),
        db.expenses.clear(),
        db.categories.clear(),
        db.accounts.clear(),
      ]);

      set({ loading: false });
      return { error: null };
    } catch (err: any) {
      console.error('[AuthStore] Error exiting family:', err);
      set({ loading: false });
      return { error: err.message };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    // Profile and familyId are mostly cleared by onAuthStateChange, 
    // but we ensure it here too.
    set({ user: null, session: null, familyId: null, profile: null });
    // Note: we don't clear the whole DB on logout, only on exitFamily.
  },
}),
{
  name: 'family-auth-storage',
  partialize: (state) => ({ familyId: state.familyId }), // Only persist familyId
}
)
);

