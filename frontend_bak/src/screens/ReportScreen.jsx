import { useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../components/toast-context'
import { Spinner } from '../components/Spinner'
import { won } from '../lib/format'

const PERIODS = [
  { label: '주간', days: 7 },
  { label: '월간', days: 30 },
]

export default function ReportScreen({ refreshKey }) {
  const notify = useToast()
  const [days, setDays] = useState(7)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api
      .report(days)
      .then((r) => alive && setReport(r))
      .catch((e) => alive && notify(e.message, 'error'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [days, refreshKey, notify])

  const total = report ? report.saved + report.wasted : 0
  const savedPct = total > 0 ? Math.round((report.saved / total) * 100) : 100

  return (
    <div className="space-y-5 px-4 pb-6 pt-2">
      <header className="flex items-center justify-between px-1">
        <h1 className="text-xl font-bold text-slate-800">낭비·절약 리포트</h1>
        <div className="flex gap-1 rounded-full bg-slate-100 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                days === p.days ? 'bg-white text-brand-700 shadow' : 'text-slate-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {loading || !report ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-500 p-4 text-white shadow-lg">
              <p className="text-xs opacity-80">절약 (먹은 금액)</p>
              <p className="mt-1 text-2xl font-bold">{won(report.saved)}</p>
              <p className="text-xs opacity-80">{report.consumed_count}건 소비</p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs text-slate-400">낭비 (버린 금액)</p>
              <p className="mt-1 text-2xl font-bold text-danger-500">{won(report.wasted)}</p>
              <p className="text-xs text-slate-400">{report.wasted_count}개 폐기</p>
            </div>
          </div>

          {/* Saved vs wasted bar */}
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
              <span>절약률</span>
              <span>{savedPct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${savedPct}%` }}
              />
            </div>
          </div>

          {report.items_saved.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-sm font-bold text-slate-500">✅ 알뜰하게 먹었어요</h2>
              <div className="flex flex-wrap gap-1.5">
                {report.items_saved.map((n) => (
                  <span
                    key={n}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </section>
          )}

          {report.items_wasted.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-sm font-bold text-slate-500">🗑️ 아깝게 버렸어요</h2>
              <div className="flex flex-wrap gap-1.5">
                {report.items_wasted.map((n) => (
                  <span
                    key={n}
                    className="rounded-full bg-danger-500/10 px-2.5 py-1 text-xs font-medium text-danger-500 ring-1 ring-danger-500/20"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
