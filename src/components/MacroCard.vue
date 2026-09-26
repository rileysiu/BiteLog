<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  totals: Object,
  goals: Object,
})

const mode = ref(0)
const modeNames = ['已攝取／目標', '剩餘攝取量', '目前攝取比例']

function nextMode() {
  mode.value = (mode.value + 1) % 3
}

const macros = [
  { key: 'carb', label: '碳水', color: 'var(--carb)' },
  { key: 'fat', label: '脂肪', color: 'var(--fat)' },
  { key: 'protein', label: '蛋白', color: 'var(--protein)' },
]

const items = computed(() => {
  return macros.map((m) => {
    const eaten = props.totals[m.key]
    const goal = props.goals[m.key]
    const over = eaten > goal
    let main = ''
    let aux = ''

    if (mode.value === 0) {
      main = Math.round(eaten) + ' g'
      aux = '/ ' + goal
    } else if (mode.value === 1) {
      main = Math.round(Math.abs(goal - eaten)) + ' g'
      aux = over ? '超出' : '剩餘'
    } else {
      main = Math.round((eaten / goal) * 100) + '%'
    }

    return { ...m, main, aux, over, percent: Math.min(100, (eaten / goal) * 100) }
  })
})
</script>

<template>
  <section class="card">
    <div class="grid">
      <div v-for="m in items" :key="m.key" class="item">
        <div class="label">{{ m.label }}</div>
        <div class="value">
          <span class="num main" :class="{ over: m.over }">{{ m.main }}</span>
          <span class="num aux">{{ m.aux }}</span>
        </div>
        <div class="track">
          <div class="fill" :style="{ width: m.percent + '%', background: m.color }"></div>
        </div>
      </div>
    </div>
    <button class="toggle" @click="nextMode" :aria-label="'切換顯示方式，目前為' + modeNames[mode]">
      <span class="circle">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-3-3M20 16H6l3 3" /></svg>
      </span>
    </button>
  </section>
</template>

<style scoped>
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 10px 20px 22px; display: flex; align-items: flex-start; gap: 6px; }
.grid { flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.item { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.label { font-size: 13px; font-weight: 700; }
.value { display: flex; align-items: baseline; gap: 4px; white-space: nowrap; }
.main { font-size: 19px; font-weight: 900; }
.aux { font-size: 12px; color: var(--muted); font-weight: 700; }
.over { color: #C2410C; }
.track { height: 8px; border-radius: 4px; background: var(--track); overflow: hidden; }
.fill { height: 8px; border-radius: 4px; }
.toggle { width: 44px; height: 44px; margin-top: -10px; border: 0; background: transparent; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--ink); }
.circle { width: 30px; height: 30px; border-radius: 15px; background: var(--bg); display: flex; align-items: center; justify-content: center; }
</style>