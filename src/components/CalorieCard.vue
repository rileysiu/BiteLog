<script setup>
import { computed } from 'vue'

const props = defineProps({
  eaten: Number,
  goal: Number,
})

const isOver = computed(() => props.eaten > props.goal)
const leftAmount = computed(() => Math.abs(props.goal - props.eaten))
const percent = computed(() => Math.min(100, (props.eaten / props.goal) * 100))

const fmt = (n) => Math.round(n).toLocaleString('en-US')
</script>

<template>
  <section class="card">
    <div class="label">卡路里</div>
    <div class="row">
      <div class="main">
        <span class="num big">{{ fmt(eaten) }}</span>
        <span class="unit">卡</span>
        <span class="num goal">/ {{ fmt(goal) }}</span>
      </div>
      <div class="remain">
        <span class="num mid" :class="{ over: isOver }">{{ fmt(leftAmount) }}</span>
        <span class="small">{{ isOver ? '超出' : '剩餘' }}</span>
      </div>
    </div>
    <div class="track">
      <div class="fill" :style="{ width: percent + '%' }"></div>
    </div>
  </section>
</template>

<style scoped>
.card { background: #FFFFFF; border-radius: 24px; padding: 20px 22px; }
.label { font-size: 15px; font-weight: 700; margin-bottom: 12px; }
.row { display: flex; justify-content: space-between; align-items: baseline; }
.main { display: flex; align-items: baseline; gap: 6px; }
.big { font-size: 30px; font-weight: 900; }
.unit { font-size: 18px; font-weight: 900; }
.goal { font-size: 15px; color: var(--muted); font-weight: 700; }
.remain { display: flex; align-items: baseline; gap: 4px; white-space: nowrap; }
.mid { font-size: 22px; font-weight: 900; }
.small { font-size: 12px; color: var(--muted); }
.over { color: #C2410C; }
.track { height: 10px; border-radius: 5px; background: var(--track); overflow: hidden; margin-top: 14px; }
.fill { height: 10px; border-radius: 5px; background: var(--primary); }
</style>