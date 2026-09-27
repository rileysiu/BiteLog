<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiaryStore } from '../stores/diary'
import { useAuthStore } from '../stores/auth'
import { MEALS, suggestMeal, mealName } from '../utils/meal'
import { titleFor } from '../utils/date'

const route = useRoute()
const router = useRouter()
const diary = useDiaryStore()
const auth = useAuthStore()

const isEdit = computed(() => route.name === 'editQuick')
const entry = computed(() => (isEdit.value ? diary.entries.find((e) => e.id === route.params.id) : null))

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')

const form = reactive({
  meal: route.query.meal || suggestMeal(now),
  kcal: '',
  carb: '',
  fat: '',
  protein: '',
  time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  note: '',
})
const date = ref(diary.selectedDate)

// 編輯模式：填入原本的內容
const initialized = ref(false)
watch(
  entry,
  (e) => {
    if (initialized.value || !e) return
    form.meal = e.meal
    form.kcal = String(e.kcal)
    for (const k of ['carb', 'fat', 'protein']) form[k] = e[k] === null || e[k] === undefined ? '' : String(e[k])
    form.time = e.time
    form.note = e.note ?? ''
    date.value = e.date
    initialized.value = true
  },
  { immediate: true }
)

const MACROS = [
  { key: 'carb', label: '碳水', color: 'var(--carb)' },
  { key: 'fat', label: '脂肪', color: 'var(--fat)' },
  { key: 'protein', label: '蛋白', color: 'var(--protein)' },
]

const toNum = (v) => (v === '' || v === null || !Number.isFinite(Number(v)) ? null : Number(v))
const kcal = computed(() => Number(form.kcal))
const canSave = computed(() => auth.isLoggedIn && kcal.value > 0 && !!form.time)

const previewName = computed(() => form.note.trim() || '快速加入')
const previewMacro = computed(() => {
  const parts = MACROS.filter((m) => toNum(form[m.key]) !== null).map((m) => `${m.label} ${form[m.key]}g`)
  return parts.length ? parts.join(' · ') : '沒有填主要營養素'
})

function buildEntry() {
  const values = { carb: toNum(form.carb), fat: toNum(form.fat), protein: toNum(form.protein) }
  const nutrients = { kcal: Math.round(kcal.value) }
  for (const k of ['carb', 'fat', 'protein']) if (values[k] !== null) nutrients[k] = values[k]
  const note = form.note.trim()
  return {
    date: date.value,
    meal: form.meal,
    time: form.time,
    name: note || '快速加入',
    portion: '快速加入',
    source: 'quick',
    note,
    kcal: Math.round(kcal.value),
    carb: values.carb,
    fat: values.fat,
    protein: values.protein,
    nutrients,
  }
}

function save() {
  if (!canSave.value) return
  const data = buildEntry()
  if (isEdit.value) {
    diary.updateEntry(entry.value.id, data)
    router.back()
  } else {
    diary.addEntry(data)
    diary.selectedDate = data.date
    router.push('/')
  }
}

