<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import CalorieCard from '../components/CalorieCard.vue'
import MacroCard from '../components/MacroCard.vue'
import MealCard from '../components/MealCard.vue'
import TimelineList from '../components/TimelineList.vue'
import WeekStrip from '../components/WeekStrip.vue'
import CalendarPopup from '../components/CalendarPopup.vue'
import { addDays, titleFor } from '../utils/date'
import { MEALS as meals } from '../utils/meal'
import { useDiaryStore } from '../stores/diary'
import { useAuthStore } from '../stores/auth'

const diary = useDiaryStore()
const auth = useAuthStore()
const { goals, entries, selectedDate, loggedDates } = storeToRefs(diary)

const calendarOpen = ref(false)

const title = computed(() => titleFor(selectedDate.value))

const dayEntries = computed(() => entries.value.filter((e) => e.date === selectedDate.value))

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

  <section v-if="auth.ready && !auth.isLoggedIn" class="login-hint">
    <p>登入後就能開始記錄，資料會存在雲端，手機和電腦同步。</p>
    <RouterLink to="/more" class="login-link">前往登入</RouterLink>
  </section>
  
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
.login-hint { margin-top: 12px; padding: 18px 22px; border-radius: 24px; background: var(--soft); display: flex; flex-direction: column; gap: 10px; }
.login-hint p { margin: 0; font-size: 14px; line-height: 1.6; }
.login-link { align-self: flex-start; height: 44px; padding: 0 20px; border-radius: 22px; background: var(--primary); color: var(--on-primary); font-size: 14px; font-weight: 700; display: flex; align-items: center; text-decoration: none; }
</style>