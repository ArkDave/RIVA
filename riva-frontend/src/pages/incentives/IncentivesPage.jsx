import { useState, useEffect } from 'react'
import { incentiveAPI, adminAPI } from '../../api/services'
import { Spinner, Avatar } from '../../components/common'
import { MONTHS, currentMonth, currentYear, fmtCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function IncentivesPage() {
  const [staff, setStaff]   = useState([])
  const [report, setReport] = useState(null)
  const [month, setMonth]   = useState(currentMonth())
  const [year, setYear]     = useState(currentYear())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  // Local editable state: { userId: { targetGiven, targetAchieved, incentiveAmount } }
  const [edits, setEdits] = useState({})

  const years = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i)

  useEffect(() => {
    adminAPI.getUsers().then(r => {
      setStaff(r.data.data.filter(u => ['SALES_EXECUTIVE','FLOOR_INCHARGE'].includes(u.role)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadReport() }, [month, year])

  async function loadReport() {
    try {
      const r = await incentiveAPI.report(month, year)
      const data = r.data.data
      setReport(data)
      // Pre-fill edits from existing data
      const e = {}
      ;(data.rows || []).forEach(row => {
        e[row.userId] = {
          targetGiven: row.targetGiven || '',
          targetAchieved: row.targetAchieved || '',
          incentiveAmount: row.incentives || ''
        }
      })
      setEdits(e)
    } catch {}
  }

  function edit(userId, field, val) {
    setEdits(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: val } }))
  }

  async function saveAll() {
    setSaving(true)
    let saved = 0
    for (const s of staff) {
      const e = edits[s.id]
      if (!e) continue
      try {
        await incentiveAPI.saveTarget({
          userId: s.id, month, year,
          targetGiven: +e.targetGiven || 0,
          targetAchieved: +e.targetAchieved || 0,
          incentiveAmount: +e.incentiveAmount || 0
        })
        saved++
      } catch {}
    }
    toast.success(`Saved ${saved} targets`)
    setSaving(false)
    loadReport()
  }

  if (loading) return <Spinner />

  const totalIncentives = report?.totalIncentives || 0

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Incentives</div>
          <div className="page-sub">Set monthly targets and calculate earned incentives</div>
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

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Staff Name</th>
              <th>Target Given</th><th>Target Achieved</th>
              <th>Incentive Amount (₹)</th><th>Earned</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s, i) => {
              const e = edits[s.id] || {}
              const given = +e.targetGiven || 0
              const achieved = +e.targetAchieved || 0
              const amount = +e.incentiveAmount || 0
              const earned = given > 0 && achieved >= given ? amount : 0
              return (
                <tr key={s.id}>
                  <td style={{ color:'var(--tx2)', fontSize:12 }}>{i+1}</td>
                  <td>
                    <div className="flex-center gap-2">
                      <Avatar name={s.fullName} size={28} />
                      <span style={{ fontWeight:600 }}>{s.fullName}</span>
                    </div>
                  </td>
                  <td><input type="number" className="fc" style={{ width:90 }} value={e.targetGiven||''} onChange={ev=>edit(s.id,'targetGiven',ev.target.value)} placeholder="0" /></td>
                  <td><input type="number" className="fc" style={{ width:90 }} value={e.targetAchieved||''} onChange={ev=>edit(s.id,'targetAchieved',ev.target.value)} placeholder="0" /></td>
                  <td><input type="number" className="fc" style={{ width:110 }} value={e.incentiveAmount||''} onChange={ev=>edit(s.id,'incentiveAmount',ev.target.value)} placeholder="0" /></td>
                  <td>
                    <span style={{ fontWeight:700, color: earned>0?'var(--green)':'var(--tx3)' }}>
                      {earned > 0 ? fmtCurrency(earned) : '₹0'}
                    </span>
                  </td>
                </tr>
              )
            })}
            <tr style={{ background:'var(--bg2)', fontWeight:700 }}>
              <td colSpan={5} style={{ textAlign:'right', paddingRight:14 }}>Total Incentives →</td>
              <td style={{ fontSize:16, color:'var(--green)' }}>{fmtCurrency(totalIncentives)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:14 }}>
        <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
          {saving ? '⟳ Saving...' : '💾 Save Targets'}
        </button>
        <span style={{ fontSize:11, color:'var(--tx2)', marginLeft:12 }}>
          Incentive is earned only when Target Achieved ≥ Target Given
        </span>
      </div>
    </div>
  )
}
