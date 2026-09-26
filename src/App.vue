<script setup>
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()

useAuthStore().init()
</script>

<template>
  <main class="page">
    <RouterView />
  </main>

    <div v-if="!route.meta.hideNav" class="bottom-bar">
    <nav class="tabs">
      <RouterLink to="/" class="tab">今天</RouterLink>
      <RouterLink to="/progress" class="tab">進展</RouterLink>
      <RouterLink to="/more" class="tab">更多</RouterLink>
    </nav>
    <button class="fab" aria-label="新增記錄" @click="router.push('/add')">+</button>
  </div>
</template>

<style scoped>
.page { padding: 24px 16px 112px; }

.bottom-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 18px;
  width: min(448px, calc(100% - 32px));
  display: flex;
  gap: 12px;
  align-items: center;
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
}
</style>