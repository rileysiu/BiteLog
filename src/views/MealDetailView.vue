<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMealsStore } from '../stores/meals'
import { usePickerStore } from '../stores/picker'

const route = useRoute()
const router = useRouter()
const meals = useMealsStore()
const picker = usePickerStore()

function addFood() {
  picker.start({ type: 'meal', id: meal.value.id })
  router.push({ name: 'add' })
}

const meal = computed(() => meals.getById(route.params.id))
const total = computed(() => Math.round((meal.value?.items ?? []).reduce((s, i) => s + (i.kcal || 0), 0)))

const showToast = ref(route.query.saved === '1')
if (showToast.value) router.replace({ query: {} })
const menuOpen = ref(false)
const confirmDelete = ref(false)
const renaming = ref(false)
const draft = ref('')

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function openMenu() {
  confirmDelete.value = false
  menuOpen.value = true
}

function startRename() {
  menuOpen.value = false
  draft.value = meal.value.name
  renaming.value = true
}

function saveRename() {
  if (!draft.value.trim()) return
  meals.renameMeal(meal.value.id, draft.value.trim())
  renaming.value = false
}

function onDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  meals.deleteMeal(meal.value.id)
  menuOpen.value = false
  back()
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="back" aria-label="返回">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
    <button v-if="meal" class="icon-btn" @click="openMenu" aria-label="更多選項">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
    </button>
  </div>

  <p v-if="!meal && meals.status !== 'ready'" class="empty">載入中…</p>
  <p v-else-if="!meal" class="empty">找不到這個餐點，可能已經被刪除了。</p>

  <template v-else>
    <div class="head">
      <h1 class="meal-name">{{ meal.name }}</h1>
      <p class="meta">{{ meal.items.length }} 項 · {{ total }} 卡</p>
    </div>

    <section class="card">
      <div class="card-title">這一餐的食品</div>
      <div v-for="(item, i) in meal.items" :key="i" class="item">
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-portion">{{ item.portion }}</div>
        </div>
        <div class="num item-kcal">{{ item.kcal }}</div>
      </div>
      <button class="add-row" @click="addFood">
        <span class="plus">＋</span>添加食品
      </button>
    </section>
  </template>

  <div v-if="showToast && meal" class="toast">
    <span>已儲存餐點「{{ meal.name }}」</span>
    <RouterLink to="/" class="toast-link">返回日記</RouterLink>
  </div>

  <template v-if="menuOpen">
    <div class="backdrop" @click="menuOpen = false"></div>
    <div class="dialog" role="dialog" :aria-label="meal.name">
      <div class="dialog-title">{{ meal.name }}</div>
      <button class="sheet-btn" @click="startRename">編輯餐點名稱</button>
      <button class="sheet-btn danger" @click="onDelete">{{ confirmDelete ? '確定刪除？' : '刪除餐點' }}</button>
      <button class="sheet-btn" @click="menuOpen = false">取消</button>
    </div>
  </template>

  <template v-if="renaming">
    <div class="backdrop" @click="renaming = false"></div>
    <div class="dialog" role="dialog" aria-label="編輯餐點名稱">
      <label for="rename" class="dialog-title">編輯餐點名稱</label>
      <input id="rename" v-model="draft" type="text" class="field" />
      <div class="dialog-actions">
        <button class="sheet-btn" @click="renaming = false">取消</button>
        <button class="sheet-btn primary" :disabled="!draft.trim()" @click="saveRename">儲存</button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.empty { font-size: 14px; color: var(--muted); }
.head { padding: 0 6px 14px; }
.meal-name { font-size: 30px; font-weight: 900; margin: 0 0 6px; line-height: 1.2; }
.meta { font-size: 13px; color: var(--muted); margin: 0; }
.card { background: #FFFFFF; border-radius: 24px; padding: 16px 22px 6px; }
.card-title { font-size: 15px; font-weight: 900; padding-bottom: 6px; }
.item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 15px; font-weight: 500; }
.item-portion { font-size: 12px; color: var(--text-accent); font-weight: 700; margin-top: 3px; }
.item-kcal { font-size: 16px; font-weight: 800; }
.toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 28px; width: min(448px, calc(100% - 32px)); min-height: 60px; padding: 8px 8px 8px 20px; border-radius: 20px; background: var(--ink); color: #FFFFFF; display: flex; align-items: center; gap: 10px; font-size: 14px; }
.toast span { flex: 1; }
.toast-link { height: 44px; padding: 0 14px; border-radius: 14px; background: rgba(255, 255, 255, 0.14); color: #FFFFFF; font-weight: 700; display: flex; align-items: center; text-decoration: none; white-space: nowrap; }
.backdrop { position: fixed; inset: 0; background: rgba(22, 33, 58, 0.35); z-index: 40; }
.dialog { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(330px, calc(100% - 40px)); background: #FFFFFF; border-radius: 28px; padding: 20px; z-index: 41; display: flex; flex-direction: column; gap: 10px; }
.dialog-title { font-size: 17px; font-weight: 900; text-align: center; padding-bottom: 4px; }
.sheet-btn { height: 52px; border: 0; border-radius: 26px; background: var(--bg); color: var(--ink); font-size: 16px; font-weight: 700; }
.sheet-btn.danger { background: #FDE8E4; color: #B42318; }
.sheet-btn.primary { background: var(--primary); color: var(--on-primary); }
.sheet-btn:disabled { background: #C9CEDA; color: var(--muted); }
.dialog-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.field { height: 50px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 14px; font-size: 16px; color: var(--ink); font-family: inherit; }
.add-row { width: 100%; min-height: 56px; border: 0; border-top: 1px solid var(--line); background: transparent; display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 700; color: var(--ink); padding: 0; }
.plus { width: 28px; height: 28px; border-radius: 14px; background: var(--soft); color: var(--text-accent); display: flex; align-items: center; justify-content: center; }
</style>