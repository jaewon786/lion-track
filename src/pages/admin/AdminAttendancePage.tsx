import { useState, useEffect } from 'react'
import { useWeeks } from '../../hooks/useWeeks'
import { useMembers } from '../../hooks/useProfiles'
import { useAllAttendances, useCreateAttendCode, useUpdateAttendance, useActiveAttendCode } from '../../hooks/useAttendance'
import { formatDateTime, getStatusColor, getStatusLabel } from '../../utils/format'
import { Key } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminAttendancePage() {
  const { data: weeks = [] } = useWeeks()
  const { data: members = [] } = useMembers()
  const { data: attendances = [] } = useAllAttendances()
  const { data: activeCode } = useActiveAttendCode()
  const createCodeMutation = useCreateAttendCode()
  const updateMutation = useUpdateAttendance()

  const [selectedWeek, setSelectedWeek] = useState('')
  const [attendCode, setAttendCode] = useState<string | null>(null)
  const [timer, setTimer] = useState<number | null>(null)

  // DB에서 활성 코드 복원
  useEffect(() => {
    if (activeCode && !attendCode) {
      const remaining = Math.floor((new Date(activeCode.expires_at).getTime() - Date.now()) / 1000)
      if (remaining > 0) {
        setAttendCode(activeCode.code)
        setTimer(remaining)
      }
    }
  }, [activeCode, attendCode])

  useEffect(() => {
    if (weeks.length && !selectedWeek) {
      const cur = weeks.find((w) => w.status === 'current')
      setSelectedWeek(cur?.id ?? weeks[0].id)
    }
  }, [weeks, selectedWeek])

  useEffect(() => {
    if (timer === null || timer <= 0) return
    const interval = setInterval(() => setTimer((t) => (t !== null ? t - 1 : null)), 1000)
    return () => clearInterval(interval)
  }, [timer])

  const generateCode = async () => {
    const code = String(Math.floor(1000 + Math.random() * 9000))
    try {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      await createCodeMutation.mutateAsync({ code, weekId: selectedWeek, expiresAt })
      setAttendCode(code)
      setTimer(15 * 60)
      toast.success('출석 코드가 생성되었습니다.')
    } catch {
      toast.error('코드 생성에 실패했습니다.')
    }
  }

  const weekAtts = attendances.filter((a) => a.week_id === selectedWeek)
  const currentWeek = weeks.find((w) => w.id === selectedWeek)

  const toggleStatus = async (userId: string) => {
    const existing = weekAtts.find((a) => a.user_id === userId)
    const statuses = ['PRESENT', 'LATE', 'ABSENT', 'PENDING'] as const
    if (existing) {
      const idx = statuses.indexOf(existing.status as typeof statuses[number])
      const nextStatus = statuses[(idx + 1) % statuses.length]
      try {
        await updateMutation.mutateAsync({ weekId: selectedWeek, userId, status: nextStatus })
      } catch {
        toast.error('상태 변경 실패')
      }
    } else {
      try {
        await updateMutation.mutateAsync({ weekId: selectedWeek, userId, status: 'PENDING' })
      } catch {
        toast.error('상태 변경 실패')
      }
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">출석 관리</div>
        <div className="page-subtitle">출석 코드를 생성하고 출석 현황을 관리하세요.</div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">출석 코드 생성</div>
        <div className="form-group" style={{ maxWidth: 300 }}>
          <label className="form-label">주차 선택</label>
          <select className="form-input" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
            {weeks.map((w) => <option key={w.id} value={w.id}>{w.number}주차 - {w.title}</option>)}
          </select>
        </div>
        {attendCode && timer && timer > 0 ? (
          <>
            <div className="code-display">{attendCode}</div>
            <div className="code-timer">남은 시간: {Math.floor(timer / 60)}분 {timer % 60}초</div>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={generateCode} disabled={createCodeMutation.isPending}>
              <Key size={16} /> {createCodeMutation.isPending ? '생성 중...' : '코드 재생성'}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={generateCode} disabled={createCodeMutation.isPending}>
            <Key size={18} /> 출석 코드 생성
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>{currentWeek?.number}주차 출석 현황</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>클릭하여 상태 변경 (출석 → 지각 → 결석 → 미정)</div>
        </div>
        <table className="data-table">
          <thead><tr><th>이름</th><th>학과</th><th>상태</th><th>체크 시간</th></tr></thead>
          <tbody>
            {members.map((m) => {
              const att = weekAtts.find((a) => a.user_id === m.id)
              return (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</td>
                  <td>{m.department}</td>
                  <td>
                    <button className="btn btn-sm" style={{
                      background: att ? `${getStatusColor(att.status)}18` : 'rgba(148,163,184,0.1)',
                      color: att ? getStatusColor(att.status) : 'var(--text-muted)',
                      border: 'none', fontWeight: 600,
                    }} onClick={() => toggleStatus(m.id)}>
                      {att ? getStatusLabel(att.status) : '미체크'}
                    </button>
                  </td>
                  <td style={{ fontSize: 12 }}>{att?.checked_at ? formatDateTime(att.checked_at) : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
