import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useToast } from '../components/toast-context'
import { qty } from '../lib/format'

const EXAMPLES = [
  '라면에 계란 넣어 먹었어',
  '우유 한 잔 마셨어',
  '김치찌개 끓여서 두부 반 모 썼어',
]

function useSpeech(onText) {
  const recogRef = useRef(null)
  const [listening, setListening] = useState(false)
  const [supported] = useState(
    () => typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  )

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recog = new SR()
    recog.lang = 'ko-KR'
    recog.interimResults = true
    recog.continuous = false
    recog.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('')
      onText(text)
    }
    recog.onend = () => setListening(false)
    recog.onerror = () => setListening(false)
    recogRef.current = recog
    return () => recog.abort()
  }, [onText])

  const toggle = () => {
    const recog = recogRef.current
    if (!recog) return
    if (listening) {
      recog.stop()
      setListening(false)
    } else {
      try {
        recog.start()
        setListening(true)
      } catch {
        /* already started */
      }
    }
  }

  return { listening, supported, toggle }
}

export default function ConsumeScreen({ bump }) {
  const notify = useToast()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const photoRef = useRef(null)
  const { listening, supported, toggle } = useSpeech(setText)

  async function submitText() {
    if (!text.trim()) return
    setBusy(true)
    setResult(null)
    try {
      const res = await api.consumeText(text, 'voice')
      setResult(res)
      if (res.deltas.length) {
        notify(`${res.deltas.map((d) => d.ingredient).join(', ')} 차감했어요`, 'success')
        bump()
      } else if (res.clarification) {
        notify(res.clarification, 'info')
      }
      setText('')
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const res = await api.consumePhoto(file)
      setResult(res)
      if (res.deltas.length) {
        notify(`사진 인식: ${res.deltas.map((d) => d.ingredient).join(', ')} 차감`, 'success')
        bump()
      }
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(false)
      if (photoRef.current) photoRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5 px-4 pb-6 pt-2">
      <header className="px-1">
        <h1 className="text-xl font-bold text-slate-800">먹은 거 기록</h1>
        <p className="text-sm text-slate-400">말하듯이 적으면 알아서 재고를 줄여요.</p>
      </header>

      {/* Mic + text */}
      <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            disabled={!supported}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl shadow active:scale-95 ${
              listening ? 'animate-pulse bg-danger-500 text-white' : 'bg-brand-600 text-white'
            } disabled:opacity-40`}
            title={supported ? '음성 입력' : '이 브라우저는 음성 인식을 지원하지 않아요'}
          >
            🎙️
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={listening ? '듣고 있어요…' : '예) 라면에 계란 넣어 먹었어'}
            rows={2}
            className="flex-1 resize-none rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-brand-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setText(ex)}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 active:scale-95"
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          onClick={submitText}
          disabled={busy || !text.trim()}
          className="w-full rounded-2xl bg-brand-600 py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
        >
          기록하고 차감
        </button>
      </div>

      {/* Photo */}
      <button
        onClick={() => photoRef.current?.click()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 py-6 text-slate-500 active:scale-[0.99] disabled:opacity-60"
      >
        <span className="text-2xl">📷</span>
        <span className="text-sm font-semibold">음식 사진으로 기록</span>
      </button>
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPhoto}
      />

      {busy && (
        <p className="text-center text-sm text-slate-400">LLM이 분석하는 중…</p>
      )}

      {result && (
        <section className="space-y-2">
          {result.deltas.length > 0 ? (
            result.deltas.map((d, i) => (
              <div
                key={i}
                className="animate-pop flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
              >
                <span className="font-semibold text-slate-800">{d.ingredient}</span>
                <span
                  className={`text-sm font-bold ${d.applied ? 'text-brand-600' : 'text-slate-400'}`}
                >
                  −{qty(d.quantity)}
                  {d.unit || ''} {d.applied ? '' : '(기록만)'}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-700 ring-1 ring-amber-200">
              {result.clarification || '인식된 재료가 없어요.'}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
