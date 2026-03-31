import { Link, useParams } from 'react-router-dom'
import { FileText, ExternalLink, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWeek } from '../../hooks/useWeeks'
import { useMaterials, getMaterialDownloadUrl } from '../../hooks/useMaterials'
import { useAssignments, useMySubmissions } from '../../hooks/useAssignments'
import { formatDateTime, getDDay } from '../../utils/format'

export default function WeekDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: week } = useWeek(id)
  const { data: materials = [] } = useMaterials(id)
  const { data: assignments = [] } = useAssignments()
  const { data: mySubmissions = [] } = useMySubmissions()

  if (!week) return <div className="empty">로딩 중...</div>

  const weekMats = materials.filter((m) => m.is_public)
  const weekAssignments = assignments.filter((a) => a.week_id === week.id)

  const handleDownload = async (url: string, type: string) => {
    if (type === 'LINK') {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    // 모바일에서 비동기 후 window.open은 팝업 차단됨
    // → 먼저 동기적으로 탭을 열고 이후 URL 설정
    const newTab = window.open('', '_blank')
    try {
      const signedUrl = await getMaterialDownloadUrl(url)
      if (signedUrl && newTab) {
        newTab.location.href = signedUrl
      } else if (signedUrl) {
        window.location.href = signedUrl
      } else {
        newTab?.close()
        toast.error('다운로드에 실패했습니다.')
      }
    } catch (err) {
      console.error('[다운로드 오류]', err)
      newTab?.close()
      const msg = err instanceof Error ? err.message : '다운로드에 실패했습니다.'
      toast.error(`다운로드 실패: ${msg}`)
    }
  }

  return (
    <div className="fade-in">
      <Link to="/weeks" className="detail-back">← 주차 목록</Link>
      <div className="page-header">
        <span className="week-card-number" style={{ marginBottom: 8, display: 'inline-block' }}>WEEK {String(week.number).padStart(2, '0')}</span>
        <div className="page-title">{week.title}</div>
        <div className="page-subtitle">{week.description}</div>
      </div>

      <div className="section-title">수업자료</div>
      {weekMats.length === 0 && <div className="card empty" style={{ marginBottom: 24 }}>아직 등록된 자료가 없습니다.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {weekMats.map((m) => (
          <div key={m.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: m.type === 'FILE' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)',
              color: m.type === 'FILE' ? 'var(--blue)' : 'var(--green)',
            }}>
              {m.type === 'FILE' ? <FileText size={18} /> : <ExternalLink size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.description}</div>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => handleDownload(m.url, m.type)}>
              {m.type === 'FILE' ? <><Download size={14} /> 다운로드</> : <><ExternalLink size={14} /> 열기</>}
            </button>
          </div>
        ))}
      </div>

      {weekAssignments.length > 0 && (
        <>
          <div className="section-title">이번 주 과제</div>
          {weekAssignments.map((a) => {
            const sub = mySubmissions.find((s) => s.assignment_id === a.id)
            return (
              <Link key={a.id} to={`/assignments/${a.id}`} className="card card-clickable" style={{ padding: 16, marginBottom: 8, textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`assignment-dday ${a.status === 'open' ? 'dday-open' : 'dday-closed'}`}>{getDDay(a.due_at)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="assignment-title">{a.title}</div>
                    <div className="assignment-meta"><span>마감 {formatDateTime(a.due_at)}</span></div>
                  </div>
                  <span className="submit-badge" style={{ background: sub ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.1)', color: sub ? 'var(--green)' : 'var(--text-muted)' }}>
                    {sub ? '제출 완료' : '미제출'}
                  </span>
                </div>
              </Link>
            )
          })}
        </>
      )}
    </div>
  )
}
