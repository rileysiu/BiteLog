<script setup>
import { PERIODS } from '../utils/period'

defineProps({
  modelValue: String,
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="picker">
    <button
      v-for="p in PERIODS"
      :key="p.key"
      :class="{ active: modelValue === p.key }"
      :aria-pressed="modelValue === p.key"
      @click="emit('update:modelValue', p.key)"
    >
      {{ p.label }}
    </button>
  </div>
</template>

<style scoped>
.picker { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 4px; background: #FFFFFF; border-radius: 24px; margin-bottom: 12px; }
.picker button { height: 40px; border: 0; border-radius: 20px; background: transparent; color: var(--muted); font-size: 14px; font-weight: 700; padding: 0; }
.picker button.active { background: var(--primary); color: var(--on-primary); }
</style>