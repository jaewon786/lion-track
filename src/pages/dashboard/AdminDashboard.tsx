import { Link } from 'react-router-dom'
import { Key, ClipboardList, BookOpen, Users } from 'lucide-react'
import { useWeeks } from '../../hooks/useWeeks'
import { useAssignments, useSubmissions } from '../../hooks/useAssignments'
import { useAllAttendances } from '../../hooks/useAttendance'
import { useMembers } from '../../hooks/useProfiles'
import { useAuthStore } from '../../stores/authStore'
import { TRACK_LABELS } from '../../types'
import { formatDateTime } from '../../utils/format'

export default function AdminDashboard() {
  const activeTrack = useAuthStore((s) => s.activeTrack)
  const { data: weeks = [] } = useWeeks()
  const { data: assignments = [] } = useAssignments()
  const { data: submissions = [] } = useSubmissions()
  const { data: attendances = [] } = useAllAttendances()
  const { data: members = [] } = useMembers()

  const attendedWeekIds = new Set(attendances.map((a) => a.week_id))
  const completedWeeks = weeks.filter((w) => w.status !== 'upcoming' || attendedWeekIds.has(w.id))
  const totalPossibleAtt = completedWeeks.length * members.length
  const presentCount = attendances.filter((a) => a.status === 'PRESENT').length
  const overallAttRate = totalPossibleAtt > 0 ? Math.round((presentCount / totalPossibleAtt) * 100) : 0

  const gradedAssignments = assignments.filter((a) => a.status !== 'draft')
  const totalPossibleSubs = gradedAssignments.length * members.length
  const totalSubs = submissions.filter((s) => gradedAssignments.some((a) => a.id === s.assignment_id)).length
  const overallSubRate = totalPossibleSubs > 0 ? Math.round((totalSubs / totalPossibleSubs) * 100) : 0

  const now = new Date()
  const openAsgn = assignments.filter((a) => a.status === 'open' && new Date(a.due_at) > now)
  const currentWeek = weeks.find((w) => w.status === 'current')
    || [...weeks].sort((a, b) => b.number - a.number)[0]

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">운영진 대시보드</div>
        <div className="page-subtitle">멋쟁이사자처럼 14기 {TRACK_LABELS[activeTrack]} 세션 현황</div>
      </div>

      <div className="stats-grid stagger-1 fade-in">
        <div className="stat-card">
          <div className="stat-label">전체 출석률</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{overallAttRate}%</div>
          <div className="stat-sub">{presentCount}/{totalPossibleAtt} (출석/전체)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전체 과제 제출률</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{overallSubRate}%</div>
          <div className="stat-sub">{totalSubs}/{totalPossibleSubs} (제출/전체)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">수강생 수</div>
          <div className="stat-value">{members.length}</div>
          <div className="stat-sub">아기사자</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">현재 주차</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{currentWeek?.number || '-'}</div>
          <div className="stat-sub">{currentWeek?.title || '대기'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card stagger-2 fade-in">
          <div className="section-title">진행 중인 과제</div>
          {openAsgn.length === 0 && <div className="empty">진행 중인 과제가 없습니다.</div>}
          {openAsgn.map((a) => {
            const subCount = submissions.filter((s) => s.assignment_id === a.id).length
            return (
              <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  마감 {formatDateTime(a.due_at)} · 제출 {subCount}/{members.length}명
                </div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${members.length > 0 ? (subCount / members.length) * 100 : 0}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="card stagger-3 fade-in">
          <div className="section-title">미제출자 현황</div>
          {openAsgn.map((a) => {
            const submitters = submissions.filter((s) => s.assignment_id === a.id).map((s) => s.user_id)
            const missing = members.filter((m) => !submitters.includes(m.id))
            if (missing.length === 0) return null
            return (
              <div key={a.id} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>{a.title}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {missing.map((m) => (
                    <span key={m.id} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}>{m.name}</span>
                  ))}
                </div>
              </div>
            )
          })}
          {openAsgn.length === 0 && <div className="empty">진행 중인 과제가 없습니다.</div>}
        </div>
      </div>

      <div className="card stagger-4 fade-in" style={{ marginTop: 16 }}>
        <div className="section-title">빠른 이동</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/admin/attendance" className="btn btn-secondary"><Key size={16} /> 출석 코드 생성</Link>
          <Link to="/admin/assignments" className="btn btn-secondary"><ClipboardList size={16} /> 과제 관리</Link>
          <Link to="/admin/weeks" className="btn btn-secondary"><BookOpen size={16} /> 주차 관리</Link>
          <Link to="/admin/members" className="btn btn-secondary"><Users size={16} /> 회원 관리</Link>
        </div>
      </div>
    </div>
  )
}
