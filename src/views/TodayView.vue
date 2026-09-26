<script setup>
import { ref, computed } from 'vue'
import CalorieCard from '../components/CalorieCard.vue'
import MacroCard from '../components/MacroCard.vue'
import MealCard from '../components/MealCard.vue'
import TimelineList from '../components/TimelineList.vue'
import WeekStrip from '../components/WeekStrip.vue'
import CalendarPopup from '../components/CalendarPopup.vue'
import { todayKey, addDays, titleFor } from '../utils/date'
import { MEALS as meals } from '../utils/meal'

const today = todayKey()
const yesterday = addDays(today, -1)

const goals = ref({ kcal: 1904, carb: 219, fat: 63, protein: 114 })

const entries = ref([
  { id: 1, date: today, meal: 'breakfast', time: '08:10', name: '義美 5.3 厚豆奶（無加糖）', portion: '400 毫升', kcal: 228, carb: 14, fat: 10.8, protein: 21.2 },
  { id: 2, date: today, meal: 'breakfast', time: '08:10', name: 'Saputo 部分脫脂摩佐羅拉乾酪條', portion: '2 份（56.6 克）', kcal: 158, carb: 2.4, fat: 11.2, protein: 12 },
  { id: 3, date: today, meal: 'lunch', time: '12:35', name: '麥當勞 無敵豬肉滿福堡加蛋', portion: '1 份', kcal: 513, carb: 31, fat: 30, protein: 30 },
  { id: 4, date: today, meal: 'lunch', time: '12:35', name: '麥當勞 薯餅', portion: '1 份（55 克）', kcal: 177, carb: 14, fat: 13, protein: 1.9 },
  { id: 5, date: today, meal: 'snack', time: '15:40', name: '自製花生醬餅乾', portion: '2 片', kcal: 190, carb: 20, fat: 10, protein: 5 },
  { id: 6, date: yesterday, meal: 'breakfast', time: '08:05', name: '義美 5.3 厚豆奶（無加糖）', portion: '400 毫升', kcal: 228, carb: 14, fat: 10.8, protein: 21.2 },
  { id: 7, date: yesterday, meal: 'lunch', time: '12:20', name: '八方雲集 辣味鍋貼', portion: '10 顆', kcal: 520, carb: 48, fat: 26, protein: 20 },
  { id: 8, date: yesterday, meal: 'snack', time: '15:10', name: '香蕉葡萄乾麵包', portion: '1 個', kcal: 210, carb: 36, fat: 5, protein: 5 },
  { id: 9, date: yesterday, meal: 'dinner', time: '18:40', name: '八方雲集 珍珠餛飩湯', portion: '1 碗', kcal: 380, carb: 40, fat: 16, protein: 18 },
  { id: 10, date: yesterday, meal: 'dinner', time: '18:40', name: '八方雲集 旗魚花枝丸湯', portion: '1 碗', kcal: 93, carb: 8, fat: 3, protein: 9 },
])

const selectedDate = ref(today)
const calendarOpen = ref(false)

const title = computed(() => titleFor(selectedDate.value))

const dayEntries = computed(() => entries.value.filter((e) => e.date === selectedDate.value))

const loggedDates = computed(() => [...new Set(entries.value.map((e) => e.date))])

const totals = computed(() => {
  return dayEntries.value.reduce(
    (sum, e) => ({
      kcal: sum.kcal + e.kcal,
      carb: sum.carb + e.carb,
      fat: sum.fat + e.fat,
      protein: sum.protein + e.protein,
    }),
    { kcal: 0, carb: 0, fat: 0, protein: 0 }
  )
})

const mealGroups = computed(() =>
  meals.map((m) => ({
    ...m,
    items: dayEntries.value.filter((e) => e.meal === m.key),
  }))
)

const viewMode = ref('meal')

function selectDate(key) {
  selectedDate.value = key
  calendarOpen.value = false
}

function shiftWeek(n) {
  selectedDate.value = addDays(selectedDate.value, n * 7)
}
</script>

<template>
  <div class="top">
    <button class="title-btn" @click="calendarOpen = !calendarOpen" :aria-expanded="calendarOpen" aria-label="選擇日期">
      <span class="title">{{ title }}</span>
      <svg class="caret" :class="{ flipped: calendarOpen }" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 9h12l-6 7z" /></svg>
    </button>
    <div class="week-nav">
      <button @click="shiftWeek(-1)" aria-label="上一週">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <button @click="shiftWeek(1)" aria-label="下一週">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  </div>

  <WeekStrip :selected="selectedDate" :logged-dates="loggedDates" @select="selectDate" />

  <CalendarPopup
    v-if="calendarOpen"
    :selected="selectedDate"
    @select="selectDate"
    @close="calendarOpen = false"
  />

  <div class="stack">
    <CalorieCard :eaten="totals.kcal" :goal="goals.kcal" />
    <MacroCard :totals="totals" :goals="goals" />

    <div class="section-head">
      <h2 class="section-title">飲食</h2>
      <div class="segment">
        <button :class="{ active: viewMode === 'meal' }" @click="viewMode = 'meal'" :aria-pressed="viewMode === 'meal'">餐別</button>
        <button :class="{ active: viewMode === 'time' }" @click="viewMode = 'time'" :aria-pressed="viewMode === 'time'">時間</button>
      </div>
    </div>

    <template v-if="viewMode === 'meal'">
      <MealCard v-for="g in mealGroups" :key="g.key" :title="g.name" :meal-key="g.key" :items="g.items" />
    </template>
    <TimelineList v-else :entries="dayEntries" />
  </div>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.title-btn { height: 52px; border: 0; background: transparent; padding: 0 0 0 4px; display: flex; align-items: center; gap: 8px; color: var(--ink); }
.title { font-size: 30px; font-weight: 900; letter-spacing: 1px; }
.caret { transition: transform 0.2s; }
.caret.flipped { transform: rotate(180deg); }
.week-nav { display: flex; gap: 4px; }
.week-nav button { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.stack { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.section-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 4px 0; }
.section-title { font-size: 22px; font-weight: 900; margin: 0; }
.segment { display: flex; gap: 2px; padding: 3px; background: #FFFFFF; border-radius: 22px; }
.segment button { height: 38px; min-width: 64px; padding: 0 14px; border: 0; border-radius: 19px; font-size: 14px; font-weight: 700; background: transparent; color: var(--muted); }
.segment button.active { background: var(--primary); color: var(--on-primary); }
</style>