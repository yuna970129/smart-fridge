import { useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../components/toast-context'
import { Spinner, EmptyState } from '../components/Spinner'
import { dday, emojiFor, qty, won } from '../lib/format'

function AlertCard({ item, onConfirm }) {
  const overdue = item.days_left != null && item.days_left < 0
  return (
    <div className="animate-slidedown flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-urgent-500/20">
      <div className="text-2xl">{emojiFor(item.category)}</div>
      <div className="flex-1">
        <p className="font-semibold text-slate-800">
          {item.ingredient_name}{' '}
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              overdue ? 'bg-danger-500 text-white' : 'bg-urgent-500 text-white'
            }`}
          >
            {dday(item.days_left)}
          </span>
        </p>
        <p className="text-xs text-slate-400">
          {overdue ? '유통기한이 지났어요.' : '곧 유통기한이에요.'} 아직 있나요?
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onConfirm(item, true)}
          className="rounded-xl bg-brand-100 px-3 py-1.5 text-xs font-bold text-brand-700 active:scale-95"
        >
          있어요
        </button>
        <button
          onClick={() => onConfirm(item, false)}
          className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 active:scale-95"
        >
          다 썼어요
        </button>
      </div>
    </div>
  )
}

function ItemCard({ item }) {
  const urgent = item.is_urgent
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl bg-white p-3 shadow-sm ring-1 ${
        urgent ? 'ring-urgent-500/40' : 'ring-black/5'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl">{emojiFor(item.category)}</span>
        {item.days_left != null && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              item.days_left < 0
                ? 'bg-danger-500 text-white'
                : urgent
                  ? 'bg-urgent-500 text-white'
                  : 'bg-brand-100 text-brand-700'
            }`}
          >
            {dday(item.days_left)}
          </span>
        )}
      </div>
      <p className="truncate text-sm font-semibold text-slate-800">
        {item.ingredient_name}
      </p>
      <p className="text-xs text-slate-400">
        {qty(item.quantity)}
        {item.unit || ''}
      </p>
    </div>
  )
}

export default function HomeScreen({ refreshKey, bump }) {
  const notify = useToast()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState([])
  const [items, setItems] = useState([])
  const [report, setReport] = useState(null)

  useEffect(() => {
    let alive = true
    // Page-load expiry sweep (PLAN §6-6), then fetch state.
    const run = async () => {
      const expired = await api.autoExpire()
      if (alive && expired.length) {
        notify(`유통기한 경과 ${expired.length}건을 정리했어요`, 'warn')
      }
      const [a, inv, rep] = await Promise.all([
        api.alerts(),
        api.listInventory('active'),
        api.report(7),
      ])
      if (!alive) return
      setAlerts(a)
      setItems(inv)
      setReport(rep)
    }
    run()
      .catch((e) => alive && notify(e.message, 'error'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [refreshKey, notify])

  async function onConfirm(item, stillHave) {
    try {
      await api.confirm(item.id, stillHave)
      notify(stillHave ? `${item.ingredient_name} 유지했어요` : `${item.ingredient_name} 소비 처리`, 'success')
      bump()
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  if (loading) return <Spinner label="냉장고 살펴보는 중…" />

  return (
    <div className="space-y-5 px-4 pb-6 pt-2">
      {/* Report mini-card */}
      {report && (
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-500 p-4 text-white shadow-lg">
          <p className="text-xs font-medium opacity-80">이번 주 리포트</p>
          <div className="mt-1 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{won(report.saved)}</p>
              <p className="text-xs opacity-80">절약 · {report.consumed_count}건 소비</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{won(report.wasted)}</p>
              <p className="text-xs opacity-80">폐기 {report.wasted_count}개</p>
            </div>
          </div>
        </div>
      )}

      {/* Alert panel — "still have it?" */}
      {alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-bold text-slate-500">⚠️ 임박 알림</h2>
          {alerts.map((it) => (
            <AlertCard key={it.id} item={it} onConfirm={onConfirm} />
          ))}
        </section>
      )}

      {/* Inventory */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-500">🧊 냉장고 ({items.length})</h2>
        </div>
        {items.length === 0 ? (
          <EmptyState
            emoji="🧺"
            title="냉장고가 비었어요"
            subtitle="영수증을 찍어 재료를 채워보세요"
          />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
