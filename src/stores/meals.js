import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'

export const useMealsStore = defineStore('meals', () => {
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
        collection(db, 'users', uid, 'meals'),
        (snapshot) => {
          list.value = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
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
    return list.value.find((m) => m.id === id)
  }

  async function saveMeal(name, entries) {
    if (!auth.user) throw new Error('尚未登入')
    const items = entries.map(({ id, createdAt, updatedAt, date, meal, time, ...rest }) => rest)
    const docRef = await addDoc(collection(db, 'users', auth.user.uid, 'meals'), {
      name,
      items,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  function renameMeal(id, name) {
    if (!auth.user) return
    updateDoc(doc(db, 'users', auth.user.uid, 'meals', id), { name, updatedAt: serverTimestamp() }).catch((err) =>
      console.error(err)
    )
  }

  function deleteMeal(id) {
    if (!auth.user) return
    deleteDoc(doc(db, 'users', auth.user.uid, 'meals', id)).catch((err) => console.error(err))
  }

  function addItem(id, item) {
    const m = getById(id)
    if (!auth.user || !m) return
    updateDoc(doc(db, 'users', auth.user.uid, 'meals', id), {
      items: [...m.items, item],
      updatedAt: serverTimestamp(),
    }).catch((err) => console.error(err))
  }

  return { list, status, getById, saveMeal, renameMeal, deleteMeal, addItem }
})