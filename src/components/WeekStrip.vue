<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { WEEKDAYS, addDays, weekStart, todayKey, fromKey, diffDays } from '../utils/date'

const props = defineProps({
  selected: String,
  loggedDates: Array,
})
const emit = defineEmits(['select'])

const today = todayKey()

const weeks = computed(() => {
  const earliest = props.selected < today ? props.selected : today
  const latest = props.selected > today ? props.selected : today
  const start = addDays(weekStart(earliest), -7 * 12)
  const end = addDays(weekStart(latest), 7 * 4)
  const count = diffDays(end, start) / 7 + 1

  return Array.from({ length: count }, (_, w) => {
    const ws = addDays(start, w * 7)
    return {
      key: ws,
      days: WEEKDAYS.map((label, i) => {
        const key = addDays(ws, i)
        return { key, label, num: fromKey(key).getDate() }
      }),
    }
  })
})

const selectedWeekIndex = computed(() =>
  weeks.value.findIndex((w) => w.key === weekStart(props.selected))
)

const scroller = ref(null)

function scrollToSelected(smooth) {
  const el = scroller.value
  if (!el) return
  el.scrollTo({ left: selectedWeekIndex.value * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
}

onMounted(() => scrollToSelected(false))

watch(
  () => props.selected,
  async () => {
    await nextTick()
    scrollToSelected(true)
  }
)

function dayClass(key) {
  const isSelected = key === props.selected
  return {
    selected: isSelected,
    today: key === today && !isSelected,
    logged: props.loggedDates.includes(key) && !isSelected,
  }
}
</script>

<template>
  <div ref="scroller" class="strip">
    <div v-for="w in weeks" :key="w.key" class="week">
      <div v-for="d in w.days" :key="d.key" class="day">
        <div class="label" :class="{ strong: d.key === selected }">{{ d.label }}</div>
        <button
          class="day-btn"
          :aria-label="d.key"
          :aria-pressed="d.key === selected"
          @click="emit('select', d.key)"
        >
          <span class="num circle" :class="dayClass(d.key)">{{ d.num }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.strip { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.strip::-webkit-scrollbar { display: none; }
.week { flex: 0 0 100%; scroll-snap-align: start; display: grid; grid-template-columns: repeat(7, 1fr); }
.day { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.label { font-size: 12px; color: var(--muted); }
.label.strong { color: var(--ink); font-weight: 900; }
.day-btn { width: 44px; height: 44px; border: 0; background: transparent; padding: 0; display: flex; align-items: center; justify-content: center; }
.circle { width: 36px; height: 36px; border-radius: 18px; border: 1.5px solid #C9CEDA; color: var(--muted); font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.circle.logged { border-color: transparent; background: var(--soft); color: var(--text-accent); }
.circle.today { border: 2px solid var(--primary); color: var(--text-accent); }
.circle.selected { border-color: transparent; background: var(--primary); color: var(--on-primary); }
</style>