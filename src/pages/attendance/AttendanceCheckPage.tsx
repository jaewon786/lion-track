import { useState } from 'react'
import { useWeeks } from '../../hooks/useWeeks'
import { useMyAttendance, useCheckAttendance, useActiveAttendCode } from '../../hooks/useAttendance'
import { formatDateTime, getStatusColor, getStatusLabel } from '../../utils/format'
import toast from 'react-hot-toast'

export default function AttendanceCheckPage() {
  const [digits, setDigits] = useState(['', '', '', ''])
  const { data: weeks = [] } = useWeeks()
  const { data: myAttendances = [] } = useMyAttendance()
  const { data: activeCode } = useActiveAttendCode()
  const checkMutation = useCheckAttendance()

  // 활성 출석코드가 있으면 해당 주차, 없으면 status=current인 주차
  const activeWeek = activeCode
    ? weeks.find((w) => w.id === activeCode.week_id)
    : weeks.find((w) => w.status === 'current')
  const activeWeekId = activeCode?.week_id ?? activeWeek?.id

  const existingRecord = activeWeekId && myAttendances.find((a) => a.week_id === activeWeekId)
  const alreadyChecked = existingRecord && existingRecord.status !== 'PENDING' ? existingRecord : null

  const handleDigitChange = (idx: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1]
    if (val && !/\d/.test(val)) return
    const nd = [...digits]
    nd[idx] = val
    setDigits(nd)
    if (val && idx < 3) {
      const next = document.getElementById(`code-${idx + 1}`)
      if (next) next.focus()
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const prev = document.getElementById(`code-${idx - 1}`)
      if (prev) prev.focus()
    }
  }

  const handleSubmit = async () => {
    const code = digits.join('')
    if (code.length !== 4) {
      toast.error('4자리 코드를 입력해주세요.')
      return
    }
    if (!activeWeekId) {
      toast.error('현재 활성화된 출석 세션이 없습니다. 운영진에게 문의하세요.')
      return
    }
    try {
      await checkMutation.mutateAsync({ code, weekId: activeWeekId })
      toast.success('출석 완료!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '출석 코드가 올바르지 않습니다.'
      toast.error(message)
      setDigits(['', '', '', ''])
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <div className="page-title">출석 체크</div>
        <div className="page-subtitle">
          {activeWeek ? `${activeWeek.number}주차 - ${activeWeek.title}` : '진행 중인 세션이 없습니다.'}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        {alreadyChecked ? (
          <div style={{ padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{alreadyChecked.status === 'PRESENT' ? '✓' : alreadyChecked.status === 'LATE' ? '⚠' : alreadyChecked.status === 'ABSENT' ? '✕' : '?'}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: getStatusColor(alreadyChecked.status) }}>
              {getStatusLabel(alreadyChecked.status)}
            </div>
            {alreadyChecked.status !== 'PENDING' && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                {formatDateTime(alreadyChecked.checked_at)}에 처리되었습니다.
              </div>
            )}
          </div>
        ) : checkMutation.isSuccess ? (
          <div style={{ padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>출석 완료!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>정상 출석 처리되었습니다.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              운영진이 공유한 4자리 출석 코드를 입력하세요.
            </div>
            <div className="code-input-group">
              {digits.map((d, i) => (
                <input key={i} id={`code-${i}`} className="code-digit" maxLength={1}
                  value={d} onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)} />
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={handleSubmit} disabled={digits.some((d) => !d) || checkMutation.isPending}>
              {checkMutation.isPending ? '확인 중...' : '출석 확인'}
            </button>
            {!activeWeekId && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>진행 중인 세션이 없습니다.</div>}
          </>
        )}
      </div>
    </div>
  )
}
