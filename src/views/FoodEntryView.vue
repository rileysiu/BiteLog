<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoodsStore } from '../stores/foods'
import { useCustomFoodsStore } from '../stores/customFoods'
import { useDiaryStore } from '../stores/diary'
import { useAuthStore } from '../stores/auth'
import { MEALS, suggestMeal, mealName } from '../utils/meal'
import { useRecipesStore } from '../stores/recipes'
import { useMealsStore } from '../stores/meals'
import { usePickerStore } from '../stores/picker'

const route = useRoute()
const router = useRouter()
const foods = useFoodsStore()
const custom = useCustomFoodsStore()
const diary = useDiaryStore()
const auth = useAuthStore()

const isEdit = computed(() => route.name === 'editEntry')
const recipes = useRecipesStore()
const meals = useMealsStore()
const picker = usePickerStore()
const picking = computed(() => picker.isPicking && !isEdit.value)

onMounted(() => foods.load())

const entry = computed(() => (isEdit.value ? diary.entries.find((e) => e.id === route.params.id) : null))
const foodId = computed(() => (isEdit.value ? entry.value?.foodId : route.params.id))
// 先找食藥署資料庫，找不到再找自訂食品
const food = computed(() => {
  const id = foodId.value
  if (!id) return null
  return foods.getById(id) ?? custom.getById(id) ?? recipes.getById(id) ?? null
})
const isCustom = computed(() => food.value?.source === 'custom')
const sourceLabel = computed(() => ({ custom: '我的食品', recipe: '我的食譜' })[food.value?.source] ?? '食藥署資料庫')
const baseLabel = computed(() => food.value?.baseLabel ?? '克')

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')

const meal = ref(route.query.meal || suggestMeal(now))
const date = ref(diary.selectedDate)
const time = ref(`${pad(now.getHours())}:${pad(now.getMinutes())}`)

// 單位清單：自訂食品有自己的單位；食藥署食品有「每單位重」的會多一個「份」
const units = computed(() => {
  const f = food.value
  let list = []
  if (f?.units) list = [...f.units]
  else if (f?.unitGrams) list = [{ key: 'serving', label: '份', grams: f.unitGrams }]
  list.push({ key: 'gram', label: baseLabel.value, grams: 1 })
  return list
})

const unitKey = ref(null)
const qty = ref('')
const initialized = ref(false)

watch(
  [food, entry],
  ([f, e]) => {
    if (initialized.value || !f) return
    if (isEdit.value) {
      if (!e) return
      meal.value = e.meal
      date.value = e.date
      time.value = e.time
      const u = units.value.find((x) => x.key === e.unit)
      if (u && u.key !== 'gram') {
        unitKey.value = u.key
        qty.value = String(e.qty ?? Math.round((e.grams / u.grams) * 10) / 10)
      } else {
        unitKey.value = 'gram'
        qty.value = String(e.grams ?? 100)
      }
    } else {
      const first = units.value[0]
      unitKey.value = first.key
      qty.value = first.key === 'gram' ? '100' : '1'
    }
    initialized.value = true
  },
  { immediate: true }
)

const unit = computed(() => units.value.find((u) => u.key === unitKey.value) ?? units.value[0])
const grams = computed(() => (parseFloat(qty.value) || 0) * (unit.value?.grams ?? 0))

function pickUnit(u) {
  if (u.key === unitKey.value) return
  const g = grams.value
  qty.value = u.key === 'gram' ? String(Math.round(g) || 100) : String(Math.round((g / u.grams) * 10) / 10 || 1)
  unitKey.value = u.key
}

function unitButtonLabel(u) {
  return u.key === 'gram' ? u.label : `${u.label}（${u.grams} ${baseLabel.value}）`
}

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
const portionText = computed(() => {
  const u = unit.value
  if (!u) return ''
  return u.key === 'gram' ? `${qty.value} ${baseLabel.value}` : `${qty.value} ${u.label}（${Math.round(grams.value)} ${baseLabel.value}）`
})
const canSave = computed(() => auth.isLoggedIn && grams.value > 0 && (picking.value || (date.value && time.value)))

