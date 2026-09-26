<script setup>
import { computed } from 'vue'

const props = defineProps({
  bars: Array, // [{ label, segments: [{ value, color }] }]
  ticks: Array, // 左側刻度，例如 [0, 500, 1000, 1500, 2000]
  goal: { type: Number, default: 0 },
  height: { type: Number, default: 170 },
})

// 圖表的最大值：取「最高的長條、目標、最大刻度」中最大的，再留一點空間
const max = computed(() => {
  const tallest = Math.max(0, ...props.bars.map((b) => b.segments.reduce((s, x) => s + x.value, 0)))
  const top = Math.max(tallest, props.goal, props.ticks.at(-1))
  const step = props.ticks[1] - props.ticks[0]
  return Math.ceil((top * 1.1) / step) * step
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
        <div class="stack">
          <div v-for="(s, j) in b.segments" :key="j" :style="{ height: toPx(s.value) + 'px', background: s.color }"></div>
        </div>
      </div>
    </div>

    <div v-if="goal" class="goal" :style="{ top: height - toPx(goal) + 'px' }"></div>

    <div class="labels" :style="{ top: height + 8 + 'px', gridTemplateColumns: columns }">
      <span v-for="(b, i) in bars" :key="i">{{ b.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart { position: relative; }
.tick { position: absolute; left: 0; right: 0; border-top: 1px solid var(--line); }
.tick span { position: absolute; left: 0; width: 34px; text-align: right; transform: translateY(-50%); font-size: 11px; font-weight: 700; color: var(--muted); }
.plot { position: absolute; left: 40px; right: 0; top: 0; display: grid; align-items: end; }
.col { display: flex; justify-content: center; align-items: flex-end; height: 100%; }
.stack { width: 24px; display: flex; flex-direction: column-reverse; border-radius: 7px 7px 0 0; overflow: hidden; }
.goal { position: absolute; left: 40px; right: 0; border-top: 2px dashed var(--muted); pointer-events: none; }
.labels { position: absolute; left: 40px; right: 0; display: grid; text-align: center; font-size: 11px; color: var(--muted); white-space: nowrap; }
</style>