import { useState, useEffect } from 'react'
import { performanceAPI, adminAPI } from '../../api/services'
import { Spinner, Empty, Avatar } from '../../components/common'
import { MONTHS, currentMonth, currentYear } from '../../utils/helpers'
import toast from 'react-hot-toast'

const CATS = ['grooming','punctuality','discipline','upSaleCrossSale','presentation']
const CAT_LABELS = { grooming:'Grooming', punctuality:'Punctuality', discipline:'Discipline', upSaleCrossSale:'Up Sale/Cross Sale', presentation:'Presentation' }

export default function PerformancePage() {
  const [staff, setStaff]       = useState([])
  const [month, setMonth]       = useState(currentMonth())
  const [year, setYear]         = useState(currentYear())
  const [scores, setScores]     = useState({}) // { userId: { grooming:0, ... } }
  const [report, setReport]     = useState([])
  const [topBottom, setTopBottom] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState('entry') // entry | report

  useEffect(() => {
    adminAPI.getUsers().then(r => {
      const s = r.data.data.filter(u => ['SALES_EXECUTIVE','FLOOR_INCHARGE'].includes(u.role))
      setStaff(s)
      const init = {}
      s.forEach(u => { init[u.id] = { grooming:0, punctuality:0, discipline:0, upSaleCrossSale:0, presentation:0 } })
      setScores(init)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function loadReport() {
    try {
      const [rRes, tbRes] = await Promise.all([
        performanceAPI.monthly(month, year),
        performanceAPI.topBottom(month, year)
      ])
      setReport(rRes.data.data)
      setTopBottom(tbRes.data.data)
    } catch {}
  }

  useEffect(() => { if (tab === 'report') loadReport() }, [tab, month, year])

  function setScore(userId, cat, val) {
    setScores(prev => ({ ...prev, [userId]: { ...prev[userId], [cat]: +val } }))
  }

  async function saveAll() {
    const today = new Date().toISOString().split('T')[0]
    setSaving(true)
    let saved = 0
    for (const s of staff) {
      try {
        await performanceAPI.save({ userId: s.id, evalDate: today, ...scores[s.id] })
        saved++
      } catch {}
    }
    toast.success(`Saved evaluations for ${saved} staff`)
    setSaving(false)
  }

  function rowColor(pct) {
    if (pct > 75) return 'rgba(29,158,117,0.06)'
    if (pct < 50) return 'rgba(216,90,48,0.06)'
    return ''
  }

  const years = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Performance Evaluation</div>
          <div className="page-sub">Admin scores staff 1–5 daily across 5 categories</div>
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

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom:16 }}>
        {['entry','report'].map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className={`btn btn-sm ${tab===t?'btn-primary':'btn-secondary'}`}>
            {t === 'entry' ? '📝 Daily Entry' : '📊 Monthly Report'}
          </button>
        ))}
      </div>

      {tab === 'entry' ? (
        <>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Staff Name</th>
                  {CATS.map(c=><th key={c}>{CAT_LABELS[c]}</th>)}
                  <th>Total</th><th>%</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s,i) => {
                  const sc = scores[s.id] || {}
                  const total = CATS.reduce((sum,c)=>sum+(sc[c]||0),0)
                  const pct = Math.round((total/25)*100)
                  return (
                    <tr key={s.id} style={{ background: rowColor(pct) }}>
                      <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                      <td>
                        <div className="flex-center gap-2">
                          <Avatar name={s.fullName} size={28} />
                          <span style={{ fontWeight:600 }}>{s.fullName}</span>
                        </div>
                      </td>
                      {CATS.map(c=>(
                        <td key={c}>
                          <select className="fc" style={{ width:58, padding:'4px 6px', textAlign:'center' }}
                            value={sc[c]||0} onChange={e=>setScore(s.id,c,e.target.value)}>
                            {[0,1,2,3,4,5].map(n=><option key={n}>{n}</option>)}
                          </select>
                        </td>
                      ))}
                      <td style={{ fontWeight:700 }}>{total}</td>
                      <td style={{ fontWeight:700, color: pct>75?'var(--green)':pct<50?'var(--orange)':'var(--tx1)' }}>{pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:14 }}>
            <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? '⟳ Saving...' : '💾 Save Today\'s Evaluations'}
            </button>
            <span style={{ fontSize:11, color:'var(--tx2)', marginLeft:12 }}>
              🟢 &gt;75% — good · 🔴 &lt;50% — needs improvement
            </span>
          </div>
        </>
      ) : (
        <div>
          <div className="tw" style={{ marginBottom:16 }}>
            <table>
              <thead><tr><th>#</th><th>Staff Name</th><th>Avg %</th><th>Status</th></tr></thead>
              <tbody>
                {report.length === 0
                  ? <tr><td colSpan={4}><Empty icon="📊" title="No data for this period" /></td></tr>
                  : report.map((r,i)=>(
                    <tr key={r.userId} style={{ background: rowColor(r.avgPercentage) }}>
                      <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                      <td style={{ fontWeight:600 }}>{r.staffName}</td>
                      <td>
                        <div className="flex-center gap-2">
                          <div style={{ flex:1, height:6, background:'var(--bg3)', borderRadius:99 }}>
                            <div style={{ width:`${r.avgPercentage}%`, height:'100%', borderRadius:99,
                              background: r.avgPercentage>75?'var(--green)':r.avgPercentage<50?'var(--orange)':'var(--blue)' }} />
                          </div>
                          <span style={{ fontWeight:700, minWidth:40, color: r.avgPercentage>75?'var(--green)':r.avgPercentage<50?'var(--orange)':'var(--tx1)' }}>{r.avgPercentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${r.status==='GREEN'?'bg-green':r.status==='RED'?'bg-red':'bg-gray'}`}>
                          {r.status==='GREEN'?'Above 75%':r.status==='RED'?'Below 50%':'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {topBottom && (
            <div className="form-row">
              {[{title:'🏆 Top 5 Performers',key:'top5'},{title:'⚠️ Bottom 5',key:'bottom5'}].map(sec=>(
                <div key={sec.key} className="card">
                  <div className="card-title">{sec.title}</div>
                  {(topBottom[sec.key]||[]).map((r,i)=>(
                    <div key={r.userId} className="flex-center gap-2" style={{ marginBottom:10 }}>
                      <span style={{ fontWeight:700, fontSize:13, minWidth:20, color:'var(--tx2)' }}>#{i+1}</span>
                      <Avatar name={r.staffName} size={28} />
                      <span style={{ flex:1, fontSize:13 }}>{r.staffName}</span>
                      <span style={{ fontWeight:700, color:r.avgPercentage>75?'var(--green)':r.avgPercentage<50?'var(--orange)':'var(--tx1)' }}>{r.avgPercentage}%</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
