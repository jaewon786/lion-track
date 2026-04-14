import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Question, Answer } from '../types'

export function useQuestions() {
  const user = useAuthStore((s) => s.user)
  const activeTrack = useAuthStore((s) => s.activeTrack)
  return useQuery({
    queryKey: ['questions', activeTrack],
    queryFn: async (): Promise<Question[]> => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('track', activeTrack)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useQuestion(id: string | undefined) {
  return useQuery({
    queryKey: ['questions', id],
    queryFn: async (): Promise<Question> => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useAnswers(questionId: string | undefined) {
  return useQuery({
    queryKey: ['answers', questionId],
    queryFn: async (): Promise<Answer[]> => {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', questionId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!questionId,
  })
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (question: Omit<Question, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('questions')
        .insert(question)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { data, error } = await supabase
        .from('questions')
        .update({ title, content })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      queryClient.invalidateQueries({ queryKey: ['questions', vars.id] })
    },
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('질문 삭제 권한이 없거나 대상 질문을 찾을 수 없습니다.')
      return true
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['questions'], (old: Question[] | undefined) =>
        (old ?? []).filter((q) => q.id !== id)
      )
      queryClient.removeQueries({ queryKey: ['questions', id] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}

export function useCreateAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (answer: Omit<Answer, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('answers')
        .insert(answer)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['answers', vars.question_id] })
    },
  })
}

export function useDeleteAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, questionId }: { id: string; questionId: string }) => {
      const { data, error } = await supabase
        .from('answers')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('답변 삭제 권한이 없거나 대상 답변을 찾을 수 없습니다.')
      return questionId
    },
    onSuccess: (questionId) => {
      queryClient.invalidateQueries({ queryKey: ['answers', questionId] })
    },
  })
}
