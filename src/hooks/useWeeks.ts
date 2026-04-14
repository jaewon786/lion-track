import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Week } from '../types'

export function useWeeks() {
  const user = useAuthStore((s) => s.user)
  const activeTrack = useAuthStore((s) => s.activeTrack)
  return useQuery({
    queryKey: ['weeks', activeTrack],
    queryFn: async (): Promise<Week[]> => {
      const { data, error } = await supabase
        .from('weeks')
        .select('*')
        .eq('track', activeTrack)
        .order('number', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useWeek(weekId: string | undefined) {
  return useQuery({
    queryKey: ['weeks', weekId],
    queryFn: async (): Promise<Week> => {
      const { data, error } = await supabase
        .from('weeks')
        .select('*')
        .eq('id', weekId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!weekId,
  })
}

type CreateWeekInput = Pick<Week, 'number' | 'title' | 'description' | 'session_date' | 'status'>
type UpdateWeekInput = Partial<Pick<Week, 'title' | 'description' | 'session_date' | 'status'>>

export function useCreateWeek() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateWeekInput & { track: string }): Promise<Week> => {
      const { data, error } = await supabase
        .from('weeks')
        .insert(input)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] })
    },
  })
}

export function useUpdateWeek() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateWeekInput): Promise<Week> => {
      const { data, error } = await supabase
        .from('weeks')
        .update(input)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] })
    },
  })
}

export function useDeleteWeek() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weeks')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] })
    },
  })
}
