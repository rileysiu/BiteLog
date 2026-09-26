<script setup>
import { computed } from 'vue'
import { diffDays, fromKey } from '../utils/date'

const props = defineProps({
  points: Array, // [{ date, value }]，要依日期排好
  goal: { type: Number, default: null },
})

// 圖的尺寸和四周留白（左邊放刻度、下面放兩排日期）
const W = 320
const H = 208
const LEFT = 36
const RIGHT = 12
const TOP = 10
const BOTTOM = 44
const plotW = W - LEFT - RIGHT
const plotH = H - TOP - BOTTOM
const AXIS_Y = TOP + plotH // 圖表底線的位置

// 兩排日期的位置：上排和下排
const ROWS = [
  { tickEnd: AXIS_Y + 5, textY: AXIS_Y + 17 },
  { tickEnd: AXIS_Y + 21, textY: AXIS_Y + 33 },
]

const range = computed(() => {
  const all = props.points.map((p) => p.value)
  if (props.goal) all.push(props.goal)
  return { lo: Math.floor(Math.min(...all) - 0.5), hi: Math.ceil(Math.max(...all) + 0.5) }
})

const first = computed(() => props.points[0]?.date)
const span = computed(() => (props.points.length > 1 ? diffDays(props.points.at(-1).date, first.value) || 1 : 1))

// 橫軸依照實際日期排列
function toX(date) {
  if (props.points.length === 1) return LEFT + plotW / 2
  return LEFT + (diffDays(date, first.value) / span.value) * plotW
}

function toY(v) {
  const { lo, hi } = range.value
  return TOP + (1 - (v - lo) / (hi - lo)) * plotH
}

const dots = computed(() => props.points.map((p) => ({ x: toX(p.date), y: toY(p.value) })))
const line = computed(() => dots.value.map((d) => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' '))

const ticks = computed(() => {
  const { lo, hi } = range.value
  return [hi, (lo + hi) / 2, lo].map((v) => ({ y: toY(v), label: Math.round(v * 10) / 10 }))
})

// 日期標籤最多顯示 5 個，平均分布；依序輪流放在上排、下排
const xLabels = computed(() => {
  const n = props.points.length
  const picks = n <= 5 ? props.points.map((_, i) => i) : [0, 1, 2, 3, 4].map((k) => Math.round((k * (n - 1)) / 4))
  return [...new Set(picks)].map((i, order) => {
    const d = fromKey(props.points[i].date)
    return {
      x: toX(props.points[i].date),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      row: ROWS[order % 2],
    }
  })
})

const goalY = computed(() => (props.goal ? toY(props.goal) : null))
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" aria-label="體重變化曲線">
    <g v-for="(t, i) in ticks" :key="'t' + i">
      <line :x1="LEFT" :x2="W - RIGHT" :y1="t.y" :y2="t.y" style="stroke: var(--line); stroke-width: 1" />
      <text :x="LEFT - 6" :y="t.y + 3.5" text-anchor="end" class="axis">{{ t.label }}</text>
    </g>

    <line
      v-if="goalY !== null"
      :x1="LEFT"
      :x2="W - RIGHT"
      :y1="goalY"
      :y2="goalY"
      style="stroke: var(--muted); stroke-width: 1.5; stroke-dasharray: 5 4"
    />

    <polyline :points="line" style="fill: none; stroke: var(--primary); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round" />
    <circle v-for="(d, i) in dots" :key="'d' + i" :cx="d.x" :cy="d.y" r="4" style="fill: #FFFFFF; stroke: var(--primary); stroke-width: 2.5" />

    <g v-for="(l, i) in xLabels" :key="'x' + i">
      <line :x1="l.x" :x2="l.x" :y1="AXIS_Y" :y2="l.row.tickEnd" style="stroke: var(--muted); stroke-width: 1" />
      <text :x="l.x" :y="l.row.textY" text-anchor="middle" class="axis">{{ l.label }}</text>
    </g>
  </svg>
</template>

<style scoped>
.chart { width: 100%; height: auto; display: block; }
.axis { font-size: 10px; font-weight: 700; fill: var(--muted); font-family: 'Nunito', sans-serif; }
</style>