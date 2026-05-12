import { useState, useRef } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { motion, AnimatePresence } from "framer-motion"
import Card from "./Card"
import { uid } from "../utils/helpers"

export default function List({ list, lists, onListsChange, onEditCard, onDeleteCard, onDoneCard, onCtx, sortMode, filterPriority, searchQ }) {
  const { setNodeRef, isOver } = useDroppable({ id: list.id })
  const [addOpen, setAddOpen] = useState(false)
  const [addText, setAddText] = useState("")
  const [editTitle, setEditTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(list.title)
  const inputRef = useRef()

  const openAdd = () => {
    setAddOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }
  const closeAdd = () => { setAddOpen(false); setAddText("") }

  const quickAdd = async () => {
    if (!addText.trim()) return
    const newCard = { id: uid(), title: addText.trim(), desc: "", priority: "medium", tags: [], due: "", label: "", checklist: [], pinned: false }
    const newLists = lists.map(l => l.id === list.id ? { ...l, cards: [...l.cards, newCard] } : l)
    await onListsChange(newLists)
    closeAdd()
  }

  const renameList = async () => {
    setEditTitle(false)
    if (!titleVal.trim() || titleVal === list.title) return
    const newLists = lists.map(l => l.id === list.id ? { ...l, title: titleVal.trim() } : l)
    await onListsChange(newLists)
  }

  const deleteList = async () => {
    if (list.cards.length > 0 && !confirm(`Delete "${list.title}" and its ${list.cards.length} task(s)?`)) return
    await onListsChange(lists.filter(l => l.id !== list.id))
  }

  // Filter & sort cards
  let cards = [...list.cards]
  if (filterPriority !== "all") cards = cards.filter(c => c.priority === filterPriority)
  if (searchQ) {
    const q = searchQ.toLowerCase()
    cards = cards.filter(c => c.title.toLowerCase().includes(q) || (c.desc || "").toLowerCase().includes(q) || (c.tags || []).some(t => t.toLowerCase().includes(q)))
  }
  const pr = { high: 0, medium: 1, low: 2 }
  if (sortMode === "priority") cards = [...cards].sort((a, b) => (pr[a.priority] || 1) - (pr[b.priority] || 1))
  else if (sortMode === "due") cards = [...cards].sort((a, b) => { if (!a.due) return 1; if (!b.due) return -1; return a.due.localeCompare(b.due) })
  else if (sortMode === "title") cards = [...cards].sort((a, b) => a.title.localeCompare(b.title))
  // pinned always first
  cards = [...cards.filter(c => c.pinned), ...cards.filter(c => !c.pinned)]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`column ${isOver ? "drag-over" : ""}`}
    >
      {/* Header */}
      <div className="col-header">
        <div className="col-color-bar" style={{ background: list.color }} />
        {editTitle ? (
          <input
            className="col-title-input"
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={renameList}
            onKeyDown={e => { if (e.key === "Enter") renameList(); if (e.key === "Escape") { setEditTitle(false); setTitleVal(list.title) } }}
            autoFocus
          />
        ) : (
          <div className="col-title-input" onClick={() => setEditTitle(true)} style={{ cursor: "text" }}>{list.title}</div>
        )}
        <div className="col-count">{list.cards.length}</div>
        <button className="col-del-btn" onClick={deleteList}>✕</button>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="cards-list">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {cards.map(card => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <Card
                  card={card}
                  listId={list.id}
                  onEdit={onEditCard}
                  onDelete={onDeleteCard}
                  onDone={onDoneCard}
                  onCtx={onCtx}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="add-card-area">
        {addOpen ? (
          <>
            <textarea
              ref={inputRef}
              className="add-card-input"
              style={{ display: "block" }}
              placeholder="Task title…"
              value={addText}
              onChange={e => setAddText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); quickAdd() } if (e.key === "Escape") closeAdd() }}
            />
            <div className="add-card-actions show">
              <button className="btn-sm ok" onClick={quickAdd}>Add</button>
              <button className="btn-sm" onClick={closeAdd}>Cancel</button>
            </div>
          </>
        ) : (
          <button className="add-card-btn" onClick={openAdd}>
            <span style={{ fontSize: 15, opacity: .5 }}>＋</span> Add task
          </button>
        )}
      </div>
    </motion.div>
  )
}
