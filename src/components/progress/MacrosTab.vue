<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDiaryStore } from '../../stores/diary'
import { periodDates, isDayPeriod, periodWord } from '../../utils/period'
import { sumEntries, aggregateFoods } from '../../utils/stats'
import { mealName } from '../../utils/meal'
import { fromKey, WEEKDAYS } from '../../utils/date'
import DonutChart from '../DonutChart.vue'
import GroupedBars from '../GroupedBars.vue'
import RankingList from '../RankingList.vue'

const props = defineProps({
  period: String,
})

const diary = useDiaryStore()
const { entries, goals } = storeToRefs(diary)

const MACROS = [
  { key: 'carb', label: '碳水', color: 'var(--carb)', factor: 4 },
  { key: 'fat', label: '脂肪', color: 'var(--fat)', factor: 9 },
  { key: 'protein', label: '蛋白', color: 'var(--protein)', factor: 4 },
]

const r1 = (v) => Math.round(v * 10) / 10

const dates = computed(() => periodDates(props.period))
const isDay = computed(() => isDayPeriod(props.period))

const inPeriod = computed(() => {
  const set = new Set(dates.value)
  return entries.value.filter((e) => set.has(e.date))
})
const loggedDays = computed(() => new Set(inPeriod.value.map((e) => e.date)).size)

// 單日看總量，一週看每日平均
const amounts = computed(() => {
  const total = sumEntries(inPeriod.value)
  const d = isDay.value ? 1 : Math.max(1, loggedDays.value)
  return { carb: total.carb / d, fat: total.fat / d, protein: total.protein / d }
})

// 各營養素提供的卡路里，用來算比例
const kcalShares = computed(() => MACROS.map((m) => amounts.value[m.key] * m.factor))
const kcalTotal = computed(() => kcalShares.value.reduce((s, v) => s + v, 0))

const legend = computed(() =>
  MACROS.map((m, i) => {
    const value = amounts.value[m.key]
    const goal = goals.value[m.key]
    return {
      ...m,
      value: Math.round(value),
      goal,
      share: kcalTotal.value ? Math.round((kcalShares.value[i] / kcalTotal.value) * 100) : 0,
      pct: Math.min(100, (value / goal) * 100),
      over: value > goal,
    }
  })
)

const bars = computed(() =>
  dates.value.map((date) => {
    const d = fromKey(date)
    const t = sumEntries(entries.value.filter((e) => e.date === date))
    return {
      label: `${WEEKDAYS[d.getDay()]}${d.getDate()}`,
      values: MACROS.map((m) => ({ value: t[m.key], color: m.color })),
    }
  })
)

const rankings = computed(() => {
  const source = isDay.value ? inPeriod.value : aggregateFoods(inPeriod.value)
  return MACROS.map((m) => ({
    ...m,
    items: [...source]
      .sort((a, b) => (b[m.key] || 0) - (a[m.key] || 0))
      .slice(0, 5)
      .map((x) => ({
        name: x.name,
        sub: isDay.value ? `${mealName(x.meal)} · ${x.portion}` : `${periodWord(props.period)}吃了 ${x.times} 次`,
        value: `${r1(x[m.key] || 0)} g`,
      })),
  }))
})

const title = computed(() =>
  isDay.value ? `${periodWord(props.period)}的主要營養素` : `${periodWord(props.period)}每日攝取（克）`
)
</script>

<template>
  <div class="stack">
    <section class="card">
      <h2 class="card-title">{{ title }}</h2>

      <DonutChart v-if="isDay" :segments="MACROS.map((m, i) => ({ value: kcalShares[i], color: m.color }))">
        <span class="donut-label">卡路里來源</span>
      </DonutChart>

      <template v-else>
        <div class="legend-chips">
          <span v-for="m in MACROS" :key="m.key"><i :style="{ background: m.color }"></i>{{ m.label }}</span>
        </div>
        <GroupedBars :bars="bars" :ticks="[0, 100, 200, 300]" />
      </template>

      <p v-if="!isDay" class="note">
        {{ loggedDays ? `以下為每日平均（已記錄 ${loggedDays} 天）` : `${periodWord(period)}還沒有記錄` }}
      </p>

      <div class="legend">
        <div v-for="m in legend" :key="m.key" class="legend-row">
          <div class="legend-line">
            <span class="dot" :style="{ background: m.color }"></span>
            <span class="legend-label">{{ m.label }}</span>
            <span class="share">佔卡路里 {{ m.share }}%</span>
            <span class="num legend-value" :class="{ over: m.over }">{{ m.value }} g</span>
            <span class="num legend-goal">/ {{ m.goal }} g</span>
          </div>
          <div class="track"><div class="fill" :style="{ width: m.pct + '%', background: m.color }"></div></div>
        </div>
      </div>
    </section>

    <RankingList
      v-for="r in rankings"
      :key="r.key"
      :title="`${r.label}排行榜`"
      :items="r.items"
      :empty-text="`${periodWord(period)}還沒有記錄`"
    >
      <template #icon>
        <span class="dot" :style="{ background: r.color }"></span>
      </template>
    </RankingList>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 12px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 16px; display: flex; flex-direction: column; gap: 14px; }
.card-title { font-size: 16px; font-weight: 900; margin: 0; padding-left: 6px; }
.donut-label { font-size: 12px; color: var(--muted); }
.legend-chips { display: flex; gap: 12px; padding-left: 6px; font-size: 11px; color: var(--muted); }
.legend-chips span { display: flex; align-items: center; gap: 4px; }
.legend-chips i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.note { font-size: 12px; color: var(--muted); margin: 0 6px; }
.legend { display: flex; flex-direction: column; gap: 12px; padding: 0 6px; }
.legend-line { display: flex; align-items: baseline; gap: 8px; font-size: 14px; }
.dot { width: 10px; height: 10px; border-radius: 5px; display: inline-block; flex-shrink: 0; }
.legend-label { flex: 1; font-weight: 700; }
.share { font-size: 12px; color: var(--muted); white-space: nowrap; }
.legend-value { font-weight: 900; white-space: nowrap; }
.legend-value.over { color: #C2410C; }
.legend-goal { font-size: 12px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.track { height: 8px; border-radius: 4px; background: var(--track); overflow: hidden; margin-top: 6px; }
.fill { height: 8px; border-radius: 4px; }
</style>