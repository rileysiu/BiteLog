import { todayKey, addDays, weekStart } from './date'

export const PERIODS = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'week', label: '本週' },
  { key: 'lastweek', label: '上週' },
]

export function isDayPeriod(key) {
  return key === 'today' || key === 'yesterday'
}

// 回傳這個期間包含的所有日期
export function periodDates(key) {
  const today = todayKey()
  if (key === 'today') return [today]
  if (key === 'yesterday') return [addDays(today, -1)]
  const start = key === 'week' ? weekStart(today) : addDays(weekStart(today), -7)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function periodWord(key) {
  return { today: '今天', yesterday: '昨天', week: '本週', lastweek: '上週' }[key] ?? ''
}