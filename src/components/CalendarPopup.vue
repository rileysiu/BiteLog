<script setup>
import MonthCalendar from './MonthCalendar.vue'
import { todayKey } from '../utils/date'

defineProps({
  selected: String,
})
const emit = defineEmits(['select', 'close'])

const today = todayKey()
</script>

<template>
  <div class="backdrop" @click="emit('close')"></div>
  <div class="popup" role="dialog" aria-label="選擇日期">
    <MonthCalendar :selected="selected" @select="emit('select', $event)" />
    <button class="today-btn" @click="emit('select', today)">回到今天</button>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; background: rgba(22, 33, 58, 0.18); z-index: 20; }
.popup { position: fixed; top: 84px; left: 50%; transform: translateX(-50%); width: min(358px, calc(100% - 32px)); background: #FFFFFF; border-radius: 28px; padding: 18px 16px 14px; box-shadow: 0 16px 40px rgba(22, 33, 58, 0.18); z-index: 21; display: flex; flex-direction: column; gap: 10px; }
.today-btn { height: 44px; border: 0; border-radius: 22px; background: var(--soft); color: var(--text-accent); font-size: 14px; font-weight: 700; }
</style>