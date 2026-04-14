import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Profile } from '../types'

export function useProfiles() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useMembers() {
  const user = useAuthStore((s) => s.user)
  const activeTrack = useAuthStore((s) => s.activeTrack)
  return useQuery({
    queryKey: ['profiles', 'members', activeTrack],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'MEMBER')
        .eq('track', activeTrack)
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}
