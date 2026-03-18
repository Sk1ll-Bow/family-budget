import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface IAuthStore {
  user: User | null;
  session: Session | null;
  familyId: string | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  setFamilyId: (id: string) => void;
  fetchFamilyId: (userId: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<IAuthStore>((set, get) => ({
  user: null,
  session: null,
  familyId: null,
  loading: true,
  initialized: false,

  fetchFamilyId: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('[AuthStore] Error fetching family:', error.message);
        }
        return null;
      }

      const id = data?.family_id as string;
      set({ familyId: id });
      return id;
    } catch (err) {
      console.error('[AuthStore] Unexpected error fetching family:', err);
      return null;
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
      });

      // If user exists, try to get their family
      if (session?.user) {
        await get().fetchFamilyId(session.user.id);
      }

      set({ loading: false, initialized: true });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthStore] Auth event:', event);
        
        const user = session?.user ?? null;
        set({ session, user });

        if (event === 'SIGNED_IN' && user) {
          await get().fetchFamilyId(user.id);
        } else if (event === 'SIGNED_OUT') {
          set({ familyId: null });
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
      await get().fetchFamilyId(data.user.id);
    }

    set({ loading: false });
    return { error: null };
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    set({ loading: false });
    return { error: error?.message ?? null };
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
      await get().fetchFamilyId(session.user.id);
    }

    set({ loading: false });
    return { error: null };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, familyId: null });
  },
}));

