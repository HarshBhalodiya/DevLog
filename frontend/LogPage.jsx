import { useState, useEffect, useCallback } from 'react'
import { getLogs, getDates, addLog, updateLog, deleteLog, getStats } from './client.js'
import { CATEGORIES, OUTCOMES, PRIORITIES, getCat, getOutcome } from './constants.js'
import LogEntryCard from './LogEntryCard.jsx'
import EntryForm    from './EntryForm.jsx'
import StatsBar     from './StatsBar.jsx'
import './LogPage.css'

function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function LogPage() {
  const [entries, setEntries]     = useState([])
  const [dates, setDates]         = useState([todayStr()])
  const [day, setDay]             = useState(todayStr())
  const [stats, setStats]         = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [filter, setFilter]       = useState('all')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [logsRes, datesRes, statsRes] = await Promise.all([
        getLogs(day), getDates(), getStats(day)
      ])
      setEntries(logsRes.logs)
      const allDates = Array.from(new Set([todayStr(), ...datesRes.dates])).sort().reverse()
      setDates(allDates)
      setStats(statsRes)
    } catch (e) {
      setError('Cannot connect to backend. Is it running on localhost:8000?')
    }
    setLoading(false)
  }, [day])

  useEffect(() => { load() }, [load])

  const handleSave = async (formData) => {
    try {
      if (editEntry) {
        await updateLog(editEntry.id, { ...formData, date: day })
      } else {
        await addLog({ ...formData, date: day })
      }
      setShowForm(false); setEditEntry(null)
      load()
    } catch (e) {
      setError('Failed to save entry')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    try {
      await deleteLog(id)
      load()
    } catch (e) { setError('Failed to delete') }
  }

  const handleEdit = (entry) => {
    setEditEntry(entry)
    setShowForm(true)
  }

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.category === filter)

  return (
    <div className="log-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Daily Log</div>
          <div className="page-sub">{day} · {entries.length} entries</div>
        </div>
        <div className="header-actions">
          <select value={day} onChange={e => setDay(e.target.value)} className="date-select">
            {dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setEditEntry(null); setShowForm(true) }}>
            + Log Entry
          </button>
        </div>
      </div>

      <div className="page-body">
        {error && <div className="error-banner">{error}</div>}

        {/* Stats */}
        {stats && <StatsBar stats={stats} />}

        {/* Category filter */}
        {entries.length > 0 && (
          <div className="filter-row">
            <button className={`filter-btn ${filter==='all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All ({entries.length})
            </button>
            {CATEGORIES.filter(c => (stats?.by_category?.[c.id] || 0) > 0).map(c => (
              <button key={c.id}
                className={`filter-btn ${filter===c.id ? 'active' : ''}`}
                style={filter===c.id ? {borderColor: c.color, color: c.color} : {}}
                onClick={() => setFilter(filter===c.id ? 'all' : c.id)}>
                {c.icon} {c.label} ({stats?.by_category?.[c.id] || 0})
              </button>
            ))}
          </div>
        )}

        {/* Entry list */}
        {loading && entries.length === 0 ? (
          <div className="empty"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◈</div>
            <div className="empty-title">{entries.length === 0 ? `No entries for ${day}` : 'No entries match filter'}</div>
            <div className="empty-sub">{entries.length === 0 ? 'Click "+ Log Entry" to get started' : 'Try a different filter'}</div>
          </div>
        ) : (
          <div className="entry-list fade-in">
            {filtered.map(e => (
              <LogEntryCard key={e.id} entry={e} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <EntryForm
          initial={editEntry}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditEntry(null) }}
        />
      )}
    </div>
  )
}
