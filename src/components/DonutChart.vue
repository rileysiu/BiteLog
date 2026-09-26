<script setup>
import { computed } from 'vue'

const props = defineProps({
  segments: Array, // [{ value, color }]
  size: { type: Number, default: 180 },
  thickness: { type: Number, default: 26 },
})

const r = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * r.value)

const arcs = computed(() => {
  const total = props.segments.reduce((s, x) => s + x.value, 0)
  if (!total) return []
  let used = 0
  return props.segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const len = (s.value / total) * circumference.value
      const arc = { color: s.color, dash: `${len} ${circumference.value - len}`, offset: -used }
      used += len
      return arc
    })
})
</script>

<template>
  <div class="donut" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">
      <circle :cx="size / 2" :cy="size / 2" :r="r" :stroke-width="thickness" style="fill: none; stroke: var(--track)" />
      <circle
        v-for="(a, i) in arcs"
        :key="i"
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        :stroke-width="thickness"
        :stroke-dasharray="a.dash"
        :stroke-dashoffset="a.offset"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
        :style="{ fill: 'none', stroke: a.color }"
      />
    </svg>
    <div class="center"><slot /></div>
  </div>
</template>

<style scoped>
.donut { position: relative; margin: 0 auto; }
.center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
</style>