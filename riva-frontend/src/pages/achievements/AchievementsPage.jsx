import { useState, useEffect } from 'react'
import { performanceAPI, adminAPI, incentiveAPI } from '../../api/services'
import { Spinner, Avatar } from '../../components/common'
import { currentYear } from '../../utils/helpers'

const AWARD_DEFS = [
  { key: 'bestGrooming',     icon: '✨', label: 'Best Groomed Employee',      source: 'performance' },
  { key: 'bestPunctuality',  icon: '⏰', label: 'Best Punctual Employee',     source: 'performance' },
  { key: 'bestDiscipline',   icon: '📋', label: 'Best Discipline Employee',   source: 'performance' },
  { key: 'bestPresentation', icon: '💎', label: 'Best Stock Presenter',       source: 'performance' },
]

export default function AchievementsPage() {
  const [year, setYear]       = useState(currentYear())
  const [winners, setWinners] = useState(null)
  const [loading, setLoading] = useState(true)
  const years = Array.from({ length: 5 }, (_, i) => currentYear() - 2 + i)

  useEffect(() => { load() }, [year])

  async function load() {
    setLoading(true)
    try {
      const [wRes] = await Promise.all([
        performanceAPI.winners(year)
      ])
      setWinners(wRes.data.data)
    } catch {}
    setLoading(false)
  }

  if (loading) return <Spinner />

  const employeeOfYear = winners?.employeeOfYear || 'N/A'

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Staff Achievement Report Card</div>
          <div className="page-sub">Annual performance awards — {year}</div>
        </div>
        <select className="fc" style={{ width: 100 }} value={year} onChange={e => setYear(+e.target.value)}>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Employee of the Year Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #BA751718, #EF9F2710)',
        border: '1.5px solid #BA751730',
        borderRadius: 'var(--r-xl)',
        padding: '24px 28px',
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🌟</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
          Employee of the Year {year}
        </div>
        <Avatar name={employeeOfYear} size={60} />
        <div style={{ fontWeight: 800, fontSize: 22, marginTop: 10 }}>{employeeOfYear}</div>
        <div style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 4 }}>
          Highest achiever across all performance parameters
        </div>
      </div>

      {/* Award Cards */}
      <div className="award-grid">
        {AWARD_DEFS.map(award => {
          const winner = winners?.[award.key] || 'N/A'
          return (
            <div key={award.key} className="award-card">
              <div style={{ fontSize: 28, marginBottom: 8 }}>{award.icon}</div>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 0.6, color: 'var(--tx2)', marginBottom: 10, lineHeight: 1.4
              }}>{award.label}</div>
              <Avatar name={winner} size={44} />
              <div style={{ fontWeight: 700, marginTop: 8, fontSize: 14 }}>{winner}</div>
              <div style={{ marginTop: 6 }}>
                <span className="badge bg-blue">Top Score</span>
              </div>
            </div>
          )
        })}

        {/* Best Sales Executive — from incentives */}
        <div className="award-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 0.6, color: 'var(--tx2)', marginBottom: 10, lineHeight: 1.4
          }}>Best Sales Executive</div>
          <Avatar name="Sales Data" size={44} />
          <div style={{ fontWeight: 700, marginTop: 8, fontSize: 13, color: 'var(--tx2)' }}>
            From Incentives Report
          </div>
          <div style={{ marginTop: 6 }}>
            <span className="badge bg-green">Highest Target %</span>
          </div>
        </div>

        {/* Best Customer Conversion — from NPC */}
        <div className="award-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 0.6, color: 'var(--tx2)', marginBottom: 10, lineHeight: 1.4
          }}>Best Customer Conversion</div>
          <Avatar name="NPC Data" size={44} />
          <div style={{ fontWeight: 700, marginTop: 8, fontSize: 13, color: 'var(--tx2)' }}>
            From NPC Report
          </div>
          <div style={{ marginTop: 6 }}>
            <span className="badge bg-orange">Lowest NPC Ratio</span>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div style={{
        marginTop: 20, padding: '12px 16px',
        background: 'var(--bg2)', borderRadius: 'var(--r-md)',
        fontSize: 12, color: 'var(--tx2)', border: '1px solid var(--bdr)'
      }}>
        💡 Award winners are auto-calculated from Performance Evaluation scores. Sales &amp; Conversion winners are derived from Incentive and NPC report data respectively.
      </div>
    </div>
  )
}
