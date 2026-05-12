import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { createBoard, deleteBoard } from "../services/api"
import { useTask } from "../context/TaskContext"
import { COLORS, countTasks } from "../utils/helpers"
import Topbar from "./Topbar"

export default function BoardList({ boards, onBoardsChange }) {
  const navigate = useNavigate()
  const { logActivity, showToast } = useTask()
  const [name, setName] = useState("")
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const id = await createBoard(name.trim(), selectedColor)
      logActivity(`Created board "${name.trim()}"`, selectedColor)
      showToast(`Board "${name.trim()}" created ✓`)
      setName("")
      setShowForm(false)
      await onBoardsChange()
      navigate(`/board/${id}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e, boardId, boardName) => {
    e.stopPropagation()
    if (!confirm(`Delete board "${boardName}"?`)) return
    await deleteBoard(boardId)
    logActivity(`Deleted board "${boardName}"`, "#ff5f6d")
    showToast(`Deleted "${boardName}"`)
    onBoardsChange()
  }

  const total = boards.reduce((s, b) => s + countTasks(b), 0)

  return (
    <>
      <Topbar title="All Boards" meta={`${boards.length} boards · ${total} tasks`}>
        <button className="btn primary" onClick={() => setShowForm(v => !v)}>＋ New Board</button>
      </Topbar>

      <div className="page">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: "var(--surface)", border: "1px solid var(--accent)",
                borderRadius: "var(--radius)", padding: 16, marginBottom: 20,
                boxShadow: "0 0 20px var(--accent-glow)"
              }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                <input
                  className="form-input" style={{ margin: 0, flex: 1 }}
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Board name…"
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
                <button className="btn-sm ok" onClick={handleCreate} disabled={loading}>
                  {loading ? "Creating…" : "Create"}
                </button>
                <button className="btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
              <div style={{ marginBottom: 6, fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".6px", fontWeight: 600 }}>Color</div>
              <div className="color-picker">
                {COLORS.map(c => (
                  <div key={c} className={`color-dot ${c === selectedColor ? "selected" : ""}`}
                    style={{ background: c }} onClick={() => setSelectedColor(c)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="boards-grid">
          {boards.map((b, i) => (
            <motion.div
              key={b.id}
              className="board-card"
              style={{ "--c": b.color }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/board/${b.id}`)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div className="board-card-dot" style={{ background: b.color, boxShadow: `0 0 10px ${b.color}` }} />
                <button
                  style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 13, opacity: 0, transition: "opacity .15s" }}
                  className="board-del-btn"
                  onClick={e => handleDelete(e, b.id, b.name)}
                  onMouseEnter={e => e.target.style.color = "var(--danger)"}
                  onMouseLeave={e => e.target.style.color = "var(--text3)"}
                >🗑</button>
              </div>
              <div className="board-card-name">{b.name}</div>
              <div className="board-card-meta">Updated recently</div>
              <div className="board-card-footer">
                <span style={{ fontSize: 11, color: "var(--text3)" }}>{(b.lists || []).length} columns</span>
                <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text2)" }}>{countTasks(b)} tasks</span>
              </div>
            </motion.div>
          ))}
          <button className="board-add-card" onClick={() => setShowForm(true)}>＋ New Board</button>
        </div>
      </div>

      <style>{`.board-card:hover .board-del-btn { opacity: 1 !important; }`}</style>
    </>
  )
}
