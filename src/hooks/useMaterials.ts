import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Material } from '../types'

export function useMaterials(weekId?: string) {
  const user = useAuthStore((s) => s.user)
  const activeTrack = useAuthStore((s) => s.activeTrack)
  return useQuery({
    queryKey: ['materials', weekId ?? 'all', activeTrack],
    queryFn: async (): Promise<Material[]> => {
      let query = supabase.from('materials').select('*')
      if (weekId) query = query.eq('week_id', weekId)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 0,
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (material: Omit<Material, 'id'>) => {
      const { data, error } = await supabase
        .from('materials')
        .insert(material)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export async function uploadMaterialFile(weekId: string, file: File) {
  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ?? ''
  const safeFileName = ext ? `${Date.now()}.${ext}` : `${Date.now()}`
  const filePath = `week-${weekId}/${safeFileName}`
  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, file)
  if (uploadError) throw uploadError
  return filePath
}

export async function getMaterialDownloadUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from('materials')
    .createSignedUrl(filePath, 3600)
  if (error) throw error
  return data?.signedUrl
}

  export async function downloadFile(filePath: string, fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from('materials')
        .download(filePath)
            
      if (error) throw error
            
      // blob을 blob URL로 변환하여 다운로드
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || filePath.split('/').pop() || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      throw error instanceof Error ? error : new Error('다운로드에 실패했습니다.')
    }
  }
