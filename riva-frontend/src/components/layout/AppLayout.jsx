import { useState } from 'react'
import { useLocation, Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../../context/AuthContext'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className={`shell${mobileOpen ? ' mobile-open' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`main${collapsed ? ' collapsed' : ''}`}>
        <Topbar
          path={location.pathname}
          onToggleMobile={() => setMobileOpen(m => !m)}
        />
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
