<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const { user, ready, error, isLoggedIn } = storeToRefs(authStore)
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
</style>