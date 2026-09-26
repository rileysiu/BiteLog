<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoodsStore } from '../stores/foods'
import { MEALS, suggestMeal, mealName } from '../utils/meal'

const route = useRoute()
const router = useRouter()
const foods = useFoodsStore()

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const nowText = `${pad(now.getHours())}:${pad(now.getMinutes())}`

const autoPicked = !route.query.meal
const meal = ref(route.query.meal || suggestMeal(now))
const query = ref('')

const results = computed(() => foods.search(query.value))

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
    <h1 class="page-title">新增食品</h1>
    <div class="spacer"></div>
  </div>

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
  <p v-if="autoPicked" class="hint">現在 {{ nowText }}，已自動選擇「{{ mealName(meal) }}」</p>

  <label class="search">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
    <input v-model="query" type="search" placeholder="搜尋食品名稱或俗名" aria-label="搜尋食品" />
  </label>

  <div class="results">
    <p v-if="foods.status === 'loading'" class="empty">載入食品資料中…</p>
    <p v-else-if="foods.status === 'error'" class="empty">食品資料載入失敗，請重新整理頁面</p>
    <p v-else-if="!query.trim()" class="empty">輸入食品名稱開始搜尋，例如：吐司、雞蛋、白飯</p>
    <p v-else-if="results.length === 0" class="empty">找不到「{{ query }}」，之後可以新增自訂食品</p>

    <div v-for="f in results" :key="f.id" class="item">
      <div class="item-info">
        <div class="item-name">{{ f.name }}</div>
        <div v-if="f.alias" class="item-alias">俗名：{{ f.alias }}</div>
        <div class="item-meta">
          <span class="portion">每 100 克</span> · {{ Math.round(f.n.kcal ?? 0) }} 卡
          <template v-if="f.unitGrams"> · 1 份 {{ f.unitGrams }} 克</template>
        </div>
      </div>
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
</style> 