<script setup>
import { ref, computed, watch } from 'vue'
import { WEEKDAYS, fromKey, toKey, todayKey } from '../utils/date'

const props = defineProps({
  selected: String,
})
const emit = defineEmits(['select'])

const start = fromKey(props.selected)
const year = ref(start.getFullYear())
const month = ref(start.getMonth())
const today = todayKey()

// 選取的日期改變時，月曆自動翻到那個月
watch(
  () => props.selected,
  (key) => {
    const d = fromKey(key)
    year.value = d.getFullYear()
    month.value = d.getMonth()
  }
)

const cells = computed(() => {
  const firstDay = new Date(year.value, month.value, 1).getDay()
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const list = []
  for (let i = 0; i < firstDay; i++) list.push(null)
  for (let d = 1; d <= daysInMonth; d++) list.push(toKey(new Date(year.value, month.value, d)))
  return list
})

function prevMonth() {
  if (month.value === 0) {
    month.value = 11
    year.value--
  } else {
    month.value--
  }
}

function nextMonth() {
  if (month.value === 11) {
    month.value = 0
    year.value++
  } else {
    month.value++
  }
}
</script>

<template>
  <div class="calendar">
    <div class="head">
      <div class="month-title">{{ year }}年{{ month + 1 }}月</div>
      <div class="nav">
        <button @click="prevMonth" aria-label="上個月">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button @click="nextMonth" aria-label="下個月">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>

    <div class="weekdays">
      <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
    </div>

    <div class="grid">
      <div v-for="(key, i) in cells" :key="i" class="cell">
        <button
          v-if="key"
          class="num date"
          :class="{ selected: key === selected, today: key === today && key !== selected }"
          :aria-label="key"
          :aria-pressed="key === selected"
          @click="emit('select', key)"
        >
          {{ Number(key.slice(8)) }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar { display: flex; flex-direction: column; gap: 10px; }
.head { display: flex; align-items: center; justify-content: space-between; padding-left: 6px; }
.month-title { font-size: 18px; font-weight: 900; }
.nav { display: flex; gap: 4px; }
.nav button { width: 44px; height: 44px; border: 0; border-radius: 22px; background: var(--bg); color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 12px; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(7, 1fr); row-gap: 2px; }
.cell { display: flex; justify-content: center; }
.date { width: 44px; height: 44px; border: 0; border-radius: 22px; background: transparent; color: var(--ink); font-size: 16px; font-weight: 800; padding: 0; }
.date.today { border: 2px solid var(--primary); color: var(--text-accent); }
.date.selected { background: var(--primary); color: var(--on-primary); }
</style>