import { useState, useEffect } from 'react'
import { getDates, getLogs, aiWeekly } from './client.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './WeeklyPage.css'

function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function WeeklyPage() {
  const [dates, setDates]         = useState([])
  const [selected, setSelected]   = useState([])
  const [weekData, setWeekData]   = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    getDates().then(async r => {
      const all = Array.from(new Set([todayStr(), ...r.dates])).sort().reverse()
      setDates(all)
      // Auto-select last 5 days that have data
      const withData = all.slice(0, 5)
      setSelected(withData)

      // Build chart data
      const chart = []
      for (const d of all.slice(0, 7)) {
        const res = await getLogs(d)
        chart.push({ date: d.slice(5), count: res.logs.length,
          mins: res.logs.reduce((s,l) => s + (l.duration_minutes||0), 0) })
      }
      setChartData(chart.reverse())
    }).catch(() => {})
  }, [])

  const toggleDate = (d) => {
    setSelected(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  const run = async () => {
    if (!selected.length) return
    setLoading(true); setError(null)
    try {
      const data = await aiWeekly(selected.sort())
      setWeekData(data)
    } catch (e) {
      setError('Weekly analysis failed. Check your ANTHROPIC_API_KEY')
    }
    setLoading(false)
  }

  const trendColor = (t) => t === 'improving' ? '#10B981' : t === 'declining' ? '#EF4444' : '#F59E0B'
  const trendIcon  = (t) => t === 'improving' ? '↑' : t === 'declining' ? '↓' : '→'

  return (
    <div className="weekly-page">
      <div className="page-header">
        <div>
          <div className="page-title">Weekly Trends</div>
          <div className="page-sub">Multi-day analysis across your work history</div>
        </div>
        <button className="btn btn-ai" style={{marginLeft:'auto'}}
          onClick={run} disabled={loading || !selected.length}>
          {loading ? <span className="spinner" /> : '⊞'} Analyse Week
        </button>
      </div>

      <div className="page-body">
        {error && <div className="error-banner">{error}</div>}

        {/* Activity chart */}
        {chartData.length > 0 && (
          <div className="card" style={{marginBottom:14}}>
            <div className="card-title">Activity — last 7 days</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{top:4,right:4,bottom:4,left:-20}}>
                <XAxis dataKey="date" tick={{fontSize:10, fill:'var(--text3)', fontFamily:'JetBrains Mono'}} />
                <YAxis tick={{fontSize:10, fill:'var(--text3)', fontFamily:'JetBrains Mono'}} />
                <Tooltip
                  contentStyle={{background:'var(--bg1)',border:'1px solid var(--border)',borderRadius:8,fontSize:11}}
                  labelStyle={{color:'var(--text2)'}}
                  itemStyle={{color:'var(--accent2)'}}
                />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.count > 0 ? 'var(--accent)' : 'var(--border)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Date selector */}
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title">Select days to analyse</div>
          <div className="date-chips">
            {dates.map(d => (
              <button key={d}
                className={`date-chip ${selected.includes(d) ? 'active' : ''}`}
                onClick={() => toggleDate(d)}>
                {d}
              </button>
            ))}
          </div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:8}}>
            {selected.length} day{selected.length !== 1 ? 's' : ''} selected
          </div>
        </div>

        {!weekData && !loading && (
          <div className="empty">
            <div className="empty-icon">⊞</div>
            <div className="empty-title">Select dates and click "Analyse Week"</div>
            <div className="empty-sub">Get cross-day patterns, trends and coaching</div>
          </div>
        )}

        {weekData && (
          <div className="weekly-content fade-in">
            {/* Overview row */}
            <div className="week-overview-row">
              <div className="card overview-stat">
                <div className="ov-num">{weekData.overall_score}</div>
                <div className="ov-label">Week Score</div>
              </div>
              <div className="card overview-stat">
                <div className="ov-num" style={{color: trendColor(weekData.productivity_trend)}}>
                  {trendIcon(weekData.productivity_trend)}
                </div>
                <div className="ov-label" style={{color: trendColor(weekData.productivity_trend)}}>
                  {weekData.productivity_trend}
                </div>
              </div>
              <div className="card overview-stat">
                <div className="ov-num" style={{fontSize:14,color:'#10B981'}}>{weekData.best_day?.slice(5)}</div>
                <div className="ov-label">Best Day</div>
              </div>
              <div className="card overview-stat">
                <div className="ov-num" style={{fontSize:14,color:'#EF4444'}}>{weekData.toughest_day?.slice(5)}</div>
                <div className="ov-label">Toughest Day</div>
              </div>
            </div>

            {/* Summary */}
            <div className="card">
              <div className="card-title">📝 Week Overview</div>
              <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.8}}>{weekData.summary}</div>
            </div>

            <div className="two-col">
              <div className="card">
                <div className="card-title">🏆 Wins</div>
                {weekData.wins?.map((w,i) => (
                  <div key={i} className="list-item"><span style={{color:'#10B981'}}>▸</span> {w}</div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">🔁 Recurring Blockers</div>
                {weekData.recurring_blockers?.length > 0
                  ? weekData.recurring_blockers.map((b,i) => (
                    <div key={i} className="list-item"><span style={{color:'#EF4444'}}>▸</span> {b}</div>
                  ))
                  : <div className="list-item" style={{color:'#10B981'}}>No recurring blockers 💪</div>
                }
              </div>
            </div>

            <div className="two-col">
              <div className="card">
                <div className="card-title">⟳ Weekly Patterns</div>
                {weekData.weekly_patterns?.map((p,i) => (
                  <div key={i} className="list-item"><span style={{color:'#A78BFA'}}>▸</span> {p}</div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">⏱ Top Categories</div>
                {weekData.top_categories?.map((c,i) => (
                  <div key={i} className="list-item"><span style={{color:'#06B6D4'}}>▸</span> {c}</div>
                ))}
              </div>
            </div>

            <div className="card next-week-card">
              <div className="next-week-arrow">↗</div>
              <div>
                <div className="card-title">Next Week Focus</div>
                <div className="next-week-text">{weekData.next_week_focus}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="ai-overlay">
          <div className="ai-box">
            <span className="spinner" />
            <span className="ai-box-text">Analysing your week…</span>
          </div>
        </div>
      )}
    </div>
  )
}
