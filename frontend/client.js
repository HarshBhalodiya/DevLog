import axios from 'axios'

// Use environment variable for production, local proxy for development
const API_BASE =
    import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
})

// ── Logs ─────────────────────────────────────────────────────────────────────
export const getLogs = (day) => api.get('/logs', { params: { day } }).then(r => r.data)
export const getDates = () => api.get('/logs/dates').then(r => r.data)
export const getStats = (day) => api.get('/logs/stats', { params: { day } }).then(r => r.data)
export const addLog = (entry) => api.post('/log', entry).then(r => r.data)
export const updateLog = (id, entry) => api.put(`/log/${id}`, entry).then(r => r.data)
export const deleteLog = (id) => api.delete(`/log/${id}`).then(r => r.data)

// ── Notes ─────────────────────────────────────────────────────────────────────
export const getNote = (day) => api.get(`/note/${day}`).then(r => r.data)
export const saveNote = (date, content) => api.post('/note', { date, content }).then(r => r.data)

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiSummarise = (date, entries) => api.post('/ai/summarise', { date, entries }).then(r => r.data)
export const aiAnalyse = (date, entries) => api.post('/ai/analyse', { date, entries }).then(r => r.data)
export const aiWeekly = (dates) => api.post('/ai/weekly', dates).then(r => r.data)

export default api