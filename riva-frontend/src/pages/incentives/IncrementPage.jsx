import { useState, useEffect } from 'react'
import { reportAPI, adminAPI } from '../../api/services'
import { Spinner, Avatar } from '../../components/common'
import { currentYear } from '../../utils/helpers'

export default function IncrementPage() {
  const [staff, setStaff]     = useState([])
  const [year, setYear]       = useState(currentYear())
  const [reports, setReports] = useState({})
  const [loading, setLoading] = useState(true)
  const years = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i)

  useEffect(() => {
    adminAPI.getUsers().then(r => {
      setStaff(r.data.data.filter(u => ['SALES_EXECUTIVE','FLOOR_INCHARGE'].includes(u.role)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadAll() }, [staff, year])

  async function loadAll() {
    if (!staff.length) return
    const results = {}
    await Promise.all(staff.map(async s => {
      try {
        const r = await reportAPI.increment(s.id, year)
        results[s.id] = r.data.data
      } catch { results[s.id] = null }
    }))
    setReports(results)
  }

  if (loading) return <Spinner />

  const PARAMS = [
    { key:'salesAchieved',  label:'Sales Target Achieved',       pct:3 },
    { key:'schemeAchieved', label:'Scheme Sales Achieved',       pct:3 },
    { key:'npcBelow30',     label:'NPC Ratio Below 30%',         pct:2 },
    { key:'perfAbove75',    label:'Performance Eval > 75%',      pct:2 },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Increment Report</div>
          <div className="page-sub">Annual increment entitlement per staff member</div>
        </div>
        <select className="fc" style={{ width:100 }} value={year} onChange={e=>setYear(+e.target.value)}>
          {years.map(y=><option key={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:14 }}>
        {staff.map(s => {
          const rep = reports[s.id]
          if (!rep) return null
          const total = rep.totalIncrement || 0
          return (
            <div key={s.id} className="card">
              <div className="flex-center gap-2" style={{ marginBottom:14 }}>
                <Avatar name={s.fullName} size={36} />
                <div>
                  <div style={{ fontWeight:700 }}>{s.fullName}</div>
                  <div style={{ fontSize:11, color:'var(--tx2)' }}>Increment Report {year}</div>
                </div>
                <div style={{ marginLeft:'auto', fontWeight:800, fontSize:20, color:total>0?'var(--green)':'var(--tx3)' }}>+{total}%</div>
              </div>
              {PARAMS.map(p => {
                const achieved = rep[p.key]
                return (
                  <div key={p.key} className="flex-center" style={{ justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--bdr-lt)' }}>
                    <div className="flex-center gap-2">
                      <span style={{ fontSize:14 }}>{achieved ? '✅' : '⬜'}</span>
                      <span style={{ fontSize:13, color: achieved?'var(--tx1)':'var(--tx2)' }}>{p.label}</span>
                    </div>
                    <span style={{ fontWeight:700, color:achieved?'var(--green)':'var(--tx3)', fontSize:14 }}>
                      {achieved ? `+${p.pct}%` : '0%'}
                    </span>
                  </div>
                )
              })}
              <div style={{ marginTop:12, padding:'10px 12px', borderRadius:'var(--r-md)',
                background: total>0?'var(--green-lt)':'var(--bg2)',
                border:`1px solid ${total>0?'var(--green-bd)':'var(--bdr)'}` }}>
                <span style={{ fontSize:13, fontWeight:600, color:total>0?'var(--green)':'var(--tx2)' }}>
                  {total>0
                    ? `${s.fullName} is entitled for ${total}% increment this year.`
                    : 'No increment criteria met yet.'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
