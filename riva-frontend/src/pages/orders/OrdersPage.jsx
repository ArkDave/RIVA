import { useState, useEffect } from 'react'
import { orderAPI } from '../../api/services'
import { Modal, Field, Input, Badge, Spinner, Empty } from '../../components/common'
import { orderStatusBadge, fmtDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const STATUSES = ['ALL','RECEIVED','IN_PROCESS','READY','DELIVERED']
const STATUS_COLORS = { RECEIVED:'#378ADD', IN_PROCESS:'#BA7517', READY:'#1D9E75', DELIVERED:'#667085' }

export default function OrdersPage() {
  const [orders, setOrders]   = useState([])
  const [summary, setSummary] = useState({})
  const [filter, setFilter]   = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [oRes, sRes] = await Promise.all([orderAPI.getAll(), orderAPI.summary()])
      setOrders(oRes.data.data)
      setSummary(sRes.data.data)
    } catch {}
    setLoading(false)
  }

  function openEdit(order) {
    setEditModal(order)
    setForm({
      karigarName: order.karigarName || '',
      karigarAllottedDate: order.karigarAllottedDate || '',
      productReceivedDate: order.productReceivedDate || '',
      deliveredDate: order.deliveredDate || '',
      billNumber: order.billNumber || '',
      gramage: order.gramage || ''
    })
  }

  async function handleUpdate() {
    if (form.deliveredDate && !form.billNumber) {
      toast.error('Bill number required to mark as Delivered'); return
    }
    try {
      await orderAPI.update(editModal.id, form)
      toast.success('Order updated!')
      setEditModal(null)
      load()
    } catch {}
  }

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Orders &amp; Repair</div>
          <div className="page-sub">Track orders from received to delivered</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(5,1fr)' }}>
        {['RECEIVED','IN_PROCESS','READY','DELIVERED'].map(s => {
          const info = summary[s] || {}
          const sb = orderStatusBadge(s)
          return (
            <div key={s} className="stat-card" style={{ borderTop:`3px solid ${STATUS_COLORS[s]}`, cursor:'pointer' }} onClick={()=>setFilter(s)}>
              <div className="stat-label" style={{ color:STATUS_COLORS[s] }}>{s.replace('_',' ')}</div>
              <div className="stat-value" style={{ color:STATUS_COLORS[s] }}>{info.count || 0}</div>
              <div className="stat-sub">{info.grams ? `${Number(info.grams).toFixed(2)}g` : '0g'}</div>
            </div>
          )
        })}
        <div className="stat-card">
          <div className="stat-label">Total Grams</div>
          <div className="stat-value">{summary.TOTAL_GMS ? Number(summary.TOTAL_GMS).toFixed(2) : '0'}</div>
          <div className="stat-sub">across all orders</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2" style={{ marginBottom:14, flexWrap:'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            className={`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`}>
            {s === 'ALL' ? 'All Orders' : s.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Order No.</th><th>Customer</th><th>Product</th>
              <th>Delivery</th><th>Status</th><th>Karigar</th>
              <th>Grams</th><th>Sales Exec</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9}><Empty icon="📦" title="No orders found" /></td></tr>
              : filtered.map(o => {
                  const sb = orderStatusBadge(o.status)
                  return (
                    <tr key={o.id}>
                      <td className="td-mono">{o.orderNumber}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{o.customerName}</div>
                        <div style={{ fontSize:11, color:'var(--tx2)' }}>{o.customerPhone}</div>
                      </td>
                      <td>
                        <div>{o.productName}</div>
                        <div style={{ fontSize:11, color:'var(--tx2)' }}>{o.productDetail}</div>
                      </td>
                      <td style={{ fontSize:12 }}>{fmtDate(o.deliveryDate)}</td>
                      <td><Badge label={sb.label} cls={sb.cls} /></td>
                      <td style={{ fontSize:12 }}>{o.karigarName || '—'}</td>
                      <td style={{ fontSize:12 }}>{o.gramage ? `${o.gramage}g` : '—'}</td>
                      <td style={{ fontSize:12 }}>{o.salesExecutiveName}</td>
                      <td><button className="btn btn-sm btn-secondary" onClick={()=>openEdit(o)}>Update</button></td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <Modal title={`Update Order — ${editModal.orderNumber}`} onClose={()=>setEditModal(null)} wide>
          <div style={{ padding:'10px 12px', background:'var(--bg2)', borderRadius:'var(--r-md)', marginBottom:14, fontSize:13 }}>
            <b>{editModal.customerName}</b> · {editModal.customerPhone} · {editModal.productName}
          </div>
          <div className="form-row">
            <Field label="Karigar Name"><Input value={form.karigarName} onChange={v=>setForm(f=>({...f,karigarName:v}))} placeholder="Karigar name" /></Field>
            <Field label="Karigar Allotted Date"><Input type="date" value={form.karigarAllottedDate} onChange={v=>setForm(f=>({...f,karigarAllottedDate:v}))} /></Field>
          </div>
          <div className="form-row">
            <Field label="Product Received Date"><Input type="date" value={form.productReceivedDate} onChange={v=>setForm(f=>({...f,productReceivedDate:v}))} /></Field>
            <Field label="Delivered Date"><Input type="date" value={form.deliveredDate} onChange={v=>setForm(f=>({...f,deliveredDate:v}))} /></Field>
          </div>
          <div className="form-row">
            <Field label="Bill Number"><Input value={form.billNumber} onChange={v=>setForm(f=>({...f,billNumber:v}))} placeholder="Required for delivery" /></Field>
            <Field label="Gramage (g)"><Input type="number" value={form.gramage} onChange={v=>setForm(f=>({...f,gramage:v}))} placeholder="e.g. 18.5" /></Field>
          </div>
          <div style={{ padding:'10px 12px', background:'var(--bg2)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--tx2)', marginBottom:14 }}>
            Status auto-derives: Karigar set → IN PROCESS · Product received → READY · Delivered + Bill → DELIVERED
          </div>
          <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
        </Modal>
      )}
    </div>
  )
}
