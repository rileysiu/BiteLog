import { addDays } from './date'

export const MAIN_KEYS = ['kcal', 'carb', 'fat', 'protein']

// 加總一組記錄的卡路里和主要營養素
export function sumEntries(list) {
  const total = { kcal: 0, carb: 0, fat: 0, protein: 0 }
  for (const e of list) {
    for (const key of MAIN_KEYS) total[key] += e[key] || 0
  }
  return total
}

// 產生連續的日期，例如 dateRange('2026-09-26', 7) 會得到 9/20 ～ 9/26
export function dateRange(endKey, days) {
  return Array.from({ length: days }, (_, i) => addDays(endKey, i - (days - 1)))
}

// 把記錄依照日期分組，算出每一天的總量
export function dailyTotals(entries, dates) {
  const byDate = new Map()
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, [])
    byDate.get(e.date).push(e)
  }
  return dates.map((date) => {
    const list = byDate.get(date) ?? []
    return { date, logged: list.length > 0, ...sumEntries(list) }
  })
}

// 只用有記錄的天數算平均
export function averageOfLogged(days, key) {
  const logged = days.filter((d) => d.logged)
  if (logged.length === 0) return 0
  return logged.reduce((s, d) => s + d[key], 0) / logged.length
}

// 加總一組記錄的所有營養素（舊記錄如果沒有 nutrients，就用主要欄位補上）
export function sumNutrients(list) {
  const total = {}
  for (const e of list) {
    const n = e.nutrients ?? {}
    for (const [key, v] of Object.entries(n)) total[key] = (total[key] || 0) + v
    for (const key of MAIN_KEYS) {
      if (n[key] === undefined) total[key] = (total[key] || 0) + (e[key] || 0)
    }
  }
  return total
}

// 把同一種食品歸在一起，算出吃了幾次、總共多少
export function aggregateFoods(list) {
  const groups = new Map()
  for (const e of list) {
    const key = e.foodId || e.name
    const g = groups.get(key) ?? { name: e.name, times: 0, kcal: 0, carb: 0, fat: 0, protein: 0 }
    g.times++
    for (const k of MAIN_KEYS) g[k] += e[k] || 0
    groups.set(key, g)
  }
  return [...groups.values()]
}