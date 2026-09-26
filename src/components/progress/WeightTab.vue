<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWeightStore } from '../../stores/weight'
import { useDiaryStore } from '../../stores/diary'
import { todayKey, addDays, fromKey } from '../../utils/date'
import LineChart from '../LineChart.vue'

const router = useRouter()
const weight = useWeightStore()
const diary = useDiaryStore()
const { records } = storeToRefs(weight)
const { goalSettings } = storeToRefs(diary)

const r1 = (v) => Math.round(v * 10) / 10
const shortDate = (key) => {
  const d = fromKey(key)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const start = computed(() => records.value[0] ?? null)
const current = computed(() => records.value.at(-1) ?? null)
const goal = computed(() => goalSettings.value.weightGoal)

const changeText = computed(() => {
  if (!start.value || !current.value) return ''
  const d = r1(current.value.kg - start.value.kg)
  if (d < 0) return `已減 ${Math.abs(d).toFixed(1)} 公斤`
  if (d > 0) return `已增 ${d.toFixed(1)} 公斤`
  return '和起始相同'
})

// 從起始到目標，已經完成多少（減重和增重都適用）
const progress = computed(() => {
  if (!goal.value || !start.value || !current.value) return 0
  const total = start.value.kg - goal.value
  if (total === 0) return 100
  const done = start.value.kg - current.value.kg
  return Math.min(100, Math.max(0, (done / total) * 100))
})

const RANGES = [
  { key: '30', label: '30 天' },
  { key: '90', label: '90 天' },
  { key: 'all', label: '全部' },
]
const range = ref('90')

const shown = computed(() => {
  if (range.value === 'all') return records.value
  const from = addDays(todayKey(), -Number(range.value))
  return records.value.filter((r) => r.date >= from)
})

const history = computed(() =>
  records.value
    .map((r, i) => {
      const prev = records.value[i - 1]
      const d = prev ? r1(r.kg - prev.kg) : null
      return { ...r, diff: d === null ? '起始' : `${d > 0 ? '+' : ''}${d.toFixed(1)}` }
    })
    .reverse()
)
</script>

<template>
  <div v-if="!current" class="card empty-card">
    <p class="muted">還沒有體重記錄。記錄之後，這裡會顯示你的體重變化。</p>
    <RouterLink to="/weight" class="main-link">記錄體重</RouterLink>
  </div>

  <div v-else class="stack">
    <section class="card">
      <div class="summary">
        <div>
          <div class="label">目前體重</div>
          <div class="num big">{{ current.kg }} <span class="unit">公斤</span></div>
        </div>
        <div v-if="goal" class="right">
          <div class="label">目標 {{ goal }} 公斤</div>
          <div class="strong">還差 {{ Math.abs(r1(current.kg - goal)).toFixed(1) }} 公斤</div>
        </div>
        <RouterLink v-else to="/goals" class="small-link">設定目標體重</RouterLink>
      </div>

      <template v-if="goal">
        <div class="track"><div class="fill" :style="{ width: progress + '%' }"></div></div>
        <div class="progress-labels">
          <span>起始 {{ start.kg }}</span>
          <span>{{ changeText }}</span>
          <span>目標 {{ goal }}</span>
        </div>
      </template>
      <p v-else class="muted">起始 {{ start.kg }} 公斤 · {{ changeText }}</p>

      <RouterLink to="/weight" class="main-link">記錄體重</RouterLink>
    </section>

    <section class="card">
      <div class="chart-head">
        <h2 class="card-title">體重變化</h2>
        <div class="ranges">
          <button
            v-for="r in RANGES"
            :key="r.key"
            :class="{ active: range === r.key }"
            :aria-pressed="range === r.key"
            @click="range = r.key"
          >
            {{ r.label }}
          </button>
        </div>
      </div>
      <LineChart v-if="shown.length" :points="shown.map((r) => ({ date: r.date, value: r.kg }))" :goal="goal" />
      <p v-else class="muted">這段期間沒有體重記錄。</p>
      <p v-if="goal" class="muted">虛線是目標體重。</p>
    </section>

    <section class="card list">
      <h2 class="card-title">歷史記錄</h2>
      <button
        v-for="r in history"
        :key="r.date"
        class="row"
        @click="router.push({ name: 'weight', query: { date: r.date } })"
      >
        <span class="row-date">{{ shortDate(r.date) }}</span>
        <span class="row-diff">{{ r.diff }}</span>
        <span class="num row-kg">{{ r.kg }} <span class="unit small">公斤</span></span>
      </button>
    </section>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 12px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
.empty-card { align-items: flex-start; }
.card-title { font-size: 16px; font-weight: 900; margin: 0; }
.muted { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.6; }
.summary { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.label { font-size: 13px; color: var(--muted); }
.big { font-size: 32px; font-weight: 900; margin-top: 4px; }
.unit { font-family: 'Huninn', sans-serif; font-size: 16px; }
.unit.small { font-size: 12px; font-weight: 500; }
.right { text-align: right; }
.strong { font-size: 13px; font-weight: 700; margin-top: 4px; }
.track { height: 10px; border-radius: 5px; background: var(--track); overflow: hidden; }
.fill { height: 10px; border-radius: 5px; background: var(--primary); }
.progress-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); }
.main-link { height: 52px; border-radius: 26px; background: var(--primary); color: var(--on-primary); font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center; text-decoration: none; align-self: stretch; }
.small-link { height: 40px; padding: 0 16px; border-radius: 20px; background: var(--soft); color: var(--text-accent); font-size: 13px; font-weight: 700; display: flex; align-items: center; text-decoration: none; white-space: nowrap; }
.chart-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ranges { display: flex; gap: 2px; padding: 3px; background: var(--bg); border-radius: 18px; }
.ranges button { height: 34px; padding: 0 10px; border: 0; border-radius: 17px; background: transparent; color: var(--muted); font-size: 12px; font-weight: 700; }
.ranges button.active { background: var(--primary); color: var(--on-primary); }
.list { gap: 0; padding-bottom: 8px; }
.list .card-title { margin-bottom: 6px; }
.row { display: flex; align-items: center; min-height: 52px; border: 0; border-top: 1px solid var(--line); background: transparent; padding: 0; color: var(--ink); font-size: 14px; text-align: left; }
.row-date { flex: 1; }
.row-diff { width: 60px; text-align: right; font-size: 12px; color: var(--muted); }
.row-kg { width: 90px; text-align: right; font-size: 16px; font-weight: 900; }
</style>