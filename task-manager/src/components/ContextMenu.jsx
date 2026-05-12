import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export default function ContextMenu({ x, y, onEdit, onMove, onDelete, onClose }) {
  const ref = useRef()

  useEffect(() => {
    const handle = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  return (
    <motion.div
      ref={ref}
      className="ctx-menu"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ duration: 0.13 }}
    >
      <div className="ctx-item" onClick={onEdit}><span>✏</span> Edit task</div>
      <div className="ctx-item" onClick={onMove}><span>↗</span> Move to…</div>
      <div className="ctx-item danger" onClick={onDelete}><span>🗑</span> Delete task</div>
    </motion.div>
  )
}
