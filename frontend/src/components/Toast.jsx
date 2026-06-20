import { useCallback, useState } from 'react'
import { ToastContext } from './toast-context'

const STYLES = {
  success: 'bg-brand-600 text-white',
  info: 'bg-slate-800 text-white',
  warn: 'bg-urgent-600 text-white',
  error: 'bg-danger-500 text-white',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 2600)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slidedown pointer-events-auto w-full max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${STYLES[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
