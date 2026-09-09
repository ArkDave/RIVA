import { useState, useEffect, useRef, useCallback } from 'react'
import { tokenAPI, adminAPI } from '../../api/services'
import { Modal, Field, Select, Input, Badge, Spinner, Empty } from '../../components/common'
import { tokenStatusBadge, fmtTimer } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'
import { reportAPI } from '../../api/services'
import toast from 'react-hot-toast'

const METAL_TYPES  = ['GOLD','SILVER','DIAMOND','PLATINUM']
const PRODUCTS     = ['Ring','Chain','Bracelet','Necklace','Earrings','Bangle','Pendant','Set']
const NPC_REASONS  = ['Baad mai aayenge','Design pasand nhi aaye','5% making charge','Price too high','Not ready to buy','Just browsing','Need to discuss with family','Gold rate is high']

export default function NPCPage() {
  const { user, hasRole } = useAuth()
  const [counters, setCounters]   = useState([])
  const [staff, setStaff]         = useState([])
  const [tokens, setTokens]       = useState({}) // { counterId: [...tokens] }
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('floor') // 'floor' | 'report'
  const [elapsed, setElapsed]     = useState({}) // { tokenId: secs }

  // Modals
  const [raiseModal, setRaiseModal]   = useState(false)
  const [startModal, setStartModal]   = useState(null)
  const [closeModal, setCloseModal]   = useState(null)
  const [billModal, setBillModal]     = useState(null)
  const [reportData, setReportData]   = useState(null)

  // Forms
  const [raiseForm, setRaiseForm] = useState({ metalType:'', counterId:'', salesExecutiveId:'', productName:'' })
  const [startForm, setStartForm] = useState({ customerName:'', customerPhone:'' })
  const [closeForm, setCloseForm] = useState({ isSale: null, nonSaleReason:'', saleType:'', productDetail:'', deliveryDate:'' })
  const [billNo, setBillNo]       = useState('')

  const timerRef = useRef(null)

  // Load counters and staff
  useEffect(() => {
    async function init() {
      try {
        const [cRes, sRes] = await Promise.all([adminAPI.getCounters(), adminAPI.getUsers()])
        setCounters(cRes.data.data)
        setStaff(sRes.data.data.filter(u => ['SALES_EXECUTIVE','FLOOR_INCHARGE'].includes(u.role)))
      } catch {}
      setLoading(false)
    }
    init()
  }, [])

  // Load tokens per counter
  const loadTokens = useCallback(async () => {
    if (!counters.length) return
    const results = {}
    await Promise.all(counters.map(async c => {
      try {
        const r = await tokenAPI.byCounter(c.id)
        results[c.id] = r.data.data
      } catch { results[c.id] = [] }
    }))
    setTokens(results)
  }, [counters])

  useEffect(() => { loadTokens() }, [loadTokens])

  // Timer tick every second for IN_DEAL tokens
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = { ...prev }
        Object.values(tokens).flat().forEach(t => {
          if (t.status === 'IN_DEAL') next[t.id] = (prev[t.id] || t.elapsedSeconds || 0) + 1
        })
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [tokens])

  // Refresh tokens every 15s
  useEffect(() => {
    const interval = setInterval(loadTokens, 15000)
    return () => clearInterval(interval)
  }, [loadTokens])

  // ── Actions ──────────────────────────────────────────────────
  async function handleRaise() {
    const { metalType, counterId, salesExecutiveId, productName } = raiseForm
    if (!metalType || !counterId || !salesExecutiveId || !productName) {
      toast.error('All fields are mandatory'); return
    }
    try {
      await tokenAPI.raise({ metalType, counterId: +counterId, salesExecutiveId: +salesExecutiveId, productName })
      toast.success('Token raised!')
      setRaiseModal(false)
      setRaiseForm({ metalType:'', counterId:'', salesExecutiveId:'', productName:'' })
      loadTokens()
    } catch {}
  }

  async function handleStart() {
    if (!startForm.customerName || !startForm.customerPhone) {
      toast.error('Name and phone are mandatory'); return
    }
    try {
      await tokenAPI.startDeal(startModal.id, startForm)
      toast.success('Deal started!')
      setStartModal(null)
      setStartForm({ customerName:'', customerPhone:'' })
      loadTokens()
    } catch {}
  }

  async function handleClose() {
    const { isSale, nonSaleReason, saleType, productDetail, deliveryDate } = closeForm
    if (isSale === null) { toast.error('Select Sale or Non-Sale'); return }
    if (!isSale && !nonSaleReason) { toast.error('Reason is mandatory for Non-Sale'); return }
    if (isSale && !saleType) { toast.error('Select Direct Sale or Order'); return }
    if (isSale && saleType === 'ORDER' && (!productDetail || !deliveryDate)) {
      toast.error('Product detail and delivery date required for Order'); return
    }
    try {
      await tokenAPI.closeDeal(closeModal.id, { isSale, nonSaleReason, saleType, productDetail, deliveryDate })
      toast.success(isSale ? 'Deal closed as Sale!' : 'Deal closed as Non-Sale')
      setCloseModal(null)
      setCloseForm({ isSale: null, nonSaleReason:'', saleType:'', productDetail:'', deliveryDate:'' })
      loadTokens()
    } catch {}
  }

  async function handleBill() {
    if (!billNo.trim()) { toast.error('Bill number is mandatory'); return }
    try {
      await tokenAPI.enterBill(billModal.id, { billNumber: billNo })
      toast.success('Bill entered, deal closed!')
      setBillModal(null)
      setBillNo('')
      loadTokens()
    } catch {}
  }

  async function handleDayEnd() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await reportAPI.npcDaily(today)
      setReportData(res.data.data)
      setView('report')
    } catch {}
  }

  if (loading) return <Spinner />

  const allTokens = Object.values(tokens).flat()
  const activeCount = allTokens.filter(t => !['CLOSED_SALE','CLOSED_NON_SALE'].includes(t.status)).length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">NPC Process</div>
          <div className="page-sub">Non-Purchase Customer token management</div>
        </div>
        <div className="flex gap-2">
          {view === 'report' && <button className="btn btn-secondary btn-sm" onClick={() => setView('floor')}>← Floor View</button>}
          {hasRole('ADMIN','FLOOR_INCHARGE','SALES_EXECUTIVE') && view === 'floor' && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={handleDayEnd}>Day-End Report</button>
              <button className="btn btn-primary btn-sm" onClick={() => setRaiseModal(true)}>+ Raise Token</button>
            </>
          )}
        </div>
      </div>

      {view === 'floor' ? (
        <>
          {/* Summary stats */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <div className="stat-card"><div className="stat-label">Active Tokens</div><div className="stat-value text-green">{activeCount}</div></div>
            <div className="stat-card"><div className="stat-label">In Deal</div><div className="stat-value text-gold">{allTokens.filter(t=>t.status==='IN_DEAL').length}</div></div>
            <div className="stat-card"><div className="stat-label">Awaiting Bill</div><div className="stat-value text-blue">{allTokens.filter(t=>t.status==='AWAITING_BILL').length}</div></div>
            <div className="stat-card"><div className="stat-label">Counters</div><div className="stat-value">{counters.length}</div></div>
          </div>

          {/* Counter columns */}
          <div className="counter-grid">
            {counters.map(counter => {
              const ctokens = (tokens[counter.id] || []).filter(t => !['CLOSED_SALE','CLOSED_NON_SALE'].includes(t.status))
              return (
                <div key={counter.id} className="counter-col">
                  <div className="cch">
                    <span className="cch-title">{counter.name}</span>
                    <span style={{ fontSize:11, color:'var(--tx2)' }}>{ctokens.length}/5 tokens</span>
                  </div>
                  {ctokens.length === 0
                    ? <Empty icon="🎫" title="No active tokens" />
                    : ctokens.map(t => {
                      const sb = tokenStatusBadge(t.status)
                      const secs = elapsed[t.id] || t.elapsedSeconds || 0
                      return (
                        <div key={t.id} className={`token-card st-${t.status}`}>
                          <div className="flex-center gap-2" style={{ justifyContent:'space-between', marginBottom:5 }}>
                            <span className="td-mono">{t.tokenNumber}</span>
                            <Badge label={sb.label} cls={sb.cls} />
                          </div>
                          <div style={{ fontSize:12, color:'var(--tx2)', marginBottom:4 }}>
                            {t.metalType} · {t.productName} · {t.salesExecutiveName}
                          </div>
                          {t.customerName && (
                            <div style={{ fontSize:12, marginBottom:6 }}>
                              <b>{t.customerName}</b> · {t.customerPhone}
                              {t.status === 'IN_DEAL' && <span className="timer" style={{ marginLeft:8 }}>⏱ {fmtTimer(secs)}</span>}
                            </div>
                          )}
                          <div className="flex gap-2">
                            {t.status === 'RAISED' && hasRole('ADMIN','SALES_EXECUTIVE','FLOOR_INCHARGE') &&
                              <button className="btn btn-sm btn-secondary" onClick={() => { setStartModal(t); setStartForm({ customerName:'', customerPhone:'' }) }}>Start Deal</button>}
                            {t.status === 'IN_DEAL' && hasRole('ADMIN','SALES_EXECUTIVE','FLOOR_INCHARGE') &&
                              <button className="btn btn-sm btn-primary" onClick={() => { setCloseModal(t); setCloseForm({ isSale:null, nonSaleReason:'', saleType:'', productDetail:'', deliveryDate:'' }) }}>Close Deal</button>}
                            {t.status === 'AWAITING_BILL' && hasRole('ADMIN','CASHIER','SALES_EXECUTIVE','FLOOR_INCHARGE') &&
                              <button className="btn btn-sm btn-info" onClick={() => { setBillModal(t); setBillNo('') }}>Enter Bill No.</button>}
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* Day-End Report */
        <div className="card" style={{ maxWidth: 500 }}>
          <div className="card-title">NPC Report — {new Date().toLocaleDateString('en-IN')}</div>
          {reportData?.rows?.map(row => (
            <div key={row.metalType} style={{ marginBottom:16, paddingBottom:16, borderBottom:'1px solid var(--bdr)' }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>{row.metalType}</div>
              <div className="flex gap-3" style={{ fontSize:13 }}>
                <span>Walk-in: <b>{row.walkin}</b></span>
                <span>Walkout: <b>{row.walkout}</b></span>
                <span>Ratio: <b style={{ color: parseInt(row.walkoutRatio) > 30 ? 'var(--orange)' : 'var(--green)' }}>{row.walkoutRatio}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Raise Token Modal ── */}
      {raiseModal && (
        <Modal title="Raise New Token" onClose={() => setRaiseModal(false)}>
          <div className="form-row">
            <Field label="Metal Type" required>
              <Select value={raiseForm.metalType} onChange={v=>setRaiseForm(f=>({...f,metalType:v}))} options={METAL_TYPES} placeholder="Select" />
            </Field>
            <Field label="Counter" required>
              <Select value={raiseForm.counterId} onChange={v=>setRaiseForm(f=>({...f,counterId:v}))}
                options={counters.map(c=>({value:c.id,label:c.name}))} placeholder="Select" />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Sales Executive" required>
              <Select value={raiseForm.salesExecutiveId} onChange={v=>setRaiseForm(f=>({...f,salesExecutiveId:v}))}
                options={staff.map(s=>({value:s.id,label:s.fullName}))} placeholder="Select" />
            </Field>
            <Field label="Product" required>
              <Select value={raiseForm.productName} onChange={v=>setRaiseForm(f=>({...f,productName:v}))} options={PRODUCTS} placeholder="Select" />
            </Field>
          </div>
          <button className="btn btn-primary" onClick={handleRaise}>Raise Token</button>
        </Modal>
      )}

      {/* ── Start Deal Modal ── */}
      {startModal && (
        <Modal title={`Start Deal — ${startModal.tokenNumber}`} onClose={() => setStartModal(null)}>
          <Field label="Customer Name" required><Input value={startForm.customerName} onChange={v=>setStartForm(f=>({...f,customerName:v}))} placeholder="Full name" /></Field>
          <Field label="Phone Number" required><Input type="tel" value={startForm.customerPhone} onChange={v=>setStartForm(f=>({...f,customerPhone:v}))} placeholder="10-digit mobile" /></Field>
          <button className="btn btn-primary" onClick={handleStart}>Start Deal</button>
        </Modal>
      )}

      {/* ── Close Deal Modal ── */}
      {closeModal && (
        <Modal title={`Close Deal — ${closeModal.tokenNumber}`} onClose={() => setCloseModal(null)}>
          <Field label="Result" required>
            <div className="flex gap-2" style={{ marginTop:4 }}>
              {[{v:true,l:'Sale'},{v:false,l:'Non Sale'}].map(opt => (
                <button key={opt.l} onClick={()=>setCloseForm(f=>({...f,isSale:opt.v,nonSaleReason:'',saleType:''}))}
                  className={`btn ${closeForm.isSale===opt.v ? (opt.v?'btn-primary':'btn-danger') : 'btn-secondary'}`}
                  style={{ flex:1, justifyContent:'center' }}>{opt.l}</button>
              ))}
            </div>
          </Field>
          {closeForm.isSale === false && (
            <Field label="Reason" required>
              <Select value={closeForm.nonSaleReason} onChange={v=>setCloseForm(f=>({...f,nonSaleReason:v}))} options={NPC_REASONS} placeholder="Select reason" />
            </Field>
          )}
          {closeForm.isSale === true && (
            <>
              <Field label="Sale Type" required>
                <div className="flex gap-2" style={{ marginTop:4 }}>
                  {[{v:'DIRECT_SALE',l:'Direct Sale'},{v:'ORDER',l:'Order'}].map(opt => (
                    <button key={opt.v} onClick={()=>setCloseForm(f=>({...f,saleType:opt.v}))}
                      className={`btn ${closeForm.saleType===opt.v?'btn-info':'btn-secondary'}`}
                      style={{ flex:1, justifyContent:'center' }}>{opt.l}</button>
                  ))}
                </div>
              </Field>
              {closeForm.saleType === 'ORDER' && (
                <>
                  <Field label="Product Detail" required><Input value={closeForm.productDetail} onChange={v=>setCloseForm(f=>({...f,productDetail:v}))} placeholder="e.g. 22KT gold solitaire, size 16" /></Field>
                  <Field label="Delivery Date" required><Input type="date" value={closeForm.deliveryDate} onChange={v=>setCloseForm(f=>({...f,deliveryDate:v}))} /></Field>
                </>
              )}
            </>
          )}
          <div style={{ marginTop:14 }}>
            <button className="btn btn-primary" onClick={handleClose}>Confirm</button>
          </div>
        </Modal>
      )}

      {/* ── Bill Modal ── */}
      {billModal && (
        <Modal title={`Enter Bill — ${billModal.tokenNumber}`} onClose={() => setBillModal(null)}>
          <div style={{ marginBottom:12, padding:'10px 12px', background:'var(--bg2)', borderRadius:'var(--r-md)', fontSize:13 }}>
            <b>{billModal.customerName}</b> · {billModal.customerPhone}<br/>
            <span style={{ color:'var(--tx2)' }}>{billModal.productName} · {billModal.salesExecutiveName}</span>
          </div>
          <Field label="Bill Number" required><Input value={billNo} onChange={setBillNo} placeholder="e.g. BILL-2026-001" /></Field>
          <button className="btn btn-primary" onClick={handleBill}>Close Sale</button>
        </Modal>
      )}
    </div>
  )
}
