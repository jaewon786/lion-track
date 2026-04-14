import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import type { Profile } from '../types'

let authListenerRegistered = false

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
    // 초기 세션 복원
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({ user: profile ?? null, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      set({ user: null, loading: false })
    }

    // 이후 로그인/로그아웃 감지
    if (!authListenerRegistered) {
      authListenerRegistered = true
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'INITIAL_SESSION') return
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          set({ user: profile ?? null, loading: false })
          queryClient.invalidateQueries()
        } else {
          set({ user: null, loading: false })
          queryClient.clear()
        }
      })
    }
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
