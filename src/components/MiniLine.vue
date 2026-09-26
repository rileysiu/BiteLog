<script setup>
import { computed } from 'vue'

const props = defineProps({
  values: Array,
  goal: { type: Number, default: null },
  width: { type: Number, default: 170 },
  height: { type: Number, default: 120 },
})

const pad = 8

// 決定上下的範圍：包含所有數值和目標，再上下各留一點空間
const range = computed(() => {
  const all = props.goal ? [...props.values, props.goal] : [...props.values]
  const lo = Math.floor(Math.min(...all) - 0.5)
  const hi = Math.ceil(Math.max(...all) + 0.5)
  return { lo, hi }
})

function toY(v) {
  const { lo, hi } = range.value
  return pad + (1 - (v - lo) / (hi - lo)) * (props.height - pad * 2)
}

const points = computed(() => {
  const n = props.values.length
  return props.values.map((v, i) => ({
    x: n === 1 ? props.width / 2 : pad + (i * (props.width - pad * 2)) / (n - 1),
    y: toY(v),
  }))
})

const line = computed(() => points.value.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const goalY = computed(() => (props.goal ? toY(props.goal) : null))
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
    <line
      v-if="goalY !== null"
      x1="0"
      :x2="width"
      :y1="goalY"
      :y2="goalY"
      style="stroke: #9AA2B3; stroke-width: 1.2; stroke-dasharray: 4 4"
    />
    <polyline
      :points="line"
      style="fill: none; stroke: var(--primary); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round"
    />
    <circle
      v-for="(p, i) in points"
      :key="i"
      :cx="p.x"
      :cy="p.y"
      r="4"
      style="fill: #FFFFFF; stroke: var(--primary); stroke-width: 2.5"
    />
  </svg>
</template>