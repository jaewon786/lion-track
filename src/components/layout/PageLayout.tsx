import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import {
  Home, BookOpen, ClipboardList, CheckCircle, Users, Bell,
  LogOut, Menu, X, Clock, BarChart3, Key, MessageCircle,
} from 'lucide-react'

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'ADMIN'

  const handleLogout = async () => {
    try {
      await signOut()
    } catch {
      // ignore
    }
    navigate('/login', { replace: true })
  }

  const adminNav = [
    { section: '메인', items: [
      { to: '/admin', label: '대시보드', icon: <Home size={20} /> },
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
      { to: '/dashboard', label: '대시보드', icon: <Home size={20} /> },
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
              <span className="logo-sub">14기 프론트엔드</span>
            </div>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((sec) => (
            <div className="nav-section" key={sec.section}>
              <div className="nav-label">{sec.section}</div>
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin' || item.to === '/dashboard' || item.to === '/attendance'}
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
              <div className="user-role">{isAdmin ? '운영진' : '아기사자'}</div>
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
