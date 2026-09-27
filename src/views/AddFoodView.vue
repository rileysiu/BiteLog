<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoodsStore } from '../stores/foods'
import { MEALS, suggestMeal, mealName } from '../utils/meal'
import { useDiaryStore } from '../stores/diary'
import { useMealsStore } from '../stores/meals'
import { useCustomFoodsStore } from '../stores/customFoods'
import { useRecipesStore } from '../stores/recipes'
import { usePickerStore } from '../stores/picker'

const route = useRoute()
const router = useRouter()
const foods = useFoodsStore()
const diary = useDiaryStore()
const savedMeals = useMealsStore()
const custom = useCustomFoodsStore()
const recipes = useRecipesStore()
const picker = usePickerStore()

const pageTitle = computed(() => {
  if (!picker.isPicking) return '新增食品'
  return picker.isForRecipe ? '選擇食材' : '加入食品到餐點'
})

const mealKcal = (m) => Math.round(m.items.reduce((s, i) => s + (i.kcal || 0), 0))

function addSavedMeal(m) {
  diary.copyEntries(m.items, { date: diary.selectedDate, meal: meal.value, time: nowText })
  router.push('/')
}

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const nowText = `${pad(now.getHours())}:${pad(now.getMinutes())}`

const autoPicked = !route.query.meal
const meal = ref(route.query.meal || suggestMeal(now))
const query = ref('')

