<script setup>
import { ref, watch } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const fabOpen = ref(false)

// 換頁時自動關閉選單
watch(() => route.fullPath, () => {
  fabOpen.value = false
})

useAuthStore().init()
</script>

<template>
  <main class="page">
    <RouterView />
  </main>

  <template v-if="!route.meta.hideNav">
    <div v-if="fabOpen" class="backdrop" @click="fabOpen = false"></div>

    <div v-if="fabOpen" class="fab-menu">
      <RouterLink to="/weight" class="fab-item">
        <span class="fab-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M9 9.5a4 4 0 0 1 6 0M12 12l1.5-2.5" /></svg>
        </span>
        記錄體重
      </RouterLink>
      <RouterLink to="/add" class="fab-item">
        <span class="fab-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z" /><path d="M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4" /></svg>
        </span>
        記錄飲食
      </RouterLink>
    </div>

    <div class="bottom-bar">
      <nav class="tabs">
        <RouterLink to="/" class="tab">今天</RouterLink>
        <RouterLink to="/progress" class="tab">進展</RouterLink>
        <RouterLink to="/more" class="tab">更多</RouterLink>
      </nav>
      <button
        class="fab"
        :class="{ open: fabOpen }"
        :aria-expanded="fabOpen"
        aria-label="新增記錄"
        @click="fabOpen = !fabOpen"
      >
        +
      </button>
    </div>
  </template>
</template>

<style scoped>
.page { padding: 24px 16px 112px; }

.backdrop { position: fixed; inset: 0; background: rgba(22, 33, 58, 0.28); z-index: 30; }

.fab-menu {
  position: fixed;
  bottom: 96px;
  right: max(16px, calc((100% - 480px) / 2 + 16px));
  z-index: 31;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.fab-item {
  height: 52px;
  padding: 0 20px 0 16px;
  border-radius: 26px;
  background: #FFFFFF;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(22, 33, 58, 0.16);
}

.fab-icon {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: var(--soft);
  color: var(--text-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 18px;
  width: min(448px, calc(100% - 32px));
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 32;
}

.tabs {
  flex: 1;
  height: 64px;
  padding: 6px;
  border-radius: 32px;
  background: #FFFFFF;
  box-shadow: 0 6px 20px rgba(22, 33, 58, 0.10);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.tab {
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.tab.router-link-exact-active {
  background: var(--soft);
  font-weight: 900;
}

.fab {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  border: 0;
  background: var(--primary);
  color: var(--on-primary);
  font-size: 32px;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(22, 33, 58, 0.22);
  transition: transform 0.2s;
}

.fab.open { transform: rotate(45deg); }
</style>