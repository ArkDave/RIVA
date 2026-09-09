import { useState, useEffect } from 'react'
import { reportAPI } from '../../api/services'
import { Spinner, Empty } from '../../components/common'
import { MONTHS, currentMonth, currentYear, fmtCurrency, exportToExcel } from '../../utils/helpers'

export default function NpcReportPage() {
  const [month, setMonth]   = useState(currentMonth())
  const [year, setYear]     = useState(currentYear())
  const [tab, setTab]       = useState('consolidated') // consolidated | staff
  const [consolidated, setConsolidated] = useState(null)
  const [staffReport, setStaffReport]   = useState(null)
  const [loading, setLoading] = useState(false)
  const years = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i)

  useEffect(() => { load() }, [month, year, tab])

  async function load() {
    setLoading(true)
    try {
      if (tab === 'consolidated') {
        const r = await reportAPI.npcConsolidated(month, year)
        setConsolidated(r.data.data)
      } else {
        const r = await reportAPI.npcStaff(month, year)
        setStaffReport(r.data.data)
      }
    } catch {}
    setLoading(false)
  }

  async function exportConsolidated() {
    if (!consolidated) return
    const rows = (consolidated.counters || []).map(c => [c.counterName, c.walkin, c.walkout, c.ratio, c.ticketSize, c.amount])
    await exportToExcel(rows, ['Counter','Walk-in','Walkout','Ratio','Ticket Size','Amount'], `NPC_Consolidated_${MONTHS[month-1]}_${year}`)
  }

  async function exportStaff() {
    if (!staffReport) return
    const rows = (staffReport.rows || []).map(r => [r.staffName, r.sales, r.noSale, r.total, r.npcRatio])
    await exportToExcel(rows, ['Staff Name','Sales','No Sale','Total','NPC Ratio'], `NPC_Staff_${MONTHS[month-1]}_${year}`)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">NPC Reports</div>
          <div className="page-sub">Consolidated and staff-wise non-purchase customer analysis</div>
        </div>
        <div className="flex gap-2" style={{ alignItems:'center' }}>
          <select className="fc" style={{ width:130 }} value={month} onChange={e=>setMonth(+e.target.value)}>
            {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
          </select>
          <select className="fc" style={{ width:90 }} value={year} onChange={e=>setYear(+e.target.value)}>
            {years.map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2" style={{ marginBottom:16 }}>
        <button onClick={()=>setTab('consolidated')} className={`btn btn-sm ${tab==='consolidated'?'btn-primary':'btn-secondary'}`}>📊 Consolidated</button>
        <button onClick={()=>setTab('staff')} className={`btn btn-sm ${tab==='staff'?'btn-primary':'btn-secondary'}`}>👤 Staff-wise</button>
      </div>

      {loading ? <Spinner /> : tab === 'consolidated' ? (
        <div>
          {/* Counter table */}
          <div className="flex-center" style={{ justifyContent:'space-between', marginBottom:10 }}>
            <div className="card-title" style={{ margin:0 }}>CONSOLIDATED NPC REPORT — {MONTHS[month-1].toUpperCase()} {year}</div>
            <button className="btn btn-sm btn-secondary" onClick={exportConsolidated}>⬇ Export Excel</button>
          </div>
          <div className="tw" style={{ marginBottom:16 }}>
            <table>
              <thead><tr><th>S.No</th><th>Counter</th><th>Walk-in</th><th>Walkout</th><th>Ratio</th><th>Ticket Size</th><th>Amount</th></tr></thead>
              <tbody>
                {(consolidated?.counters || []).length === 0
                  ? <tr><td colSpan={7}><Empty icon="📊" title="No data for this period" /></td></tr>
                  : (consolidated?.counters || []).map((c,i)=>(
                    <tr key={c.counterName}>
                      <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                      <td style={{ fontWeight:600 }}>{c.counterName}</td>
                      <td>{c.walkin}</td>
                      <td>{c.walkout}</td>
                      <td><span style={{ fontWeight:700, color: parseInt(c.ratio)>30?'var(--orange)':'var(--green)' }}>{c.ratio}</span></td>
                      <td>{fmtCurrency(c.ticketSize)}</td>
                      <td style={{ fontWeight:700 }}>{fmtCurrency(c.amount)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Top 3 reasons + salesmen */}
          <div className="form-row">
            <div className="card">
              <div className="card-title">Top 3 Non-Sale Reasons</div>
              {(consolidated?.topReasons || []).length === 0
                ? <Empty icon="📋" title="No reasons data" />
                : (consolidated?.topReasons || []).map((r,i)=>(
                  <div key={r.reason} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--bdr-lt)' }}>
                    <div className="flex-center gap-2">
                      <span style={{ fontWeight:700, fontSize:13, minWidth:20, color:'var(--tx2)' }}>#{i+1}</span>
                      <span style={{ fontSize:13 }}>{r.reason}</span>
                    </div>
                    <div className="flex-center gap-2">
                      <span style={{ fontWeight:700 }}>{r.count}</span>
                      <span className="badge bg-orange">{r.percentage}</span>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="card">
              <div className="card-title">Top 3 Salesmen by NPC</div>
              {(consolidated?.topSalesmen || []).length === 0
                ? <Empty icon="👤" title="No salesman data" />
                : (consolidated?.topSalesmen || []).map((s,i)=>(
                  <div key={s.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--bdr-lt)' }}>
                    <div className="flex-center gap-2">
                      <span style={{ fontWeight:700, fontSize:13, minWidth:20, color:'var(--tx2)' }}>#{i+1}</span>
                      <span style={{ fontSize:13 }}>{s.name}</span>
                    </div>
                    <div className="flex-center gap-2">
                      <span style={{ fontWeight:700 }}>{s.count}</span>
                      <span className="badge bg-red">{s.percentage}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Financial loss */}
          {consolidated?.approximateFinancialLoss != null && (
            <div style={{ marginTop:14, padding:'14px 18px', background:'var(--orange-lt)', borderRadius:'var(--r-lg)', border:'1px solid #D85A3025' }}>
              <span style={{ fontSize:13, color:'var(--tx2)' }}>Approximate Financial Loss: </span>
              <span style={{ fontWeight:800, fontSize:18, color:'var(--orange)' }}>{fmtCurrency(consolidated.approximateFinancialLoss)}</span>
            </div>
          )}
        </div>
      ) : (
        /* Staff NPC Report */
        <div>
          <div className="flex-center" style={{ justifyContent:'space-between', marginBottom:10 }}>
            <div className="card-title" style={{ margin:0 }}>STAFF NPC REPORT — {MONTHS[month-1].toUpperCase()} {year}</div>
            <button className="btn btn-sm btn-secondary" onClick={exportStaff}>⬇ Export Excel</button>
          </div>
          <div className="tw">
            <table>
              <thead><tr><th>S.No</th><th>Staff Name</th><th>Sales</th><th>No Sale</th><th>Total</th><th>NPC Ratio</th></tr></thead>
              <tbody>
                {(staffReport?.rows || []).length === 0
                  ? <tr><td colSpan={6}><Empty icon="👤" title="No staff data for this period" /></td></tr>
                  : (staffReport?.rows || []).map((r,i)=>(
                    <tr key={r.staffName}>
                      <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                      <td style={{ fontWeight:600 }}>{r.staffName}</td>
                      <td><span className="badge bg-green">{r.sales}</span></td>
                      <td><span className="badge bg-red">{r.noSale}</span></td>
                      <td style={{ fontWeight:700 }}>{r.total}</td>
                      <td>
                        <span style={{ fontWeight:700, color: parseFloat(r.npcRatio)>30?'var(--orange)':'var(--green)' }}>{r.npcRatio}</span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
