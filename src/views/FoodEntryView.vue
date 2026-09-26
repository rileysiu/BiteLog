<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoodsStore } from '../stores/foods'
import { useDiaryStore } from '../stores/diary'
import { MEALS, suggestMeal, mealName } from '../utils/meal'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const foods = useFoodsStore()
const diary = useDiaryStore()
const auth = useAuthStore()

onMounted(() => foods.load())

const food = computed(() => foods.getById(route.params.id))

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')

const meal = ref(route.query.meal || suggestMeal(now))
const date = ref(diary.selectedDate)
const time = ref(`${pad(now.getHours())}:${pad(now.getMinutes())}`)

// 單位：有「每單位重」的食品多一個「份」
const units = computed(() => {
  const list = []
  if (food.value?.unitGrams) list.push({ key: 'serving', label: '份', grams: food.value.unitGrams })
  list.push({ key: 'gram', label: '克', grams: 1 })
  return list
})

const unitKey = ref(null)
const qty = ref('')

// 食品資料載入後，決定預設單位
watch(
  food,
  (f) => {
    if (!f || unitKey.value) return
    if (f.unitGrams) {
      unitKey.value = 'serving'
      qty.value = '1'
    } else {
      unitKey.value = 'gram'
      qty.value = '100'
    }
  },
  { immediate: true }
)

const unit = computed(() => units.value.find((u) => u.key === unitKey.value) ?? units.value[0])
const grams = computed(() => (parseFloat(qty.value) || 0) * (unit.value?.grams ?? 0))

// 換單位時，把數量換算成新單位，總重量不變
function pickUnit(u) {
  if (u.key === unitKey.value) return
  const g = grams.value
  qty.value = u.key === 'gram' ? String(Math.round(g) || 100) : String(Math.round((g / u.grams) * 10) / 10 || 1)
  unitKey.value = u.key
}

// 依照份量換算所有營養素（資料庫是每 100 克）
const scaled = computed(() => {
  const out = {}
  if (!food.value) return out
  const k = grams.value / 100
  for (const [key, v] of Object.entries(food.value.n)) out[key] = Math.round(v * k * 100) / 100
  return out
})

const MAIN = ['kcal', 'carb', 'fat', 'protein']
const showAll = ref(false)
const otherNutrients = computed(() =>
  Object.entries(foods.nutrients)
    .filter(([key]) => !MAIN.includes(key))
    .map(([key, meta]) => ({ key, label: meta.label, unit: meta.unit, value: scaled.value[key] }))
)

const r1 = (v) => Math.round(v * 10) / 10
const portionText = computed(() =>
  unit.value?.key === 'gram' ? `${qty.value} 克` : `${qty.value} ${unit.value?.label}（${Math.round(grams.value)} 克）`
)
const canAdd = computed(() => auth.isLoggedIn && grams.value > 0 && date.value && time.value)

