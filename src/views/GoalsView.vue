<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDiaryStore } from '../stores/diary'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const diary = useDiaryStore()
const auth = useAuthStore()
const { goalSettings } = storeToRefs(diary)

const form = reactive({ kcal: 0, carbPct: 0, fatPct: 0, proteinPct: 0, weightGoal: '' })
const dirty = ref(false)
const mode = ref('pct')
const saving = ref(false)
const message = ref('')

// 雲端的目標載入或改變時，把數字填進表單（但你正在修改時不會被覆蓋）
watch(
  goalSettings,
  (g) => {
    if (dirty.value) return
    form.kcal = g.kcal
    form.carbPct = g.carbPct
    form.fatPct = g.fatPct
    form.proteinPct = g.proteinPct
    form.weightGoal = g.weightGoal ?? ''
  },
  { immediate: true, deep: true }
)

const MACROS = [
  { key: 'carb', label: '碳水', factor: 4, color: 'var(--carb)' },
  { key: 'fat', label: '脂肪', factor: 9, color: 'var(--fat)' },
  { key: 'protein', label: '蛋白', factor: 4, color: 'var(--protein)' },
]

function gramsOf(m) {
  return Math.round((form.kcal * form[m.key + 'Pct']) / 100 / m.factor)
}

function inputValue(m) {
  return mode.value === 'pct' ? form[m.key + 'Pct'] : gramsOf(m)
}

function onMacroInput(m, event) {
  dirty.value = true
  const v = Number(event.target.value) || 0
  form[m.key + 'Pct'] =
    mode.value === 'pct' ? v : form.kcal > 0 ? Math.round(((v * m.factor) / form.kcal) * 100) : 0
}

function markDirty() {
  dirty.value = true
  message.value = ''
}

const totalPct = computed(() => form.carbPct + form.fatPct + form.proteinPct)
const canSave = computed(() => auth.isLoggedIn && form.kcal > 0 && totalPct.value === 100 && !saving.value)

async function save() {
  if (!canSave.value) return
  saving.value = true
  message.value = ''
  try {
    const w = parseFloat(form.weightGoal)
    await diary.saveGoals({
      kcal: Number(form.kcal),
      carbPct: form.carbPct,
      fatPct: form.fatPct,
      proteinPct: form.proteinPct,
      weightGoal: Number.isFinite(w) && w > 0 ? w : null,
    })
    dirty.value = false
    message.value = '已儲存'
  } catch (err) {
    console.error(err)
    message.value = '儲存失敗，請再試一次'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="router.back()" aria-label="返回">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
    <h1 class="page-title">我的目標</h1>
    <button class="save-btn" :disabled="!canSave" @click="save">{{ saving ? '儲存中' : '儲存' }}</button>
  </div>

  <p v-if="!auth.isLoggedIn" class="notice">請先到「更多」頁登入，才能儲存目標。</p>
  <p v-if="message" class="notice">{{ message }}</p>

  <section class="card">
    <h2 class="card-title">每日卡路里</h2>
    <div class="row">
      <label for="kcal">卡路里</label>
      <div class="input-wrap">
        <input id="kcal" v-model.number="form.kcal" @input="markDirty" type="number" inputmode="numeric" class="num input" />
        <span class="unit">卡</span>
      </div>
    </div>
    <RouterLink to="/goals/calculator" class="calc-link">依身體資料計算建議值</RouterLink>
  </section>

  <section class="card">
    <div class="card-head">
      <h2 class="card-title">主要營養素</h2>
      <div class="segment">
        <button :class="{ active: mode === 'pct' }" @click="mode = 'pct'" :aria-pressed="mode === 'pct'">百分比</button>
        <button :class="{ active: mode === 'gram' }" @click="mode = 'gram'" :aria-pressed="mode === 'gram'">克數</button>
      </div>
    </div>

    <div class="ratio-bar">
      <div v-for="m in MACROS" :key="m.key" :style="{ width: (form[m.key + 'Pct'] / Math.max(totalPct, 100)) * 100 + '%', background: m.color }"></div>
    </div>

    <div v-for="m in MACROS" :key="m.key" class="row macro-row">
      <div class="macro-label">
        <span class="dot" :style="{ background: m.color }"></span>
        <div>
          <label :for="'in-' + m.key">{{ m.label }}</label>
          <div class="sub">{{ mode === 'pct' ? gramsOf(m) + ' 克' : form[m.key + 'Pct'] + '% 卡路里' }}</div>
        </div>
      </div>
      <div class="input-wrap">
        <input
          :id="'in-' + m.key"
          :value="inputValue(m)"
          @input="onMacroInput(m, $event)"
          type="number"
          inputmode="numeric"
          class="num input small"
        />
        <span class="unit">{{ mode === 'pct' ? '%' : '克' }}</span>
      </div>
    </div>

    <p class="sum" :class="{ bad: totalPct !== 100 }">
      {{ totalPct === 100 ? '合計 100%，比例正確' : `合計 ${totalPct}%，三者加總需為 100%` }}
    </p>
  </section>

  <section class="card">
    <h2 class="card-title">體重目標</h2>
    <div class="row">
      <label for="wgoal">目標體重</label>
      <div class="input-wrap">
        <input id="wgoal" v-model="form.weightGoal" @input="markDirty" type="number" step="0.1" inputmode="decimal" class="num input" placeholder="—" />
        <span class="unit">公斤</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 18px; font-weight: 900; margin: 0; }
.save-btn { height: 44px; padding: 0 20px; border: 0; border-radius: 22px; background: var(--primary); color: var(--on-primary); font-size: 15px; font-weight: 700; }
.save-btn:disabled { background: #C9CEDA; color: var(--muted); }
.notice { font-size: 13px; color: var(--muted); margin: 0 6px 12px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 20px 22px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 14px; }
.card-head { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 16px; font-weight: 900; margin: 0; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.row label { font-size: 15px; }
.macro-row { padding-top: 12px; border-top: 1px solid var(--line); }
.macro-label { display: flex; align-items: center; gap: 10px; }
.macro-label label { font-weight: 700; }
.dot { width: 10px; height: 10px; border-radius: 5px; flex-shrink: 0; }
.sub { font-size: 12px; color: var(--muted); }
.input-wrap { display: flex; align-items: center; gap: 8px; }
.input { width: 120px; height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 14px; text-align: right; font-size: 20px; font-weight: 900; color: var(--ink); }
.input.small { width: 88px; font-size: 18px; }
.unit { font-size: 14px; color: var(--muted); min-width: 28px; white-space: nowrap; }
.segment { display: flex; gap: 2px; padding: 3px; background: var(--bg); border-radius: 20px; }
.segment button { height: 36px; padding: 0 14px; border: 0; border-radius: 18px; font-size: 13px; font-weight: 700; background: transparent; color: var(--muted); }
.segment button.active { background: var(--primary); color: var(--on-primary); }
.ratio-bar { display: flex; height: 12px; border-radius: 6px; overflow: hidden; gap: 2px; background: var(--track); }
.sum { margin: 0; padding: 10px 14px; border-radius: 14px; background: var(--soft); font-size: 13px; font-weight: 700; }
.sum.bad { background: #FDE8DF; color: #9A3412; }
.calc-link { height: 44px; border-radius: 22px; background: var(--soft); color: var(--text-accent); font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; text-decoration: none; }
</style>