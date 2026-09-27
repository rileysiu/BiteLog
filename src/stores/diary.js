import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import { todayKey, fromKey } from '../utils/date'

const DEFAULT_GOALS = {
  kcal: 1904,
  carbPct: 46,
  fatPct: 30,
  proteinPct: 24,
  weightGoal: null,
  weekly: { enabled: false, kcal: [null, null, null, null, null, null, null] },
}

export const useDiaryStore = defineStore('diary', () => {
  const auth = useAuthStore()

  const goalSettings = ref({ ...DEFAULT_GOALS })
  const entries = ref([])
  const selectedDate = ref(todayKey())
  const status = ref('idle')
  const saveError = ref('')

  let unsubscribers = []

  function stopListening() {
    unsubscribers.forEach((stop) => stop())
    unsubscribers = []
  }

  function listen(uid) {
    stopListening()
    if (!uid) {
      entries.value = []
      goalSettings.value = { ...DEFAULT_GOALS }
      status.value = 'idle'
      return
    }
    status.value = 'loading'

    unsubscribers.push(
      onSnapshot(
        collection(db, 'users', uid, 'entries'),
        (snapshot) => {
          entries.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          status.value = 'ready'
        },
        (err) => {
          console.error(err)
          status.value = 'error'
        }
      )
    )

    unsubscribers.push(
      onSnapshot(
        doc(db, 'users', uid, 'settings', 'goals'),
        (snap) => {
          goalSettings.value = { ...DEFAULT_GOALS, ...(snap.exists() ? snap.data() : {}) }
        },
        (err) => console.error(err)
      )
    )
  }

  watch(() => auth.user?.uid, (uid) => listen(uid), { immediate: true })

  // 用卡路里和比例，算出主要營養素的克數
  function macroGoals(kcal) {
    const g = goalSettings.value
    return {
      kcal,
      carb: Math.round((kcal * g.carbPct) / 100 / 4),
      fat: Math.round((kcal * g.fatPct) / 100 / 9),
      protein: Math.round((kcal * g.proteinPct) / 100 / 4),
    }
  }

  // 某一天的目標：有開啟每週不同目標、而且那天有填，就用那天的
  function goalsFor(dateKey) {
    const g = goalSettings.value
    let kcal = g.kcal
    if (g.weekly?.enabled) {
      const v = g.weekly.kcal?.[fromKey(dateKey).getDay()]
      if (v > 0) kcal = v
    }
    return macroGoals(kcal)
  }

  // 一段期間的平均目標，給進展頁的一週統計使用
  function averageGoals(dates) {
    const list = dates.map(goalsFor)
    const avg = (key) => Math.round(list.reduce((s, x) => s + x[key], 0) / list.length)
    return { kcal: avg('kcal'), carb: avg('carb'), fat: avg('fat'), protein: avg('protein') }
  }

  // 今天的目標（概覽頁等地方使用）
  const goals = computed(() => goalsFor(todayKey()))

  const loggedDates = computed(() => [...new Set(entries.value.map((e) => e.date))])

  // 每種食品被加入日記幾次，用來排序搜尋結果
  const pickCounts = computed(() => {
    const map = new Map()
    for (const e of entries.value) {
      if (e.foodId) map.set(e.foodId, (map.get(e.foodId) ?? 0) + 1)
    }
    return map
  })

  function addEntry(entry) {
    if (!auth.user) return
    saveError.value = ''
    addDoc(collection(db, 'users', auth.user.uid, 'entries'), { ...entry, createdAt: serverTimestamp() }).catch((err) => {
      console.error(err)
      saveError.value = '儲存失敗，請檢查網路後再試一次'
    })
  }

    function updateEntry(id, data) {
    if (!auth.user) return
    saveError.value = ''
    updateDoc(doc(db, 'users', auth.user.uid, 'entries', id), { ...data, updatedAt: serverTimestamp() }).catch((err) => {
      console.error(err)
      saveError.value = '修改失敗，請檢查網路後再試一次'
    })
  }

  function deleteEntry(id) {
    if (!auth.user) return
    saveError.value = ''
    deleteDoc(doc(db, 'users', auth.user.uid, 'entries', id)).catch((err) => {
      console.error(err)
      saveError.value = '刪除失敗，請檢查網路後再試一次'
    })
  }

  function copyEntries(list, { date, meal, time }) {
    if (!auth.user || list.length === 0) return
    saveError.value = ''
    const col = collection(db, 'users', auth.user.uid, 'entries')
    const batch = writeBatch(db)
    for (const e of list) {
      const { id, createdAt, updatedAt, ...rest } = e
      batch.set(doc(col), { ...rest, date, meal, time: time ?? rest.time, createdAt: serverTimestamp() })
    }
    batch.commit().catch((err) => {
      console.error(err)
      saveError.value = '加入失敗，請檢查網路後再試一次'
    })
  }

  async function saveGoals(data) {
    if (!auth.user) throw new Error('尚未登入')
    await setDoc(doc(db, 'users', auth.user.uid, 'settings', 'goals'), data, { merge: true })
  }

  return { goalSettings, goals, goalsFor, averageGoals, entries, selectedDate, status, saveError, loggedDates, pickCounts, addEntry, updateEntry, deleteEntry, copyEntries, saveGoals }
})