function add() {
  if (!canAdd.value) return
  const s = scaled.value
  diary.addEntry({
    date: date.value,
    meal: meal.value,
    time: time.value,
    name: food.value.name,
    portion: portionText.value,
    foodId: food.value.id,
    source: 'tfnd',
    grams: r1(grams.value),
    kcal: Math.round(s.kcal ?? 0),
    carb: s.carb ?? 0,
    fat: s.fat ?? 0,
    protein: s.protein ?? 0,
    nutrients: s,
  })
  diary.selectedDate = date.value
  router.push('/')
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="router.back()" aria-label="返回">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
    <h1 class="page-title">加入食品</h1>
    <div class="spacer"></div>
  </div>

  <p v-if="!food && foods.status !== 'error'" class="empty">載入中…</p>
  <p v-else-if="!food" class="empty">找不到這個食品</p>

  <template v-else>
    <div class="head">
      <span class="badge">食藥署資料庫</span>
      <h2 class="food-name">{{ food.name }}</h2>
      <p class="food-desc">{{ food.desc }}</p>
    </div>

    <section class="card">
      <label for="qty" class="field-label">份量</label>
      <div class="qty-row">
        <input id="qty" v-model="qty" type="number" inputmode="decimal" class="num qty-input" />
        <span class="unit-name">{{ unit?.label }}</span>
        <span class="grams">＝ {{ r1(grams) }} 克</span>
      </div>
      <div class="pills">
        <button
          v-for="u in units"
          :key="u.key"
          :class="{ active: u.key === unitKey }"
          :aria-pressed="u.key === unitKey"
          @click="pickUnit(u)"
        >
          {{ u.key === 'gram' ? '克' : `份（${u.grams} 克）` }}
        </button>
      </div>

      <div class="field-label">餐別</div>
      <div class="meals">
        <button
          v-for="m in MEALS"
          :key="m.key"
          :class="{ active: meal === m.key }"
          :aria-pressed="meal === m.key"
          @click="meal = m.key"
        >
          {{ m.name }}
        </button>
      </div>

      <div class="dt">
        <div>
          <label for="date" class="field-label">日期</label>
          <input id="date" v-model="date" type="date" class="field" />
        </div>
        <div>
          <label for="time" class="field-label">進食時間</label>
          <input id="time" v-model="time" type="time" class="field" />
        </div>
      </div>
    </section>

    <section class="card">
      <div class="kcal-row">
        <span class="field-label no-margin">這份的營養</span>
        <span><span class="num kcal">{{ Math.round(scaled.kcal ?? 0) }}</span> 卡</span>
      </div>
      <div class="macros">
        <div class="macro"><span class="dot" style="background: var(--carb)"></span>碳水<b class="num">{{ r1(scaled.carb ?? 0) }} g</b></div>
        <div class="macro"><span class="dot" style="background: var(--fat)"></span>脂肪<b class="num">{{ r1(scaled.fat ?? 0) }} g</b></div>
        <div class="macro"><span class="dot" style="background: var(--protein)"></span>蛋白<b class="num">{{ r1(scaled.protein ?? 0) }} g</b></div>
      </div>
      <button class="more-btn" @click="showAll = !showAll" :aria-expanded="showAll">
        {{ showAll ? '收合營養素' : '查看全部營養素' }}
      </button>
      <div v-if="showAll" class="all">
        <div v-for="n in otherNutrients" :key="n.key" class="all-row">
          <span>{{ n.label }}</span>
          <span class="num">{{ n.value === undefined ? '—' : `${r1(n.value)} ${n.unit}` }}</span>
        </div>
      </div>
    </section>

    <div class="bottom">
      <button class="add-btn" :disabled="!canAdd" @click="add">
        {{ auth.isLoggedIn ? `加入${mealName(meal)}` : '請先登入才能記錄' }}
      </button>
    </div>
  </template>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 18px; font-weight: 900; margin: 0; }
.spacer { width: 44px; }
.empty { font-size: 14px; color: var(--muted); }
.head { padding: 0 6px 12px; }
.badge { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 10px; background: #DDF2EF; color: #1C625B; }
.food-name { font-size: 24px; font-weight: 900; margin: 8px 0 4px; }
.food-desc { font-size: 12px; color: var(--muted); margin: 0; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 22px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
.field-label { font-size: 14px; font-weight: 900; display: block; margin-bottom: 6px; }
.no-margin { margin: 0; }
.qty-row { display: flex; align-items: center; gap: 10px; }
.qty-input { width: 96px; height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 14px; text-align: right; font-size: 20px; font-weight: 900; color: var(--ink); }
.unit-name { font-size: 15px; font-weight: 700; white-space: nowrap; }
.grams { font-size: 13px; color: var(--muted); white-space: nowrap; }
.pills { display: flex; flex-wrap: wrap; gap: 6px; }
.pills button, .meals button { height: 40px; padding: 0 14px; border: 0; border-radius: 20px; background: var(--bg); color: var(--ink); font-size: 13px; font-weight: 700; }
.pills button.active, .meals button.active { background: var(--primary); color: var(--on-primary); }
.meals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.meals button { height: 44px; font-size: 14px; }
.dt { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.field { width: 100%; height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 12px; font-size: 15px; color: var(--ink); font-family: inherit; }
.kcal-row { display: flex; justify-content: space-between; align-items: baseline; }
.kcal { font-size: 26px; font-weight: 900; }
.macros { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.macro { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 16px; background: var(--bg); font-size: 12px; color: var(--muted); }
.macro b { font-size: 17px; color: var(--ink); }
.dot { width: 8px; height: 8px; border-radius: 4px; display: inline-block; margin-right: 6px; }
.more-btn { height: 44px; border: 0; border-radius: 22px; background: var(--bg); color: var(--ink); font-size: 14px; font-weight: 700; }
.all-row { display: flex; justify-content: space-between; min-height: 40px; align-items: center; border-top: 1px solid var(--line); font-size: 14px; }
.all-row .num { font-weight: 800; }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); }
.add-btn { width: 100%; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 900; }
.add-btn:disabled { background: #C9CEDA; color: var(--muted); }
</style>