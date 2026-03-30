import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Notice } from '../types'

export function useNotices() {
  return useQuery({
    queryKey: ['notices'],
    queryFn: async (): Promise<Notice[]> => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useNotice(id: string | undefined) {
  return useQuery({
    queryKey: ['notices', id],
    queryFn: async (): Promise<Notice> => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notice: Omit<Notice, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('notices')
        .insert(notice)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
    },
  })
}

export function useUpdateNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { data, error } = await supabase
        .from('notices')
        .update({ title, content })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      queryClient.invalidateQueries({ queryKey: ['notices', vars.id] })
    },
  })
}

export function useDeleteNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle()
      if (error) throw error
      // RLS로 삭제 권한이 없으면 에러 없이 null이 반환될 수 있어 명시적으로 검증한다.
      if (!data) throw new Error('공지 삭제 권한이 없거나 대상 공지를 찾을 수 없습니다.')
      return true
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notices'], (old: Notice[] | undefined) =>
        (old ?? []).filter((n) => n.id !== id)
      )
      queryClient.removeQueries({ queryKey: ['notices', id] })
      queryClient.invalidateQueries({ queryKey: ['notices'] })
    },
  })
}
