import { useTask } from "../context/TaskContext"
import { countTasks, today, PRIORITY_COLORS } from "../utils/helpers"
import Topbar from "../components/Topbar"

export default function Dashboard({ boards }) {
  const { activity } = useTask()

  let totalTasks = 0, high = 0, medium = 0, low = 0, completed = 0, overdue = 0
  const t = today()
  boards.forEach(b => (b.lists || []).forEach(l => {
    l.cards?.forEach(c => {
      totalTasks++
      if (c.priority === "high") high++
      else if (c.priority === "medium") medium++
      else low++
      if (l.title.toLowerCase().includes("done") || l.title.toLowerCase().includes("complete")) completed++
      if (c.due && c.due < t) overdue++
    })
  }))
  const completionRate = totalTasks ? Math.round(completed / totalTasks * 100) : 0
  const maxPr = Math.max(high, medium, low, 1)

  const stats = [
    { label: "Boards", value: boards.length, sub: "Active workspaces", color: "var(--accent)" },
    { label: "Total Tasks", value: totalTasks, sub: "Across all boards", color: "var(--text)" },
    { label: "Completed", value: completed, sub: `${completionRate}% done`, color: "var(--success)" },
    { label: "High Priority", value: high, sub: "Need attention", color: "var(--danger)" },
    { label: "Overdue", value: overdue, sub: "Past due date", color: "var(--warn)" },
  ]

  return (
    <>
      <Topbar title="Dashboard" meta="Overview of all boards and tasks" />
      <div className="page">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="dash-two">
          {/* Board progress */}
          <div>
            <div className="dash-section-title">Board progress</div>
            {boards.map(b => {
              const total = countTasks(b)
              if (!total) return null
              const done = (b.lists || []).filter(l => l.title.toLowerCase().includes("done") || l.title.toLowerCase().includes("complete")).reduce((s, l) => s + (l.cards?.length || 0), 0)
              const pct = Math.round(done / total * 100)
              return (
                <div key={b.id} className="progress-row">
                  <div className="progress-label" title={b.name}>{b.name}</div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: b.color }} />
                  </div>
                  <div className="progress-pct">{pct}%</div>
                </div>
              )
            })}
            {!boards.length && <div style={{ fontSize: 13, color: "var(--text3)" }}>No boards yet</div>}
          </div>

          {/* Priority breakdown */}
          <div>
            <div className="dash-section-title">Priority breakdown</div>
            {[
              { label: "🔴 High", count: high, color: "var(--danger)" },
              { label: "🟡 Medium", count: medium, color: "var(--warn)" },
              { label: "🟢 Low", count: low, color: "var(--success)" },
            ].map(p => (
              <div key={p.label} className="pbar-row">
                <div className="pbar-label">{p.label}</div>
                <div className="pbar-track">
                  <div className="pbar-fill" style={{ width: `${p.count / maxPr * 100}%`, background: p.color }} />
                </div>
                <div className="pbar-count">{p.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="dash-section-title" style={{ marginTop: 6 }}>Recent activity</div>
        <div className="activity-list">
          {[...activity].reverse().slice(0, 10).map(a => (
            <div key={a.id} className="activity-item">
              <div className="activity-dot" style={{ background: a.color }} />
              <div className="activity-text">{a.text}</div>
              <div className="activity-time">{a.time}</div>
            </div>
          ))}
          {!activity.length && <div style={{ fontSize: 13, color: "var(--text3)", padding: "8px 0" }}>No recent activity yet</div>}
        </div>
      </div>
    </>
  )
}
