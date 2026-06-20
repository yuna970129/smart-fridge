// Thin fetch wrapper around the FastAPI backend. In dev, Vite proxies these
// same-origin paths to http://127.0.0.1:8000 (see vite.config.js).

const BASE = '/api'

async function handle(res) {
  if (!res.ok) {
    let detail
    try {
      detail = (await res.json()).detail
    } catch {
      detail = res.statusText
    }
    throw new Error(detail || `요청 실패 (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Inventory
  listInventory: (status = 'active') =>
    fetch(`${BASE}/inventory?status=${status}`).then(handle),
  addItem: (payload) =>
    fetch(`${BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  updateItem: (id, payload) =>
    fetch(`${BASE}/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  discardItem: (id) =>
    fetch(`${BASE}/inventory/${id}`, { method: 'DELETE' }).then(handle),

  // Receipts
  uploadReceipt: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`${BASE}/receipts/upload`, { method: 'POST', body: fd }).then(handle)
  },

  // Recipes
  recommend: (k = 6) => fetch(`${BASE}/recipes/recommend?k=${k}`).then(handle),
  markMade: (recipe) =>
    fetch(`${BASE}/recipes/made`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    }).then(handle),

  // Consumption
  consumeText: (text, source = 'voice') =>
    fetch(`${BASE}/consumption/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source }),
    }).then(handle),
  consumePhoto: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`${BASE}/consumption/photo`, { method: 'POST', body: fd }).then(handle)
  },

  // Expiry
  alerts: () => fetch(`${BASE}/expiry/alerts`).then(handle),
  confirm: (id, stillHave) =>
    fetch(`${BASE}/expiry/confirm/${id}?still_have=${stillHave}`, {
      method: 'POST',
    }).then(handle),
  autoExpire: () => fetch(`${BASE}/expiry/auto-expire`, { method: 'POST' }).then(handle),

  // Reports
  report: (days = 7) =>
    fetch(`${BASE}/reports/waste-saving?period_days=${days}`).then(handle),

  health: () => fetch('/health').then(handle),
}
