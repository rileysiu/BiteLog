import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import { normalize } from './foods'

// 把食譜轉成和食品一樣的格式
function toFood(id, r) {
  const ingredients = r.ingredients || []
  const totalGrams = ingredients.reduce((s, i) => s + (i.grams || 0), 0) || 1
  const totals = {}
  for (const i of ingredients) {
    for (const [key, v] of Object.entries(i.nutrients || {})) totals[key] = (totals[key] || 0) + v
  }
  const n = {}
  for (const [key, v] of Object.entries(totals)) n[key] = Math.round((v / totalGrams) * 100 * 100) / 100
  const servings = r.servings > 0 ? r.servings : 1
  const servingGrams = Math.round((totalGrams / servings) * 10) / 10
  return {
    id,
    source: 'recipe',
    name: r.name,
    alias: '',
    desc: `食譜 · 可分成 ${servings} 份${r.cookMinutes ? ` · ${r.cookMinutes} 分鐘` : ''}`,
    baseLabel: '克',
    unitGrams: servingGrams,
    units: [{ key: 'serving', label: '份', grams: servingGrams }],
    n,
    raw: r,
    _name: normalize(r.name),
    _alias: '',
  }
}

export const useRecipesStore = defineStore('recipes', () => {
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
        collection(db, 'users', uid, 'recipes'),
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
    return list.value.find((r) => r.id === id)
  }

  function search(query) {
    const q = normalize(query)
    if (!q) return []
    return list.value.filter((r) => r._name.includes(q))
  }

  // 編輯中的草稿：離開頁面去挑食材時，草稿還會留著
  const draft = ref(null)

  function startDraft(forId) {
    if (draft.value?.forId === forId) return
    const r = forId === 'new' ? null : getById(forId)?.raw
    draft.value = {
      forId,
      name: r?.name ?? '',
      servings: r?.servings ?? 1,
      cookMinutes: r?.cookMinutes ?? '',
      ingredients: r ? r.ingredients.map((i) => ({ ...i })) : [],
    }
  }

  function clearDraft() {
    draft.value = null
  }

  function addDraftIngredient(item) {
    draft.value?.ingredients.push(item)
  }

  async function addRecipe(data) {
    if (!auth.user) throw new Error('尚未登入')
    const docRef = await addDoc(collection(db, 'users', auth.user.uid, 'recipes'), { ...data, createdAt: serverTimestamp() })
    return docRef.id
  }

  function updateRecipe(id, data) {
    if (!auth.user) return
    updateDoc(doc(db, 'users', auth.user.uid, 'recipes', id), { ...data, updatedAt: serverTimestamp() }).catch((err) =>
      console.error(err)
    )
  }

  function deleteRecipe(id) {
    if (!auth.user) return
    deleteDoc(doc(db, 'users', auth.user.uid, 'recipes', id)).catch((err) => console.error(err))
  }

  return { list, status, getById, search, draft, startDraft, clearDraft, addDraftIngredient, addRecipe, updateRecipe, deleteRecipe }
})