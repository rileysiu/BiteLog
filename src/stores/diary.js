import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { todayKey, addDays } from '../utils/date'

export const useDiaryStore = defineStore('diary', () => {
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

  const loggedDates = computed(() => [...new Set(entries.value.map((e) => e.date))])

  function addEntry(entry) {
    entries.value.push({ ...entry, id: Date.now() })
  }

  return { goals, entries, selectedDate, loggedDates, addEntry }
})