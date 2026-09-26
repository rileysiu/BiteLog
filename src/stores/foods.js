import { defineStore } from 'pinia'
import { ref } from 'vue'

// 常見異體字：左邊的字會被當成右邊的字來搜尋
const VARIANTS = [
  ['臺', '台'],
  ['土司', '吐司'],
  ['麪', '麵'],
]

export function normalize(text) {
  let t = (text || '').toLowerCase().replace(/\s+/g, '')
  for (const [from, to] of VARIANTS) t = t.split(from).join(to)
  return t
}

export const useFoodsStore = defineStore('foods', () => {
  const list = ref([])
  const nutrients = ref({})
  const status = ref('idle')

  async function load() {
    if (status.value === 'loaded' || status.value === 'loading') return
    status.value = 'loading'
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'foods.json')
      const data = await res.json()
      nutrients.value = data.nutrients
      list.value = data.foods.map((f) => ({
        ...f,
        _name: normalize(f.name),
        _alias: normalize(f.alias),
      }))
      status.value = 'loaded'
    } catch (err) {
      console.error(err)
      status.value = 'error'
    }
  }

  function search(query, limit = 50) {
    const q = normalize(query)
    if (!q) return []
    const matched = []
    for (const f of list.value) {
      let score = -1
      if (f._name.startsWith(q)) score = 0
      else if (f._name.includes(q)) score = 1
      else if (f._alias.includes(q)) score = 2
      if (score >= 0) matched.push({ f, score })
    }
    matched.sort((a, b) => a.score - b.score || a.f.name.length - b.f.name.length)
    return matched.slice(0, limit).map((m) => m.f)
  }

  function getById(id) {
    return list.value.find((f) => f.id === id)
  }

  return { list, nutrients, status, load, search, getById }
})