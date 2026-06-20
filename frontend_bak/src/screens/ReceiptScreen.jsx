import { useRef, useState } from 'react'
import { api } from '../api'
import { useToast } from '../components/toast-context'
import { Spinner } from '../components/Spinner'
import { emojiFor, qty } from '../lib/format'

export default function ReceiptScreen({ bump }) {
  const notify = useToast()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  async function onPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const data = await api.uploadReceipt(file)
      setResult(data)
      notify(`${data.added_items.length}개 재료를 재고에 담았어요`, 'success')
      bump()
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5 px-4 pb-6 pt-2">
      <header className="px-1">
        <h1 className="text-xl font-bold text-slate-800">영수증 스캔</h1>
        <p className="text-sm text-slate-400">사진 한 장이면 재고가 자동으로 채워져요.</p>
      </header>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-brand-300 bg-brand-50 py-10 text-brand-700 active:scale-[0.99] disabled:opacity-60"
      >
        <span className="text-4xl">🧾</span>
        <span className="font-bold">영수증 사진 올리기</span>
        <span className="text-xs text-brand-600/70">탭하여 카메라 또는 갤러리 선택</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />

      {busy && <Spinner label="LLM이 영수증을 읽는 중…" />}

      {result && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-500">
              {result.store ? `🏪 ${result.store}` : '인식 결과'}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              parser: {result.parser}
            </span>
          </div>

          <div className="space-y-2">
            {result.added_items.map((it) => (
              <div
                key={it.id}
                className="animate-pop flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
              >
                <span className="text-2xl">{emojiFor(it.category)}</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{it.ingredient_name}</p>
                  <p className="text-xs text-slate-400">
                    {qty(it.quantity)}
                    {it.unit || ''} · ~{it.expires_at} 까지
                  </p>
                </div>
                <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700">
                  +담음
                </span>
              </div>
            ))}
          </div>

          {result.items?.length > result.added_items.length && (
            <p className="px-1 text-xs text-slate-400">
              인식된 {result.items.length}줄 중 식자재 {result.added_items.length}개를 담았어요.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
