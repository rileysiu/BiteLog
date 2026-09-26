<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const props = defineProps({
  title: String,
  mealKey: String,
  items: Array,
})

const router = useRouter()

const open = ref(true)

const hasItems = computed(() => props.items.length > 0)

const sum = computed(() =>
  props.items.reduce(
    (s, e) => ({
      kcal: s.kcal + e.kcal,
      carb: s.carb + e.carb,
      fat: s.fat + e.fat,
      protein: s.protein + e.protein,
    }),
    { kcal: 0, carb: 0, fat: 0, protein: 0 }
  )
)

const summary = computed(() =>
  hasItems.value ? `${props.items.length} 項 · ${Math.round(sum.value.kcal)} 卡` : '尚未記錄'
)

const r1 = (n) => Math.round(n * 10) / 10
const macroLine = (o) => `碳水 ${r1(o.carb)}g · 脂肪 ${r1(o.fat)}g · 蛋白 ${r1(o.protein)}g`
</script>

<template>
  <section class="card">
    <div class="head">
      <div class="info">
        <div class="title">{{ title }}</div>
        <div class="summary">{{ summary }}</div>
      </div>
      <button
        v-if="hasItems"
        class="icon-btn"
        @click="open = !open"
        :aria-expanded="open"
        :aria-label="(open ? '收合' : '展開') + title"
      >
        <svg :class="{ flipped: open }" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <button class="record-btn" @click="router.push({ path: '/add', query: { meal: mealKey } })">記錄</button>
    </div>

    <div v-if="hasItems && open" class="body">
      <RouterLink v-for="item in items" :key="item.id" :to="{ name: 'editEntry', params: { id: item.id } }" class="item">
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-portion">{{ item.portion }}</div>
          <div class="item-macro">{{ macroLine(item) }}</div>
        </div>
        <div class="num item-kcal">{{ item.kcal }}</div>
      </RouterLink>

      <div class="foot">
        <div class="item-macro">{{ macroLine(sum) }}</div>
        <div class="actions">
          <button class="chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
            複製
          </button>
          <button class="chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v16l-6-4-6 4z" /></svg>
            儲存
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card { background: #FFFFFF; border-radius: 24px; padding: 14px 14px 14px 22px; }
.head { display: flex; align-items: center; gap: 6px; }
.info { flex: 1; min-width: 0; }
.title { font-size: 18px; font-weight: 900; }
.summary { font-size: 13px; color: var(--muted); margin-top: 2px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: transparent; color: var(--muted); padding: 0; display: flex; align-items: center; justify-content: center; }
.icon-btn svg { transition: transform 0.2s; }
.flipped { transform: rotate(180deg); }
.record-btn { height: 44px; padding: 0 20px; border: 0; border-radius: 22px; background: var(--soft); color: var(--text-accent); font-size: 15px; font-weight: 700; }
.body { margin: 8px 8px 0 0; }
.item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); text-decoration: none; color: inherit; }
.item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.item-name { font-size: 15px; font-weight: 500; }
.item-portion { font-size: 12px; color: var(--text-accent); font-weight: 700; }
.item-macro { font-size: 12px; color: var(--muted); }
.item-kcal { font-size: 16px; font-weight: 800; }
.foot { border-top: 1px solid var(--line); padding-top: 10px; display: flex; flex-direction: column; gap: 10px; }
.actions { display: flex; gap: 8px; }
.chip { height: 36px; padding: 0 12px; border: 0; border-radius: 18px; background: var(--bg); color: var(--ink); font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 5px; }
</style>