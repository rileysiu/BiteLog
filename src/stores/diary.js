import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import { todayKey } from '../utils/date'

export const useDiaryStore = defineStore('diary', () => {
  const auth = useAuthStore()

  const goals = ref({ kcal: 1904, carb: 219, fat: 63, protein: 114 })
  const entries = ref([])
  const selectedDate = ref(todayKey())
  const status = ref('idle')
  const saveError = ref('')

  let unsubscribe = null

  function stopListening() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  function listen(uid) {
    stopListening()
    if (!uid) {
      entries.value = []
      status.value = 'idle'
      return
    }
    status.value = 'loading'
    const ref = collection(db, 'users', uid, 'entries')
    unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        entries.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        status.value = 'ready'
      },
      (err) => {
        console.error(err)
        status.value = 'error'
      }
    )
  }

  // 登入的人一改變（登入、登出、換帳號），就重新讀取那個人的資料
  watch(() => auth.user?.uid, (uid) => listen(uid), { immediate: true })

  const loggedDates = computed(() => [...new Set(entries.value.map((e) => e.date))])

  function addEntry(entry) {
    if (!auth.user) return
    saveError.value = ''
    const ref = collection(db, 'users', auth.user.uid, 'entries')
    addDoc(ref, { ...entry, createdAt: serverTimestamp() }).catch((err) => {
      console.error(err)
      saveError.value = '儲存失敗，請檢查網路後再試一次'
    })
  }

  return { goals, entries, selectedDate, status, saveError, loggedDates, addEntry }
})