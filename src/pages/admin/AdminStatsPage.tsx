import { useWeeks } from '../../hooks/useWeeks'
import { useAssignments, useSubmissions } from '../../hooks/useAssignments'
import { useMembers } from '../../hooks/useProfiles'
import { useAllAttendances } from '../../hooks/useAttendance'
import { getStatusColor } from '../../utils/format'

export default function AdminStatsPage() {
  const { data: weeks = [] } = useWeeks()
  const { data: assignments = [] } = useAssignments()
  const { data: submissions = [] } = useSubmissions()
  const { data: members = [] } = useMembers()
  const { data: attendances = [] } = useAllAttendances()

  const completedWeeks = weeks.filter((w) => w.status !== 'upcoming')

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">통계 현황</div>
        <div className="page-subtitle">주차별 출석 및 과제 제출 통계</div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">주차별 출석률</div>
        <div className="chart-bar-group">
          {completedWeeks.map((w) => {
            const atts = attendances.filter((a) => a.week_id === w.id)
            const rate = members.length > 0 ? Math.round((atts.filter((a) => a.status === 'PRESENT').length / members.length) * 100) : 0
            return (
              <div className="chart-bar-item" key={w.id}>
                <div className="chart-bar-value">{rate}%</div>
                <div className="chart-bar" style={{ height: `${rate}%`, background: rate >= 80 ? 'var(--green)' : rate >= 60 ? 'var(--yellow)' : 'var(--red)' }} />
                <div className="chart-bar-label">{w.number}주</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">주차별 과제 제출률</div>
        <div className="chart-bar-group">
          {assignments.filter((a) => a.status === 'closed').map((a) => {
            const w = weeks.find((wk) => wk.id === a.week_id)
            const subs = submissions.filter((s) => s.assignment_id === a.id)
            const rate = members.length > 0 ? Math.round((subs.length / members.length) * 100) : 0
            return (
              <div className="chart-bar-item" key={a.id}>
                <div className="chart-bar-value">{rate}%</div>
                <div className="chart-bar" style={{ height: `${rate}%`, background: 'var(--accent)' }} />
                <div className="chart-bar-label">{w?.number}주</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="section-title">수강생별 출석 현황</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>학과</th>
                {completedWeeks.map((w) => <th key={w.id}>{w.number}주</th>)}
                <th>출석률</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const atts = attendances.filter((a) => a.user_id === m.id)
                const presentCnt = atts.filter((a) => a.status === 'PRESENT').length
                const rate = completedWeeks.length > 0 ? Math.round((presentCnt / completedWeeks.length) * 100) : 0
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</td>
                    <td>{m.department}</td>
                    {completedWeeks.map((w) => {
                      const att = atts.find((a) => a.week_id === w.id)
                      return (
                        <td key={w.id}>
                          <span style={{ color: getStatusColor(att?.status || 'absent'), fontWeight: 600, fontSize: 12 }}>
                            {att?.status === 'PRESENT' ? '✓' : att?.status === 'LATE' ? '△' : '✕'}
                          </span>
                        </td>
                      )
                    })}
                    <td style={{ fontWeight: 600, color: getStatusColor(rate >= 80 ? 'PRESENT' : rate >= 50 ? 'LATE' : 'ABSENT') }}>{rate}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
