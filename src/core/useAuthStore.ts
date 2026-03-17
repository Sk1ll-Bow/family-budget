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

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });

      // If user exists, try to get their family
      if (session?.user) {
        const { data } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', session.user.id)
          .limit(1)
          .single();

        if (data) {
          set({ familyId: data.family_id as string });
        }
      }
    } catch {
      set({ loading: false, initialized: true });
    }
  },

  setFamilyId: (id: string) => set({ familyId: id }),

  login: async (email: string, password: string) => {
    set({ loading: true });
    console.log('[AuthStore] Attempting login for:', email);
    console.log('[AuthStore] Project URL:', import.meta.env.VITE_SUPABASE_URL);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('[AuthStore] Login failed:', error.message, error.status);
      set({ loading: false });
      return { error: error.message };
    }

    console.log('[AuthStore] Login successful for:', data.user?.email);
    set({ loading: false });

    // Fetch family after login
    const { user } = get();
    if (user) {
      const { data } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (data) set({ familyId: data.family_id as string });
    }

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
    set({ loading: false });
    
    if (error) return { error: error.message };

    set({
      session,
      user: session?.user ?? null,
    });

    return { error: null };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, familyId: null });
  },
}));
