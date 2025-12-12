export function EdgeOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden mix-blend-screen"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,93,255,0.08),transparent_48%),radial-gradient(circle_at_82%_16%,rgba(83,201,255,0.08),transparent_52%)] blur-3xl opacity-32" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)] mix-blend-screen opacity-18" />
    </div>
  )
}