const confirmDelete = ref(false)
function onDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  diary.deleteEntry(entry.value.id)
  router.back()
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="router.back()" aria-label="返回">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
    <h1 class="page-title">{{ isEdit ? '編輯快速加入' : '快速加入' }}</h1>
    <div class="spacer"></div>
  </div>

  <p v-if="isEdit && !entry" class="notice">{{ diary.status === 'ready' ? '找不到這筆記錄，可能已經被刪除了。' : '載入中…' }}</p>

  <template v-else>
    <p v-if="!auth.isLoggedIn" class="notice">請先到「更多」頁登入，才能記錄。</p>

    <section class="card">
      <div class="field-label">餐別</div>
      <div class="meals">
        <button
          v-for="m in MEALS"
          :key="m.key"
          :class="{ active: form.meal === m.key }"
          :aria-pressed="form.meal === m.key"
          @click="form.meal = m.key"
        >
          {{ m.name }}
        </button>
      </div>
      <p v-if="!isEdit" class="hint">依現在時間自動選擇，可以修改</p>
    </section>

    <section class="card center">
      <label for="qa-kcal" class="field-label">卡路里<span class="required">*</span></label>
      <div class="kcal-row">
        <input id="qa-kcal" v-model="form.kcal" type="number" inputmode="numeric" class="num kcal-input" placeholder="0" />
        <span class="kcal-unit">卡</span>
      </div>
    </section>

    <section class="card">
      <div class="field-label">主要營養素<span class="hint-inline">（選填）</span></div>
      <div v-for="m in MACROS" :key="m.key" class="row">
        <label :for="'qa-' + m.key" class="row-label"><span class="dot" :style="{ background: m.color }"></span>{{ m.label }}</label>
        <div class="input-wrap">
          <input :id="'qa-' + m.key" v-model="form[m.key]" type="number" inputmode="decimal" class="num input" placeholder="—" />
          <span class="unit">g</span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="row no-border">
        <label for="qa-time" class="row-label">時間</label>
        <input id="qa-time" v-model="form.time" type="time" class="time-input" />
      </div>
      <p class="hint">日期：{{ titleFor(date) }}（跟著日記目前選的日子）</p>
      <div class="note-block">
        <label for="qa-note" class="field-label">備註<span class="hint-inline">（選填）</span></label>
        <textarea id="qa-note" v-model="form.note" rows="2" class="note" placeholder="例如：同事請的蛋糕"></textarea>
      </div>
    </section>

    <div class="preview-title">在日記裡會顯示成</div>
    <div class="preview">
      <div class="preview-info">
        <div class="preview-name">{{ previewName }}</div>
        <div class="preview-portion">快速加入</div>
        <div class="preview-macro">{{ previewMacro }}</div>
      </div>
      <div class="num preview-kcal">{{ kcal > 0 ? Math.round(kcal) : 0 }}</div>
    </div>
    <p class="hint outside">快速加入的項目只會記在這一天的日記裡，不會加進「我的食品」，也不會出現在搜尋結果。</p>

    <div class="bottom">
      <button v-if="isEdit" class="delete-btn" @click="onDelete">{{ confirmDelete ? '確定刪除？' : '刪除' }}</button>
      <button class="main-btn" :disabled="!canSave" @click="save">
        {{ !auth.isLoggedIn ? '請先登入才能記錄' : isEdit ? '儲存修改' : `加入${mealName(form.meal)}` }}
      </button>
    </div>
  </template>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 18px; font-weight: 700; margin: 0; }
.spacer { width: 44px; }
.notice { font-size: 13px; color: var(--muted); font-weight: 700; margin: 0 6px 12px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 22px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
.card.center { align-items: center; padding: 22px; }
.field-label { font-size: 14px; font-weight: 700; }
.required { color: #B42318; margin-left: 2px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); font-weight: 700; line-height: 1.6; }
.hint.outside { margin: 8px 6px 0; }
.hint-inline { font-size: 12px; color: var(--muted); margin-left: 4px; }
.meals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.meals button { height: 44px; border: 0; border-radius: 22px; background: var(--bg); color: var(--ink); font-size: 14px; font-weight: 700; }
.meals button.active { background: var(--primary); color: var(--on-primary); }
.kcal-row { display: flex; align-items: baseline; gap: 8px; }
.kcal-input { width: 170px; height: 68px; border: 0; border-radius: 20px; background: var(--soft); padding: 0 16px; text-align: center; font-size: 36px; font-weight: 900; color: var(--ink); }
.kcal-unit { font-size: 16px; font-weight: 700; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 10px; border-top: 1px solid var(--line); }
.row.no-border { padding-top: 0; border-top: 0; }
.row-label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }
.dot { width: 8px; height: 8px; border-radius: 4px; }
.input-wrap { display: flex; align-items: center; gap: 6px; }
.input { width: 96px; height: 46px; border: 0; border-radius: 14px; background: var(--bg); padding: 0 12px; text-align: right; font-size: 17px; font-weight: 900; color: var(--ink); }
.unit { width: 12px; font-size: 13px; color: var(--muted); font-weight: 700; }
.time-input { width: 130px; height: 46px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 12px; font-size: 15px; color: var(--ink); font-family: inherit; }
.note-block { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; border-top: 1px solid var(--line); }
.note { border: 0; border-radius: 14px; background: var(--bg); padding: 12px 14px; font-size: 15px; color: var(--ink); resize: none; line-height: 1.5; font-family: inherit; }
.preview-title { font-size: 13px; font-weight: 700; color: var(--muted); margin: 4px 6px 8px; }
.preview { background: #FFFFFF; border-radius: 20px; padding: 12px 20px; display: flex; align-items: center; gap: 12px; }
.preview-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.preview-name { font-size: 15px; }
.preview-portion { font-size: 12px; color: var(--text-accent); font-weight: 700; }
.preview-macro { font-size: 12px; color: var(--muted); font-weight: 700; }
.preview-kcal { font-size: 16px; font-weight: 800; }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); display: flex; gap: 10px; }
.main-btn { flex: 1; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 700; }
.main-btn:disabled { background: #C9CEDA; color: var(--muted); }
.delete-btn { height: 56px; padding: 0 22px; border: 1.5px solid #F3B8AE; border-radius: 28px; background: #FFFFFF; color: #B42318; font-size: 15px; font-weight: 700; }
</style>