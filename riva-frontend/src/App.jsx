import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'

// Pages
import LoginPage          from './pages/auth/LoginPage'
import NPCPage            from './pages/npc/NPCPage'
import NpcReportPage      from './pages/npc/NpcReportPage'
import OrdersPage         from './pages/orders/OrdersPage'
import PerformancePage    from './pages/performance/PerformancePage'
import IncentivesPage     from './pages/incentives/IncentivesPage'
import IncrementPage      from './pages/incentives/IncrementPage'
import CustomerVisitsPage from './pages/customers/CustomerVisitsPage'
import TelecallingPage    from './pages/telecalling/TelecallingPage'
import AchievementsPage   from './pages/achievements/AchievementsPage'
import AdminPage          from './pages/admin/AdminPage'

// Protected route wrapper
function Protected({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/npc" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/npc" replace /> : <LoginPage />} />

      {/* Protected shell */}
      <Route element={<AppLayout />}>
        <Route path="/npc" element={
          <Protected roles={['ADMIN','FLOOR_INCHARGE','SALES_EXECUTIVE','CASHIER','ORDER_DEPARTMENT','TELECALLER']}>
            <NPCPage />
          </Protected>
        } />
        <Route path="/npc/reports" element={
          <Protected roles={['ADMIN','FLOOR_INCHARGE','SALES_EXECUTIVE','CASHIER','ORDER_DEPARTMENT','TELECALLER']}>
            <NpcReportPage />
          </Protected>
        } />
        <Route path="/orders" element={
          <Protected roles={['ADMIN','FLOOR_INCHARGE','SALES_EXECUTIVE','CASHIER','ORDER_DEPARTMENT','TELECALLER']}>
            <OrdersPage />
          </Protected>
        } />
        <Route path="/performance" element={
          <Protected roles={['ADMIN','FLOOR_INCHARGE']}>
            <PerformancePage />
          </Protected>
        } />
        <Route path="/incentives" element={
          <Protected roles={['ADMIN']}>
            <IncentivesPage />
          </Protected>
        } />
        <Route path="/increment" element={
          <Protected roles={['ADMIN']}>
            <IncrementPage />
          </Protected>
        } />
        <Route path="/customers" element={
          <Protected roles={['ADMIN','FLOOR_INCHARGE']}>
            <CustomerVisitsPage />
          </Protected>
        } />
        <Route path="/telecalling" element={
          <Protected roles={['ADMIN','FLOOR_INCHARGE','SALES_EXECUTIVE','CASHIER','ORDER_DEPARTMENT','TELECALLER']}>
            <TelecallingPage />
          </Protected>
        } />
        <Route path="/achievements" element={
          <Protected roles={['ADMIN','FLOOR_INCHARGE']}>
            <AchievementsPage />
          </Protected>
        } />
        <Route path="/admin" element={
          <Protected roles={['ADMIN']}>
            <AdminPage />
          </Protected>
        } />

        {/* Default redirect */}
        <Route index element={<Navigate to="/npc" replace />} />
        <Route path="*" element={<Navigate to="/npc" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '10px',
              border: '1px solid #e4e7ec',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            },
            success: { iconTheme: { primary: '#1D9E75', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#D85A30', secondary: '#fff' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
