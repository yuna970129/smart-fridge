export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-brand-700">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  )
}

export function EmptyState({ emoji = '🗒️', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="text-4xl">{emoji}</div>
      <p className="font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
  )
}
