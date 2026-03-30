import { useWeeks } from '../../hooks/useWeeks'
import { useMyAttendance } from '../../hooks/useAttendance'
import { formatDate, formatDateTime } from '../../utils/format'
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, Clock } from 'lucide-react'

const TOTAL_WEEKS = 10

export default function MyAttendancePage() {
  const { data: weeks = [], isLoading: wLoading } = useWeeks()
  const { data: myAttendances = [], isLoading: aLoading } = useMyAttendance()

  const passedWeeks = weeks.filter((w) => w.status !== 'upcoming').length
  const presentCount = myAttendances.filter((a) => a.status === 'PRESENT').length
  const lateCount = myAttendances.filter((a) => a.status === 'LATE').length
  const absentCount = myAttendances.filter((a) => a.status === 'ABSENT').length
  const pendingCount = myAttendances.filter((a) => a.status === 'PENDING').length
  const unmarkedCount = Math.max(0, passedWeeks - presentCount - lateCount - absentCount - pendingCount)
  const rate = Math.round((presentCount / TOTAL_WEEKS) * 100)

  if (wLoading || aLoading) return <div style={{ padding: 32, textAlign: 'center' }}>로딩 중...</div>

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    PRESENT: { icon: <CheckCircle size={18} />, color: 'var(--green)', bg: 'rgba(34,197,94,0.12)', label: '출석' },
    LATE: { icon: <AlertTriangle size={18} />, color: 'var(--yellow)', bg: 'rgba(245,158,11,0.12)', label: '지각' },
    ABSENT: { icon: <XCircle size={18} />, color: 'var(--red)', bg: 'rgba(239,68,68,0.1)', label: '결석' },
    PENDING: { icon: <HelpCircle size={18} />, color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.08)', label: '미정' },
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">내 출석 현황</div>
        <div className="page-subtitle">전체 {TOTAL_WEEKS}주 중 {passedWeeks}주 진행 완료</div>
      </div>

      {/* 출석률 요약 카드 */}
      <div className="card" style={{ marginBottom: 20, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>종합 출석률</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{rate}%</div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{presentCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>출석</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--yellow)' }}>{lateCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>지각</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>{absentCount + unmarkedCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>결석</div>
            </div>
            {pendingCount > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-muted)' }}>{pendingCount}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>미정</div>
              </div>
            )}
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${rate}%`, background: rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--yellow)' : 'var(--red)' }} />
        </div>
      </div>

      {/* 출석 타임라인 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>출석 타임라인</div>
        <div className="att-timeline">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((num) => {
            const w = weeks.find((wk) => wk.number === num)
            const att = w ? myAttendances.find((a) => a.week_id === w.id) : null
            const status = att?.status || (w ? (w.status === 'upcoming' ? 'future' : 'ABSENT') : 'future')
            const icon = status === 'PRESENT' ? '✓' : status === 'LATE' ? '!' : status === 'ABSENT' ? '✕' : status === 'PENDING' ? '?' : '·'
            const label = status === 'PRESENT' ? '출석' : status === 'LATE' ? '지각' : status === 'ABSENT' ? '결석' : status === 'PENDING' ? '미정' : ''
            return (
              <div key={num} className={`att-cell ${status}`}>
                <div className="att-dot">{icon}</div>
                <span className="att-week">{num}주</span>
                {label && <span className="att-label">{label}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* 주차별 상세 기록 */}
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>주차별 상세 기록</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((num) => {
          const w = weeks.find((wk) => wk.number === num)
          const att = w ? myAttendances.find((a) => a.week_id === w.id) : null
          const isFuture = !w || w.status === 'upcoming'
          const status = att?.status ?? (isFuture ? null : 'ABSENT')
          const cfg = status ? statusConfig[status] : null

          const cardBg = status === 'PRESENT' ? '#1e6e3e'
            : status === 'LATE' ? '#6e5820'
            : status === 'ABSENT' ? '#6e2828'
            : status === 'PENDING' ? '#383840'
            : '#1a1a1e'

          const cardShadow = status === 'PRESENT' ? '0 0 24px rgba(34,197,94,0.3)'
            : status === 'LATE' ? '0 0 20px rgba(245,158,11,0.3)'
            : status === 'ABSENT' ? '0 0 16px rgba(239,68,68,0.25)'
            : 'none'

          return (
            <div
              key={num}
              style={{
                padding: '14px 18px',
                borderRadius: 16,
                border: cfg ? `1px solid ${cfg.color}33` : '1px solid #2A2A2E',
                opacity: isFuture ? 0.4 : 1,
                borderLeft: cfg ? `3px solid ${cfg.color}` : '1px solid #2A2A2E',
                backgroundColor: cardBg,
                boxShadow: cardShadow,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* 주차 번호 */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: cfg?.bg || 'rgba(148,163,184,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cfg?.color || 'var(--text-muted)', flexShrink: 0,
                }}>
                  {cfg ? cfg.icon : <span style={{ fontSize: 14, fontWeight: 700 }}>{num}</span>}
                </div>

                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cfg ? cfg.color : 'var(--text-primary)' }}>{num}주차</span>
                    {w && <span style={{ fontSize: 12, color: cfg ? cfg.color : 'var(--text-muted)', opacity: 1 }}>{w.title}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', gap: 12, flexWrap: 'wrap', opacity: 0.85 }}>
                    {w && <span>{formatDate(w.session_date)}</span>}
                    {att?.checked_at && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {formatDateTime(att.checked_at)} 체크인
                      </span>
                    )}
                  </div>
                </div>

                {/* 상태 뱃지 */}
                {cfg ? (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                    background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
                  }}>
                    {cfg.label}
                  </span>
                ) : !isFuture ? (
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                    background: 'rgba(148,163,184,0.06)', color: 'var(--text-muted)', whiteSpace: 'nowrap',
                  }}>-</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
