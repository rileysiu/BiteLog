<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import PeriodPicker from '../components/PeriodPicker.vue'
import OverviewTab from '../components/progress/OverviewTab.vue'
import KcalTab from '../components/progress/KcalTab.vue'
import WeightTab from '../components/progress/WeightTab.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const TABS = [
  { key: 'overview', label: '概覽' },
  { key: 'kcal', label: '卡路里' },
  { key: 'weight', label: '體重' },
  { key: 'nutrients', label: '營養素' },
  { key: 'macros', label: '主要營養素' },
]

const TABS_WITH_PERIOD = ['kcal', 'nutrients', 'macros']

const tab = computed(() => route.query.tab || 'overview')

// 期間也記在網址上，例如 /progress?tab=kcal&period=week
const period = computed({
  get: () => route.query.period || 'today',
  set: (value) => router.replace({ query: { ...route.query, period: value } }),
})

function setTab(key) {
  router.replace({ query: { ...route.query, tab: key } })
}
</script>

<template>
  <h1 class="title">進展</h1>

  <div class="tabs">
    <button
      v-for="t in TABS"
      :key="t.key"
      :class="{ active: tab === t.key }"
      :aria-pressed="tab === t.key"
      @click="setTab(t.key)"
    >
      {{ t.label }}
    </button>
  </div>

  <section v-if="auth.ready && !auth.isLoggedIn" class="login-hint">
    <p>登入後，這裡會顯示你的卡路里、體重和營養素統計。</p>
    <RouterLink to="/more" class="login-link">前往登入</RouterLink>
  </section>

  <template v-else>
    <PeriodPicker v-if="TABS_WITH_PERIOD.includes(tab)" v-model="period" />

    <OverviewTab v-if="tab === 'overview'" @go="setTab" />
    <KcalTab v-else-if="tab === 'kcal'" :period="period" />
    <WeightTab v-else-if="tab === 'weight'" />
    <p v-else class="placeholder">這個分頁會在接下來的步驟完成。</p>
  </template>
</template>

<style scoped>
.title { font-size: 30px; font-weight: 900; margin: 0 0 8px; letter-spacing: 1px; }
.tabs { display: flex; gap: 22px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px 14px; padding: 0 16px; }
.tabs::-webkit-scrollbar { display: none; }
.tabs button { height: 44px; flex-shrink: 0; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--muted); font-size: 16px; font-weight: 500; padding: 0; }
.tabs button.active { color: var(--ink); font-weight: 900; border-bottom-color: var(--ink); }
.login-hint { padding: 18px 22px; border-radius: 24px; background: var(--soft); display: flex; flex-direction: column; gap: 10px; }
.login-hint p { margin: 0; font-size: 14px; line-height: 1.6; }
.login-link { align-self: flex-start; height: 44px; padding: 0 20px; border-radius: 22px; background: var(--primary); color: var(--on-primary); font-size: 14px; font-weight: 700; display: flex; align-items: center; text-decoration: none; }
.placeholder { font-size: 14px; color: var(--muted); padding: 0 6px; }
</style>