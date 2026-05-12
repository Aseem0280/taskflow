import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { today, PRIORITY_COLORS } from "../utils/helpers"
import Topbar from "../components/Topbar"

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

export default function CalendarView({ boards }) {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()) }

  // Gather tasks by date across all boards
  const tasksByDate = {}
  boards.forEach(b => (b.lists || []).forEach(l => l.cards?.forEach(c => {
    if (c.due) {
      if (!tasksByDate[c.due]) tasksByDate[c.due] = []
      tasksByDate[c.due].push({ ...c, boardId: b.id, listId: l.id, boardColor: b.color })
    }
  })))

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const t = today()

  const cells = []
  for (let i = 0; i < totalCells; i++) {
    let day, dateStr, isOther = false
    if (i < firstDay) {
      day = daysInPrev - firstDay + i + 1
      const m = month === 0 ? 12 : month
      const y = month === 0 ? year - 1 : year
      dateStr = `${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`
      isOther = true
    } else if (i >= firstDay + daysInMonth) {
      day = i - firstDay - daysInMonth + 1
      const m = month === 11 ? 1 : month + 2
      const y = month === 11 ? year + 1 : year
      dateStr = `${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`
      isOther = true
    } else {
      day = i - firstDay + 1
      dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
    }
    cells.push({ day, dateStr, isOther, isToday: dateStr === t })
  }

  return (
    <>
      <Topbar title={`${MONTHS[month]} ${year}`} meta="Tasks with due dates">
        <button className="btn" onClick={prev}>‹ Prev</button>
        <button className="btn" onClick={goToday}>Today</button>
        <button className="btn" onClick={next}>Next ›</button>
      </Topbar>

      <div className="page" style={{ overflow: "auto" }}>
        <div className="cal-grid-wrap">
          <div className="cal-weekdays">
            {WEEKDAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
          </div>
          <div className="cal-days">
            {cells.map(({ day, dateStr, isOther, isToday }) => {
              const tasks = tasksByDate[dateStr] || []
              const maxShow = 3
              return (
                <div key={dateStr} className={`cal-day ${isOther ? "other" : ""} ${isToday ? "is-today" : ""}`}>
                  <div className="cal-day-num">{day}</div>
                  {tasks.slice(0, maxShow).map(c => {
                    const pc = PRIORITY_COLORS[c.priority] || "#8c92a4"
                    return (
                      <div key={c.id} className="cal-chip"
                        style={{ background: pc + "22", color: pc, border: `1px solid ${pc}33` }}
                        onClick={() => navigate(`/board/${c.boardId}`)}
                        title={c.title}>
                        {c.title}
                      </div>
                    )
                  })}
                  {tasks.length > maxShow && (
                    <div className="cal-overflow">+{tasks.length - maxShow} more</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
