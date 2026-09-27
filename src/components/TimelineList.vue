<script setup>
import { computed } from 'vue'

const props = defineProps({
  entries: Array,
})

const mealInfo = {
  breakfast: { name: '早餐', bg: '#FBEFD9', fg: '#7F520C' },
  lunch: { name: '午餐', bg: '#DDF2EF', fg: '#1C625B' },
  dinner: { name: '晚餐', bg: '#E4E6FA', fg: '#373A94' },
  snack: { name: '點心', bg: '#FBE4EC', fg: '#922C55' },
}

const rows = computed(() => {
  const sorted = [...props.entries].sort((a, b) => a.time.localeCompare(b.time))
  return sorted.map((e, i) => ({
    ...e,
    showTime: i === 0 || e.time !== sorted[i - 1].time,
    meal: mealInfo[e.meal],
  }))
})

const r1 = (n) => Math.round(n * 10) / 10
const macroLine = (o) => {
  const parts = [['碳水', o.carb], ['脂肪', o.fat], ['蛋白', o.protein]]
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([label, v]) => `${label} ${r1(v)}g`)
  return parts.length ? parts.join(' · ') : '沒有填主要營養素'
}

const linkTo = (item) =>
  item.source === 'quick' ? { name: 'editQuick', params: { id: item.id } } : { name: 'editEntry', params: { id: item.id } }
</script>

<template>
  <section class="card">
    <div v-if="rows.length === 0" class="empty">這一天還沒有記錄</div>
    <RouterLink
      v-for="(row, i) in rows"
      :key="row.id"
      :to="linkTo(row)"
      class="row"
      :class="{ divider: row.showTime && i > 0 }"
    >
      <div class="num time">{{ row.showTime ? row.time : '' }}</div>
      <div class="info">
        <div class="tags">
          <span class="chip" :style="{ background: row.meal.bg, color: row.meal.fg }">{{ row.meal.name }}</span>
          <span class="portion">{{ row.portion }}</span>
        </div>
        <div class="name">{{ row.name }}</div>
        <div class="macro">{{ macroLine(row) }}</div>
      </div>
      <div class="num kcal">{{ row.kcal }}</div>
    </RouterLink>
  </section>
</template>

<style scoped>
.card { background: #FFFFFF; border-radius: 24px; padding: 6px 0; }
.empty { padding: 20px 22px; font-size: 14px; color: var(--muted); }
.row { display: flex; gap: 12px; padding: 12px 20px; align-items: flex-start; text-decoration: none; color: inherit; }
.divider { border-top: 1px solid var(--line); }
.time { width: 46px; flex-shrink: 0; font-size: 15px; font-weight: 800; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.tags { display: flex; align-items: center; gap: 8px; }
.chip { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }
.portion { font-size: 12px; color: var(--text-accent); font-weight: 700; }
.name { font-size: 15px; font-weight: 500; }
.macro { font-size: 12px; color: var(--muted); }
.kcal { font-size: 16px; font-weight: 800; }
</style>