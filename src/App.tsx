import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './stores/authStore'

import PageLayout from './components/layout/PageLayout'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import WeeksPage from './pages/weeks/WeeksPage'
import WeekDetailPage from './pages/weeks/WeekDetailPage'
import AssignmentsPage from './pages/assignments/AssignmentsPage'
import AssignmentDetailPage from './pages/assignments/AssignmentDetailPage'
import AttendanceCheckPage from './pages/attendance/AttendanceCheckPage'
import MyAttendancePage from './pages/attendance/MyAttendancePage'
import NoticesPage from './pages/notices/NoticesPage'
import NoticeDetailPage from './pages/notices/NoticeDetailPage'
import QuestionsPage from './pages/questions/QuestionsPage'
import QuestionDetailPage from './pages/questions/QuestionDetailPage'
import AdminWeeksPage from './pages/admin/AdminWeeksPage'
import AdminAssignmentsPage from './pages/admin/AdminAssignmentsPage'
import AdminAttendancePage from './pages/admin/AdminAttendancePage'
import AdminMembersPage from './pages/admin/AdminMembersPage'
import AdminStatsPage from './pages/admin/AdminStatsPage'

function ProtectedRoute() {
  const { user, loading } = useAuthStore()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>
  if (!user) return <Navigate to="/login" replace />
  return <PageLayout><Outlet /></PageLayout>
}

function AdminRoute() {
  const { user } = useAuthStore()
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}

function AuthRoute() {
  const { user, loading } = useAuthStore()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

function AppInner() {
  const initialize = useAuthStore((s) => s.initialize)
  useEffect(() => { initialize() }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/weeks" element={<WeeksPage />} />
          <Route path="/weeks/:id" element={<WeekDetailPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          <Route path="/attendance" element={<AttendanceCheckPage />} />
          <Route path="/attendance/my" element={<MyAttendancePage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/notices/:id" element={<NoticeDetailPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/questions/:id" element={<QuestionDetailPage />} />

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/weeks" element={<AdminWeeksPage />} />
            <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            <Route path="/admin/members" element={<AdminMembersPage />} />
            <Route path="/admin/stats" element={<AdminStatsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: 12, background: '#1e293b', color: '#f1f5f9', fontSize: 14 } }} />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}

