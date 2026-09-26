<script setup>
import { computed } from 'vue'

const props = defineProps({
  bars: Array, // [{ label, values: [{ value, color }] }]
  ticks: Array,
  height: { type: Number, default: 170 },
})

const max = computed(() => {
  const tallest = Math.max(0, ...props.bars.flatMap((b) => b.values.map((v) => v.value)))
  const top = Math.max(tallest, props.ticks.at(-1))
  const step = props.ticks[1] - props.ticks[0]
  return Math.ceil((top * 1.05) / step) * step
})

const toPx = (v) => (v / max.value) * props.height
const columns = computed(() => `repeat(${props.bars.length}, minmax(0, 1fr))`)
</script>

<template>
  <div class="chart" :style="{ height: height + 28 + 'px' }">
    <div v-for="t in ticks" :key="t" class="tick" :style="{ top: height - toPx(t) + 'px' }">
      <span class="num">{{ t }}</span>
    </div>

    <div class="plot" :style="{ height: height + 'px', gridTemplateColumns: columns }">
      <div v-for="(b, i) in bars" :key="i" class="col">
        <div v-for="(v, j) in b.values" :key="j" class="bar" :style="{ height: toPx(v.value) + 'px', background: v.color }"></div>
      </div>
    </div>

    <div class="labels" :style="{ top: height + 8 + 'px', gridTemplateColumns: columns }">
      <span v-for="(b, i) in bars" :key="i">{{ b.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart { position: relative; }
.tick { position: absolute; left: 0; right: 0; border-top: 1px solid var(--line); }
.tick span { position: absolute; left: 0; width: 34px; text-align: right; transform: translateY(-50%); font-size: 11px; font-weight: 700; color: var(--muted); }
.plot { position: absolute; left: 40px; right: 0; top: 0; display: grid; }
.col { display: flex; justify-content: center; align-items: flex-end; gap: 2px; height: 100%; }
.bar { width: 9px; border-radius: 4px 4px 0 0; }
.labels { position: absolute; left: 40px; right: 0; display: grid; text-align: center; font-size: 11px; color: var(--muted); white-space: nowrap; }
</style>