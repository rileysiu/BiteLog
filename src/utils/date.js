const pad = (n) => String(n).padStart(2, '0')

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toKey(new Date())
}

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export function diffDays(a, b) {
  return Math.round((fromKey(a) - fromKey(b)) / 86400000)
}

export function weekStart(key) {
  return addDays(key, -fromKey(key).getDay())
}

export function titleFor(key) {
  const diff = diffDays(key, todayKey())
  if (diff === 0) return '今天'
  if (diff === -1) return '昨天'
  if (diff === 1) return '明天'
  const d = fromKey(key)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return `${sameYear ? '' : d.getFullYear() + '年'}${d.getMonth() + 1}月${d.getDate()}日`
}