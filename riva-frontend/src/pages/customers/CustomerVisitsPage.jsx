import { useState, useEffect } from 'react'
import { reportAPI } from '../../api/services'
import { Modal, Spinner, Empty } from '../../components/common'
import { currentYear, exportToExcel } from '../../utils/helpers'

const BUCKETS = [
  { key:'visitedOnce',   label:'Visited 1 Time',  color:'#378ADD' },
  { key:'visitedTwice',  label:'Visited 2 Times',  color:'#1D9E75' },
  { key:'visitedThrice', label:'Visited 3 Times',  color:'#BA7517' },
  { key:'visitedFour',   label:'Visited 4 Times',  color:'#7F77DD' },
  { key:'aboveFour',     label:'Above 4 Visits',   color:'#D85A30' },
]

export default function CustomerVisitsPage() {
  const [year, setYear]     = useState(currentYear())
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [drillDown, setDrillDown] = useState(null)
  const years = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i)

  useEffect(() => { load() }, [year])

  async function load() {
    setLoading(true)
    try {
      const r = await reportAPI.customerVisits(year)
      setData(r.data.data.data)
    } catch {}
    setLoading(false)
  }

  async function handleExport(bucket) {
    const customers = data?.[bucket.key]?.customers || []
    await exportToExcel(
      customers.map(c => [c.name, c.phone, c.visits]),
      ['Name', 'Phone Number', 'No. of Visits'],
      `customer_visits_${bucket.label.replace(/ /g,'_')}_${year}`
    )
  }

  if (loading) return <Spinner />

  const total = BUCKETS.reduce((s,b) => s + (data?.[b.key]?.count || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Customer Visit Report</div>
          <div className="page-sub">Visit frequency analysis — Jan {year} to Dec {year}</div>
        </div>
        <select className="fc" style={{ width:100 }} value={year} onChange={e=>setYear(+e.target.value)}>
          {years.map(y=><option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', marginBottom:24 }}>
        {BUCKETS.map(b => {
          const info = data?.[b.key] || {}
          return (
            <div key={b.key} className="stat-card"
              style={{ borderTop:`3px solid ${b.color}`, cursor:'pointer' }}
              onClick={()=>setDrillDown(b)}>
              <div className="stat-label" style={{ color:b.color }}>{b.label}</div>
              <div className="stat-value" style={{ color:b.color }}>{info.count || 0}</div>
              <div className="stat-sub">{info.percentage || '0%'} of total</div>
            </div>
          )
        })}
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">{year} year</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <div className="card-title">Visit Distribution</div>
        {BUCKETS.map(b => {
          const info = data?.[b.key] || {}
          const count = info.count || 0
          const pct = total > 0 ? (count / total * 100) : 0
          return (
            <div key={b.key} style={{ marginBottom:12 }}>
              <div className="flex-center" style={{ justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                <span>{b.label}</span>
                <span style={{ fontWeight:700 }}>{count} ({pct.toFixed(1)}%)</span>
              </div>
              <div style={{ height:8, background:'var(--bg3)', borderRadius:99 }}>
                <div style={{ width:`${pct}%`, height:'100%', background:b.color, borderRadius:99, transition:'width .4s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Drill-down modal */}
      {drillDown && (
        <Modal title={`${drillDown.label} — ${data?.[drillDown.key]?.count || 0} Customers`} onClose={()=>setDrillDown(null)} wide>
          <div style={{ marginBottom:12 }}>
            <button className="btn btn-sm btn-secondary" onClick={()=>handleExport(drillDown)}>⬇ Download Excel</button>
          </div>
          <div className="tw">
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Visits</th></tr></thead>
              <tbody>
                {(data?.[drillDown.key]?.customers || []).length === 0
                  ? <tr><td colSpan={4}><Empty icon="👥" title="No customers in this bucket" /></td></tr>
                  : (data?.[drillDown.key]?.customers || []).map((c,i)=>(
                    <tr key={c.phone}>
                      <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                      <td style={{ fontWeight:600 }}>{c.name}</td>
                      <td className="td-mono">{c.phone}</td>
                      <td><span className="badge bg-blue">{c.visits}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  )
}
