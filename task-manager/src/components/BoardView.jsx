import { useEffect, useState, useCallback } from "react"
import { useParams } from "react-router-dom"
import {
  DndContext, DragOverlay, closestCenter, PointerSensor,
  useSensor, useSensors, MouseSensor, TouchSensor
} from "@dnd-kit/core"
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { AnimatePresence } from "framer-motion"
import { fetchBoard, saveLists } from "../services/api"
import { useTask } from "../context/TaskContext"
import { COLORS, uid, countTasks } from "../utils/helpers"
import Topbar from "./Topbar"
import List from "./List"
import CardModal from "./CardModal"
import ContextMenu from "./ContextMenu"

export default function BoardView({ boards, onBoardsChange }) {
  const { id } = useParams()
  const { logActivity, showToast } = useTask()

  const [board, setBoard] = useState(null)
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)

  // Add column form
  const [showAddCol, setShowAddCol] = useState(false)
  const [colTitle, setColTitle] = useState("")
  const [colColor, setColColor] = useState(COLORS[0])

  // Sort / filter / search
  const [sortMode, setSortMode] = useState("none")
  const [filterPriority, setFilterPriority] = useState("all")
  const [searchQ, setSearchQ] = useState("")

  // Modal
  const [modal, setModal] = useState(null) // { card, listId } | { listId } for add

  // Context menu
  const [ctx, setCtx] = useState(null) // { x, y, cardId, listId }

  // DnD active
  const [activeCard, setActiveCard] = useState(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  useEffect(() => {
    loadBoard()
  }, [id])

  const loadBoard = async () => {
    setLoading(true)
    try {
      const data = await fetchBoard(id)
      if (data) { setBoard(data); setLists(data.lists || []) }
    } finally {
      setLoading(false)
    }
  }

  const persist = async (newLists) => {
    setLists(newLists)
    await saveLists(id, newLists)
    onBoardsChange?.()
  }

  // ── DnD ──────────────────────────────────────────────
  const findListByCardId = (cardId) => lists.find(l => l.cards.some(c => c.id === cardId))

  const handleDragStart = ({ active }) => {
    const list = findListByCardId(active.id)
    const card = list?.cards.find(c => c.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragOver = ({ active, over }) => {
    if (!over) return
    const srcList = findListByCardId(active.id)
    if (!srcList) return

    // Dropped over a list (not a card)
    const tgtList = lists.find(l => l.id === over.id)
    if (tgtList && tgtList.id !== srcList.id) {
      const card = srcList.cards.find(c => c.id === active.id)
      const newLists = lists.map(l => {
        if (l.id === srcList.id) return { ...l, cards: l.cards.filter(c => c.id !== active.id) }
        if (l.id === tgtList.id) return { ...l, cards: [...l.cards, card] }
        return l
      })
      setLists(newLists)
      return
    }

    // Dropped over a card
    const overList = findListByCardId(over.id)
    if (!overList) return
    if (srcList.id !== overList.id) {
      const card = srcList.cards.find(c => c.id === active.id)
      const overIdx = overList.cards.findIndex(c => c.id === over.id)
      const newLists = lists.map(l => {
        if (l.id === srcList.id) return { ...l, cards: l.cards.filter(c => c.id !== active.id) }
        if (l.id === overList.id) {
          const newCards = [...l.cards]
          newCards.splice(overIdx, 0, card)
          return { ...l, cards: newCards }
        }
        return l
      })
      setLists(newLists)
    } else {
      // Same list reorder
      const idx1 = srcList.cards.findIndex(c => c.id === active.id)
      const idx2 = srcList.cards.findIndex(c => c.id === over.id)
      if (idx1 !== idx2) {
        const newLists = lists.map(l => l.id === srcList.id
          ? { ...l, cards: arrayMove(l.cards, idx1, idx2) } : l)
        setLists(newLists)
      }
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null)
    if (!over) return
    const srcList = findListByCardId(active.id)
    const card = srcList?.cards.find(c => c.id === active.id)
    const tgtList = lists.find(l => l.id === over.id) || findListByCardId(over.id)
    if (srcList && tgtList && srcList.id !== tgtList.id) {
      logActivity(`Moved "${card?.title}" to ${tgtList.title}`, tgtList.color)
      showToast(`Moved to ${tgtList.title}`)
    }
    await persist(lists)
  }

  // ── Card CRUD ──────────────────────────────────────────
  const openAddModal = (listId) => setModal({ mode: "add", listId })
  const openEditModal = (card, listId) => setModal({ mode: "edit", card, listId })

  const handleSaveModal = async (cardData, targetListId) => {
    if (modal.mode === "add") {
      const newCard = { id: uid(), ...cardData }
      const newLists = lists.map(l => l.id === targetListId ? { ...l, cards: [...l.cards, newCard] } : l)
      await persist(newLists)
      logActivity(`Added "${cardData.title}"`, lists.find(l => l.id === targetListId)?.color)
      showToast("Task created ✓")
    } else {
      // Edit — possibly move list
      const srcListId = modal.listId
      let newLists
      if (targetListId !== srcListId) {
        newLists = lists.map(l => {
          if (l.id === srcListId) return { ...l, cards: l.cards.filter(c => c.id !== modal.card.id) }
          if (l.id === targetListId) return { ...l, cards: [...l.cards, { ...modal.card, ...cardData }] }
          return l
        })
      } else {
        newLists = lists.map(l => l.id === srcListId
          ? { ...l, cards: l.cards.map(c => c.id === modal.card.id ? { ...c, ...cardData } : c) }
          : l)
      }
      await persist(newLists)
      logActivity(`Updated "${cardData.title}"`, lists.find(l => l.id === targetListId)?.color)
      showToast("Task updated ✓")
    }
    setModal(null)
  }

  const handleDeleteCard = async (cardId, listId) => {
    const list = lists.find(l => l.id === listId)
    const card = list?.cards.find(c => c.id === cardId)
    const newLists = lists.map(l => l.id === listId ? { ...l, cards: l.cards.filter(c => c.id !== cardId) } : l)
    await persist(newLists)
    logActivity(`Deleted "${card?.title}"`, list?.color)
    showToast("Task deleted")
  }

  const handleDoneCard = async (cardId, listId) => {
    const doneList = lists.find(l => l.title.toLowerCase().includes("done") || l.title.toLowerCase().includes("complete"))
    if (!doneList || doneList.id === listId) { showToast("Already in done column"); return }
    const srcList = lists.find(l => l.id === listId)
    const card = srcList?.cards.find(c => c.id === cardId)
    const newLists = lists.map(l => {
      if (l.id === listId) return { ...l, cards: l.cards.filter(c => c.id !== cardId) }
      if (l.id === doneList.id) return { ...l, cards: [...l.cards, card] }
      return l
    })
    await persist(newLists)
    logActivity(`Completed "${card?.title}"`, "#4ecb8d")
    showToast("Marked as done ✓")
  }

  // ── Add Column ─────────────────────────────────────────
  const handleAddCol = async () => {
    if (!colTitle.trim()) return
    const newList = { id: uid(), title: colTitle.trim(), color: colColor, cards: [] }
    const newLists = [...lists, newList]
    await persist(newLists)
    logActivity(`Created column "${colTitle.trim()}"`, colColor)
    showToast(`Column "${colTitle.trim()}" created`)
    setColTitle(""); setShowAddCol(false)
  }

  // ── Context Menu ───────────────────────────────────────
  const handleCtx = (e, cardId, listId) => {
    e.preventDefault()
    let x = e.clientX, y = e.clientY
    if (x + 170 > window.innerWidth) x = window.innerWidth - 176
    if (y + 120 > window.innerHeight) y = window.innerHeight - 126
    setCtx({ x, y, cardId, listId })
  }

  const ctxCard = ctx ? lists.find(l => l.id === ctx.listId)?.cards.find(c => c.id === ctx.cardId) : null

  // ── Sort cycle ─────────────────────────────────────────
  const sortLabels = { none: "↕ Sort", priority: "🔴 Priority", due: "📅 Due date", title: "🔤 Title" }
  const cycleSortMode = () => {
    const modes = ["none", "priority", "due", "title"]
    setSortMode(m => modes[(modes.indexOf(m) + 1) % modes.length])
  }

  const totalTasks = lists.reduce((s, l) => s + l.cards.length, 0)

  if (loading) return (
    <>
      <Topbar title="Loading…" />
      <div className="loading"><div className="spinner" /> Loading board…</div>
    </>
  )
  if (!board) return <><Topbar title="Not found" /><div className="loading">Board not found.</div></>

  return (
    <>
      <Topbar title={board.name} meta={`${lists.length} columns · ${totalTasks} tasks`}>
        {/* Search */}
        <div className="search-box">
          <span style={{ color: "var(--text3)", fontSize: 12 }}>🔍</span>
          <input placeholder="Search tasks…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        {/* Filter pills */}
        <div className="filter-pills">
          {["all","high","medium","low"].map(p => (
            <button key={p} className={`filter-pill ${filterPriority === p ? "active" : ""}`}
              onClick={() => setFilterPriority(p)}>
              {p === "all" ? "All" : p === "high" ? "🔴 High" : p === "medium" ? "🟡 Med" : "🟢 Low"}
            </button>
          ))}
        </div>
        {/* Sort */}
        <button className={`btn ${sortMode !== "none" ? "active-sort" : ""}`} onClick={cycleSortMode}>
          {sortLabels[sortMode]}
        </button>
        {/* Add task */}
        <button className="btn primary" onClick={() => openAddModal(lists[0]?.id)}>＋ Add Task</button>
      </Topbar>

      <div className="board-view">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board-area">
            {lists.map(list => (
              <List
                key={list.id}
                list={list}
                lists={lists}
                onListsChange={persist}
                onEditCard={openEditModal}
                onDeleteCard={handleDeleteCard}
                onDoneCard={handleDoneCard}
                onCtx={handleCtx}
                sortMode={sortMode}
                filterPriority={filterPriority}
                searchQ={searchQ}
              />
            ))}

            {/* Add column */}
            <div className="add-col-wrap">
              {showAddCol ? (
                <div className="add-col-form">
                  <input
                    className="form-input"
                    placeholder="Column name…"
                    value={colTitle}
                    onChange={e => setColTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAddCol(); if (e.key === "Escape") setShowAddCol(false) }}
                    autoFocus
                  />
                  <div className="color-picker" style={{ marginBottom: 10 }}>
                    {COLORS.map(c => (
                      <div key={c} className={`color-dot ${c === colColor ? "selected" : ""}`}
                        style={{ background: c }} onClick={() => setColColor(c)} />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 7 }}>
                    <button className="btn-sm ok" onClick={handleAddCol}>Create</button>
                    <button className="btn-sm" onClick={() => setShowAddCol(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="add-col-trigger" onClick={() => setShowAddCol(true)}>
                  <span style={{ fontSize: 16, opacity: .4 }}>＋</span> Add column
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && (
              <div className="card" style={{ opacity: 0.9, boxShadow: "0 8px 32px #00000088", transform: "rotate(1.5deg)" }}>
                <div className="card-title">{activeCard.title}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card modal */}
      <AnimatePresence>
        {modal && (
          <CardModal
            key="modal"
            card={modal.mode === "edit" ? modal.card : null}
            lists={lists}
            listId={modal.listId}
            onSave={handleSaveModal}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Context menu */}
      <AnimatePresence>
        {ctx && (
          <ContextMenu
            key="ctx"
            x={ctx.x} y={ctx.y}
            onEdit={() => { openEditModal(ctxCard, ctx.listId); setCtx(null) }}
            onMove={() => {
              const others = lists.filter(l => l.id !== ctx.listId)
              const names = others.map((l, i) => `${i + 1}. ${l.title}`).join("\n")
              const choice = prompt(`Move to column:\n${names}\n\nEnter number:`)
              if (choice) {
                const idx = parseInt(choice) - 1
                if (others[idx]) {
                  const srcList = lists.find(l => l.id === ctx.listId)
                  const card = srcList?.cards.find(c => c.id === ctx.cardId)
                  const newLists = lists.map(l => {
                    if (l.id === ctx.listId) return { ...l, cards: l.cards.filter(c => c.id !== ctx.cardId) }
                    if (l.id === others[idx].id) return { ...l, cards: [...l.cards, card] }
                    return l
                  })
                  persist(newLists)
                  showToast(`Moved to ${others[idx].title}`)
                }
              }
              setCtx(null)
            }}
            onDelete={() => { handleDeleteCard(ctx.cardId, ctx.listId); setCtx(null) }}
            onClose={() => setCtx(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
