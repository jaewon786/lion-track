import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  user: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string, department: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      set({ user: profile, loading: false })
    } else {
      set({ user: null, loading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({ user: profile })
      } else {
        set({ user: null })
      }
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  },

  signUp: async (email, password, name, department) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, department },
      },
    })
    if (error) return { error: error.message }
    return {}
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore signOut errors
    } finally {
      set({ user: null, loading: false })
    }
  },
}))
