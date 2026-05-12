export const COLORS = ["#6c8aff","#a78bfa","#f472b6","#2dd4bf","#f5a623","#4ecb8d","#ff5f6d","#60a5fa","#fb923c","#e879f9"]
export const LABEL_COLORS = ["#6c8aff","#a78bfa","#f472b6","#2dd4bf","#f5a623","#4ecb8d","#ff5f6d","#60a5fa","#fb923c"]
export const PRIORITY_COLORS = { high: "#ff5f6d", medium: "#f5a623", low: "#4ecb8d" }
export const PRIORITY_CSS = { high: "var(--danger)", medium: "var(--warn)", low: "var(--success)" }

export function uid() {
  return "x" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}
export function today() {
  return new Date().toISOString().slice(0, 10)
}
export function dayOffset(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
export function countTasks(board) {
  return (board.lists || []).reduce((s, l) => s + (l.cards || []).length, 0)
}
export function dueCls(due) {
  if (!due) return ""
  const t = today()
  const d3 = new Date(); d3.setDate(d3.getDate() + 3)
  const d3str = d3.toISOString().slice(0, 10)
  if (due < t) return "overdue"
  if (due === t) return "today"
  if (due <= d3str) return "soon"
  return ""
}
export function dueIcon(due) {
  if (!due) return ""
  const t = today()
  return due < t ? "⚠" : "📅"
}
