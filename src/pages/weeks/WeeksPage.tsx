import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useWeeks } from '../../hooks/useWeeks'
import { formatDate } from '../../utils/format'

export default function WeeksPage() {
  const { data: weeks = [] } = useWeeks()

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">주차별 수업</div>
        <div className="page-subtitle">10주 커리큘럼을 확인하고 수업자료를 열람하세요.</div>
      </div>
      <div className="weeks-grid">
        {weeks.map((w, i) => (
          <Link key={w.id} to={`/weeks/${w.id}`} className={`card card-clickable stagger-${Math.min(i % 4 + 1, 4)} fade-in`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="week-card-number">WEEK {String(w.number).padStart(2, '0')}</span>
              <span className={`week-status ${w.status}`}>
                {w.status === 'completed' ? '완료' : w.status === 'current' ? '진행 중' : '예정'}
              </span>
            </div>
            <div className="week-card-title">{w.title}</div>
            <div className="week-card-desc">{w.description}</div>
            <div className="week-card-meta">
              <Clock size={14} /> {formatDate(w.session_date)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
