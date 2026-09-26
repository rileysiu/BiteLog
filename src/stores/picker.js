import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePickerStore = defineStore('picker', () => {
  // null：正常模式；{ type: 'recipe' }：食譜在挑食材；{ type: 'meal', id }：餐點在挑食品
  const target = ref(null)

  const isPicking = computed(() => !!target.value)
  const isForRecipe = computed(() => target.value?.type === 'recipe')

  function start(t) {
    target.value = t
  }

  function finish() {
    target.value = null
  }

  return { target, isPicking, isForRecipe, start, finish }
})