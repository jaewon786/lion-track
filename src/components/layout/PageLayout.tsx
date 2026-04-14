import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { TRACKS, TRACK_LABELS, type Track } from '../../types'
import {
  Home, BookOpen, ClipboardList, CheckCircle, Users, Bell,
  LogOut, Menu, X, Clock, BarChart3, Key, MessageCircle,
} from 'lucide-react'

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut, activeTrack, setActiveTrack } = useAuthStore()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const handleLogout = async () => {
    try {
      await signOut()
    } catch {
      // ignore
    }
    navigate('/login', { replace: true })
  }

  const roleLabel = isSuperAdmin ? '총괄 운영진' : isAdmin ? '운영진' : '아기사자'

  const adminNav = [
    { section: '메인', items: [
      { to: '/', label: '대시보드', icon: <Home size={20} /> },
      { to: '/admin/stats', label: '통계 현황', icon: <BarChart3 size={20} /> },
    ]},
    { section: '운영 관리', items: [
      { to: '/admin/weeks', label: '주차 관리', icon: <BookOpen size={20} /> },
      { to: '/admin/assignments', label: '과제 관리', icon: <ClipboardList size={20} /> },
      { to: '/admin/attendance', label: '출석 관리', icon: <Key size={20} /> },
      { to: '/admin/members', label: '회원 관리', icon: <Users size={20} /> },
    ]},
    { section: '기타', items: [
      { to: '/notices', label: '공지사항', icon: <Bell size={20} /> },
      { to: '/questions', label: '질문 게시판', icon: <MessageCircle size={20} /> },
    ]},
  ]

  const memberNav = [
    { section: '메인', items: [
      { to: '/', label: '대시보드', icon: <Home size={20} /> },
    ]},
    { section: '학습', items: [
      { to: '/weeks', label: '주차별 수업', icon: <BookOpen size={20} /> },
      { to: '/assignments', label: '과제', icon: <ClipboardList size={20} /> },
      { to: '/attendance', label: '출석 체크', icon: <CheckCircle size={20} /> },
      { to: '/attendance/my', label: '내 출석 현황', icon: <Clock size={20} /> },
    ]},
    { section: '기타', items: [
      { to: '/notices', label: '공지사항', icon: <Bell size={20} /> },
      { to: '/questions', label: '질문 게시판', icon: <MessageCircle size={20} /> },
    ]},
  ]

  const navItems = isAdmin ? adminNav : memberNav

  return (
    <div className="app">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-mark">LT</div>
            <div className="logo-text">
              <span className="logo-name">LION-TRACK</span>
              <span className="logo-sub">14기 {TRACK_LABELS[activeTrack]}</span>
            </div>
          </div>
          {isSuperAdmin && (
            <select
              value={activeTrack}
              onChange={(e) => setActiveTrack(e.target.value as Track)}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--accent)',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {TRACKS.map((t) => (
                <option key={t} value={t}>{TRACK_LABELS[t]}</option>
              ))}
            </select>
          )}
        </div>
        <nav className="nav">
          {navItems.map((sec) => (
            <div className="nav-section" key={sec.section}>
              <div className="nav-label">{sec.section}</div>
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/' || item.to === '/attendance'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.name?.[0] ?? '?'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{roleLabel}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo" style={{ gap: 8 }}>
            <div className="logo-mark" style={{ width: 32, height: 32, fontSize: 13, borderRadius: 8 }}>LT</div>
            <span className="logo-name" style={{ fontSize: 15 }}>LION-TRACK</span>
          </div>
          <div style={{ width: 32 }} />
        </div>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}
