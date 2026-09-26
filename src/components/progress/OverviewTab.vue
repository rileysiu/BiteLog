<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDiaryStore } from '../../stores/diary'
import { useWeightStore } from '../../stores/weight'
import { todayKey, fromKey, WEEKDAYS } from '../../utils/date'
import { dateRange, dailyTotals, averageOfLogged } from '../../utils/stats'
import MiniBars from '../MiniBars.vue'
import MiniLine from '../MiniLine.vue'

const emit = defineEmits(['go'])

const diary = useDiaryStore()
const weight = useWeightStore()
const { entries, goals, goalSettings } = storeToRefs(diary)
const { records } = storeToRefs(weight)

// 最近 7 天（含今天）
const days = computed(() => dailyTotals(entries.value, dateRange(todayKey(), 7)))
const labels = computed(() => days.value.map((d) => WEEKDAYS[fromKey(d.date).getDay()]))
const loggedCount = computed(() => days.value.filter((d) => d.logged).length)
const avgKcal = computed(() => Math.round(averageOfLogged(days.value, 'kcal')))

const macroRows = [
  { key: 'carb', label: '碳水', color: 'var(--carb)', text: '#1C7A71' },
  { key: 'fat', label: '脂肪', color: 'var(--fat)', text: '#7437AE' },
  { key: 'protein', label: '蛋白', color: 'var(--protein)', text: '#9A620E' },
]

const weightInfo = computed(() => {
  const list = records.value
  if (list.length === 0) return null
  const start = list[0]
  const current = list.at(-1)
  const change = Math.round((current.kg - start.kg) * 10) / 10
  return { start, current, change, recent: list.slice(-10).map((r) => r.kg) }
})

const shortDate = (key) => {
  const d = fromKey(key)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
const fmt = (n) => Math.round(n).toLocaleString('en-US')
const arrow = (n) => (n > 0 ? '↑ ' : n < 0 ? '↓ ' : '')
</script>

<template>
  <div class="stack">
    <section class="card">
      <div class="card-head">
        <h2 class="card-title">卡路里</h2>
        <button class="go-btn" @click="emit('go', 'kcal')" aria-label="查看卡路里詳情">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      <div class="body">
        <div class="stat">
          <div class="stat-label">7 天平均</div>
          <div v-if="loggedCount" class="num stat-value">{{ fmt(avgKcal) }} <span class="stat-unit">卡</span></div>
          <div v-else class="stat-empty">最近 7 天還沒有記錄</div>
        </div>
        <MiniBars :values="days.map((d) => d.kcal)" :labels="labels" :max="goals.kcal" />
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">體重</h2>
        <button class="go-btn" @click="emit('go', 'weight')" aria-label="查看體重詳情">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      <div v-if="weightInfo" class="body">
        <div class="weight-stats">
          <div>
            <div class="stat-label">起始</div>
            <div class="num small-value">{{ weightInfo.start.kg }} <span class="stat-unit">公斤</span></div>
          </div>
          <div>
            <div class="stat-label">目前（{{ shortDate(weightInfo.current.date) }}）</div>
            <div class="num small-value">{{ weightInfo.current.kg }} <span class="stat-unit">公斤</span></div>
          </div>
          <div>
            <div class="stat-label">變化</div>
            <div class="num small-value">{{ arrow(weightInfo.change) }}{{ Math.abs(weightInfo.change).toFixed(1) }} <span class="stat-unit">公斤</span></div>
          </div>
        </div>
        <MiniLine :values="weightInfo.recent" :goal="goalSettings.weightGoal" />
      </div>
      <div v-else class="empty-row">
        <span class="stat-empty">還沒有體重記錄</span>
        <RouterLink to="/weight" class="small-link">記錄體重</RouterLink>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">主要營養素</h2>
        <button class="go-btn" @click="emit('go', 'macros')" aria-label="查看主要營養素詳情">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      <div v-for="(m, i) in macroRows" :key="m.key" class="body macro-row" :class="{ divider: i > 0 }">
        <div class="stat">
          <div class="macro-label" :style="{ color: m.text }">{{ m.label }}</div>
          <div class="stat-label">7 天平均</div>
          <div class="num stat-value medium">{{ loggedCount ? Math.round(averageOfLogged(days, m.key)) : 0 }} g</div>
        </div>
        <MiniBars :values="days.map((d) => d[m.key])" :labels="labels" :max="goals[m.key]" :color="m.color" :height="70" />
      </div>
    </section>

    <RouterLink to="/goals" class="goals-link">管理我的目標</RouterLink>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 12px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 16px 18px 22px; }
.card-head { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 20px; font-weight: 900; margin: 0; }
.go-btn { width: 44px; height: 44px; border: 0; background: transparent; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.body { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; }
.stat-label { font-size: 12px; color: var(--muted); }
.stat-value { font-size: 26px; font-weight: 900; margin-top: 4px; }
.stat-value.medium { font-size: 22px; }
.stat-unit { font-family: 'Huninn', sans-serif; font-size: 14px; }
.stat-empty { font-size: 13px; color: var(--muted); }
.weight-stats { display: flex; flex-direction: column; gap: 10px; }
.small-value { font-size: 18px; font-weight: 900; margin-top: 2px; }
.empty-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.small-link { height: 40px; padding: 0 16px; border-radius: 20px; background: var(--soft); color: var(--text-accent); font-size: 13px; font-weight: 700; display: flex; align-items: center; text-decoration: none; }
.macro-row { padding: 10px 0; margin-top: 0; }
.macro-row.divider { border-top: 1px solid var(--line); }
.macro-label { font-size: 15px; font-weight: 900; margin-bottom: 4px; }
.goals-link { height: 48px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 900; color: var(--text-accent); text-decoration: none; }
</style>