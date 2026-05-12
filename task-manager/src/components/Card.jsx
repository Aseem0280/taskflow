import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PRIORITY_COLORS, PRIORITY_CSS, dueCls, dueIcon, today } from "../utils/helpers"

export default function Card({ card, listId, onEdit, onDelete, onDone, onCtx }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    "--card-label": card.label || "transparent",
  }

  const pc = PRIORITY_CSS[card.priority] || "var(--text3)"
  const pcHex = PRIORITY_COLORS[card.priority] || "#8c92a4"
  const cls = dueCls(card.due)
  const doneCnt = (card.checklist || []).filter(x => x.done).length
  const totalCnt = (card.checklist || []).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${isDragging ? "is-dragging" : ""}`}
      onContextMenu={e => onCtx(e, card.id, listId)}
      {...attributes}
      {...listeners}
    >
      {card.label && <div className="card-label-strip" style={{ background: card.label }} />}

      <div className="card-priority-row">
        <div className="p-dot" style={{ background: pc }} />
        <span className="p-label" style={{ color: pc, fontSize: 10 }}>{card.priority}</span>
        {card.pinned && <span className="card-pin">📌</span>}
      </div>

      <div className="card-title">{card.title}</div>

      {card.desc && (
        <div className="card-desc">
          {card.desc.length > 80 ? card.desc.slice(0, 80) + "…" : card.desc}
        </div>
      )}

      {totalCnt > 0 && (
        <div className="checklist-bar">
          <div className="checklist-bar-label">{doneCnt}/{totalCnt} done</div>
          <div className="checklist-bar-track">
            <div className="checklist-bar-fill" style={{ width: `${Math.round(doneCnt / totalCnt * 100)}%` }} />
          </div>
        </div>
      )}

      {card.tags?.length > 0 && (
        <div className="card-tags">
          {card.tags.map(t => (
            <span key={t} className="tag"
              style={{ background: pcHex + "22", color: pcHex, border: `1px solid ${pcHex}33` }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="card-footer">
        {card.due && (
          <span className={`card-due ${cls}`}>
            {dueIcon(card.due)} {card.due}
          </span>
        )}
        <div className="card-actions">
          <button className="card-action-btn done" title="Mark done"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDone(card.id, listId) }}>✓</button>
          <button className="card-action-btn" title="Edit"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit(card, listId) }}>✏</button>
          <button className="card-action-btn del" title="Delete"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(card.id, listId) }}>🗑</button>
        </div>
      </div>
    </div>
  )
}
