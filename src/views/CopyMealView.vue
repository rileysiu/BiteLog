<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiaryStore } from '../stores/diary'
import { MEALS, mealName } from '../utils/meal'
import { addDays, titleFor, fromKey } from '../utils/date'
import MonthCalendar from '../components/MonthCalendar.vue'

const route = useRoute()
const router = useRouter()
const diary = useDiaryStore()

const sourceDate = route.query.date || diary.selectedDate
const sourceMeal = route.query.meal || 'breakfast'

const items = computed(() =>
  diary.entries
    .filter((e) => e.date === sourceDate && e.meal === sourceMeal)
    .sort((a, b) => a.time.localeCompare(b.time))
)

// 預設全部勾選
const pickedIds = ref([])
let initialized = false
watch(
  items,
  (list) => {
    if (initialized || list.length === 0) return
    pickedIds.value = list.map((e) => e.id)
    initialized = true
  },
  { immediate: true }
)

const allPicked = computed(() => items.value.length > 0 && pickedIds.value.length === items.value.length)

function toggleAll() {
  pickedIds.value = allPicked.value ? [] : items.value.map((e) => e.id)
}

function toggle(id) {
  pickedIds.value = pickedIds.value.includes(id)
    ? pickedIds.value.filter((x) => x !== id)
    : [...pickedIds.value, id]
}

const step = ref(1)
const targetMeal = ref(sourceMeal)
const targetDate = ref(addDays(sourceDate, 1))

const targetText = computed(() => {
  const d = fromKey(targetDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日的${mealName(targetMeal.value)}`
})

function close() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function copy() {
  const list = items.value.filter((e) => pickedIds.value.includes(e.id))
  diary.copyEntries(list, { date: targetDate.value, meal: targetMeal.value })
  diary.selectedDate = targetDate.value
  router.push('/')
}
</script>

<template>
  <div class="top">
    <button v-if="step === 1" class="icon-btn" @click="close" aria-label="關閉">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <button v-else class="icon-btn" @click="step = 1" aria-label="上一步">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
    <div class="title-wrap">
      <h1 class="page-title">複製餐點</h1>
      <div class="step-text">{{ step === 1 ? '步驟 1／2：選擇食品' : '步驟 2／2：選擇餐別與日期' }}</div>
    </div>
    <div class="spacer"></div>
  </div>

  <template v-if="step === 1">
    <p class="source">來源：{{ titleFor(sourceDate) }}的{{ mealName(sourceMeal) }}</p>

    <p v-if="items.length === 0" class="source">這一餐沒有可以複製的食品。</p>

    <section v-else class="card">
      <div class="all-row">
        <span class="all-label">選擇所有食品</span>
        <button class="switch" :class="{ on: allPicked }" :aria-pressed="allPicked" aria-label="選擇所有食品" @click="toggleAll">
          <span class="knob"></span>
        </button>
      </div>
      <button
        v-for="e in items"
        :key="e.id"
        class="pick-row"
        :aria-pressed="pickedIds.includes(e.id)"
        @click="toggle(e.id)"
      >
        <span class="pick-info">
          <span class="pick-name">{{ e.name }}</span>
          <span class="pick-sub"><span class="portion">{{ e.portion }}</span> · {{ e.kcal }} 卡</span>
        </span>
        <span class="check" :class="{ on: pickedIds.includes(e.id) }">
          <svg v-if="pickedIds.includes(e.id)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>
        </span>
      </button>
    </section>

    <div class="bottom">
      <button class="main-btn" :disabled="pickedIds.length === 0" @click="step = 2">下一步</button>
    </div>
  </template>

  <template v-else>
    <section class="card">
      <div class="card-title">複製到哪一餐</div>
      <div class="meals">
        <button
          v-for="m in MEALS"
          :key="m.key"
          :class="{ active: targetMeal === m.key }"
          :aria-pressed="targetMeal === m.key"
          @click="targetMeal = m.key"
        >
          {{ m.name }}
        </button>
      </div>
    </section>

    <section class="card">
      <div class="card-title">複製到哪一天</div>
      <MonthCalendar :selected="targetDate" @select="targetDate = $event" />
    </section>

    <p class="source">將複製 {{ pickedIds.length }} 項食品到 {{ targetText }}</p>

    <div class="bottom">
      <button class="main-btn" @click="copy">複製</button>
    </div>
  </template>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.title-wrap { text-align: center; }
.page-title { font-size: 18px; font-weight: 900; margin: 0; }
.step-text { font-size: 12px; color: var(--muted); }
.spacer { width: 44px; }
.source { font-size: 13px; color: var(--muted); margin: 0 6px 12px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 16px 16px 16px 22px; margin-bottom: 12px; display: flex; flex-direction: column; }
.card-title { font-size: 15px; font-weight: 900; margin-bottom: 10px; }
.all-row { display: flex; align-items: center; justify-content: space-between; min-height: 52px; }
.all-label { font-size: 15px; font-weight: 900; }
.switch { width: 52px; height: 32px; border: 0; border-radius: 16px; padding: 3px; background: #C9CEDA; display: flex; justify-content: flex-start; }
.switch.on { background: var(--primary); justify-content: flex-end; }
.knob { width: 26px; height: 26px; border-radius: 13px; background: #FFFFFF; }
.pick-row { min-height: 64px; border: 0; border-top: 1px solid var(--line); background: transparent; padding: 10px 0; display: flex; align-items: center; gap: 12px; text-align: left; color: var(--ink); }
.pick-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; white-space: normal; }
.pick-name { font-size: 15px; font-weight: 500; }
.pick-sub { font-size: 12px; color: var(--muted); }
.portion { color: var(--text-accent); font-weight: 700; }
.check { width: 28px; height: 28px; border-radius: 14px; border: 2px solid #C9CEDA; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #FFFFFF; }
.check.on { border-color: transparent; background: var(--primary); }
.meals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.meals button { height: 44px; border: 0; border-radius: 22px; background: var(--bg); color: var(--ink); font-size: 14px; font-weight: 700; }
.meals button.active { background: var(--primary); color: var(--on-primary); }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); }
.main-btn { width: 100%; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 900; }
.main-btn:disabled { background: #C9CEDA; color: var(--muted); }
</style>