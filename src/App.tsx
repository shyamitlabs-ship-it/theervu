import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './lib/AuthContext'
import LoginPage from './pages/LoginPage'
import StudentLayout from './layouts/StudentLayout'
import StaffLayout from './layouts/StaffLayout'
import AdminLayout from './layouts/AdminLayout'
import StudentHome from './pages/student/StudentHome'
import RaiseTicket from './pages/student/RaiseTicket'
import MyTickets from './pages/student/MyTickets'
import TicketDetail from './pages/student/TicketDetail'
import StaffQueue from './pages/staff/StaffQueue'
import StaffTicketDetail from './pages/staff/StaffTicketDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFlagged from './pages/admin/AdminFlagged'
import AdminEvents from './pages/admin/AdminEvents'
import AdminUsers from './pages/admin/AdminUsers'

const queryClient = new QueryClient()

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/" />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} /> : <LoginPage />} />
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentHome />} />
        <Route path="raise" element={<RaiseTicket />} />
        <Route path="tickets" element={<MyTickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
      </Route>
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffLayout /></ProtectedRoute>}>
        <Route index element={<StaffQueue />} />
        <Route path="tickets/:id" element={<StaffTicketDetail />} />
      </Route>
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="flagged" element={<AdminFlagged />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App