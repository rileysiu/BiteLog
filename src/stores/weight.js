import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'

export const useWeightStore = defineStore('weight', () => {
  const auth = useAuthStore()
  const records = ref([])
  let unsubscribe = null

  watch(
    () => auth.user?.uid,
    (uid) => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      records.value = []
      if (!uid) return
      unsubscribe = onSnapshot(
        collection(db, 'users', uid, 'weights'),
        (snapshot) => {
          records.value = snapshot.docs
            .map((d) => d.data())
            .sort((a, b) => a.date.localeCompare(b.date))
        },
        (err) => console.error(err)
      )
    },
    { immediate: true }
  )

  const latest = computed(() => records.value.at(-1) ?? null)

  function recordOn(date) {
    return records.value.find((r) => r.date === date) ?? null
  }

  function previousBefore(date) {
    return records.value.filter((r) => r.date < date).at(-1) ?? null
  }

  async function save({ date, time, kg }) {
    if (!auth.user) throw new Error('尚未登入')
    await setDoc(doc(db, 'users', auth.user.uid, 'weights', date), {
      date,
      time,
      kg,
      updatedAt: serverTimestamp(),
    })
  }

  function remove(date) {
    if (!auth.user) return
    deleteDoc(doc(db, 'users', auth.user.uid, 'weights', date)).catch((err) => console.error(err))
  }

  return { records, latest, recordOn, previousBefore, save, remove }
})