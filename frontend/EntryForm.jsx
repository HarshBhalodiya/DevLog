import { useState } from 'react'
import { CATEGORIES, OUTCOMES, PRIORITIES } from './constants.js'
import './EntryForm.css'

const BLANK = {
  category: 'task', title: '', description: '',
  duration_minutes: '', outcome: 'done', priority: 'medium', tags: '',
}

export default function EntryForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? {
    category: initial.category,
    title: initial.title,
    description: initial.description || '',
    duration_minutes: initial.duration_minutes || '',
    outcome: initial.outcome || 'done',
    priority: initial.priority || 'medium',
    tags: (initial.tags || []).join(', '),
  } : BLANK)

  const set = (k, v) => setForm(prev => ({...prev, [k]: v}))

  const submit = () => {
    if (!form.title.trim()) return
    onSave({
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      outcome: form.outcome,
      priority: form.priority,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{initial ? 'Edit Entry' : 'Log New Entry'}</div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Category</label>
          <div className="cat-grid">
            {CATEGORIES.map(c => (
              <button key={c.id} type="button"
                className={`cat-btn ${form.category===c.id ? 'active' : ''}`}
                style={form.category===c.id ? {borderColor:c.color, color:c.color, background:c.color+'18'} : {}}
                onClick={() => set('category', c.id)}
                title={c.desc}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="input" value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="What did you do?"
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="input" value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="More context, links, notes…"
            rows={3} style={{resize:'vertical'}}
          />
        </div>

        <div className="form-row">
          {/* Duration */}
          <div className="form-group" style={{flex:1}}>
            <label className="form-label">Duration (min)</label>
            <input type="number" className="input"
              value={form.duration_minutes}
              onChange={e => set('duration_minutes', e.target.value)}
              placeholder="30"
            />
          </div>

          {/* Priority */}
          <div className="form-group" style={{flex:1}}>
            <label className="form-label">Priority</label>
            <div className="toggle-row">
              {PRIORITIES.map(p => (
                <button key={p.id} type="button"
                  className={`toggle-btn ${form.priority===p.id ? 'active' : ''}`}
                  style={form.priority===p.id ? {borderColor:p.color, color:p.color, background:p.color+'18'} : {}}
                  onClick={() => set('priority', p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Outcome */}
        <div className="form-group">
          <label className="form-label">Outcome</label>
          <div className="toggle-row">
            {OUTCOMES.map(o => (
              <button key={o.id} type="button"
                className={`toggle-btn ${form.outcome===o.id ? 'active' : ''}`}
                style={form.outcome===o.id ? {borderColor:o.color, color:o.color, background:o.color+'18'} : {}}
                onClick={() => set('outcome', o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input className="input" value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="backend, auth, urgent"
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!form.title.trim()}>
            {initial ? 'Save Changes' : 'Log Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}
