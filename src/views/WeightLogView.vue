<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWeightStore } from '../stores/weight'
import { useAuthStore } from '../stores/auth'
import { todayKey, fromKey } from '../utils/date'

const route = useRoute()
const router = useRouter()
const weight = useWeightStore()
const auth = useAuthStore()

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')

// 從歷史記錄點進來時，網址會帶著日期，例如 /weight?date=2026-09-20
const date = ref(route.query.date || todayKey())
const initial = weight.recordOn(date.value) ?? weight.latest
const time = ref(weight.recordOn(date.value)?.time ?? `${pad(now.getHours())}:${pad(now.getMinutes())}`)
const kg = ref(initial ? String(initial.kg) : '')
const saving = ref(false)
const error = ref('')

const shortDate = (key) => {
  const d = fromKey(key)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const value = computed(() => parseFloat(kg.value))
const previous = computed(() => weight.previousBefore(date.value))
const existing = computed(() => weight.recordOn(date.value))

const diffText = computed(() => {
  if (!previous.value || !Number.isFinite(value.value)) return ''
  const d = Math.round((value.value - previous.value.kg) * 10) / 10
  if (d < 0) return `比上次少 ${Math.abs(d).toFixed(1)} 公斤`
  if (d > 0) return `比上次多 ${d.toFixed(1)} 公斤`
  return '與上次相同'
})

const canSave = computed(() => auth.isLoggedIn && value.value > 0 && value.value < 500 && date.value && !saving.value)

async function save() {
  if (!canSave.value) return
  saving.value = true
  error.value = ''
  try {
    await weight.save({ date: date.value, time: time.value, kg: Math.round(value.value * 10) / 10 })
    router.back()
  } catch (err) {
    console.error(err)
    error.value = '儲存失敗，請再試一次'
  } finally {
    saving.value = false
  }
}

const confirmDelete = ref(false)
function onDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  weight.remove(date.value)
  router.back()
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="router.back()" aria-label="關閉">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <h1 class="page-title">記錄體重</h1>
    <div class="spacer"></div>
  </div>

  <section class="card center">
    <label for="kg" class="field-label">體重</label>
    <div class="kg-row">
      <input id="kg" v-model="kg" type="number" step="0.1" inputmode="decimal" class="num kg-input" placeholder="0.0" />
      <span class="kg-unit">公斤</span>
    </div>
    <p v-if="previous" class="muted">上次記錄：{{ shortDate(previous.date) }}　{{ previous.kg }} 公斤</p>
    <p v-if="diffText" class="diff">{{ diffText }}</p>
  </section>

  <section class="card">
    <div class="dt">
      <div>
        <label for="wdate" class="field-label">日期</label>
        <input id="wdate" v-model="date" type="date" class="field" />
      </div>
      <div>
        <label for="wtime" class="field-label">時間</label>
        <input id="wtime" v-model="time" type="time" class="field" />
      </div>
    </div>
    <p v-if="existing" class="muted">
      {{ shortDate(existing.date) }} 已經記錄過 {{ existing.kg }} 公斤，儲存後會以這次為準。
    </p>
  </section>

  <p v-if="!auth.isLoggedIn" class="notice">請先到「更多」頁登入，才能記錄體重。</p>
  <p v-if="error" class="notice error">{{ error }}</p>

  <div class="bottom">
    <button v-if="existing" class="delete-btn" @click="onDelete">{{ confirmDelete ? '確定刪除？' : '刪除' }}</button>
    <button class="save-btn" :disabled="!canSave" @click="save">{{ saving ? '儲存中…' : '儲存' }}</button>
  </div>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 18px; font-weight: 900; margin: 0; }
.spacer { width: 44px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 20px 22px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
.center { align-items: center; padding: 26px 22px; }
.field-label { font-size: 14px; font-weight: 900; display: block; margin-bottom: 6px; }
.kg-row { display: flex; align-items: baseline; gap: 8px; }
.kg-input { width: 170px; height: 72px; border: 0; border-radius: 20px; background: var(--soft); padding: 0 16px; text-align: center; font-size: 40px; font-weight: 900; color: var(--ink); }
.kg-unit { font-size: 16px; font-weight: 700; white-space: nowrap; }
.muted { margin: 0; font-size: 13px; color: var(--muted); }
.diff { margin: 0; font-size: 13px; font-weight: 700; color: var(--text-accent); }
.dt { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.field { width: 100%; height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 12px; font-size: 15px; color: var(--ink); font-family: inherit; }
.notice { font-size: 13px; color: var(--muted); margin: 0 6px 12px; }
.notice.error { color: #B42318; }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); display: flex; gap: 10px; }
.save-btn { flex: 1; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 900; }
.save-btn:disabled { background: #C9CEDA; color: var(--muted); }
.delete-btn { height: 56px; padding: 0 22px; border: 1.5px solid #F3B8AE; border-radius: 28px; background: #FFFFFF; color: #B42318; font-size: 15px; font-weight: 700; }
</style>