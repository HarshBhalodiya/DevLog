import { CATEGORIES, OUTCOMES } from './constants.js'
import './StatsBar.css'

export default function StatsBar({ stats }) {
  if (!stats) return null
  const hrs = Math.floor((stats.total_minutes || 0) / 60)
  const mins = (stats.total_minutes || 0) % 60

  return (
    <div className="stats-bar">
      <div className="stat-group">
        {CATEGORIES.filter(c => (stats.by_category?.[c.id] || 0) > 0).map(c => (
          <div key={c.id} className="stat-item">
            <span className="stat-dot" style={{background: c.color}} />
            <span className="stat-label">{c.label}</span>
            <span className="stat-val" style={{color: c.color}}>{stats.by_category[c.id]}</span>
          </div>
        ))}
      </div>
      <div className="stat-group right">
        {OUTCOMES.filter(o => (stats.by_outcome?.[o.id] || 0) > 0).map(o => (
          <div key={o.id} className="stat-item">
            <span className="stat-dot" style={{background: o.color}} />
            <span className="stat-label">{o.label}</span>
            <span className="stat-val" style={{color: o.color}}>{stats.by_outcome[o.id]}</span>
          </div>
        ))}
        {stats.total_minutes > 0 && (
          <div className="stat-item">
            <span className="stat-label">⏱ {hrs > 0 ? `${hrs}h ` : ''}{mins}m</span>
          </div>
        )}
      </div>
    </div>
  )
}
