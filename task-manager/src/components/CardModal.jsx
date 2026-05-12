import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LABEL_COLORS, uid } from "../utils/helpers"

const PRIORITY_OPTS = [
  { key: "low", icon: "🟢", label: "Low" },
  { key: "medium", icon: "🟡", label: "Medium" },
  { key: "high", icon: "🔴", label: "High" },
]

export default function CardModal({ card, lists, listId, onSave, onClose }) {
  const isEdit = !!card
  const [title, setTitle] = useState(card?.title || "")
  const [desc, setDesc] = useState(card?.desc || "")
  const [due, setDue] = useState(card?.due || "")
  const [priority, setPriority] = useState(card?.priority || "medium")
  const [tags, setTags] = useState(card?.tags ? [...card.tags] : [])
  const [tagInput, setTagInput] = useState("")
  const [checklist, setChecklist] = useState(card?.checklist ? JSON.parse(JSON.stringify(card.checklist)) : [])
  const [checkInput, setCheckInput] = useState("")
  const [label, setLabel] = useState(card?.label || "")
  const [pinned, setPinned] = useState(card?.pinned || false)
  const [selListId, setSelListId] = useState(listId || lists[0]?.id || "")
  const titleRef = useRef()

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 80)
    const handleKey = e => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const autoResize = (el) => {
    if (!el) return
    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }

  const addTag = () => {
    const v = tagInput.trim().replace(/,/g, "")
    if (v && !tags.includes(v)) setTags(p => [...p, v])
    setTagInput("")
  }

  const addCheck = () => {
    if (!checkInput.trim()) return
    setChecklist(p => [...p, { id: uid(), text: checkInput.trim(), done: false }])
    setCheckInput("")
  }

  const toggleCheck = (id, done) => setChecklist(p => p.map(x => x.id === id ? { ...x, done } : x))
  const removeCheck = (id) => setChecklist(p => p.filter(x => x.id !== id))

  const handleSave = () => {
    if (!title.trim()) { titleRef.current?.focus(); return }
    onSave({ title: title.trim(), desc, due, priority, tags, checklist, label, pinned }, selListId)
  }

  const doneCnt = checklist.filter(x => x.done).length

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal"
        initial={{ scale: 0.93, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="modal-header">
          <textarea
            ref={titleRef}
            className="modal-title-input"
            rows={1}
            placeholder="Task title…"
            value={title}
            onChange={e => { setTitle(e.target.value); autoResize(e.target) }}
          />
          <div className="modal-header-btns">
            <button className={`modal-icon-btn ${pinned ? "active" : ""}`} onClick={() => setPinned(p => !p)} title="Pin">📌</button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-two-col">
            {/* LEFT */}
            <div>
              <div className="modal-field">
                <div className="modal-label">Description</div>
                <textarea className="modal-input" placeholder="Add notes, links…" value={desc} onChange={e => setDesc(e.target.value)} />
              </div>

              {/* Checklist */}
              <div className="modal-field">
                <div className="modal-label">Checklist</div>
                {checklist.length > 0 && (
                  <div className="checklist-items">
                    {checklist.map(item => (
                      <div key={item.id} className="checklist-item">
                        <input type="checkbox" className="checklist-cb" checked={item.done}
                          onChange={e => toggleCheck(item.id, e.target.checked)} />
                        <span className={`checklist-text ${item.done ? "done" : ""}`}>{item.text}</span>
                        <button className="checklist-del" onClick={() => removeCheck(item.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="checklist-add-row">
                  <input className="modal-input" style={{ marginBottom: 0 }} placeholder="Add item…"
                    value={checkInput} onChange={e => setCheckInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCheck()} />
                  <button className="btn-sm" onClick={addCheck}>Add</button>
                </div>
              </div>

              {/* Tags */}
              <div className="modal-field">
                <div className="modal-label">Tags</div>
                <div className="tag-input-row">
                  <input className="modal-input" style={{ marginBottom: 0 }} placeholder="Tag name, press Enter"
                    value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => (e.key === "Enter" || e.key === ",") && (e.preventDefault(), addTag())} />
                  <button className="btn-sm" onClick={addTag}>Add</button>
                </div>
                {tags.length > 0 && (
                  <div className="tags-preview" style={{ marginTop: 8 }}>
                    {tags.map(t => (
                      <div key={t} className="tag-preview">
                        {t}
                        <span className="tag-rm" onClick={() => setTags(p => p.filter(x => x !== t))}>✕</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="modal-field">
                <div className="modal-label">Priority</div>
                <div className="priority-grid">
                  {PRIORITY_OPTS.map(p => (
                    <div key={p.key}
                      className={`priority-opt ${priority === p.key ? `sel-${p.key}` : ""}`}
                      onClick={() => setPriority(p.key)}>
                      <div className="p-icon">{p.icon}</div>
                      <div className="p-lbl">{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-field">
                <div className="modal-label">Column</div>
                <select className="modal-select" value={selListId} onChange={e => setSelListId(e.target.value)}>
                  {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>

              <div className="modal-field">
                <div className="modal-label">Due date</div>
                <input type="date" className="modal-input" value={due} onChange={e => setDue(e.target.value)} />
              </div>

              <div className="modal-field">
                <div className="modal-label">Label</div>
                <div className="label-grid">
                  <div
                    className={`label-opt ${label === "" ? "selected" : ""}`}
                    style={{ background: "var(--surface3)", border: "2px solid var(--border2)" }}
                    onClick={() => setLabel("")}
                  >
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>✕</span>
                  </div>
                  {LABEL_COLORS.map(c => (
                    <div key={c} className={`label-opt ${label === c ? "selected" : ""}`}
                      style={{ background: c }} onClick={() => setLabel(c)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="modal-progress-text">
            {checklist.length > 0 ? `Checklist: ${doneCnt}/${checklist.length}` : ""}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn-sm ok" onClick={handleSave}>{isEdit ? "Update Task" : "Save Task"}</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
