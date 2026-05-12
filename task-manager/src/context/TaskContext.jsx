import { createContext, useContext, useState, useCallback } from "react"

const TaskContext = createContext(null)

export function TaskProvider({ children }) {
  const [activity, setActivity] = useState([])
  const [toast, setToast] = useState(null)
  const [toastTimer, setToastTimer] = useState(null)

  const logActivity = useCallback((text, color = "#6c8aff") => {
    const now = new Date()
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    setActivity(prev => {
      const next = [...prev, { text, color, time, id: Date.now() }]
      return next.slice(-30)
    })
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    if (toastTimer) clearTimeout(toastTimer)
    const t = setTimeout(() => setToast(null), 2600)
    setToastTimer(t)
  }, [toastTimer])

  return (
    <TaskContext.Provider value={{ activity, logActivity, toast, showToast }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTask() {
  return useContext(TaskContext)
}
