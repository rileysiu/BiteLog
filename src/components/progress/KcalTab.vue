<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDiaryStore } from '../../stores/diary'
import { MEALS, mealName } from '../../utils/meal'
import { periodDates, isDayPeriod, periodWord } from '../../utils/period'
import { fromKey, WEEKDAYS } from '../../utils/date'
import DonutChart from '../DonutChart.vue'
import StackedBars from '../StackedBars.vue'
import RankingList from '../RankingList.vue'

const props = defineProps({
  period: String,
})

const diary = useDiaryStore()
const { entries, goals } = storeToRefs(diary)

const fmt = (n) => Math.round(n).toLocaleString('en-US')
const sumKcal = (list) => list.reduce((s, e) => s + (e.kcal || 0), 0)

const dates = computed(() => periodDates(props.period))
const isDay = computed(() => isDayPeriod(props.period))

const inPeriod = computed(() => {
  const set = new Set(dates.value)
  return entries.value.filter((e) => set.has(e.date))
})

const total = computed(() => sumKcal(inPeriod.value))
const loggedDays = computed(() => new Set(inPeriod.value.map((e) => e.date)).size)

const head = computed(() => {
  if (isDay.value) {
    const diff = goals.value.kcal - total.value
    return {
      label: `${periodWord(props.period)}攝取`,
      sub: `目標 ${fmt(goals.value.kcal)} · ${diff >= 0 ? '剩餘' : '超出'} ${fmt(Math.abs(diff))}`,
      over: diff < 0,
    }
  }
  return {
    label: `${periodWord(props.period)}總攝取`,
    sub: loggedDays.value
      ? `每日平均 ${fmt(total.value / loggedDays.value)} · 已記錄 ${loggedDays.value} 天`
      : '這一週還沒有記錄',
    over: false,
  }
})

// 各餐別的卡路里
const mealSplit = computed(() =>
  MEALS.map((m) => ({ ...m, kcal: sumKcal(inPeriod.value.filter((e) => e.meal === m.key)) }))
)
const maxMeal = computed(() => Math.max(1, ...mealSplit.value.map((m) => m.kcal)))

// 一週的長條：每天一根，依餐別分色
const bars = computed(() =>
  dates.value.map((date) => {
    const d = fromKey(date)
    const list = entries.value.filter((e) => e.date === date)
    return {
      label: `${WEEKDAYS[d.getDay()]}${d.getDate()}`,
      segments: MEALS.map((m) => ({ value: sumKcal(list.filter((e) => e.meal === m.key)), color: m.color })),
    }
  })
)

// 排行榜：單日依每筆記錄；一週把同一種食品加總
const ranking = computed(() => {
  if (isDay.value) {
    return [...inPeriod.value]
      .sort((a, b) => b.kcal - a.kcal)
      .slice(0, 10)
      .map((e) => ({ name: e.name, sub: `${mealName(e.meal)} · ${e.portion}`, value: `${fmt(e.kcal)} 卡` }))
  }
  const groups = new Map()
  for (const e of inPeriod.value) {
    const key = e.foodId || e.name
    const g = groups.get(key) ?? { name: e.name, times: 0, kcal: 0 }
    g.times++
    g.kcal += e.kcal || 0
    groups.set(key, g)
  }
  return [...groups.values()]
    .sort((a, b) => b.kcal - a.kcal)
    .slice(0, 10)
    .map((g) => ({ name: g.name, sub: `${periodWord(props.period)}吃了 ${g.times} 次`, value: `${fmt(g.kcal)} 卡` }))
})
</script>

<template>
  <div class="stack">
    <section class="card">
      <div class="head">
        <div class="head-label">{{ head.label }}</div>
        <div class="num head-value">{{ fmt(total) }} <span class="unit">卡</span></div>
        <div class="head-sub" :class="{ over: head.over }">{{ head.sub }}</div>
      </div>

      <DonutChart v-if="isDay" :segments="mealSplit.map((m) => ({ value: m.kcal, color: m.color }))">
        <span class="donut-label">餐別分布</span>
      </DonutChart>

      <template v-else>
        <div class="legend">
          <span v-for="m in MEALS" :key="m.key"><i :style="{ background: m.color }"></i>{{ m.name }}</span>
          <span><i class="dash"></i>目標</span>
        </div>
        <StackedBars :bars="bars" :ticks="[0, 500, 1000, 1500, 2000]" :goal="goals.kcal" />
      </template>

      <div class="meals">
        <div v-for="m in mealSplit" :key="m.key" class="meal-row">
          <div class="meal-line">
            <span class="dot" :style="{ background: m.color }"></span>
            <span class="meal-name">{{ m.name }}</span>
            <span class="pct">{{ total ? Math.round((m.kcal / total) * 100) : 0 }}%</span>
            <span class="num meal-kcal">{{ fmt(m.kcal) }}</span>
          </div>
          <div class="track"><div class="fill" :style="{ width: (m.kcal / maxMeal) * 100 + '%', background: m.color }"></div></div>
        </div>
      </div>
    </section>

    <RankingList
      title="卡路里排行榜"
      :items="ranking"
      :empty-text="`${periodWord(period)}還沒有記錄`"
    />
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 12px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 16px; display: flex; flex-direction: column; gap: 16px; }
.head { padding-left: 6px; }
.head-label { font-size: 13px; color: var(--muted); }
.head-value { font-size: 30px; font-weight: 900; margin: 2px 0; }
.unit { font-family: 'Huninn', sans-serif; font-size: 16px; }
.head-sub { font-size: 13px; color: var(--muted); }
.head-sub.over { color: #C2410C; }
.donut-label { font-size: 12px; color: var(--muted); }
.legend { display: flex; flex-wrap: wrap; gap: 12px; padding-left: 6px; font-size: 11px; color: var(--muted); }
.legend span { display: flex; align-items: center; gap: 4px; }
.legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.legend i.dash { width: 14px; height: 0; border-top: 2px dashed var(--muted); border-radius: 0; }
.meals { display: flex; flex-direction: column; gap: 12px; padding: 0 6px; }
.meal-line { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.dot { width: 10px; height: 10px; border-radius: 5px; }
.meal-name { flex: 1; }
.pct { font-size: 12px; color: var(--muted); }
.meal-kcal { width: 58px; text-align: right; font-weight: 900; }
.track { height: 8px; border-radius: 4px; background: var(--track); overflow: hidden; margin-top: 6px; }
.fill { height: 8px; border-radius: 4px; }
</style>