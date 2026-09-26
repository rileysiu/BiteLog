import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import { todayKey } from '../utils/date'

const DEFAULT_GOALS = { kcal: 1904, carbPct: 46, fatPct: 30, proteinPct: 24, weightGoal: null }

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

  // 從百分比算出克數，給「今天」頁的儀表板使用
  const goals = computed(() => {
    const g = goalSettings.value
    return {
      kcal: g.kcal,
      carb: Math.round((g.kcal * g.carbPct) / 100 / 4),
      fat: Math.round((g.kcal * g.fatPct) / 100 / 9),
      protein: Math.round((g.kcal * g.proteinPct) / 100 / 4),
    }
  })

  const loggedDates = computed(() => [...new Set(entries.value.map((e) => e.date))])

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

  async function saveGoals(data) {
    if (!auth.user) throw new Error('尚未登入')
    await setDoc(doc(db, 'users', auth.user.uid, 'settings', 'goals'), data, { merge: true })
  }

  return { goalSettings, goals, entries, selectedDate, status, saveError, loggedDates, addEntry, updateEntry, deleteEntry, saveGoals }
})