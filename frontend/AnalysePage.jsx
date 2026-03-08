import { useState, useEffect } from 'react'
import { getLogs, getDates, aiAnalyse } from './client.js'
import './AnalysePage.css'

function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function AnalysePage() {
  const [day, setDay]         = useState(todayStr())
  const [dates, setDates]     = useState([todayStr()])
  const [entries, setEntries] = useState([])
  const [analysis, setAnalysis] = useState(null)
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
    setAnalysis(null)
  }, [day])

  const run = async () => {
    if (!entries.length) return
    setLoading(true); setError(null)
    try {
      const data = await aiAnalyse(day, entries)
      setAnalysis(data)
    } catch (e) {
      setError('Analysis failed. Check your ANTHROPIC_API_KEY in backend .env')
    }
    setLoading(false)
  }

  const scoreColor = (n) => n >= 70 ? '#10B981' : n >= 40 ? '#F59E0B' : '#EF4444'
  const switchColor = (n) => n <= 3 ? '#10B981' : n <= 6 ? '#F59E0B' : '#EF4444'
  const circumference = 2 * Math.PI * 45

  return (
    <div className="analyse-page">
      <div className="page-header">
        <div>
          <div className="page-title">Productivity Analysis</div>
          <div className="page-sub">Deep AI insights — what went well, what to improve</div>
        </div>
        <div style={{display:'flex',gap:10,marginLeft:'auto',alignItems:'center'}}>
          <select value={day} onChange={e => setDay(e.target.value)} className="date-select">
            {dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-ai" onClick={run} disabled={loading || !entries.length}>
            {loading ? <span className="spinner" /> : '⟁'} Analyse Day
          </button>
        </div>
      </div>

      <div className="page-body">
        {error && <div className="error-banner">{error}</div>}

        {!analysis && !loading && (
          <div className="empty">
            <div className="empty-icon">⟁</div>
            <div className="empty-title">
              {entries.length === 0 ? `No entries for ${day}` : `${entries.length} entries ready`}
            </div>
            <div className="empty-sub">
              {entries.length === 0 ? 'Add entries in Daily Log first' : 'Click "Analyse Day" for deep insights'}
            </div>
          </div>
        )}

        {analysis && (
          <div className="analyse-content fade-in">

            {/* Score card */}
            <div className="score-row">
              <div className="card score-card">
                <div className="score-ring-wrap">
                  <svg viewBox="0 0 100 100" className="score-ring">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg2)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="45" fill="none"
                      stroke={scoreColor(analysis.productivity_score)}
                      strokeWidth="8"
                      strokeDasharray={`${(analysis.productivity_score / 100) * circumference} ${circumference}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{transition:'stroke-dasharray 0.8s ease'}}
                    />
                    <text x="50" y="45" textAnchor="middle" fill="var(--text)" fontSize="20" fontWeight="700"
                      fontFamily="Syne,sans-serif">{analysis.productivity_score}</text>
                    <text x="50" y="60" textAnchor="middle" fill="var(--text3)" fontSize="9">/100</text>
                  </svg>
                </div>
                <div className="score-label">{analysis.productivity_label}</div>

                <div className="score-chips">
                  <div className="score-chip">
                    <span className="chip-label">Context Switching</span>
                    <span className="chip-val" style={{color: switchColor(analysis.context_switching_score)}}>
                      {analysis.context_switching_score}/10
                    </span>
                  </div>
                </div>
              </div>

              <div className="card coaching-card">
                <div className="card-title">💬 Coaching Note</div>
                <div className="coaching-text">{analysis.coaching_note}</div>
                <div className="card-title" style={{marginTop:20}}>🏅 Skills Used Today</div>
                <div className="skills-row">
                  {analysis.skills_used?.map((s,i) => (
                    <span key={i} className="skill-tag">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Went well / wrong */}
            <div className="two-col">
              <div className="card">
                <div className="card-title">✓ What Went Well</div>
                {analysis.what_went_well?.map((w,i) => (
                  <div key={i} className="list-item"><span style={{color:'#10B981'}}>▸</span> {w}</div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">✗ What Went Wrong</div>
                {analysis.what_went_wrong?.length > 0
                  ? analysis.what_went_wrong.map((w,i) => (
                    <div key={i} className="list-item"><span style={{color:'#EF4444'}}>▸</span> {w}</div>
                  ))
                  : <div className="list-item" style={{color:'#10B981'}}>Nothing major! 🎉</div>
                }
              </div>
            </div>

            {/* Patterns + Focus */}
            <div className="two-col">
              <div className="card">
                <div className="card-title">⟳ Patterns Detected</div>
                {analysis.patterns?.map((p,i) => (
                  <div key={i} className="list-item"><span style={{color:'#A78BFA'}}>▸</span> {p}</div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">🎯 Focus Quality</div>
                <div style={{fontSize:13, color:'var(--text2)', lineHeight:1.7}}>{analysis.focus_time_quality}</div>
              </div>
            </div>

            {/* Improvements */}
            {analysis.improvements?.length > 0 && (
              <div className="card">
                <div className="card-title">⬆ Improvements</div>
                <div className="improv-grid">
                  {analysis.improvements.map((imp, i) => (
                    <div key={i} className="improv-card">
                      <div className="improv-title">{imp.title}</div>
                      <div className="improv-row"><span className="improv-label">Why</span> {imp.why}</div>
                      <div className="improv-row"><span className="improv-label action">Action</span> {imp.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tomorrow */}
            <div className="card tomorrow-banner">
              <div className="tomorrow-arrow">→</div>
              <div>
                <div className="card-title">Tomorrow's Priority</div>
                <div className="tomorrow-text">{analysis.recommendation_for_tomorrow}</div>
              </div>
            </div>

          </div>
        )}
      </div>

      {loading && (
        <div className="ai-overlay">
          <div className="ai-box">
            <span className="spinner" />
            <span className="ai-box-text">Analysing your productivity patterns…</span>
          </div>
        </div>
      )}
    </div>
  )
}