const results = computed(() => {
  const list = [
    ...custom.search(query.value),
    ...(picker.isForRecipe ? [] : recipes.search(query.value)),
    ...foods.search(query.value, 200),
  ]
  const counts = diary.pickCounts
  return list
    .map((f, i) => ({ f, i, count: counts.get(f.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.i - b.i)
    .slice(0, 50)
    .map(({ f, count }) => ({ ...f, pickCount: count }))
})

onMounted(() => foods.load())

function close() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="close" aria-label="關閉">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <h1 class="page-title">{{ pageTitle }}</h1>
    <div class="spacer"></div>
  </div>

  <div v-if="!picker.isPicking" class="meals">
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
  <p v-if="autoPicked && !picker.isPicking" class="hint">現在 {{ nowText }}，已自動選擇「{{ mealName(meal) }}」</p>

  <label class="search">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
    <input v-model="query" type="search" placeholder="搜尋食品名稱或俗名" aria-label="搜尋食品" />
  </label>

  <RouterLink v-if="!picker.isPicking" :to="{ name: 'quickAdd', query: { meal } }" class="quick">
    <span class="quick-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 13h6l-1 8 8-10h-6z" /></svg>
    </span>
    <span class="quick-text">
      <span class="quick-title">快速加入</span>
      <span class="quick-sub">不用選食品，直接輸入卡路里</span>
    </span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
  </RouterLink>

  <div class="results">
    <p v-if="foods.status === 'loading'" class="empty">載入食品資料中…</p>
    <p v-else-if="foods.status === 'error'" class="empty">食品資料載入失敗，請重新整理頁面</p>
    <template v-else-if="!query.trim()">
      <template v-if="savedMeals.list.length && !picker.isPicking">
        <h2 class="section-title">我的餐點</h2>
        <div v-for="m in savedMeals.list" :key="m.id" class="item">
          <RouterLink :to="{ name: 'meal', params: { id: m.id } }" class="item-info link">
            <div class="item-name">{{ m.name }}</div>
            <div class="item-meta">{{ m.items.length }} 項 · {{ mealKcal(m) }} 卡</div>
          </RouterLink>
          <button class="add-btn" :aria-label="'加入 ' + m.name" @click="addSavedMeal(m)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </template>
      <h2 class="section-title">我的食品</h2>
      <RouterLink :to="{ name: 'newCustomFood', query: { meal } }" class="quick in-list">
        <span class="quick-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
        </span>
        <span class="quick-text">
          <span class="quick-title">新增自訂食品</span>
          <span class="quick-sub">照著包裝上的營養標示輸入</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </RouterLink>
      <div v-for="f in custom.list" :key="f.id" class="item">
        <RouterLink :to="{ name: 'editCustomFood', params: { id: f.id } }" class="item-info link">
          <div class="item-name">{{ f.name }}</div>
          <div class="item-meta">{{ f.brand ? f.brand + ' · ' : '' }}每份 {{ f.unitGrams }} {{ f.baseLabel }} · {{ Math.round(f.raw.per === 'serving' ? f.raw.values.kcal : (f.raw.values.kcal * f.unitGrams) / 100) }} 卡</div>
        </RouterLink>
        <button class="add-btn" :aria-label="'加入 ' + f.name" @click="router.push({ name: 'food', params: { id: f.id }, query: { meal } })">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      <template v-if="!picker.isForRecipe">
        <h2 class="section-title">我的食譜</h2>
        <RouterLink :to="{ name: 'newRecipe' }" class="quick in-list">
          <span class="quick-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" /><path d="M9 7c0-1.5 1-2 1-3M14 7c0-1.5 1-2 1-3M2 11h2M20 11h2" /></svg>
          </span>
          <span class="quick-text">
            <span class="quick-title">建立食譜</span>
            <span class="quick-sub">組合食材，自動算出每份營養</span>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </RouterLink>
        <div v-for="r in recipes.list" :key="r.id" class="item">
          <RouterLink :to="{ name: 'editRecipe', params: { id: r.id } }" class="item-info link">
            <div class="item-name">{{ r.name }}</div>
            <div class="item-meta">{{ r.raw.servings }} 份 · 每份 {{ Math.round((r.n.kcal ?? 0) * r.unitGrams / 100) }} 卡</div>
          </RouterLink>
          <button class="add-btn" :aria-label="'加入 ' + r.name" @click="router.push({ name: 'food', params: { id: r.id }, query: { meal } })">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </template>
      <p class="empty">輸入食品名稱開始搜尋，例如：吐司、雞蛋、白飯</p>
    </template>
    <template v-else-if="results.length === 0">
      <p class="empty">找不到「{{ query }}」</p>
      <RouterLink :to="{ name: 'newCustomFood', query: { meal } }" class="quick in-list">
        <span class="quick-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
        </span>
        <span class="quick-text">
          <span class="quick-title">新增自訂食品</span>
          <span class="quick-sub">照著包裝上的營養標示輸入</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </RouterLink>
    </template>

    <div v-for="f in results" :key="f.id" class="item">
      <div class="item-info">
        <div class="item-name"><span v-if="f.source" class="mine">{{ f.source === 'recipe' ? '我的食譜' : '我的食品' }}</span>{{ f.name }}</div>
        <div v-if="f.alias" class="item-alias">俗名：{{ f.alias }}</div>
        <div class="item-meta">
          <span class="portion">每 100 {{ f.baseLabel || '克' }}</span> · {{ Math.round(f.n.kcal ?? 0) }} 卡
          <template v-if="f.unitGrams"> · 1 份 {{ f.unitGrams }} 克</template>
        </div>
      </div>
      <span v-if="f.pickCount" class="count">選過 {{ f.pickCount }} 次</span>
      <button
        class="add-btn"
        :aria-label="'加入 ' + f.name"
        @click="router.push({ name: 'food', params: { id: f.id }, query: { meal } })"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 18px; font-weight: 900; margin: 0; }
.spacer { width: 44px; }
.meals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.meals button { height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); font-size: 14px; font-weight: 700; }
.meals button.active { background: var(--primary); color: var(--on-primary); }
.hint { font-size: 12px; color: var(--muted); margin: 8px 4px 0; }
.search { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 18px; margin-top: 14px; border-radius: 26px; background: #FFFFFF; color: var(--muted); }
.search input { flex: 1; min-width: 0; height: 44px; border: 0; background: transparent; font-size: 16px; color: var(--ink); outline: none; }
.results { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.empty { font-size: 14px; color: var(--muted); margin: 8px 4px; }
.item { display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 20px; border-radius: 20px; background: #FFFFFF; }
.item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.item-name { font-size: 15px; font-weight: 500; }
.item-alias { font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-meta { font-size: 12px; color: var(--muted); }
.portion { color: var(--text-accent); font-weight: 700; }
.add-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: var(--soft); color: var(--text-accent); padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.section-title { font-size: 14px; font-weight: 900; margin: 4px 4px 0; }
.link { text-decoration: none; color: inherit; }
.mine { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: var(--soft); color: var(--text-accent); margin-right: 6px; }
.count { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px; background: var(--track); color: var(--muted); flex-shrink: 0; white-space: nowrap; }
.quick { display: flex; align-items: center; gap: 12px; min-height: 56px; margin-top: 12px; padding: 8px 14px 8px 10px; border-radius: 20px; background: #FFFFFF; color: var(--muted); text-decoration: none; }
.quick-icon { width: 40px; height: 40px; border-radius: 20px; background: var(--soft); color: var(--text-accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.quick-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.quick-title { font-size: 15px; font-weight: 700; color: var(--ink); }
.quick-sub { font-size: 12px; font-weight: 700; color: var(--muted); }
.quick.in-list { margin-top: 0; }
</style>