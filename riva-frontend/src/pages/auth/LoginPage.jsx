import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import logo from '../../assets/logo.jpeg'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '', storeCode: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username || !form.password) { toast.error('Enter username and password'); return }
    setLoading(true)
    try {
      const user = await login(form.username, form.password, form.storeCode)
      const roleRoutes = {
        ADMIN: '/npc', FLOOR_INCHARGE: '/npc',
        SALES_EXECUTIVE: '/npc', CASHIER: '/npc',
        ORDER_DEPARTMENT: '/orders', TELECALLER: '/telecalling'
      }
      navigate(roleRoutes[user.role] || '/npc', { replace: true })
    } catch (err) {
      // Error toast already handled inside login() or catch here
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img
            src={logo}
            alt="RIVA Logo"
            style={{
              width: 84,
              height: 84,
              objectFit: 'contain',
              margin: '0 auto 12px',
              display: 'block',
              borderRadius: 14,
              background: '#fff',
              padding: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
            }}
          />
          <h1>RIVA</h1>
          <p>Results Integration &amp; Verified Analytics</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>Username <span className="req">*</span></label>
            <input
              className="fc"
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="fg">
            <label>Password <span className="req">*</span></label>
            <input
              className="fc"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div className="fg">
            <label>Store Code <span className="opt" style={{ fontSize: 11, color: 'var(--tx3)', fontWeight: 400 }}>(Optional - e.g. MUMBAI-01)</span></label>
            <input
              className="fc"
              type="text"
              placeholder="Default store"
              value={form.storeCode}
              onChange={e => setForm(f => ({ ...f, storeCode: e.target.value.toUpperCase() }))}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: 8, padding: '11px' }}
            disabled={loading}
          >
            {loading ? '⟳ Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--tx3)' }}>
          Default: admin / admin123 (Multi-tenant isolated per store schema)
        </div>
      </div>
    </div>
  )
}
