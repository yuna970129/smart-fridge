import { createContext, useContext } from 'react'

// Kept separate from the provider component so the Toast module only exports
// components (satisfies react-refresh/only-export-components).
export const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}
