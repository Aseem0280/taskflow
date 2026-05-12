export default function Topbar({ title, meta, children, extraLeft }) {
  return (
    <header className="topbar">
      <div className="topbar-title-wrap">
        <div className="topbar-title">{title}</div>
        {meta && <div className="topbar-meta">{meta}</div>}
      </div>
      {extraLeft}
      <div className="topbar-actions">{children}</div>
    </header>
  )
}
