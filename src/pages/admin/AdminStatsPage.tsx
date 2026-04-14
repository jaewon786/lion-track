import { useState } from 'react'
import { useWeeks } from '../../hooks/useWeeks'
import { useAssignments, useSubmissions } from '../../hooks/useAssignments'
import { useMembers } from '../../hooks/useProfiles'
import { useAllAttendances } from '../../hooks/useAttendance'
import { getStatusColor } from '../../utils/format'

type Tab = 'overview' | 'attendance' | 'assignments' | 'members'

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const BOM = '\uFEFF'
  const content = BOM + [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminStatsPage() {
  const { data: weeks = [] } = useWeeks()
  const { data: assignments = [] } = useAssignments()
  const { data: submissions = [] } = useSubmissions()
  const { data: members = [] } = useMembers()
  const { data: attendances = [] } = useAllAttendances()

  const [tab, setTab] = useState<Tab>('overview')

  // 출석 기록이 1건이라도 있는 주차를 통계에 포함
  const attendedWeekIds = new Set(attendances.map((a) => a.week_id))
  const completedWeeks = weeks.filter((w) => w.status !== 'upcoming' || attendedWeekIds.has(w.id))
  const completedWeekIds = new Set(completedWeeks.map((w) => w.id))
  const memberIds = new Set(members.map((m) => m.id))
  const now = new Date()
  const closedAssignments = assignments.filter((a) => a.status === 'closed' || (a.status === 'open' && new Date(a.due_at) < now))

  // 통계 대상 주차 + 수강생(MEMBER)의 출석 기록만 필터링
  const completedAttendances = attendances.filter((a) => completedWeekIds.has(a.week_id) && memberIds.has(a.user_id))

  // 전체 통계 수치
  const totalPresent = completedAttendances.filter((a) => a.status === 'PRESENT').length
  const totalLate = completedAttendances.filter((a) => a.status === 'LATE').length
  const totalExpected = completedWeeks.length * members.length
  const overallAttRate = totalExpected > 0 ? Math.round(((totalPresent + totalLate) / totalExpected) * 100) : 0

  const totalSubmissions = closedAssignments.reduce((sum, a) => sum + submissions.filter((s) => s.assignment_id === a.id).length, 0)
  const totalExpectedSubs = closedAssignments.length * members.length
  const overallSubRate = totalExpectedSubs > 0 ? Math.round((totalSubmissions / totalExpectedSubs) * 100) : 0

  // 수강생별 데이터 계산
  const memberStats = members.map((m) => {
    const atts = completedAttendances.filter((a) => a.user_id === m.id)
    const present = atts.filter((a) => a.status === 'PRESENT').length
    const late = atts.filter((a) => a.status === 'LATE').length
    const absent = Math.max(0, completedWeeks.length - present - late)
    const attRate = completedWeeks.length > 0 ? Math.round(((present + late) / completedWeeks.length) * 100) : 0

    const subs = submissions.filter((s) => s.user_id === m.id)
    const submitted = closedAssignments.filter((a) => subs.some((s) => s.assignment_id === a.id)).length
    const subRate = closedAssignments.length > 0 ? Math.round((submitted / closedAssignments.length) * 100) : 0

    const totalScore = Math.round((attRate + subRate) / 2)
    return { ...m, present, late, absent, attRate, submitted, subRate, totalScore }
  }).sort((a, b) => b.totalScore - a.totalScore)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: '전체 요약' },
    { key: 'attendance', label: '출석 통계' },
    { key: 'assignments', label: '과제 통계' },
    { key: 'members', label: '수강생별 통계' },
  ]

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">통계 현황</div>
        <div className="page-subtitle">주차별 출석 및 과제 제출 통계를 한눈에 확인하세요.</div>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ━━━ 전체 요약 ━━━ */}
      {tab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">전체 수강생</div>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{members.length}</div>
              <div className="stat-sub">명</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">진행 주차</div>
              <div className="stat-value" style={{ color: 'var(--blue)' }}>{completedWeeks.length}</div>
              <div className="stat-sub">/ {weeks.length}주</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">평균 출석률</div>
              <div className="stat-value" style={{ color: overallAttRate >= 80 ? 'var(--green)' : overallAttRate >= 60 ? 'var(--yellow)' : 'var(--red)' }}>{overallAttRate}%</div>
              <div className="stat-sub">출석+지각 기준</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">평균 제출률</div>
              <div className="stat-value" style={{ color: overallSubRate >= 80 ? 'var(--green)' : overallSubRate >= 60 ? 'var(--yellow)' : 'var(--red)' }}>{overallSubRate}%</div>
              <div className="stat-sub">마감 과제 기준</div>
            </div>
          </div>

          {/* 주차별 출석률 바 차트 */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-title">주차별 출석률</div>
            <div className="chart-bar-group">
              {completedWeeks.map((w) => {
                const atts = completedAttendances.filter((a) => a.week_id === w.id)
                const present = atts.filter((a) => a.status === 'PRESENT').length
                const late = atts.filter((a) => a.status === 'LATE').length
                const rate = members.length > 0 ? Math.round(((present + late) / members.length) * 100) : 0
                return (
                  <div className="chart-bar-item" key={w.id}>
                    <div className="chart-bar-value">{rate}%</div>
                    <div className="chart-bar" style={{ height: `${rate}%`, background: rate >= 80 ? 'var(--green)' : rate >= 60 ? 'var(--yellow)' : 'var(--red)' }} />
                    <div className="chart-bar-label">{w.number}주</div>
                  </div>
                )
              })}
              {completedWeeks.length === 0 && <div className="empty" style={{ width: '100%' }}>진행된 주차가 없습니다.</div>}
            </div>
          </div>

          {/* 주차별 과제 제출률 바 차트 */}
          <div className="card">
            <div className="section-title">주차별 과제 제출률</div>
            <div className="chart-bar-group">
              {closedAssignments.map((a) => {
                const w = weeks.find((wk) => wk.id === a.week_id)
                const subs = submissions.filter((s) => s.assignment_id === a.id)
                const rate = members.length > 0 ? Math.round((subs.length / members.length) * 100) : 0
                return (
                  <div className="chart-bar-item" key={a.id}>
                    <div className="chart-bar-value">{rate}%</div>
                    <div className="chart-bar" style={{ height: `${rate}%`, background: 'var(--accent)' }} />
                    <div className="chart-bar-label">{w ? `${w.number}주` : '?'}</div>
                  </div>
                )
              })}
              {closedAssignments.length === 0 && <div className="empty" style={{ width: '100%' }}>마감된 과제가 없습니다.</div>}
            </div>
          </div>

          {/* 위험 수강생 */}
          {(() => {
            const atRiskMembers = memberStats.filter(m => m.attRate < 60 || m.subRate < 60)
            return (
              <div className="card" style={{ marginTop: 24 }}>
                <div className="section-title">위험 수강생</div>
                {atRiskMembers.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--green)', fontWeight: 600 }}>
                    모든 수강생이 기준을 충족합니다 ✓
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {atRiskMembers.map(m => (
                      <div key={m.id} style={{ padding: 16, borderRadius: 10, border: '1px solid var(--red)', background: 'rgba(239,68,68,0.06)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{m.name}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: m.attRate < 60 ? '#fff' : 'var(--text-muted)', background: m.attRate < 60 ? 'var(--red)' : 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 6 }}>
                            출석률 {m.attRate}%
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: m.subRate < 60 ? '#fff' : 'var(--text-muted)', background: m.subRate < 60 ? 'var(--red)' : 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 6 }}>
                            제출률 {m.subRate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </>
      )}

      {/* ━━━ 출석 통계 ━━━ */}
      {tab === 'attendance' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-label">출석</div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>{totalPresent}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">지각</div>
              <div className="stat-value" style={{ color: 'var(--yellow)' }}>{totalLate}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">결석</div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>{totalExpected > 0 ? Math.max(0, totalExpected - totalPresent - totalLate) : 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">출석률</div>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{overallAttRate}%</div>
            </div>
          </div>

          <div className="card">
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div className="section-title">수강생별 출석 현황</div>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                const headers = ['이름', '학과', ...completedWeeks.map(w => `${w.number}주`), '출석', '지각', '결석', '출석률']
                const rows = memberStats.map(m => {
                  const atts = completedAttendances.filter(a => a.user_id === m.id)
                  return [
                    m.name, m.department || '',
                    ...completedWeeks.map(w => {
                      const att = atts.find(a => a.week_id === w.id)
                      return att?.status === 'PRESENT' ? '출' : att?.status === 'LATE' ? '지' : '결'
                    }),
                    String(m.present), String(m.late), String(m.absent), `${m.attRate}%`
                  ]
                })
                downloadCSV('출석통계.csv', headers, rows)
              }}>CSV 내보내기</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>학과</th>
                    {completedWeeks.map((w) => <th key={w.id}>{w.number}주</th>)}
                    <th>출석</th>
                    <th>지각</th>
                    <th>결석</th>
                    <th>출석률</th>
                  </tr>
                </thead>
                <tbody>
                  {memberStats.map((m) => {
                    const atts = completedAttendances.filter((a) => a.user_id === m.id)
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{m.name}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{m.department}</td>
                        {completedWeeks.map((w) => {
                          const att = atts.find((a) => a.week_id === w.id)
                          return (
                            <td key={w.id} style={{ textAlign: 'center' }}>
                              <span style={{ color: getStatusColor(att?.status || 'ABSENT'), fontWeight: 600, fontSize: 12 }}>
                                {att?.status === 'PRESENT' ? '✓' : att?.status === 'LATE' ? '△' : '✕'}
                              </span>
                            </td>
                          )
                        })}
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--green)' }}>{m.present}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--yellow)' }}>{m.late}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--red)' }}>{m.absent}</td>
                        <td style={{ fontWeight: 700, color: getStatusColor(m.attRate >= 80 ? 'PRESENT' : m.attRate >= 50 ? 'LATE' : 'ABSENT') }}>{m.attRate}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {members.length === 0 && <div className="empty">수강생이 없습니다.</div>}
          </div>
        </>
      )}

      {/* ━━━ 과제 통계 ━━━ */}
      {tab === 'assignments' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-label">전체 과제</div>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{assignments.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">마감된 과제</div>
              <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{closedAssignments.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">총 제출 수</div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>{totalSubmissions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">평균 제출률</div>
              <div className="stat-value" style={{ color: overallSubRate >= 80 ? 'var(--green)' : 'var(--yellow)' }}>{overallSubRate}%</div>
            </div>
          </div>

          <div className="card">
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div className="section-title">과제별 제출 현황</div>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                const headers = ['과제명', '주차', '상태', '제출수', '미제출수', '제출률']
                const rows = assignments.map(a => {
                  const w = weeks.find(wk => wk.id === a.week_id)
                  const subs = submissions.filter(s => s.assignment_id === a.id)
                  const rate = members.length > 0 ? Math.round((subs.length / members.length) * 100) : 0
                  const isClosed = a.status === 'closed' || (a.status === 'open' && new Date(a.due_at) < now)
                  const statusLabel = isClosed ? '마감' : a.status === 'open' ? '진행중' : '임시'
                  return [a.title, w ? `${w.number}주차` : '-', statusLabel, String(subs.length), String(members.length - subs.length), `${rate}%`]
                })
                downloadCSV('과제통계.csv', headers, rows)
              }}>CSV 내보내기</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>주차</th>
                    <th>과제명</th>
                    <th>상태</th>
                    <th>제출</th>
                    <th>미제출</th>
                    <th>제출률</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const w = weeks.find((wk) => wk.id === a.week_id)
                    const subs = submissions.filter((s) => s.assignment_id === a.id)
                    const rate = members.length > 0 ? Math.round((subs.length / members.length) * 100) : 0
                    const isClosed = a.status === 'closed' || (a.status === 'open' && new Date(a.due_at) < now)
                    const statusLabel = isClosed ? '마감' : a.status === 'open' ? '진행중' : '임시'
                    const statusColor = isClosed ? 'var(--text-muted)' : a.status === 'open' ? 'var(--green)' : 'var(--yellow)'
                    return (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{w ? `${w.number}주차` : '-'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}15`, padding: '3px 8px', borderRadius: 6 }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--green)' }}>{subs.length}명</td>
                        <td style={{ fontWeight: 600, color: 'var(--red)' }}>{members.length - subs.length}명</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ flex: 1, minWidth: 60 }}>
                              <div className="progress-fill" style={{ width: `${rate}%`, background: rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--yellow)' : 'var(--red)' }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', minWidth: 36, textAlign: 'right' }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {assignments.length === 0 && <div className="empty">등록된 과제가 없습니다.</div>}
          </div>

          {/* 수강생별 과제 제출 현황 */}
          {closedAssignments.length > 0 && (
            <div className="card" style={{ marginTop: 24 }}>
              <div className="section-title">수강생별 과제 제출 현황</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      {closedAssignments.map((a) => {
                        const w = weeks.find((wk) => wk.id === a.week_id)
                        return <th key={a.id}>{w ? `${w.number}주` : '?'}</th>
                      })}
                      <th>제출률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberStats.map((m) => {
                      const mySubs = submissions.filter((s) => s.user_id === m.id)
                      return (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{m.name}</td>
                          {closedAssignments.map((a) => {
                            const sub = mySubs.find((s) => s.assignment_id === a.id)
                            return (
                              <td key={a.id} style={{ textAlign: 'center' }}>
                                <span style={{ color: sub ? getStatusColor(sub.status) : 'var(--red)', fontWeight: 600, fontSize: 12 }}>
                                  {sub ? (sub.status === 'late' ? '△' : '✓') : '✕'}
                                </span>
                              </td>
                            )
                          })}
                          <td style={{ fontWeight: 700, color: getStatusColor(m.subRate >= 80 ? 'PRESENT' : m.subRate >= 50 ? 'LATE' : 'ABSENT') }}>{m.subRate}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ━━━ 수강생별 통계 ━━━ */}
      {tab === 'members' && (
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div className="section-title">수강생 종합 현황</div>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const headers = ['이름', '학과', '출석', '지각', '결석', '출석률', '과제제출수', '제출률', '종합점수']
              const rows = memberStats.map(m => [
                m.name, m.department || '', String(m.present), String(m.late), String(m.absent),
                `${m.attRate}%`, String(m.submitted), `${m.subRate}%`, `${m.totalScore}%`
              ])
              downloadCSV('수강생별통계.csv', headers, rows)
            }}>CSV 내보내기</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>학과</th>
                  <th>출석</th>
                  <th>지각</th>
                  <th>결석</th>
                  <th>출석률</th>
                  <th>과제 제출</th>
                  <th>제출률</th>
                  <th>종합점수</th>
                </tr>
              </thead>
              <tbody>
                {memberStats.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{m.department}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--green)' }}>{m.present}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--yellow)' }}>{m.late}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--red)' }}>{m.absent}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1, minWidth: 48 }}>
                          <div className="progress-fill" style={{ width: `${m.attRate}%`, background: m.attRate >= 80 ? 'var(--green)' : m.attRate >= 50 ? 'var(--yellow)' : 'var(--red)' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', minWidth: 36, textAlign: 'right' }}>{m.attRate}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.submitted}/{closedAssignments.length}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1, minWidth: 48 }}>
                          <div className="progress-fill" style={{ width: `${m.subRate}%`, background: m.subRate >= 80 ? 'var(--green)' : m.subRate >= 50 ? 'var(--yellow)' : 'var(--red)' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', minWidth: 36, textAlign: 'right' }}>{m.subRate}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1, minWidth: 48 }}>
                          <div className="progress-fill" style={{ width: `${m.totalScore}%`, background: m.totalScore >= 80 ? 'var(--green)' : m.totalScore >= 50 ? 'var(--yellow)' : 'var(--red)' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', minWidth: 36, textAlign: 'right' }}>{m.totalScore}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {members.length === 0 && <div className="empty">수강생이 없습니다.</div>}
        </div>
      )}
    </div>
  )
}
