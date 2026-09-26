import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'

export const useProfileStore = defineStore('profile', () => {
  const auth = useAuthStore()
  const profile = ref(null)
  const status = ref('idle')
  let unsubscribe = null

  watch(
    () => auth.user?.uid,
    (uid) => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      profile.value = null
      status.value = 'idle'
      if (!uid) return
      status.value = 'loading'
      unsubscribe = onSnapshot(
        doc(db, 'users', uid, 'settings', 'profile'),
        (snap) => {
          profile.value = snap.exists() ? snap.data() : null
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

  async function save(data) {
    if (!auth.user) throw new Error('尚未登入')
    await setDoc(doc(db, 'users', auth.user.uid, 'settings', 'profile'), data, { merge: true })
  }

  return { profile, status, save }
})