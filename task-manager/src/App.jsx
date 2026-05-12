import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"
import { fetchBoards } from "./services/api"
import { useTask } from "./context/TaskContext"
import { countTasks, COLORS } from "./utils/helpers"
import { AnimatePresence, motion } from "framer-motion"

import BoardList from "./components/BoardList"
import BoardView from "./components/BoardView"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import CalendarView from "./pages/CalendarView"
import Toast from "./components/Toast"

function Sidebar({ boards, currentBoardId }) {
  const { logActivity, showToast } = useTask()
  const navigate = useNavigate()
  const location = useLocation()
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  const isActive = (path) => location.pathname === path

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span>TaskFlow</span>
        </div>
        <div className="today-badge">{today}</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Views</div>

        <button className={`nav-btn ${isActive("/") ? "active" : ""}`} onClick={() => navigate("/")}>
          <span className="nav-icon">◫</span>
          All Boards
          <span className="nav-chip">{boards.length}</span>
        </button>

        {currentBoardId && (
          <button className={`nav-btn ${location.pathname.startsWith("/board/") ? "active" : ""}`}
            onClick={() => navigate(`/board/${currentBoardId}`)}>
            <span className="nav-icon">⬛</span>
            Board
            <span className="nav-chip">{countTasks(boards.find(b => b.id === currentBoardId) || { lists: [] })}</span>
          </button>
        )}

        <button className={`nav-btn ${isActive("/calendar") ? "active" : ""}`} onClick={() => navigate("/calendar")}>
          <span className="nav-icon">📅</span>
          Calendar
        </button>

        <button className={`nav-btn ${isActive("/dashboard") ? "active" : ""}`} onClick={() => navigate("/dashboard")}>
          <span className="nav-icon">◎</span>
          Dashboard
        </button>

        <div className="nav-section-label" style={{ marginTop: 12 }}>Boards</div>
        {boards.map(b => (
          <button key={b.id}
            className={`board-nav-item ${currentBoardId === b.id && location.pathname.startsWith("/board/") ? "active" : ""}`}
            onClick={() => navigate(`/board/${b.id}`)}>
            <span className="board-dot" style={{ background: b.color }} />
            <span className="board-nav-name">{b.name}</span>
            <span className="board-nav-count">{countTasks(b)}</span>
          </button>
        ))}
        <button className="btn-nav-new" onClick={() => navigate("/")}>＋ New Board</button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={() => navigate("/login")}>
          <div className="avatar">
            {auth.currentUser?.email?.[0]?.toUpperCase() || "G"}
          </div>
          <div className="user-info">
            <div className="user-name">{auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Guest"}</div>
            <div className="user-role">{auth.currentUser ? "Signed in" : "Not signed in"}</div>
          </div>
          <div className="status-dot" style={{ color: auth.currentUser ? "var(--success)" : "var(--text3)", background: auth.currentUser ? "var(--success)" : "var(--text3)" }} />
        </div>
      </div>
    </aside>
  )
}

function AppInner() {
  const [boards, setBoards] = useState([])
  const [currentBoardId, setCurrentBoardId] = useState(null)
  const [user, setUser] = useState(undefined)
  const { toast } = useTask()
  const location = useLocation()

  // Track current board from URL
  useEffect(() => {
    const match = location.pathname.match(/\/board\/(.+)/)
    if (match) setCurrentBoardId(match[1])
  }, [location])

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return unsub
  }, [])

  // Load boards
  const loadBoards = async () => {
    try {
      const data = await fetchBoards()
      setBoards(data)
      if (data.length && !currentBoardId) setCurrentBoardId(data[0].id)
    } catch {
      // Firebase might not have data yet — ok
    }
  }

  useEffect(() => { loadBoards() }, [])

  return (
    <div className="app-layout">
      <Sidebar boards={boards} currentBoardId={currentBoardId} />
      <div className="main-area">
        <Routes>
          <Route path="/" element={<BoardList boards={boards} onBoardsChange={loadBoards} />} />
          <Route path="/board/:id" element={<BoardView boards={boards} onBoardsChange={loadBoards} />} />
          <Route path="/dashboard" element={<Dashboard boards={boards} />} />
          <Route path="/calendar" element={<CalendarView boards={boards} />} />
          <Route path="/login" element={<Login onAuthChange={() => setUser(auth.currentUser)} />} />
        </Routes>
      </div>
      <Toast message={toast} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
