import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAssignments, useMySubmissions } from '../../hooks/useAssignments'
import { useWeeks } from '../../hooks/useWeeks'
import { formatDateTime, getDDay, getStatusLabel } from '../../utils/format'

export default function AssignmentsPage() {
  const [filter, setFilter] = useState('all')
  const { data: assignments = [] } = useAssignments()
  const { data: mySubmissions = [] } = useMySubmissions()
  const { data: weeks = [] } = useWeeks()

  const filtered = filter === 'all' ? assignments : assignments.filter((a) => a.status === filter)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">과제</div>
        <div className="page-subtitle">주차별 과제를 확인하고 제출하세요.</div>
      </div>
      <div className="tabs">
        {[['all', '전체'], ['open', '진행 중'], ['closed', '마감']].map(([v, l]) => (
          <button key={v} className={`tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="assignment-list">
        {filtered.map((a) => {
          const sub = mySubmissions.find((s) => s.assignment_id === a.id)
          const week = weeks.find((w) => w.id === a.week_id)
          return (
            <Link key={a.id} to={`/assignments/${a.id}`} className="card card-clickable" style={{ padding: 16, textDecoration: 'none', color: 'inherit' }}>
              <div className="assignment-card">
                <div className={`assignment-dday ${a.status === 'open' ? 'dday-open' : 'dday-closed'}`}>
                  {a.status === 'open' ? getDDay(a.due_at) : '마감'}
                </div>
                <div className="assignment-info">
                  <div className="assignment-title">{a.title}</div>
                  <div className="assignment-meta">
                    <span>{week?.number}주차</span>
                    <span>마감 {formatDateTime(a.due_at)}</span>
                    <span>{a.submit_type === 'GITHUB_URL' ? 'GitHub URL' : a.submit_type === 'FILE_UPLOAD' ? '파일 업로드' : 'URL + 파일'}</span>
                  </div>
                </div>
                <span className="submit-badge" style={{
                  background: sub ? (sub.status === 'late' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)') : a.status === 'closed' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)',
                  color: sub ? (sub.status === 'late' ? 'var(--yellow)' : 'var(--green)') : a.status === 'closed' ? 'var(--red)' : 'var(--text-muted)',
                }}>
                  {sub ? getStatusLabel(sub.status) : '미제출'}
                </span>
              </div>
            </Link>
          )
        })}
        {filtered.length === 0 && <div className="empty">해당 과제가 없습니다.</div>}
      </div>
    </div>
  )
}
