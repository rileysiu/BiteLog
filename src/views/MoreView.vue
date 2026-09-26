<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { THEMES, THEME_ORDER } from '../utils/themes'

const authStore = useAuthStore()
const { user, ready, error, isLoggedIn } = storeToRefs(authStore)
const themeStore = useThemeStore()
const { current: currentTheme } = storeToRefs(themeStore)

</script>

<template>
  <h1 class="title">更多</h1>

  <section class="card">
    <h2 class="card-title">帳號與同步</h2>

    <p v-if="!ready" class="muted">確認登入狀態中…</p>

    <template v-else-if="!isLoggedIn">
      <p class="muted">登入後，你在手機和電腦上的飲食記錄、體重、目標和自訂食品都會自動同步。</p>
      <button class="login-btn" @click="authStore.login()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
        使用 Google 帳號登入
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </template>

    <template v-else>
      <div class="profile">
        <img v-if="user.photo" :src="user.photo" alt="" class="avatar" referrerpolicy="no-referrer" />
        <div v-else class="avatar placeholder">{{ (user.name || user.email || '?').slice(0, 1) }}</div>
        <div class="who">
          <div class="name">{{ user.name || '已登入' }}</div>
          <div class="email">{{ user.email }}</div>
        </div>
      </div>
      <button class="logout-btn" @click="authStore.logout()">登出</button>
    </template>
  </section>
  <section class="card theme-card">
    <div class="theme-head">
      <h2 class="card-title">主題</h2>
      <span class="muted">目前：{{ THEMES[currentTheme].name }}</span>
    </div>
    <div class="swatches">
      <button
        v-for="key in THEME_ORDER"
        :key="key"
        class="swatch"
        :aria-pressed="currentTheme === key"
        :aria-label="THEMES[key].name + '主題'"
        @click="themeStore.choose(key)"
      >
        <span
          class="circle"
          :class="{ selected: currentTheme === key }"
          :style="{ background: THEMES[key].primary, color: '#FFFFFF', '--ring': THEMES[key].primary }"
          >
          <!-- :style="{ background: THEMES[key].primary, color: THEMES[key].onPrimary, '--ring': THEMES[key].primary }" -->
          <svg v-if="currentTheme === key" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>
        </span>
        <span class="swatch-name" :class="{ strong: currentTheme === key }">{{ THEMES[key].name }}</span>
      </button>
    </div>
    <div class="preview">
      <div class="preview-track"><div class="preview-fill"></div></div>
      <span class="preview-chip">記錄</span>
      <span class="preview-fab">+</span>
    </div>
  </section>
  <section class="card links">
    <RouterLink to="/goals" class="link-row">
      <span class="link-text">
        <span class="link-label">我的目標</span>
        <span class="link-sub">卡路里、主要營養素、體重目標</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
    </RouterLink>
  </section>
</template>

<style scoped>
.title { font-size: 30px; font-weight: 900; margin: 0 0 16px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
.card-title { font-size: 16px; font-weight: 900; margin: 0; }
.muted { font-size: 13px; color: var(--muted); line-height: 1.6; margin: 0; }
.error { font-size: 13px; color: #B42318; margin: 0; }
.login-btn { height: 52px; border: 1.5px solid #C9CEDA; border-radius: 26px; background: #FFFFFF; color: var(--ink); font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; }
.profile { display: flex; align-items: center; gap: 12px; }
.avatar { width: 48px; height: 48px; border-radius: 24px; flex-shrink: 0; object-fit: cover; }
.placeholder { background: var(--soft); color: var(--text-accent); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; }
.who { min-width: 0; }
.name { font-size: 15px; font-weight: 700; }
.email { font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.logout-btn { height: 44px; border: 0; border-radius: 22px; background: var(--bg); color: var(--ink); font-size: 14px; font-weight: 700; }
.links { margin-top: 12px; padding: 6px 22px; gap: 0; }
.link-row { min-height: 60px; display: flex; align-items: center; gap: 12px; color: var(--muted); text-decoration: none; }
.link-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.link-label { font-size: 15px; font-weight: 700; color: var(--ink); }
.link-sub { font-size: 12px; color: var(--muted); }
.theme-card { margin-top: 12px; }
.theme-head { display: flex; align-items: baseline; justify-content: space-between; }
.swatches { display: grid; grid-template-columns: repeat(5, 1fr); row-gap: 6px; }
.swatch { height: 76px; border: 0; background: transparent; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--ink); }
.circle { width: 48px; height: 48px; border-radius: 24px; display: flex; align-items: center; justify-content: center; border: 3px solid transparent; }
.circle.selected { border-color: #FFFFFF; box-shadow: 0 0 0 2px var(--ring); }
.swatch-name { font-size: 13px; }
.swatch-name.strong { font-weight: 900; }
.preview { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 16px; background: var(--bg); }
.preview-track { flex: 1; height: 8px; border-radius: 4px; background: #FFFFFF; overflow: hidden; }
.preview-fill { width: 62%; height: 8px; border-radius: 4px; background: var(--primary); }
.preview-chip { height: 32px; padding: 0 14px; border-radius: 16px; background: var(--soft); color: var(--text-accent); font-size: 13px; font-weight: 700; display: flex; align-items: center; }
.preview-fab { width: 32px; height: 32px; border-radius: 16px; background: var(--primary); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
</style>