function buildEntry() {
  const s = scaled.value
  return {
    date: date.value,
    meal: meal.value,
    time: time.value,
    name: food.value.name,
    portion: portionText.value,
    foodId: food.value.id,
    source: food.value.source ?? 'tfnd',
    unit: unitKey.value,
    qty: parseFloat(qty.value) || 0,
    grams: r1(grams.value),
    kcal: Math.round(s.kcal ?? 0),
    carb: s.carb ?? 0,
    fat: s.fat ?? 0,
    protein: s.protein ?? 0,
    nutrients: s,
  }
}

function save() {
  if (!canSave.value) return
  if (picking.value) {
    const { date: _d, meal: _m, time: _t, ...item } = buildEntry()
    if (picker.isForRecipe) recipes.addDraftIngredient(item)
    else meals.addItem(picker.target.id, item)
    picker.finish()
    router.go(-2)
    return
  }
  const data = buildEntry()
  if (isEdit.value) {
    diary.updateEntry(entry.value.id, data)
    diary.selectedDate = data.date
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

const saveLabel = computed(() => {
  if (!auth.isLoggedIn) return '請先登入才能記錄'
  if (picking.value) return picker.isForRecipe ? '加入食譜' : '加入餐點'
  return isEdit.value ? '儲存修改' : `加入${mealName(meal.value)}`
})
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="router.back()" aria-label="返回">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
    <h1 class="page-title">{{ isEdit ? '編輯記錄' : '加入食品' }}</h1>
    <div class="spacer"></div>
  </div>

  <p v-if="isEdit && !entry && diary.status !== 'ready'" class="empty">載入中…</p>
  <p v-else-if="isEdit && !entry" class="empty">找不到這筆記錄，可能已經被刪除了。</p>

  <template v-else-if="isEdit && entry && !food && (foods.status === 'loaded' && custom.status === 'ready')">
    <div class="head">
      <h2 class="food-name">{{ entry.name }}</h2>
      <p class="food-desc">這筆記錄的食品已經不存在（可能是刪除了自訂食品），只能刪除這筆記錄。</p>
    </div>
    <div class="bottom">
      <button class="delete-btn full" @click="onDelete">{{ confirmDelete ? '確定刪除？' : '刪除記錄' }}</button>
    </div>
  </template>

  <p v-else-if="!food && foods.status !== 'error'" class="empty">載入中…</p>
  <p v-else-if="!food" class="empty">找不到這個食品</p>

  <template v-else>
    <div class="head">
      <span class="badge" :class="{ custom: food.source }">{{ sourceLabel }}</span>
      <h2 class="food-name">{{ food.name }}</h2>
      <p class="food-desc">{{ food.desc }}</p>
    </div>

    <section class="card">
      <label for="qty" class="field-label">份量</label>
      <div class="qty-row">
        <input id="qty" v-model="qty" type="number" inputmode="decimal" class="num qty-input" />
        <span class="unit-name">{{ unit?.label }}</span>
        <span class="grams">＝ {{ r1(grams) }} {{ baseLabel }}</span>
      </div>
      <div class="pills">
        <button
          v-for="u in units"
          :key="u.key"
          :class="{ active: u.key === unitKey }"
          :aria-pressed="u.key === unitKey"
          @click="pickUnit(u)"
        >
          {{ unitButtonLabel(u) }}
        </button>
      </div>

      <template v-if="!picking">
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
      </template>
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
      <RouterLink v-if="isCustom" :to="{ name: 'editCustomFood', params: { id: food.id } }" class="edit-link">修改這個自訂食品</RouterLink>
    </section>

    <div class="bottom">
      <button v-if="isEdit" class="delete-btn" @click="onDelete">{{ confirmDelete ? '確定刪除？' : '刪除' }}</button>
      <button class="add-btn" :disabled="!canSave" @click="save">{{ saveLabel }}</button>
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
.badge.custom { background: var(--soft); color: var(--text-accent); }
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
.edit-link { align-self: center; min-height: 44px; display: flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--text-accent); text-decoration: none; }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); display: flex; gap: 10px; }
.add-btn { flex: 1; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 900; }
.add-btn:disabled { background: #C9CEDA; color: var(--muted); }
.delete-btn { height: 56px; padding: 0 22px; border: 1.5px solid #F3B8AE; border-radius: 28px; background: #FFFFFF; color: #B42318; font-size: 15px; font-weight: 700; }
.delete-btn.full { flex: 1; }
</style>