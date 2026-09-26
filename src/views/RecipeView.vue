<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { usePickerStore } from '../stores/picker'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const recipes = useRecipesStore()
const picker = usePickerStore()
const auth = useAuthStore()

const isEdit = computed(() => route.name === 'editRecipe')
const forId = computed(() => (isEdit.value ? route.params.id : 'new'))
const existing = computed(() => (isEdit.value ? recipes.getById(route.params.id) : null))

// 修改模式要等食譜載入完，才能建立草稿
watch(
  [forId, existing],
  ([id, r]) => {
    if (isEdit.value && !r) return
    recipes.startDraft(id)
  },
  { immediate: true }
)

const draft = computed(() => (recipes.draft?.forId === forId.value ? recipes.draft : null))

const r1 = (v) => Math.round(v * 10) / 10
const servings = computed(() => Math.max(1, Number(draft.value?.servings) || 1))

const totals = computed(() => {
  const t = { kcal: 0, carb: 0, fat: 0, protein: 0 }
  for (const i of draft.value?.ingredients ?? []) {
    t.kcal += i.kcal || 0
    t.carb += i.carb || 0
    t.fat += i.fat || 0
    t.protein += i.protein || 0
  }
  return t
})

const per = computed(() => ({
  kcal: Math.round(totals.value.kcal / servings.value),
  carb: r1(totals.value.carb / servings.value),
  fat: r1(totals.value.fat / servings.value),
  protein: r1(totals.value.protein / servings.value),
}))

function changeServings(delta) {
  draft.value.servings = Math.max(1, servings.value + delta)
}

function removeIngredient(i) {
  draft.value.ingredients.splice(i, 1)
}

function addIngredient() {
  picker.start({ type: 'recipe' })
  router.push({ name: 'add' })
}

const canSave = computed(
  () => auth.isLoggedIn && draft.value && draft.value.name.trim() && draft.value.ingredients.length > 0
)
const saving = ref(false)
const error = ref('')

async function save() {
  if (!canSave.value || saving.value) return
  const d = draft.value
  const data = {
    name: d.name.trim(),
    servings: servings.value,
    cookMinutes: Number(d.cookMinutes) > 0 ? Number(d.cookMinutes) : null,
    ingredients: d.ingredients,
  }
  if (isEdit.value) {
    recipes.updateRecipe(route.params.id, data)
    recipes.clearDraft()
    router.back()
    return
  }
  saving.value = true
  error.value = ''
  try {
    await recipes.addRecipe(data)
    recipes.clearDraft()
    router.back()
  } catch (err) {
    console.error(err)
    error.value = '儲存失敗，請再試一次'
  } finally {
    saving.value = false
  }
}

function cancel() {
  recipes.clearDraft()
  router.back()
}

