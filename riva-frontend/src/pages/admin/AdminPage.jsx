import { useState, useEffect } from 'react'
import { adminAPI, storeAPI } from '../../api/services'
import { Modal, Field, Input, Select, Avatar, Spinner, Empty, Confirm } from '../../components/common'
import { roleLabel } from '../../utils/helpers'
import toast from 'react-hot-toast'

const ROLES = ['ADMIN','FLOOR_INCHARGE','SALES_EXECUTIVE','CASHIER','ORDER_DEPARTMENT','TELECALLER']
const METALS = ['GOLD','SILVER','DIAMOND','PLATINUM']

export default function AdminPage() {
  const [tab, setTab]           = useState('users')
  const [users, setUsers]       = useState([])
  const [counters, setCounters] = useState([])
  const [ticketSizes, setTicketSizes] = useState([])
  const [stores, setStores]     = useState([])
  const [loading, setLoading]   = useState(true)

  // User form
  const [userModal, setUserModal] = useState(false)
  const [userForm, setUserForm]   = useState({ username:'', password:'', fullName:'', phone:'', role:'', counterId:'' })
  const [saving, setSaving]       = useState(false)

  // Counter form
  const [counterName, setCounterName] = useState('')
  const [counterDesc, setCounterDesc] = useState('')

  // Store form
  const [storeModal, setStoreModal] = useState(false)
  const [storeForm, setStoreForm]   = useState({ code: '', name: '', address: '', phone: '' })

  // Confirm delete
  const [confirm, setConfirm] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [uRes, cRes, tRes, sRes] = await Promise.allSettled([
        adminAPI.getUsers(),
        adminAPI.getCounters(),
        adminAPI.getTicketSizes(),
        storeAPI.getStores()
      ])

      if (uRes.status === 'fulfilled') setUsers(uRes.value.data?.data || uRes.value.data || [])
      if (cRes.status === 'fulfilled') setCounters(cRes.value.data?.data || cRes.value.data || [])
      if (tRes.status === 'fulfilled') setTicketSizes(tRes.value.data?.data || tRes.value.data || [])
      if (sRes.status === 'fulfilled') setStores(sRes.value.data?.data || sRes.value.data || [])
    } catch {}
    setLoading(false)
  }

  // ── Stores ────────────────────────────────────────────────
  async function createStore() {
    const { code, name } = storeForm
    if (!code || !name) { toast.error('Store code and name are required'); return }
    setSaving(true)
    try {
      await storeAPI.createStore(storeForm)
      toast.success(`Store "${code.toUpperCase()}" provisioned successfully!`)
      setStoreModal(false)
      setStoreForm({ code: '', name: '', address: '', phone: '' })
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to provision store schema')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStore(id, currentActive) {
    try {
      await storeAPI.toggleStoreStatus(id, !currentActive)
      toast.success(`Store status updated`)
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update store status')
    }
  }

  // ── Users ─────────────────────────────────────────────────
  async function createUser() {
    const { username, password, fullName, role } = userForm
    if (!username || !password || !fullName || !role) { toast.error('All required fields must be filled'); return }
    setSaving(true)
    try {
      await adminAPI.createUser({
        ...userForm,
        counterId: userForm.counterId ? +userForm.counterId : undefined
      })
      toast.success('User created!')
      setUserModal(false)
      setUserForm({ username:'', password:'', fullName:'', phone:'', role:'', counterId:'' })
      loadAll()
    } catch {}
    setSaving(false)
  }

  async function deleteUser(id, name) {
    setConfirm({
      message: `Deactivate user "${name}"? They will no longer be able to log in.`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteUser(id)
          toast.success('User deactivated')
          loadAll()
        } catch {}
        setConfirm(null)
      },
      onCancel: () => setConfirm(null)
    })
  }

  // ── Counters ──────────────────────────────────────────────
  async function createCounter() {
    if (!counterName.trim()) { toast.error('Counter name required'); return }
    try {
      await adminAPI.createCounter(counterName, counterDesc)
      toast.success('Counter added!')
      setCounterName('')
      setCounterDesc('')
      loadAll()
    } catch {}
  }

  async function deleteCounter(id, name) {
    setConfirm({
      message: `Remove counter "${name}"?`,
      onConfirm: async () => {
        try {
          await adminAPI.deleteCounter(id)
          toast.success('Counter removed')
          loadAll()
        } catch {}
        setConfirm(null)
      },
      onCancel: () => setConfirm(null)
    })
  }

  // ── Ticket Sizes ──────────────────────────────────────────
  const [ticketEdits, setTicketEdits] = useState({})

  useEffect(() => {
    const e = {}
    ticketSizes.forEach(t => { e[t.metalType] = t.ticketSize })
    setTicketEdits(e)
  }, [ticketSizes])

  async function saveTicketSize(metal) {
    try {
      await adminAPI.updateTicketSize(metal, ticketEdits[metal])
      toast.success(`${metal} ticket size updated!`)
      loadAll()
    } catch {}
  }

  if (loading) return <Spinner />

  const TABS = [
    { key:'users',    label:'👤 Users' },
    { key:'counters', label:'🏪 Counters' },
    { key:'ticket',   label:'🏷️ Ticket Sizes' },
    { key:'stores',   label:'🏢 Store Schemas' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Admin Panel</div>
          <div className="page-sub">Manage users, counters, stores, and system configuration</div>
        </div>
        {tab === 'users' && (
          <button className="btn btn-primary btn-sm" onClick={() => setUserModal(true)}>+ Add User</button>
        )}
        {tab === 'stores' && (
          <button className="btn btn-primary btn-sm" onClick={() => setStoreModal(true)}>+ Provision Store</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: 18 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <div className="tw">
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>Username</th><th>Role</th><th>Counter</th><th>Phone</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.length === 0
                ? <tr><td colSpan={7}><Empty icon="👤" title="No users yet" /></td></tr>
                : users.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                    <td>
                      <div className="flex-center gap-2">
                        <Avatar name={u.fullName} size={30} />
                        <span style={{ fontWeight:600 }}>{u.fullName}</span>
                      </div>
                    </td>
                    <td className="td-mono">{u.username}</td>
                    <td><span className="badge bg-blue">{roleLabel(u.role)}</span></td>
                    <td style={{ fontSize:12 }}>{u.counter || '—'}</td>
                    <td style={{ fontSize:12 }}>{u.phone || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.id, u.fullName)}>
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* ── Counters Tab ── */}
      {tab === 'counters' && (
        <div>
          <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
            <div className="card-title">Add Counter</div>
            <div className="form-row">
              <Field label="Counter Name" required>
                <Input value={counterName} onChange={setCounterName} placeholder="e.g. Counter D" />
              </Field>
              <Field label="Description">
                <Input value={counterDesc} onChange={setCounterDesc} placeholder="Optional" />
              </Field>
            </div>
            <button className="btn btn-primary btn-sm" onClick={createCounter}>Add Counter</button>
          </div>

          <div className="tw">
            <table>
              <thead><tr><th>#</th><th>Counter Name</th><th>Description</th><th>Action</th></tr></thead>
              <tbody>
                {counters.length === 0
                  ? <tr><td colSpan={4}><Empty icon="🏪" title="No counters" /></td></tr>
                  : counters.map((c, i) => (
                    <tr key={c.id}>
                      <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                      <td style={{ fontWeight:600 }}>{c.name}</td>
                      <td style={{ fontSize:12, color:'var(--tx2)' }}>{c.description || '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteCounter(c.id, c.name)}>Remove</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Ticket Sizes Tab ── */}
      {tab === 'ticket' && (
        <div className="card" style={{ maxWidth: 420 }}>
          <div className="card-title">Ticket Size Configuration</div>
          <p style={{ fontSize:12, color:'var(--tx2)', marginBottom:16 }}>
            Used to calculate Approximate Financial Loss in Consolidated NPC Report.
            Amount = Ticket Size × Walkout Numbers.
          </p>
          {METALS.map(metal => (
            <div key={metal} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <label style={{ width:90, fontWeight:600, fontSize:13 }}>{metal}</label>
              <span style={{ color:'var(--tx2)' }}>₹</span>
              <input
                type="number"
                className="fc"
                style={{ flex:1 }}
                value={ticketEdits[metal] || ''}
                onChange={e => setTicketEdits(prev => ({ ...prev, [metal]: e.target.value }))}
                placeholder="e.g. 25000"
              />
              <button className="btn btn-sm btn-primary" onClick={() => saveTicketSize(metal)}>Save</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Stores Tab (Multi-Tenant Schema Management) ── */}
      {tab === 'stores' && (
        <div>
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--accent-light, #eefbf7)', borderRadius: 8, border: '1px solid #1D9E75' }}>
            <div style={{ fontWeight: 600, color: '#1D9E75', fontSize: 13 }}>Schema-per-Store Architecture</div>
            <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>
              Each store is provisioned with a dedicated PostgreSQL database schema (e.g. <code>store_mumbai_01</code>).
              API requests dynamically set PostgreSQL <code>search_path</code> based on JWT or <code>X-Store-Schema</code> header.
            </div>
          </div>

          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Store Code</th>
                  <th>Store Name</th>
                  <th>Database Schema</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0
                  ? <tr><td colSpan={7}><Empty icon="🏢" title="No stores provisioned yet" /></td></tr>
                  : stores.map((s, i) => (
                    <tr key={s.id || i}>
                      <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                      <td className="td-mono" style={{ fontWeight: 700 }}>{s.code}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <code style={{ background: '#f4f6f8', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                          {s.schemaName}
                        </code>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--tx2)' }}>
                        {s.phone ? `📞 ${s.phone}` : ''} {s.address ? `📍 ${s.address}` : (s.phone ? '' : '—')}
                      </td>
                      <td>
                        <span className={`badge ${s.active ? 'bg-green' : 'bg-red'}`}>
                          {s.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${s.active ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => toggleStore(s.id, s.active)}
                        >
                          {s.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {userModal && (
        <Modal title="Create New User" onClose={() => setUserModal(false)}>
          <div className="form-row">
            <Field label="Full Name" required>
              <Input value={userForm.fullName} onChange={v => setUserForm(f => ({...f, fullName:v}))} placeholder="e.g. Ravi Kumar" />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={userForm.phone} onChange={v => setUserForm(f => ({...f, phone:v}))} placeholder="10-digit mobile" />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Username" required>
              <Input value={userForm.username} onChange={v => setUserForm(f => ({...f, username:v}))} placeholder="login username" />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={userForm.password} onChange={v => setUserForm(f => ({...f, password:v}))} placeholder="min 6 chars" />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Role" required>
              <Select value={userForm.role} onChange={v => setUserForm(f => ({...f, role:v}))}
                options={ROLES.map(r => ({ value:r, label:roleLabel(r) }))} placeholder="Select role" />
            </Field>
            <Field label="Assign Counter">
              <Select value={userForm.counterId} onChange={v => setUserForm(f => ({...f, counterId:v}))}
                options={counters.map(c => ({ value:c.id, label:c.name }))} placeholder="Optional" />
            </Field>
          </div>
          <button className="btn btn-primary" onClick={createUser} disabled={saving}>
            {saving ? '⟳ Creating...' : 'Create User'}
          </button>
        </Modal>
      )}

      {/* Provision Store Modal */}
      {storeModal && (
        <Modal title="Provision New Store & Schema" onClose={() => setStoreModal(false)}>
          <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--tx2)', background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
            ℹ️ Creating a store dynamically runs <code>CREATE SCHEMA store_&lt;code&gt;</code> and initializes isolated domain tables automatically in PostgreSQL.
          </div>
          <div className="form-row">
            <Field label="Store Code" required>
              <Input
                value={storeForm.code}
                onChange={v => setStoreForm(f => ({...f, code: v.toUpperCase().replace(/\s+/g, '_')}))}
                placeholder="e.g. MUMBAI-01"
              />
            </Field>
            <Field label="Store Name" required>
              <Input value={storeForm.name} onChange={v => setStoreForm(f => ({...f, name: v}))} placeholder="e.g. Mumbai Bandra Branch" />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Phone">
              <Input type="tel" value={storeForm.phone} onChange={v => setStoreForm(f => ({...f, phone: v}))} placeholder="+919876543210" />
            </Field>
            <Field label="Address">
              <Input value={storeForm.address} onChange={v => setStoreForm(f => ({...f, address: v}))} placeholder="Bandra West, Mumbai" />
            </Field>
          </div>
          <button className="btn btn-primary" onClick={createStore} disabled={saving}>
            {saving ? '⟳ Provisioning Schema...' : 'Provision Store & Schema'}
          </button>
        </Modal>
      )}

      {/* Confirm dialog */}
      {confirm && <Confirm message={confirm.message} onConfirm={confirm.onConfirm} onCancel={confirm.onCancel} />}
    </div>
  )
}
