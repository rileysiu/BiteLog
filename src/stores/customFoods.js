import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import { normalize } from './foods'

// 把你填的資料，轉成和食藥署食品一樣的格式（營養素都換算成每 100 克）
function toFood(id, d) {
  const serving = d.servingSize > 0 ? d.servingSize : 100
  const factor = d.per === 'serving' ? 100 / serving : 1
  const n = {}
  for (const [key, v] of Object.entries(d.values || {})) {
    if (typeof v === 'number') n[key] = Math.round(v * factor * 100) / 100
  }
  const baseLabel = d.baseUnit === 'ml' ? '毫升' : '克'
  const units = [
    { key: 'serving', label: '份', grams: serving },
    ...(d.units || [])
      .filter((u) => u.name && u.amount > 0)
      .map((u, i) => ({ key: 'c' + i, label: u.name, grams: u.amount })),
  ]
  return {
    id,
    source: 'custom',
    name: d.name,
    brand: d.brand || '',
    alias: d.brand || '',
    desc: d.brand ? `品牌：${d.brand}` : '自訂食品',
    baseUnit: d.baseUnit,
    baseLabel,
    unitGrams: serving,
    units,
    n,
    raw: d,
    _name: normalize(d.name),
    _alias: normalize(d.brand || ''),
  }
}

export const useCustomFoodsStore = defineStore('customFoods', () => {
  const auth = useAuthStore()
  const list = ref([])
  const status = ref('idle')
  let unsubscribe = null

  watch(
    () => auth.user?.uid,
    (uid) => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      list.value = []
      status.value = 'idle'
      if (!uid) return
      status.value = 'loading'
      unsubscribe = onSnapshot(
        collection(db, 'users', uid, 'customFoods'),
        (snapshot) => {
          list.value = snapshot.docs
            .map((d) => toFood(d.id, d.data()))
            .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
          status.value = 'ready'
        },
        (err) => {
          console.error(err)
          status.value = 'error'
        }
      )
    },
    { immediate: true }
  )

  function getById(id) {
    return list.value.find((f) => f.id === id)
  }

  function search(query) {
    const q = normalize(query)
    if (!q) return []
    return list.value.filter((f) => f._name.includes(q) || f._alias.includes(q))
  }

  async function addFood(data) {
    if (!auth.user) throw new Error('尚未登入')
    const docRef = await addDoc(collection(db, 'users', auth.user.uid, 'customFoods'), {
      ...data,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  function updateFood(id, data) {
    if (!auth.user) return
    updateDoc(doc(db, 'users', auth.user.uid, 'customFoods', id), { ...data, updatedAt: serverTimestamp() }).catch((err) =>
      console.error(err)
    )
  }

  function deleteFood(id) {
    if (!auth.user) return
    deleteDoc(doc(db, 'users', auth.user.uid, 'customFoods', id)).catch((err) => console.error(err))
  }

  return { list, status, getById, search, addFood, updateFood, deleteFood }
})