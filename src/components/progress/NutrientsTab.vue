<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDiaryStore } from '../../stores/diary'
import { periodDates, isDayPeriod, periodWord } from '../../utils/period'
import { sumNutrients } from '../../utils/stats'
import { NUTRIENT_GROUPS } from '../../utils/nutrients'

const props = defineProps({
  period: String,
})

const diary = useDiaryStore()
const { entries } = storeToRefs(diary)
const periodGoals = computed(() => diary.averageGoals(periodDates(props.period)))

const isDay = computed(() => isDayPeriod(props.period))

const inPeriod = computed(() => {
  const set = new Set(periodDates(props.period))
  return entries.value.filter((e) => set.has(e.date))
})

const loggedDays = computed(() => new Set(inPeriod.value.map((e) => e.date)).size)
const divisor = computed(() => (isDay.value ? 1 : Math.max(1, loggedDays.value)))
const totals = computed(() => sumNutrients(inPeriod.value))

function format(v, unit) {
  if (v === null) return '—'
  if (unit !== 'g' && v >= 10) return Math.round(v).toLocaleString('en-US')
  return (Math.round(v * 10) / 10).toString()
}

const groups = computed(() =>
  NUTRIENT_GROUPS.map((g) => ({
    title: g.title,
    rows: g.items.map((item) => {
      const has = totals.value[item.key] !== undefined
      const value = has ? totals.value[item.key] / divisor.value : null
      const ref = item.ref === 'goal' ? periodGoals.value[item.key] : item.ref
      const pct = ref && value !== null ? (value / ref) * 100 : 0
      return {
        ...item,
        valueText: format(value, item.unit),
        refText: ref ? `/ ${format(ref, item.unit)} ${item.unit}` : '未訂定參考值',
        hasRef: !!ref,
        pct: Math.min(100, pct),
        over: item.limit && pct > 100,
      }
    }),
  }))
)

const note = computed(() =>
  isDay.value ? `${periodWord(props.period)}的攝取量` : `${periodWord(props.period)}每日平均（已記錄 ${loggedDays.value} 天）`
)
</script>

<template>
  <div class="stack">
    <p class="note">{{ note }}</p>

    <p v-if="inPeriod.length === 0" class="card empty">{{ periodWord(period) }}還沒有記錄。</p>

    <template v-else>
      <section v-for="g in groups" :key="g.title" class="card">
        <h2 class="card-title">{{ g.title }}</h2>
        <div v-for="row in g.rows" :key="row.key" class="row">
          <div class="line">
            <span class="label" :class="{ sub: row.sub }">{{ row.label }}</span>
            <span class="num value" :class="{ over: row.over }">{{ row.valueText }} {{ row.unit }}</span>
            <span class="num ref">{{ row.refText }}</span>
          </div>
          <div v-if="row.hasRef" class="track" :class="{ sub: row.sub }">
            <div class="fill" :class="{ over: row.over }" :style="{ width: row.pct + '%' }"></div>
          </div>
        </div>
      </section>

      <p class="note">
        參考值來自衛福部包裝食品營養標示的每日參考值（四歲以上）。部分食品沒有提供某些營養素的資料，實際攝取量可能比顯示的多。
      </p>
    </template>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 12px; }
.note { font-size: 12px; color: var(--muted); line-height: 1.6; margin: 0 6px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 22px 10px; margin: 0; }
.empty { padding: 18px 22px; font-size: 14px; color: var(--muted); }
.card-title { font-size: 16px; font-weight: 900; margin: 0 0 4px; }
.row { padding: 10px 0; border-top: 1px solid var(--line); }
.line { display: flex; align-items: baseline; gap: 8px; }
.label { flex: 1; font-size: 14px; font-weight: 700; }
.label.sub { font-weight: 400; padding-left: 14px; }
.value { font-size: 15px; font-weight: 900; white-space: nowrap; }
.value.over { color: #C2410C; }
.ref { min-width: 72px; text-align: right; font-size: 12px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.track { height: 6px; border-radius: 3px; background: var(--track); overflow: hidden; margin-top: 6px; }
.track.sub { margin-left: 14px; }
.fill { height: 6px; border-radius: 3px; background: var(--primary); }
.fill.over { background: #C2410C; }
</style>