import { getCat, getOutcome, getPriority } from './constants.js'
import './LogEntryCard.css'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function LogEntryCard({ entry, onEdit, onDelete }) {
  const cat      = getCat(entry.category)
  const outcome  = getOutcome(entry.outcome)
  const priority = getPriority(entry.priority)

  return (
    <div className="entry-card" style={{'--accent-color': cat.color}}>
      <div className="entry-accent" style={{background: cat.color}} />

      <div className="entry-body">
        <div className="entry-top">
          <span className="badge" style={{color: cat.color, borderColor: cat.color+'40', background: cat.color+'18'}}>
            {cat.icon} {cat.label}
          </span>
          <span className="badge" style={{color: outcome.color, borderColor: outcome.color+'40', background: outcome.color+'15'}}>
            {outcome.label}
          </span>
          {entry.priority && entry.priority !== 'medium' && (
            <span className="badge" style={{color: priority.color, borderColor: priority.color+'40', background: priority.color+'15'}}>
              {priority.label}
            </span>
          )}
          <span className="entry-meta">{fmtTime(entry.timestamp)}</span>
          {entry.duration_minutes && (
            <span className="entry-meta">⏱ {entry.duration_minutes}m</span>
          )}
        </div>

        <div className="entry-title">{entry.title}</div>
        {entry.description && <div className="entry-desc">{entry.description}</div>}

        {entry.tags?.length > 0 && (
          <div className="tag-row">
            {entry.tags.map(t => <span key={t} className="tag">#{t}</span>)}
          </div>
        )}
      </div>

      <div className="entry-actions">
        <button className="action-btn" onClick={() => onEdit(entry)} title="Edit">✎</button>
        <button className="action-btn danger" onClick={() => onDelete(entry.id)} title="Delete">✕</button>
      </div>
    </div>
  )
}
