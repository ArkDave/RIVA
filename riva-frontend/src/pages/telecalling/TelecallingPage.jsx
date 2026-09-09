import { useState, useEffect } from 'react'
import { telecallingAPI } from '../../api/services'
import { Modal, Field, Spinner, Empty } from '../../components/common'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const STATUSES = ['Call Busy','Wrong Number','Did not Pick','Making Charges are High','Gold rate is high','Design Is not Good','Not Interested','Did not Like the Service','Shifted to another city/state','Will Visit soon']
const ACTIVE_STATUSES = ['Call Busy','Did not Pick']

export default function TelecallingPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [importModal, setImportModal] = useState(false)
  const [importText, setImportText]   = useState('')
  const [importing, setImporting]     = useState(false)
  const [tab, setTab]   = useState('contacts')
  const [report, setReport] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await telecallingAPI.getContacts(user.userId)
      setContacts(r.data.data)
    } catch {}
    setLoading(false)
  }

  async function handleStatusChange(contactId, status) {
    try {
      await telecallingAPI.updateStatus(contactId, status)
      setContacts(prev => prev.map(c => c.id === contactId
        ? { ...c, callStatus: status, callActive: ACTIVE_STATUSES.includes(status) }
        : c
      ))
    } catch {}
  }

  async function handleImport() {
    const lines = importText.trim().split('\n').filter(Boolean)
    if (!lines.length) { toast.error('No data to import'); return }
    const contacts = lines.map(l => {
      const [customerName, customerPhone] = l.split(',').map(s => s.trim())
      return { customerName, customerPhone }
    })
    setImporting(true)
    try {
      await telecallingAPI.importContacts(user.userId, { contacts })
      toast.success(`Imported ${contacts.length} contacts`)
      setImportModal(false)
      setImportText('')
      load()
    } catch {}
    setImporting(false)
  }

  async function handleDayEnd() {
    try {
      const r = await telecallingAPI.dayEnd(user.userId)
      setReport(r.data.data)
      setTab('report')
      toast.success('Day-end report generated!')
    } catch {}
  }

  if (loading) return <Spinner />

  const active = contacts.filter(c => c.callActive || !c.callStatus).length
  const ended  = contacts.filter(c => !c.callActive && c.callStatus).length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Telecalling</div>
          <div className="page-sub">Manage customer call data and daily report</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={()=>setImportModal(true)}>⬆ Import Contacts</button>
          <button className="btn btn-gold btn-sm" onClick={handleDayEnd}>Day-End Report</button>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:18 }}>
        <div className="stat-card"><div className="stat-label">Total Contacts</div><div className="stat-value">{contacts.length}</div></div>
        <div className="stat-card"><div className="stat-label">Active / Pending</div><div className="stat-value text-gold">{active}</div></div>
        <div className="stat-card"><div className="stat-label">Calls Ended</div><div className="stat-value text-green">{ended}</div></div>
      </div>

      <div className="flex gap-2" style={{ marginBottom:14 }}>
        {['contacts','report'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`btn btn-sm ${tab===t?'btn-primary':'btn-secondary'}`}>
            {t==='contacts'?'📋 Contacts':'📊 Report'}
          </button>
        ))}
      </div>

      {tab === 'contacts' ? (
        <div className="tw">
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>Phone</th><th>Status</th><th>Active</th></tr>
            </thead>
            <tbody>
              {contacts.length === 0
                ? <tr><td colSpan={5}><Empty icon="📞" title="No contacts yet" subtitle="Import contact data to get started" /></td></tr>
                : contacts.map((c,i)=>(
                  <tr key={c.id}>
                    <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                    <td style={{ fontWeight:600 }}>{c.customerName}</td>
                    <td className="td-mono">{c.customerPhone}</td>
                    <td>
                      <select className="fc" style={{ width:230 }} value={c.callStatus||''} onChange={e=>handleStatusChange(c.id,e.target.value)}>
                        <option value="">— Select Status —</option>
                        {STATUSES.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      {c.callStatus
                        ? <span className={`badge ${c.callActive?'bg-gold':'bg-green'}`}>{c.callActive?'Active':'Ended'}</span>
                        : <span className="badge bg-gray">Pending</span>
                      }
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ maxWidth:500 }}>
          <div className="card-title">Telecalling Report — {report?.reportDate || new Date().toISOString().split('T')[0]}</div>
          <div className="tw">
            <table>
              <thead><tr><th>Sr.No</th><th>Reason</th><th>Total Responses</th></tr></thead>
              <tbody>
                {(report?.statusSummary || []).map((r,i)=>(
                  <tr key={r.reason}>
                    <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                    <td>{r.reason}</td>
                    <td style={{ fontWeight:700 }}>{r.totalResponses || '—'}</td>
                  </tr>
                ))}
                <tr style={{ background:'var(--bg2)', fontWeight:700 }}>
                  <td colSpan={2} style={{ textAlign:'right' }}>Total Calls</td>
                  <td>{report?.totalCalls || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize:11, color:'var(--tx2)', marginTop:10 }}>
            Call Busy &amp; Did not Pick remain Active. All other statuses end the call.
          </p>
        </div>
      )}

      {/* Import Modal */}
      {importModal && (
        <Modal title="Import Customer Data" onClose={()=>setImportModal(false)}>
          <p style={{ fontSize:12, color:'var(--tx2)', marginBottom:10 }}>
            Paste CSV data — one contact per line: <code>Name, Phone Number</code>
          </p>
          <textarea className="fc" rows={8} value={importText} onChange={e=>setImportText(e.target.value)}
            placeholder={'Ravi Patel, 9876501234\nSonal Mehta, 9876502345'} />
          <div style={{ marginTop:12 }}>
            <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
              {importing ? '⟳ Importing...' : 'Import Contacts'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
