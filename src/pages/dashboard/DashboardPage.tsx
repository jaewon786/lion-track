import { useAuthStore } from '../../stores/authStore'
import MemberDashboard from './MemberDashboard'
import AdminDashboard from './AdminDashboard'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return <AdminDashboard />
  return <MemberDashboard />
}
