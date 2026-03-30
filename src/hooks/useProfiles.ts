import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export function useProfiles() {
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
  })
}

export function useMembers() {
  return useQuery({
    queryKey: ['profiles', 'members'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'MEMBER')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
  })
}
