<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiaryStore } from '../stores/diary'
import { useMealsStore } from '../stores/meals'
import { mealName } from '../utils/meal'
import { titleFor } from '../utils/date'

const route = useRoute()
const router = useRouter()
const diary = useDiaryStore()
const meals = useMealsStore()

const sourceDate = route.query.date || diary.selectedDate
const sourceMeal = route.query.meal || 'breakfast'

const items = computed(() =>
  diary.entries
    .filter((e) => e.date === sourceDate && e.meal === sourceMeal)
    .sort((a, b) => a.time.localeCompare(b.time))
)
const total = computed(() => Math.round(items.value.reduce((s, e) => s + e.kcal, 0)))

const name = ref('')
const saving = ref(false)
const error = ref('')
const canSave = computed(() => name.value.trim() && items.value.length > 0 && !saving.value)

async function save() {
  if (!canSave.value) return
  saving.value = true
  error.value = ''
  try {
    const id = await meals.saveMeal(name.value.trim(), items.value)
    router.replace({ name: 'meal', params: { id }, query: { saved: '1' } })
  } catch (err) {
    console.error(err)
    error.value = '儲存失敗，請再試一次'
  } finally {
    saving.value = false
  }
}

function cancel() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="cancel" aria-label="關閉">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <h1 class="page-title">儲存餐點</h1>
    <div class="spacer"></div>
  </div>

  <section class="card">
    <label for="meal-name" class="field-label">餐點名稱</label>
    <input id="meal-name" v-model="name" type="text" class="field" placeholder="例如：平日早餐" />
    <p class="hint">請為這組食品命名，之後可以在「新增食品」頁一次加入。</p>
  </section>

  <section class="card">
    <div class="field-label">
      這一餐的食品
      <span class="source">（{{ titleFor(sourceDate) }}的{{ mealName(sourceMeal) }} · {{ items.length }} 項 · {{ total }} 卡）</span>
    </div>
    <p v-if="items.length === 0" class="hint">這一餐沒有食品可以儲存。</p>
    <div v-for="e in items" :key="e.id" class="item">
      <div class="item-info">
        <div class="item-name">{{ e.name }}</div>
        <div class="item-portion">{{ e.portion }}</div>
      </div>
      <div class="num item-kcal">{{ e.kcal }}</div>
    </div>
  </section>

  <p v-if="error" class="error">{{ error }}</p>

  <div class="bottom">
    <button class="cancel-btn" @click="cancel">取消</button>
    <button class="main-btn" :disabled="!canSave" @click="save">{{ saving ? '儲存中…' : '儲存' }}</button>
  </div>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 18px; font-weight: 900; margin: 0; }
.spacer { width: 44px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 22px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 15px; font-weight: 900; }
.source { font-size: 12px; font-weight: 400; color: var(--muted); }
.field { height: 50px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 14px; font-size: 16px; color: var(--ink); font-family: inherit; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.6; }
.item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 15px; font-weight: 500; }
.item-portion { font-size: 12px; color: var(--text-accent); font-weight: 700; margin-top: 3px; }
.item-kcal { font-size: 16px; font-weight: 800; }
.error { font-size: 13px; color: #B42318; margin: 0 6px 12px; }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); display: flex; gap: 10px; }
.cancel-btn { height: 56px; padding: 0 24px; border: 0; border-radius: 28px; background: #FFFFFF; color: var(--ink); font-size: 15px; font-weight: 700; }
.main-btn { flex: 1; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 900; }
.main-btn:disabled { background: #C9CEDA; color: var(--muted); }
</style>