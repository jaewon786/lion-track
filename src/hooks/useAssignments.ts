import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Assignment, Submission } from '../types'

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

export function useAssignments() {
  const user = useAuthStore((s) => s.user)
  const activeTrack = useAuthStore((s) => s.activeTrack)
  return useQuery({
    queryKey: ['assignments', activeTrack],
    queryFn: async (): Promise<Assignment[]> => {
      const { data: trackWeeks } = await supabase
        .from('weeks')
        .select('id')
        .eq('track', activeTrack)
      const weekIds = (trackWeeks ?? []).map((w) => w.id)
      if (weekIds.length === 0) return []
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .in('week_id', weekIds)
        .order('due_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useAssignment(id: string | undefined) {
  return useQuery({
    queryKey: ['assignments', id],
    queryFn: async (): Promise<Assignment> => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useSubmissions(assignmentId?: string) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['submissions', assignmentId ?? 'all'],
    queryFn: async (): Promise<Submission[]> => {
      let query = supabase.from('submissions').select('*')
      if (assignmentId) query = query.eq('assignment_id', assignmentId)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useMySubmissions() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['submissions', 'my'],
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user!.id)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({
      assignmentId,
      githubUrl,
      fileUrl,
    }: {
      assignmentId: string
      githubUrl?: string
      fileUrl?: string
    }) => {
      const existingPromise = (async () => {
        return await supabase
          .from('submissions')
          .select('id')
          .eq('assignment_id', assignmentId)
          .eq('user_id', user!.id)
          .maybeSingle()
      })()

      const { data: existing, error: existingError } = await withTimeout(
        existingPromise,
        15000,
        '제출 조회가 지연되고 있습니다. 잠시 후 다시 시도해주세요.'
      )
      if (existingError) throw existingError

      const payload = {
        assignment_id: assignmentId,
        user_id: user!.id,
        github_url: githubUrl,
        file_url: fileUrl,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString(),
      }

      const submitPromise = existing?.id
        ? (async () => {
            return await supabase
              .from('submissions')
              .update({
                github_url: payload.github_url,
                file_url: payload.file_url,
                status: payload.status,
                submitted_at: payload.submitted_at,
              })
              .eq('id', existing.id)
          })()
        : (async () => {
            return await supabase
              .from('submissions')
              .insert(payload)
          })()

      const { error } = await withTimeout(
        submitPromise,
        15000,
        '제출 요청이 지연되고 있습니다. 잠시 후 다시 시도해주세요.'
      )

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}

export async function uploadSubmissionFile(assignmentId: string, userId: string, file: File) {
  const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : ''
  const baseName = file.name.slice(0, file.name.length - ext.length)
  const sanitized = baseName
    .replace(/[^\x20-\x7E]/g, '')   // 한글 등 비ASCII 제거
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 허용되지 않는 특수문자 → _
    .replace(/_{2,}/g, '_')            // 연속 _ 정리
    .replace(/^_+|_+$/g, '')           // 앞뒤 _ 제거
  const safeName = (sanitized || 'file') + ext
  const filePath = `assignment-${assignmentId}/${userId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage
    .from('submissions')
    .upload(filePath, file)

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('bucket') && msg.includes('not found')) {
      throw new Error('submissions 스토리지 버킷이 없습니다. Supabase Storage에 submissions 버킷을 생성해주세요.')
    }
    throw error
  }

  return filePath
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ assignmentId, userId, status }: { assignmentId: string; userId: string; status: 'submitted' | 'late' }) => {
      const { error } = await supabase
        .from('submissions')
        .upsert(
          { assignment_id: assignmentId, user_id: userId, status, submitted_at: new Date().toISOString() },
          { onConflict: 'assignment_id,user_id' }
        )
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}

export function useAdminDeleteSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ assignmentId, userId }: { assignmentId: string; userId: string }) => {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('assignment_id', assignmentId)
        .eq('user_id', userId)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (assignment: Omit<Assignment, 'id'>) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      try {
        const { error } = await supabase
          .from('assignments')
          .insert(assignment)
          .abortSignal(controller.signal)
        if (error) throw error
        return true
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('요청이 지연되고 있습니다. 잠시 후 다시 시도해주세요.')
        }
        throw err
      } finally {
        clearTimeout(timeoutId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Omit<Assignment, 'id'>> & { id: string }) => {
      const resultPromise = (async () => {
        return await supabase
          .from('assignments')
          .update(updates)
          .eq('id', id)
      })()

      const { error } = await withTimeout(
        resultPromise,
        15000,
        '수정 요청이 지연되고 있습니다. 잠시 후 다시 시도해주세요.'
      )
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const resultPromise = (async () => {
        return await supabase
          .from('assignments')
          .delete()
          .eq('id', id)
          .select('id')
          .maybeSingle()
      })()

      const { data, error } = await withTimeout(
        resultPromise,
        15000,
        '삭제 요청이 지연되고 있습니다. 잠시 후 다시 시도해주세요.'
      )

      if (error) throw error
      if (!data) {
        throw new Error('과제를 삭제하지 못했습니다. assignments DELETE 정책 또는 권한을 확인해주세요.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}

export async function downloadSubmissionFile(filePath: string, fileName?: string) {
  const getDisplayName = (path: string) => {
    const raw = decodeURIComponent(path.split('/').pop() || 'submission')
    return raw.replace(/^\d+-/, '')
  }

  // Legacy data may store a full URL instead of a storage path.
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    window.open(filePath, '_blank', 'noopener,noreferrer')
    return
  }

  // 1) Try direct authenticated download
  const { data, error } = await supabase.storage
    .from('submissions')
    .download(filePath)

  if (!error && data) {
    const blobUrl = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName || getDisplayName(filePath)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
    return
  }

  // 2) Fallback: signed URL (works if SELECT policy allows)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('submissions')
    .createSignedUrl(filePath, 60)

  if (!signedError && signedData?.signedUrl) {
    window.open(signedData.signedUrl, '_blank', 'noopener,noreferrer')
    return
  }

  // 3) Fallback: public URL (works if bucket is public)
  const { data: publicData } = supabase.storage
    .from('submissions')
    .getPublicUrl(filePath)

  if (publicData?.publicUrl) {
    // Verify that the public URL is accessible before opening
    try {
      const res = await fetch(publicData.publicUrl, { method: 'HEAD' })
      if (res.ok) {
        window.open(publicData.publicUrl, '_blank', 'noopener,noreferrer')
        return
      }
    } catch {
      // public URL also not accessible
    }
  }

  throw new Error('제출 파일 다운로드 권한이 없습니다. Supabase Storage의 submissions 버킷에 SELECT 정책을 추가해주세요.')
}
