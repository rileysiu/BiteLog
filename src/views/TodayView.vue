<script setup>
import { ref, computed } from 'vue'
import CalorieCard from '../components/CalorieCard.vue'
import MacroCard from '../components/MacroCard.vue'
import MealCard from '../components/MealCard.vue'
import TimelineList from '../components/TimelineList.vue'

const goals = ref({ kcal: 1904, carb: 219, fat: 63, protein: 114 })

const entries = ref([
  { id: 1, meal: 'breakfast', time: '08:10', name: '義美 5.3 厚豆奶（無加糖）', portion: '400 毫升', kcal: 228, carb: 14, fat: 10.8, protein: 21.2 },
  { id: 2, meal: 'breakfast', time: '08:10', name: 'Saputo 部分脫脂摩佐羅拉乾酪條', portion: '2 份（56.6 克）', kcal: 158, carb: 2.4, fat: 11.2, protein: 12 },
  { id: 3, meal: 'lunch', time: '12:35', name: '麥當勞 無敵豬肉滿福堡加蛋', portion: '1 份', kcal: 513, carb: 31, fat: 30, protein: 30 },
  { id: 4, meal: 'lunch', time: '12:35', name: '麥當勞 薯餅', portion: '1 份（55 克）', kcal: 177, carb: 14, fat: 13, protein: 1.9 },
  { id: 5, meal: 'snack', time: '15:40', name: '自製花生醬餅乾', portion: '2 片', kcal: 190, carb: 20, fat: 10, protein: 5 },
])

const totals = computed(() => {
  return entries.value.reduce(
    (sum, e) => ({
      kcal: sum.kcal + e.kcal,
      carb: sum.carb + e.carb,
      fat: sum.fat + e.fat,
      protein: sum.protein + e.protein,
    }),
    { kcal: 0, carb: 0, fat: 0, protein: 0 }
  )
})

const meals = [
  { key: 'breakfast', name: '早餐' },
  { key: 'lunch', name: '午餐' },
  { key: 'dinner', name: '晚餐' },
  { key: 'snack', name: '點心' },
]

const mealGroups = computed(() =>
  meals.map((m) => ({
    ...m,
    items: entries.value.filter((e) => e.meal === m.key),
  }))
)

const viewMode = ref('meal')
</script>

<template>
  <h1 class="title">今天</h1>

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
      <MealCard v-for="g in mealGroups" :key="g.key" :title="g.name" :items="g.items" />
    </template>
    <TimelineList v-else :entries="entries" />
  </div>
</template>

<style scoped>
.title { font-size: 30px; font-weight: 900; margin: 0 0 16px; }
.stack { display: flex; flex-direction: column; gap: 12px; }
.section-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 4px 0; }
.section-title { font-size: 22px; font-weight: 900; margin: 0; }
.segment { display: flex; gap: 2px; padding: 3px; background: #FFFFFF; border-radius: 22px; }
.segment button { height: 38px; min-width: 64px; padding: 0 14px; border: 0; border-radius: 19px; font-size: 14px; font-weight: 700; background: transparent; color: var(--muted); }
.segment button.active { background: var(--primary); color: var(--on-primary); }
</style>