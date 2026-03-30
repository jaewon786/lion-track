import { useProfiles } from '../../hooks/useProfiles'

export default function AdminMembersPage() {
  const { data: users = [], isLoading } = useProfiles()

  if (isLoading) return <div style={{ padding: 32, textAlign: 'center' }}>로딩 중...</div>

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">회원 관리</div>
        <div className="page-subtitle">수강생 목록과 역할을 관리하세요.</div>
      </div>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>이름</th><th>이메일</th><th>학과</th><th>역할</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.name[0]}</div>
                    {u.name}
                  </div>
                </td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{u.email}</td>
                <td>{u.department}</td>
                <td>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: u.role === 'ADMIN' ? 'var(--accent-dim)' : 'rgba(59,130,246,0.1)',
                    color: u.role === 'ADMIN' ? 'var(--accent)' : 'var(--blue)',
                  }}>
                    {u.role === 'ADMIN' ? '운영진' : '아기사자'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
