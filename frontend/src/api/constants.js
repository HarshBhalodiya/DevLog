export const CATEGORIES = [
  { id: 'pr_review',  label: 'PR Review',   icon: '⌥', color: '#60A5FA', desc: 'Code reviews, PR feedback' },
  { id: 'rollout',    label: 'Rollout',      icon: '🚀', color: '#EF4444', desc: 'Deployments & releases' },
  { id: 'meeting',    label: 'Meeting',      icon: '◎',  color: '#F59E0B', desc: 'Standups, syncs, 1:1s' },
  { id: 'metrics',    label: 'Metrics',      icon: '⟁',  color: '#06B6D4', desc: 'Dashboards & monitoring' },
  { id: 'comments',   label: 'Comments',     icon: '⌘',  color: '#A78BFA', desc: 'Issue & PR comments' },
  { id: 'task',       label: 'Dev Task',     icon: '◈',  color: '#10B981', desc: 'Feature work, bug fixes' },
  { id: 'incident',   label: 'Incident',     icon: '⚡', color: '#F97316', desc: 'On-call, incidents' },
  { id: 'other',      label: 'Other',        icon: '◦',  color: '#6B7280', desc: 'Miscellaneous' },
]

export const OUTCOMES = [
  { id: 'done',        label: 'Done',        color: '#10B981' },
  { id: 'in_progress', label: 'In Progress', color: '#F59E0B' },
  { id: 'blocked',     label: 'Blocked',     color: '#EF4444' },
  { id: 'cancelled',   label: 'Cancelled',   color: '#6B7280' },
]

export const PRIORITIES = [
  { id: 'low',    label: 'Low',    color: '#6B7280' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'high',   label: 'High',   color: '#EF4444' },
]

export const getCat      = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7]
export const getOutcome  = (id) => OUTCOMES.find(o => o.id === id)   || OUTCOMES[0]
export const getPriority = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[1]
