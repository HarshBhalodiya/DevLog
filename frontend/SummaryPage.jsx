import { useState, useEffect } from 'react'
import { getLogs, getDates, aiSummarise } from './client.js'
import './SummaryPage.css'

function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function SummaryPage() {
  const [day, setDay]         = useState(todayStr())
  const [dates, setDates]     = useState([todayStr()])
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getDates().then(r => {
      const all = Array.from(new Set([todayStr(), ...r.dates])).sort().reverse()
      setDates(all)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    getLogs(day).then(r => setEntries(r.logs)).catch(() => {})
    setSummary(null)
  }, [day])

  const generate = async () => {
    if (!entries.length) return
    setLoading(true); setError(null)
    try {
      const data = await aiSummarise(day, entries)
      setSummary(data)
    } catch (e) {
      setError('AI summary failed. Check your ANTHROPIC_API_KEY in backend .env')
    }
    setLoading(false)
  }

  const scoreColor = (n) => n >= 7 ? '#10B981' : n >= 4 ? '#F59E0B' : '#EF4444'

  return (
    <div className="summary-page">
      <div className="page-header">
        <div>
          <div className="page-title">End-of-Day Summary</div>
          <div className="page-sub">AI-generated summary of your work</div>
        </div>
        <div style={{display:'flex',gap:10,marginLeft:'auto',alignItems:'center'}}>
          <select value={day} onChange={e => setDay(e.target.value)} className="date-select">
            {dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button
            className="btn btn-ai"
            onClick={generate}
            disabled={loading || !entries.length}>
            {loading ? <span className="spinner" /> : '◎'} Generate Summary
          </button>
        </div>
      </div>

      <div className="page-body">
        {error && <div className="error-banner">{error}</div>}

        {!summary && !loading && (
          <div className="empty">
            <div className="empty-icon">◎</div>
            <div className="empty-title">
              {entries.length === 0 ? `No entries for ${day}` : `${entries.length} entries ready to summarise`}
            </div>
            <div className="empty-sub">
              {entries.length === 0 ? 'Add entries in Daily Log first' : 'Click "Generate Summary" for your AI digest'}
            </div>
          </div>
        )}

        {summary && (
          <div className="summary-content fade-in">
            {/* Hero */}
            <div className="summary-hero card">
              <div className="summary-headline">{summary.headline}</div>
              <div className="summary-oneliner">"{summary.one_liner}"</div>

              <div className="summary-stats">
                <div className="stat-box">
                  <div className="stat-num">{summary.total_tasks}</div>
                  <div className="stat-label">Tasks Logged</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num" style={{color: scoreColor(summary.energy_score)}}>
                    {summary.energy_score}<span style={{fontSize:14}}>/10</span>
                  </div>
                  <div className="stat-label">Energy Score</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num" style={{color:'#06B6D4'}}>{summary.time_breakdown?.focused_work_pct}%</div>
                  <div className="stat-label">Focused Work</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num" style={{color:'#F59E0B'}}>{summary.time_breakdown?.meetings_pct}%</div>
                  <div className="stat-label">In Meetings</div>
                </div>
              </div>

              {/* Breakdown bar */}
              <div className="breakdown-label">Time Breakdown</div>
              <div className="breakdown-bar">
                {summary.time_breakdown?.focused_work_pct > 0 &&
                  <div style={{width: summary.time_breakdown.focused_work_pct+'%', background:'#06B6D4'}} title="Focused work" />}
                {summary.time_breakdown?.meetings_pct > 0 &&
                  <div style={{width: summary.time_breakdown.meetings_pct+'%', background:'#F59E0B'}} title="Meetings" />}
                {summary.time_breakdown?.reviews_pct > 0 &&
                  <div style={{width: summary.time_breakdown.reviews_pct+'%', background:'#60A5FA'}} title="Reviews" />}
                {summary.time_breakdown?.other_pct > 0 &&
                  <div style={{width: summary.time_breakdown.other_pct+'%', background:'#6B7280'}} title="Other" />}
              </div>
              <div className="breakdown-legend">
                <span style={{color:'#06B6D4'}}>■ Focus {summary.time_breakdown?.focused_work_pct}%</span>
                <span style={{color:'#F59E0B'}}>■ Meetings {summary.time_breakdown?.meetings_pct}%</span>
                <span style={{color:'#60A5FA'}}>■ Reviews {summary.time_breakdown?.reviews_pct}%</span>
                <span style={{color:'#6B7280'}}>■ Other {summary.time_breakdown?.other_pct}%</span>
              </div>
            </div>

            <div className="summary-two-col">
              {/* Highlights */}
              <div className="card">
                <div className="card-title">✓ Highlights</div>
                {summary.highlights?.map((h, i) => (
                  <div key={i} className="list-item">
                    <span style={{color:'#10B981'}}>▸</span> {h}
                  </div>
                ))}
              </div>

              {/* Blockers */}
              <div className="card">
                <div className="card-title">⚠ Blockers & Gaps</div>
                {summary.blockers?.length > 0
                  ? summary.blockers.map((b, i) => (
                    <div key={i} className="list-item">
                      <span style={{color:'#EF4444'}}>▸</span> {b}
                    </div>
                  ))
                  : <div className="list-item" style={{color:'#10B981'}}>No blockers today 🎉</div>
                }
              </div>
            </div>

            {/* Standout + Tomorrow */}
            <div className="summary-two-col">
              <div className="card highlight-card">
                <div className="card-title">⭐ Standout Task</div>
                <div className="highlight-text">{summary.standout_task}</div>
              </div>
              <div className="card tomorrow-card">
                <div className="card-title">→ Tomorrow's Focus</div>
                <div className="highlight-text">{summary.tomorrow_hint}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="ai-overlay">
          <div className="ai-box">
            <span className="spinner" />
            <span className="ai-box-text">Claude is summarising your day…</span>
          </div>
        </div>
      )}
    </div>
  )
}
