import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { storeAPI } from '../../api/services'
import { Avatar } from '../common'
import { roleLabel } from '../../utils/helpers'

const PAGE_TITLES = {
  '/npc':          { title: 'NPC Process',        sub: 'Manage customer tokens and deals' },
  '/orders':       { title: 'Orders & Repair',    sub: 'Track order pipeline stages' },
  '/telecalling':  { title: 'Telecalling',         sub: 'Manage customer call data' },
  '/performance':  { title: 'Performance Eval',   sub: 'Daily staff scoring' },
  '/incentives':   { title: 'Incentives',          sub: 'Monthly target & incentive management' },
  '/increment':    { title: 'Increment Report',   sub: 'Annual increment calculation' },
  '/customers':    { title: 'Customer Visits',    sub: 'Visit frequency analysis' },
  '/achievements': { title: 'Staff Achievements', sub: 'Annual award report card' },
  '/admin':        { title: 'Admin Panel',         sub: 'Users, counters, configuration' },
}

export default function Topbar({ path, onToggleMobile }) {
  const { user, storeCode, tenantSchema, switchStore, logout } = useAuth()
  const [stores, setStores] = useState([])
  const [showStorePicker, setShowStorePicker] = useState(false)

  const page = Object.entries(PAGE_TITLES).find(([k]) => path.startsWith(k))
  const info = page ? page[1] : { title: 'RIVA', sub: '' }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  useEffect(() => {
    if (user?.role === 'ADMIN' && showStorePicker && stores.length === 0) {
      storeAPI.getStores()
        .then(res => {
          const list = res.data?.data || res.data || []
          setStores(list)
        })
        .catch(() => {})
    }
  }, [showStorePicker, user?.role, stores.length])

  return (
    <div className="topbar">
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center' }}>
        <button className="menu-btn" onClick={onToggleMobile} title="Toggle Navigation">☰</button>
        <div>
          <h2>{info.title}</h2>
          <p>{info.sub} &nbsp;·&nbsp; {today}</p>
        </div>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Active Store Schema Badge */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => user?.role === 'ADMIN' && setShowStorePicker(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 20,
              background: 'var(--accent-light, rgba(29,158,117,0.1))',
              border: '1px solid var(--accent, #1D9E75)',
              color: 'var(--accent, #1D9E75)',
              fontSize: 12,
              fontWeight: 600,
              cursor: user?.role === 'ADMIN' ? 'pointer' : 'default'
            }}
            title={`Active Database Schema: ${tenantSchema}`}
          >
            <span>🏪</span>
            <span>{storeCode || 'DEFAULT'}</span>
            {user?.role === 'ADMIN' && <span style={{ fontSize: 10 }}>▼</span>}
          </button>

          {/* Admin Store Switcher Menu */}
          {showStorePicker && (
            <div style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              background: '#fff',
              border: '1px solid #e4e7ec',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              width: 220,
              zIndex: 100,
              padding: '6px 0'
            }}>
              <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', borderBottom: '1px solid #f0f0f0' }}>
                Switch Active Store
              </div>
              {stores.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--tx2)' }}>
                  Default Store ({storeCode})
                </div>
              ) : (
                stores.map(st => (
                  <div
                    key={st.id}
                    onClick={() => {
                      switchStore(st.code, st.schemaName)
                      setShowStorePicker(false)
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                      background: st.code === storeCode ? '#f4f6f8' : 'transparent',
                      fontWeight: st.code === storeCode ? 600 : 400,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div>{st.name} ({st.code})</div>
                      <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{st.schemaName}</div>
                    </div>
                    {st.code === storeCode && <span style={{ color: '#1D9E75' }}>✓</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="user-chip">
          <Avatar name={user?.fullName || 'U'} size={28} />
          <div>
            <div className="user-chip-name">{user?.fullName}</div>
            <div className="user-chip-role">{roleLabel(user?.role)}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </div>
  )
}
