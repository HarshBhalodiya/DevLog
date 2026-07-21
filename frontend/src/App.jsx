import { Routes, Route, NavLink } from 'react-router-dom'
import LogPage      from './pages/LogPage.jsx'
import SummaryPage  from './pages/SummaryPage.jsx'
import AnalysePage  from './pages/AnalysePage.jsx'
import WeeklyPage   from './pages/WeeklyPage.jsx'
import './App.css'

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">▣</span>
          <div>
            <div className="logo-title">DevLog</div>
            <div className="logo-sub">work tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/"        className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
            <span className="nav-icon">◈</span> Daily Log
          </NavLink>
          <NavLink to="/summary" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">◎</span> Summary
          </NavLink>
          <NavLink to="/analyse" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">⟁</span> Analysis
          </NavLink>
          <NavLink to="/weekly"  className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">⊞</span> Weekly
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="footer-dot" />
          <span>backend: {import.meta.env.VITE_API_URL}</span>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/"        element={<LogPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/analyse" element={<AnalysePage />} />
          <Route path="/weekly"  element={<WeeklyPage />} />
        </Routes>
      </main>
    </div>
  )
}
