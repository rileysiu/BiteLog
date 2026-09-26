<script setup>
import { computed } from 'vue'

const props = defineProps({
  values: Array,
  labels: Array,
  color: { type: String, default: 'var(--primary)' },
  height: { type: Number, default: 100 },
  max: { type: Number, default: 0 },
})

// 最高的那根長條，決定整張圖的比例
const top = computed(() => Math.max(props.max, ...props.values, 1))

const bars = computed(() =>
  props.values.map((v, i) => ({
    label: props.labels[i],
    h: Math.round((v / top.value) * props.height),
  }))
)
</script>

<template>
  <div class="bars" :style="{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }">
    <div v-for="(b, i) in bars" :key="i" class="bar">
      <div class="track" :style="{ height: height + 'px' }">
        <div class="fill" :style="{ height: b.h + 'px', background: color }"></div>
      </div>
      <div class="label">{{ b.label }}</div>
    </div>
  </div>
</template>

<style scoped>
.bars { display: grid; gap: 6px; width: 190px; }
.bar { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.track { width: 20px; border-radius: 10px; background: var(--track); display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; }
.fill { width: 20px; border-radius: 10px; }
.label { font-size: 12px; color: var(--muted); }
</style>