const confirmDelete = ref(false)
function onDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  recipes.deleteRecipe(route.params.id)
  recipes.clearDraft()
  router.back()
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="cancel" aria-label="關閉">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <h1 class="page-title">{{ isEdit ? '修改食譜' : '建立食譜' }}</h1>
    <div class="spacer"></div>
  </div>

  <p v-if="!draft" class="empty">載入中…</p>

  <template v-else>
    <p v-if="!auth.isLoggedIn" class="notice">請先到「更多」頁登入，才能建立食譜。</p>

    <section class="card">
      <label for="rc-name" class="field-label">食譜名稱<span class="hint">（必填）</span></label>
      <input id="rc-name" v-model="draft.name" type="text" class="field" placeholder="例如：香蕉葡萄乾麵包" />

      <div class="row">
        <span class="row-label">可分成幾份</span>
        <div class="stepper">
          <button @click="changeServings(-1)" aria-label="減少份數">−</button>
          <span class="num count">{{ servings }}</span>
          <button @click="changeServings(1)" aria-label="增加份數">+</button>
        </div>
      </div>

      <div class="row">
        <label for="rc-time" class="row-label">烹調時間<span class="hint">（選填）</span></label>
        <div class="input-wrap">
          <input id="rc-time" v-model="draft.cookMinutes" type="number" inputmode="numeric" class="num input" placeholder="—" />
          <span class="unit">分鐘</span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-title">食材（{{ draft.ingredients.length }} 項）</div>
      <div v-for="(item, i) in draft.ingredients" :key="i" class="item">
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-meta"><span class="portion">{{ item.portion }}</span> · {{ item.kcal }} 卡</div>
        </div>
        <button class="remove-btn" @click="removeIngredient(i)" :aria-label="'移除 ' + item.name">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <button class="add-row" @click="addIngredient">
        <span class="plus">＋</span>新增食材
      </button>
    </section>

    <section class="card">
      <div class="kcal-row">
        <span class="card-title">每份營養</span>
        <span><span class="num kcal">{{ per.kcal }}</span> 卡</span>
      </div>
      <div class="macros">
        <div class="macro"><span class="dot" style="background: var(--carb)"></span>碳水<b class="num">{{ per.carb }} g</b></div>
        <div class="macro"><span class="dot" style="background: var(--fat)"></span>脂肪<b class="num">{{ per.fat }} g</b></div>
        <div class="macro"><span class="dot" style="background: var(--protein)"></span>蛋白<b class="num">{{ per.protein }} g</b></div>
      </div>
      <p class="hint">整份共 {{ Math.round(totals.kcal) }} 卡，除以 {{ servings }} 份自動算出。</p>
    </section>

    <p v-if="error" class="notice error">{{ error }}</p>

    <div class="bottom">
      <button v-if="isEdit" class="delete-btn" @click="onDelete">{{ confirmDelete ? '確定刪除？' : '刪除' }}</button>
      <button class="main-btn" :disabled="!canSave || saving" @click="save">
        {{ saving ? '儲存中…' : isEdit ? '儲存修改' : '儲存食譜' }}
      </button>
    </div>
  </template>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 18px; font-weight: 900; margin: 0; }
.spacer { width: 44px; }
.empty { font-size: 14px; color: var(--muted); }
.notice { font-size: 13px; color: var(--muted); margin: 0 6px 12px; }
.notice.error { color: #B42318; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 22px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
.card-title { font-size: 15px; font-weight: 900; }
.field-label { font-size: 13px; font-weight: 700; }
.hint { font-size: 12px; color: var(--muted); font-weight: 400; margin: 0; }
.field { height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 14px; font-size: 15px; color: var(--ink); font-family: inherit; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.row-label { font-size: 14px; font-weight: 700; }
.stepper { display: flex; align-items: center; gap: 6px; }
.stepper button { width: 44px; height: 44px; border: 0; border-radius: 22px; background: var(--soft); color: var(--text-accent); font-size: 22px; font-weight: 700; padding: 0; }
.count { width: 44px; text-align: center; font-size: 20px; font-weight: 900; }
.input-wrap { display: flex; align-items: center; gap: 6px; }
.input { width: 80px; height: 44px; border: 0; border-radius: 12px; background: var(--soft); padding: 0 12px; text-align: right; font-size: 17px; font-weight: 900; color: var(--ink); }
.unit { font-size: 13px; color: var(--muted); white-space: nowrap; }
.item { display: flex; align-items: center; gap: 8px; min-height: 56px; border-top: 1px solid var(--line); }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 14px; font-weight: 500; }
.item-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
.portion { color: var(--text-accent); font-weight: 700; }
.remove-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: transparent; color: var(--muted); padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.add-row { min-height: 56px; border: 0; border-top: 1px solid var(--line); background: transparent; display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 700; color: var(--ink); padding: 0; }
.plus { width: 28px; height: 28px; border-radius: 14px; background: var(--soft); color: var(--text-accent); display: flex; align-items: center; justify-content: center; }
.kcal-row { display: flex; justify-content: space-between; align-items: baseline; }
.kcal { font-size: 24px; font-weight: 900; }
.macros { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.macro { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 16px; background: var(--bg); font-size: 12px; color: var(--muted); }
.macro b { font-size: 17px; color: var(--ink); }
.dot { width: 8px; height: 8px; border-radius: 4px; display: inline-block; margin-right: 6px; }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); display: flex; gap: 10px; }
.main-btn { flex: 1; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 900; }
.main-btn:disabled { background: #C9CEDA; color: var(--muted); }
.delete-btn { height: 56px; padding: 0 22px; border: 1.5px solid #F3B8AE; border-radius: 28px; background: #FFFFFF; color: #B42318; font-size: 15px; font-weight: 700; }
</style>