// Small presentation helpers.

export function won(n) {
  if (n == null) return '₩0'
  return '₩' + Number(n).toLocaleString('ko-KR')
}

export function qty(n) {
  if (n == null) return ''
  const r = Math.round(n * 100) / 100
  return String(r)
}

// D-day badge text from days_left.
export function dday(daysLeft) {
  if (daysLeft == null) return null
  if (daysLeft < 0) return `D+${Math.abs(daysLeft)}`
  if (daysLeft === 0) return 'D-DAY'
  return `D-${daysLeft}`
}

export const CATEGORY_EMOJI = {
  채소: '🥬',
  육류: '🥩',
  해산물: '🐟',
  유제품: '🧀',
  가공: '🥫',
  곡물: '🍚',
  반찬: '🥗',
  양념: '🧂',
}

export function emojiFor(category) {
  return CATEGORY_EMOJI[category] || '🍴'
}
