import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Attendance } from '../types'

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId!)
  }
}

export function useMyAttendance() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['attendances', 'my'],
    queryFn: async (): Promise<Attendance[]> => {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('user_id', user!.id)
        .order('checked_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useAllAttendances() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['attendances', 'all'],
    queryFn: async (): Promise<Attendance[]> => {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
      if (error) throw error
      return data
    },
    enabled: !!user,
    refetchInterval: 5000,
  })
}

// 현재 활성화된(만료되지 않은) 출석 코드를 조회하여 활성 세션 판단
export function useActiveAttendCode() {
  return useQuery({
    queryKey: ['attend_codes', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attend_codes')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as { id: string; week_id: string; code: string; expires_at: string } | null
    },
    refetchInterval: 10000, // 10초마다 폴링
  })
}

export function useCheckAttendance() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({ code, weekId }: { code: string; weekId: string }) => {
      // 코드 검증
      const verifyPromise = (async () => {
        return await supabase
          .from('attend_codes')
          .select('id')
          .eq('week_id', weekId)
          .eq('code', code)
          .gte('expires_at', new Date().toISOString())
          .maybeSingle()
      })()

      const { data: codeData, error: codeError } = await withTimeout(
        verifyPromise, 15000, '출석 확인이 지연되고 있습니다.'
      )

      if (codeError) throw codeError
      if (!codeData) {
        throw new Error('출석 코드가 올바르지 않거나 만료되었습니다.')
      }

      // 기존 출석 기록 확인 (PENDING 상태일 수 있음)
      const existingPromise = (async () => {
        return await supabase
          .from('attendances')
          .select('id')
          .eq('week_id', weekId)
          .eq('user_id', user!.id)
          .maybeSingle()
      })()

      const { data: existing } = await withTimeout(
        existingPromise, 15000, '출석 확인이 지연되고 있습니다.'
      )

      if (existing) {
        // 기존 레코드 UPDATE (PENDING → PRESENT)
        const updatePromise = (async () => {
          return await supabase
            .from('attendances')
            .update({ status: 'PRESENT', checked_at: new Date().toISOString() })
            .eq('id', existing.id)
        })()
        const { error } = await withTimeout(updatePromise, 15000, '출석 처리가 지연되고 있습니다.')
        if (error) throw error
      } else {
        // 새 레코드 INSERT
        const insertPromise = (async () => {
          return await supabase
            .from('attendances')
            .insert({
              week_id: weekId,
              user_id: user!.id,
              status: 'PRESENT',
            })
        })()
        const { error } = await withTimeout(insertPromise, 15000, '출석 처리가 지연되고 있습니다.')
        if (error) throw error
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] })
    },
  })
}

export function useCreateAttendCode() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({ weekId, code, expiresAt }: { weekId: string; code: string; expiresAt: string }) => {
      const insertPromise = (async () => {
        return await supabase
          .from('attend_codes')
          .insert({
            week_id: weekId,
            code,
            expires_at: expiresAt,
            created_by: user!.id,
          })
      })()

      const { error } = await withTimeout(
        insertPromise, 15000, '코드 생성이 지연되고 있습니다.'
      )
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attend_codes'] })
    },
  })
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ weekId, userId, status }: { weekId: string; userId: string; status: string }) => {
      if (status === 'PENDING') {
        // 미정으로 변경 시 기존 기록 삭제
        const { error } = await supabase
          .from('attendances')
          .delete()
          .eq('week_id', weekId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        // upsert: 기존 기록이 있으면 status 업데이트, 없으면 새로 생성
        const { error } = await supabase
          .from('attendances')
          .upsert(
            { week_id: weekId, user_id: userId, status, checked_at: new Date().toISOString() },
            { onConflict: 'week_id,user_id' }
          )
        if (error) throw error
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] })
    },
  })
}
