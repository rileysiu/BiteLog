import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)
  const error = ref('')
  let started = false

  function init() {
    if (started) return
    started = true
    onAuthStateChanged(auth, (u) => {
      user.value = u
        ? { uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL }
        : null
      ready.value = true
    })
  }

  async function login() {
    error.value = ''
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      console.error(e)
      const cancelled = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']
      if (!cancelled.includes(e.code)) error.value = '登入失敗，請再試一次'
    }
  }

  async function logout() {
    await signOut(auth)
  }

  const isLoggedIn = computed(() => !!user.value)

  return { user, ready, error, isLoggedIn, init, login, logout }
})