<script setup>
import { ref, computed } from 'vue'
import CalorieCard from '../components/CalorieCard.vue'
import MacroCard from '../components/MacroCard.vue'

const goals = ref({ kcal: 1904, carb: 219, fat: 63, protein: 114 })

const entries = ref([
  { id: 1, meal: 'breakfast', time: '08:10', name: '義美 5.3 厚豆奶（無加糖）', portion: '400 毫升', kcal: 228, carb: 14, fat: 10.8, protein: 21.2 },
  { id: 2, meal: 'breakfast', time: '08:10', name: 'Saputo 部分脫脂摩佐羅拉乾酪條', portion: '2 份（56.6 克）', kcal: 158, carb: 2.4, fat: 11.2, protein: 12 },
  { id: 3, meal: 'lunch', time: '12:35', name: '麥當勞 無敵豬肉滿福堡加蛋', portion: '1 份', kcal: 513, carb: 31, fat: 30, protein: 30 },
  { id: 4, meal: 'lunch', time: '12:35', name: '麥當勞 薯餅', portion: '1 份（55 克）', kcal: 1177, carb: 14, fat: 13, protein: 1.9 },
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
</script>

<template>
  <h1 class="title">今天</h1>
  <div class="stack">
    <CalorieCard :eaten="totals.kcal" :goal="goals.kcal" />
    <MacroCard :totals="totals" :goals="goals" />
  </div>
</template>

<style scoped>
.title { font-size: 30px; font-weight: 900; margin: 0 0 16px; }
.stack { display: flex; flex-direction: column; gap: 12px; }
</style>