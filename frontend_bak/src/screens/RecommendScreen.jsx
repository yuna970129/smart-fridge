import { useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../components/toast-context'
import { Spinner, EmptyState } from '../components/Spinner'

function RecipeCard({ match, onMade, busy }) {
  const r = match.recipe
  const pct = Math.round(match.completeness * 100)
  return (
    <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">{r.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                r.origin === 'seed' ? 'bg-slate-100 text-slate-500' : 'bg-violet-100 text-violet-600'
              }`}
            >
              {r.origin === 'seed' ? '큐레이션' : 'AI생성'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {r.cuisine} · {r.cook_minutes ?? '?'}분
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-brand-600">{pct}%</p>
          <p className="text-[10px] text-slate-400">재료 보유</p>
        </div>
      </div>

      {match.uses_urgent.length > 0 && (
        <div className="rounded-xl bg-urgent-500/10 px-3 py-1.5 text-xs font-semibold text-urgent-600">
          🔥 임박 재료 활용: {match.uses_urgent.join(', ')}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {match.have.map((h) => (
          <span
            key={h}
            className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200"
          >
            ✓ {h}
          </span>
        ))}
        {match.missing.map((m) => (
          <span
            key={m}
            className="rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-200"
          >
            + {m}
          </span>
        ))}
      </div>

      <button
        onClick={() => onMade(r)}
        disabled={busy}
        className="w-full rounded-2xl bg-brand-600 py-2.5 text-sm font-bold text-white shadow active:scale-[0.98] disabled:opacity-50"
      >
        🍳 만들었어요 (재료 자동 차감)
      </button>
    </div>
  )
}

export default function RecommendScreen({ refreshKey, bump }) {
  const notify = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [madeBusy, setMadeBusy] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .recommend(6)
      .then((d) => alive && setData(d))
      .catch((e) => alive && notify(e.message, 'error'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [refreshKey, notify])

  async function onMade(recipe) {
    setMadeBusy(true)
    try {
      const res = await api.markMade(recipe)
      const applied = res.deltas.filter((d) => d.applied)
      notify(
        `${recipe.name} 완료! ${applied.map((d) => d.ingredient).join(', ')} 차감`,
        'success',
      )
      bump() // re-triggers the effect above (refreshKey dep) to refetch
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setMadeBusy(false)
    }
  }

  if (loading) return <Spinner label="레시피 고르는 중…" />
  if (!data || data.matches.length === 0)
    return (
      <EmptyState
        emoji="🍳"
        title="추천할 레시피가 없어요"
        subtitle="재료를 더 담으면 추천이 생겨요"
      />
    )

  return (
    <div className="space-y-4 px-4 pb-6 pt-2">
      <header className="px-1">
        <h1 className="text-xl font-bold text-slate-800">오늘 뭐 먹지?</h1>
        {data.urgent_ingredients.length > 0 ? (
          <p className="text-sm text-urgent-600">
            🔥 {data.urgent_ingredients.join(', ')} 부터 쓰는 레시피예요
          </p>
        ) : (
          <p className="text-sm text-slate-400">냉장고 재료로 만들 수 있는 한식</p>
        )}
      </header>

      {data.matches.map((m, i) => (
        <RecipeCard key={`${m.recipe.name}-${i}`} match={m} onMade={onMade} busy={madeBusy} />
      ))}

      {data.shopping_list.length > 0 && (
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-2 text-sm font-bold text-slate-500">🛒 다음에 장 볼 것</h2>
          <div className="flex flex-wrap gap-1.5">
            {data.shopping_list.map((s) => (
              <span
                key={s.name}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
