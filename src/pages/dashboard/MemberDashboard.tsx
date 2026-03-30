import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useWeeks } from '../../hooks/useWeeks'
import { useAssignments, useMySubmissions } from '../../hooks/useAssignments'
import { useMyAttendance } from '../../hooks/useAttendance'
import { useNotices } from '../../hooks/useNotices'
import { useAuthStore } from '../../stores/authStore'
import { formatDateTime, getDDay } from '../../utils/format'

export default function MemberDashboard() {
  const user = useAuthStore((s) => s.user)!
  const { data: weeks = [] } = useWeeks()
  const { data: assignments = [] } = useAssignments()
  const { data: mySubmissions = [] } = useMySubmissions()
  const { data: myAttendances = [] } = useMyAttendance()
  const { data: notices = [] } = useNotices()

  const presentCount = myAttendances.filter((a) => a.status === 'PRESENT').length
  const attRate = Math.round((presentCount / 10) * 100)

  const closedAssignments = assignments.filter((a) => a.status === 'closed')
  const submittedClosed = mySubmissions.filter((s) => closedAssignments.some((a) => a.id === s.assignment_id)).length
  const subRate = closedAssignments.length > 0 ? Math.round((submittedClosed / closedAssignments.length) * 100) : 0

  const openAssignments = assignments.filter((a) => a.status === 'open')

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">안녕하세요, {user.name}님</div>
        <div className="page-subtitle">오늘도 화이팅! 학습 현황을 확인해보세요.</div>
      </div>

      <div className="stats-grid stagger-1 fade-in">
        <div className="stat-card">
          <div className="stat-label">출석률</div>
          <div className="stat-value" style={{ color: attRate >= 80 ? 'var(--green)' : attRate >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{attRate}%</div>
          <div className="stat-sub">{presentCount}/10주 출석</div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${attRate}%`, background: attRate >= 80 ? 'var(--green)' : attRate >= 50 ? 'var(--yellow)' : 'var(--red)' }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">과제 제출률</div>
          <div className="stat-value" style={{ color: subRate >= 80 ? 'var(--green)' : subRate >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{subRate}%</div>
          <div className="stat-sub">{submittedClosed}/{closedAssignments.length}개 제출</div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${subRate}%`, background: subRate >= 80 ? 'var(--green)' : subRate >= 50 ? 'var(--yellow)' : 'var(--red)' }} />
          </div>
        </div>
      </div>

      {/* Attendance Timeline */}
      <div className="card stagger-2 fade-in" style={{ marginBottom: 24 }}>
        <div className="section-title">출석 타임라인</div>
        <div className="att-timeline">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
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

      {/* Open Assignments */}
      {openAssignments.length > 0 && (
        <div className="card stagger-3 fade-in" style={{ marginBottom: 24 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>진행 중인 과제</div>
            <Link to="/assignments" className="btn btn-ghost btn-sm">전체 보기 <ChevronRight size={16} /></Link>
          </div>
          {openAssignments.map((a) => {
            const sub = mySubmissions.find((s) => s.assignment_id === a.id)
            const week = weeks.find((w) => w.id === a.week_id)
            return (
              <Link key={a.id} to={`/assignments/${a.id}`} className="card card-clickable" style={{ marginBottom: 8, padding: 16, textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="assignment-dday dday-open">{getDDay(a.due_at)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="assignment-title">{a.title}</div>
                    <div className="assignment-meta">
                      <span>{week?.number}주차</span>
                      <span>마감 {formatDateTime(a.due_at)}</span>
                    </div>
                  </div>
                  <span className="submit-badge" style={{ background: sub ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.1)', color: sub ? 'var(--green)' : 'var(--text-muted)' }}>
                    {sub ? '제출 완료' : '미제출'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Recent Notices */}
      <div className="card stagger-4 fade-in">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>최근 공지</div>
          <Link to="/notices" className="btn btn-ghost btn-sm">전체 보기 <ChevronRight size={16} /></Link>
        </div>
        {notices.slice(0, 2).map((n) => (
          <Link key={n.id} to={`/notices/${n.id}`} className="card notice-card" style={{ marginBottom: 8, padding: 14, textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="notice-date">{formatDateTime(n.created_at)}</div>
            <div className="notice-title">{n.title}</div>
          </Link>
        ))}
        {notices.length === 0 && <div className="empty">아직 공지가 없습니다.</div>}
      </div>
    </div>
  )
}
