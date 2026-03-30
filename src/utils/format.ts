import { format, formatDistanceToNow, differenceInCalendarDays } from 'date-fns'
import { ko } from 'date-fns/locale'

export const formatDate = (d: string | null) => {
  if (!d) return '-'
  return format(new Date(d), 'M/d')
}

export const formatDateTime = (d: string | null) => {
  if (!d) return '-'
  return format(new Date(d), 'M/d HH:mm')
}

export const formatFullDate = (d: string | null) => {
  if (!d) return '-'
  return format(new Date(d), 'yyyy년 M월 d일', { locale: ko })
}

export const getDDay = (due: string) => {
  const diff = differenceInCalendarDays(new Date(due), new Date())
  if (diff < 0) return '마감'
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
}

export const getRelativeTime = (d: string) => {
  return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ko })
}

export const getStatusColor = (s: string | undefined) => {
  if (s === 'PRESENT' || s === 'submitted') return 'var(--green)'
  if (s === 'LATE' || s === 'late') return 'var(--yellow)'
  if (s === 'ABSENT') return 'var(--red)'
  if (s === 'PENDING') return 'var(--text-muted)'
  return 'var(--text-muted)'
}

export const getStatusLabel = (s: string | undefined) => {
  const map: Record<string, string> = {
    PRESENT: '출석',
    LATE: '지각',
    ABSENT: '결석',
    PENDING: '미정',
    submitted: '제출',
    late: '지각 제출',
  }
  return map[s ?? ''] || '미제출'
}
