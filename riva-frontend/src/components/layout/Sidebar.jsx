import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.jpeg'

const ALL_STAFF_ROLES = ['ADMIN','FLOOR_INCHARGE','SALES_EXECUTIVE','CASHIER','ORDER_DEPARTMENT','TELECALLER']

const NAV = [
  {
    section: 'Operations',
    items: [
      { path: '/npc',           icon: '🪙', label: 'NPC Process',      roles: ALL_STAFF_ROLES },
      { path: '/orders',        icon: '📦', label: 'Orders & Repair',   roles: ALL_STAFF_ROLES },
      { path: '/telecalling',   icon: '📞', label: 'Telecalling',       roles: ALL_STAFF_ROLES },
    ]
  },
  {
    section: 'Performance',
    items: [
      { path: '/performance',   icon: '📊', label: 'Performance Eval',  roles: ['ADMIN','FLOOR_INCHARGE'] },
      { path: '/incentives',    icon: '💰', label: 'Incentives',        roles: ['ADMIN'] },
      { path: '/increment',     icon: '📈', label: 'Increment',         roles: ['ADMIN'] },
    ]
  },
  {
    section: 'Reports',
    items: [
      { path: '/customers',     icon: '👥', label: 'Customer Visits',   roles: ['ADMIN','FLOOR_INCHARGE'] },
      { path: '/achievements',  icon: '🏅', label: 'Achievements',      roles: ['ADMIN','FLOOR_INCHARGE'] },
    ]
  },
  {
    section: 'Admin',
    items: [
      { path: '/admin',         icon: '⚙️', label: 'Admin Panel',       roles: ['ADMIN'] },
    ]
  }
]

export default function Sidebar({ collapsed, onToggle, onCloseMobile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, hasRole } = useAuth()

  const visibleNav = NAV.map(section => ({
    ...section,
    items: section.items.filter(item => hasRole(...item.roles))
  })).filter(s => s.items.length > 0)

  function handleNavigate(path) {
    navigate(path)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sb-logo">
        <img src={logo} alt="RIVA Logo" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2, flexShrink: 0 }} />
        <div className="sb-logo-text">
          <h1>RIVA</h1>
          <p>Results Integration &amp; Verified Analytics</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {visibleNav.map(section => (
          <div key={section.section}>
            <div className="sb-section">{section.section}</div>
            {section.items.map(item => (
              <button
                key={item.path}
                className={`sb-item${location.pathname.startsWith(item.path) ? ' active' : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <span className="sb-item-icon">{item.icon}</span>
                <span className="sb-label">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Toggle */}
      <div className="sb-footer">
        <button className="sb-toggle" onClick={onToggle}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
    </div>
  )
}
