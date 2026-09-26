import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from './auth'
import { THEMES, DEFAULT_THEME } from '../utils/themes'

const STORAGE_KEY = 'food-diary-theme'

// 把主題的顏色，寫進整個網頁的顏色變數
function applyTheme(key) {
  const t = THEMES[key] ?? THEMES[DEFAULT_THEME]
  const root = document.documentElement.style
  root.setProperty('--primary', t.primary)
  root.setProperty('--on-primary', t.onPrimary)
  root.setProperty('--text-accent', t.textAccent)
  root.setProperty('--soft', t.soft)
  root.setProperty('--bg', t.bg)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg)
}

function readSaved() {
  try {
    const key = localStorage.getItem(STORAGE_KEY)
    return THEMES[key] ? key : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export const useThemeStore = defineStore('theme', () => {
  const auth = useAuthStore()
  const current = ref(readSaved())
  applyTheme(current.value)

  function setLocal(key) {
    current.value = key
    applyTheme(key)
    try {
      localStorage.setItem(STORAGE_KEY, key)
    } catch {
      // 瀏覽器不允許儲存時，就只在這次使用
    }
  }

  // 登入後，讀取雲端上的主題（例如在別的裝置選過）
  let unsubscribe = null
  watch(
    () => auth.user?.uid,
    (uid) => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      if (!uid) return
      unsubscribe = onSnapshot(
        doc(db, 'users', uid, 'settings', 'preferences'),
        (snap) => {
          const key = snap.data()?.theme
          if (key && THEMES[key] && key !== current.value) setLocal(key)
        },
        (err) => console.error(err)
      )
    },
    { immediate: true }
  )

  function choose(key) {
    if (!THEMES[key]) return
    setLocal(key)
    if (auth.user) {
      setDoc(doc(db, 'users', auth.user.uid, 'settings', 'preferences'), { theme: key }, { merge: true }).catch((err) =>
        console.error(err)
      )
    }
  }

  return { current, choose }
})