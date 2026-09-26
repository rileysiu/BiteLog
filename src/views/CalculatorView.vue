<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import { useWeightStore } from '../stores/weight'
import { useDiaryStore } from '../stores/diary'
import { useAuthStore } from '../stores/auth'
import { ACTIVITY_LEVELS, GOAL_TYPES, suggestKcal } from '../utils/energy'

const router = useRouter()
const profileStore = useProfileStore()
const weight = useWeightStore()
const diary = useDiaryStore()
const auth = useAuthStore()

const thisYear = new Date().getFullYear()

const form = reactive({
  sex: '',
  birthYear: '',
  height: '',
  weight: '',
  activity: 'light',
  goalType: 'lose',
})

// 帶入之前存的身體資料；體重優先用最新的體重記錄
const initialized = ref(false)
watch(
  () => [profileStore.status, weight.latest],
  () => {
    if (initialized.value || profileStore.status === 'loading') return
    const p = profileStore.profile
    if (p) {
      form.sex = p.sex ?? ''
      form.birthYear = p.birthYear ? String(p.birthYear) : ''
      form.height = p.height ? String(p.height) : ''
      form.activity = p.activity ?? 'light'
      form.goalType = p.goalType ?? 'lose'
    }
    const w = weight.latest?.kg ?? p?.weight
    form.weight = w ? String(w) : ''
    initialized.value = true
  },
  { immediate: true }
)

const age = computed(() => thisYear - Number(form.birthYear))

const valid = computed(() => {
  const by = Number(form.birthYear)
  const h = Number(form.height)
  const w = Number(form.weight)
  return (
    (form.sex === 'male' || form.sex === 'female') &&
    by >= 1920 && by <= thisYear - 10 &&
    h >= 100 && h <= 250 &&
    w >= 25 && w <= 300
  )
})

const result = computed(() =>
  valid.value
    ? suggestKcal({
        sex: form.sex,
        age: age.value,
        height: Number(form.height),
        weight: Number(form.weight),
        activity: form.activity,
        goalType: form.goalType,
      })
    : null
)

const fmt = (n) => Math.round(n).toLocaleString('en-US')
const saving = ref(false)
const error = ref('')

async function apply() {
  if (!result.value || !auth.isLoggedIn || saving.value) return
  saving.value = true
  error.value = ''
  try {
    await profileStore.save({
      sex: form.sex,
      birthYear: Number(form.birthYear),
      height: Number(form.height),
      weight: Number(form.weight),
      activity: form.activity,
      goalType: form.goalType,
    })
    await diary.saveGoals({ kcal: result.value.kcal })
    router.back()
  } catch (err) {
    console.error(err)
    error.value = '儲存失敗，請再試一次'
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
    <h1 class="page-title">計算建議值</h1>
    <div class="spacer"></div>
  </div>

  <section class="card">
    <h2 class="card-title">身體資料</h2>

    <div class="field-label">性別</div>
    <div class="choices two">
      <button :class="{ active: form.sex === 'male' }" :aria-pressed="form.sex === 'male'" @click="form.sex = 'male'">男性</button>
      <button :class="{ active: form.sex === 'female' }" :aria-pressed="form.sex === 'female'" @click="form.sex = 'female'">女性</button>
    </div>

    <div class="row">
      <label for="c-year" class="row-label">出生年份</label>
      <div class="input-wrap">
        <input id="c-year" v-model="form.birthYear" type="number" inputmode="numeric" class="num input" placeholder="1995" />
        <span class="unit">{{ form.birthYear && valid ? `${age} 歲` : '年' }}</span>
      </div>
    </div>
    <div class="row">
      <label for="c-height" class="row-label">身高</label>
      <div class="input-wrap">
        <input id="c-height" v-model="form.height" type="number" inputmode="decimal" class="num input" placeholder="165" />
        <span class="unit">公分</span>
      </div>
    </div>
    <div class="row">
      <label for="c-weight" class="row-label">體重</label>
      <div class="input-wrap">
        <input id="c-weight" v-model="form.weight" type="number" inputmode="decimal" class="num input" placeholder="60" />
        <span class="unit">公斤</span>
      </div>
    </div>
  </section>

  <section class="card">
    <h2 class="card-title">活動量</h2>
    <button
      v-for="a in ACTIVITY_LEVELS"
      :key="a.key"
      class="option"
      :class="{ active: form.activity === a.key }"
      :aria-pressed="form.activity === a.key"
      @click="form.activity = a.key"
    >
      <span class="option-text">
        <span class="option-label">{{ a.label }}</span>
        <span class="option-desc">{{ a.desc }}</span>
      </span>
      <span class="radio"></span>
    </button>
  </section>

  <section class="card">
    <h2 class="card-title">目標</h2>
    <div class="choices three">
      <button
        v-for="g in GOAL_TYPES"
        :key="g.key"
        :class="{ active: form.goalType === g.key }"
        :aria-pressed="form.goalType === g.key"
        @click="form.goalType = g.key"
      >
        {{ g.label }}
      </button>
    </div>
    <p class="hint">{{ GOAL_TYPES.find((g) => g.key === form.goalType)?.desc }}</p>
  </section>

  <section v-if="result" class="card result">
    <div class="result-row"><span>基礎代謝率</span><span class="num">{{ fmt(result.bmr) }} 卡</span></div>
    <div class="result-row"><span>每日消耗</span><span class="num">{{ fmt(result.tdee) }} 卡</span></div>
    <div class="result-row"><span>依目標調整</span><span class="num">{{ result.delta > 0 ? '+' : '' }}{{ fmt(result.delta) }} 卡</span></div>
    <div class="result-main">
      <span>建議每日卡路里</span>
      <span class="num big">{{ fmt(result.kcal) }} <span class="unit-inline">卡</span></span>
    </div>
    <p v-if="result.floored" class="warn">照目標算出的數字低於基礎代謝率，已調整為基礎代謝率。吃得比這更少，可能影響健康。</p>
    <p class="hint">這是依公式估算的數字，每個人的實際狀況不同。如果有特殊健康狀況，請以醫師或營養師的建議為準。</p>
  </section>
  <p v-else class="notice">填完性別、出生年份、身高和體重後，就會算出建議值。</p>

  <p v-if="error" class="notice error">{{ error }}</p>

  <div class="bottom">
    <button class="main-btn" :disabled="!result || !auth.isLoggedIn || saving" @click="apply">
      {{ saving ? '套用中…' : result ? `套用 ${fmt(result.kcal)} 卡到我的目標` : '套用到我的目標' }}
    </button>
  </div>
</template>

<style scoped>
.top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.icon-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: #FFFFFF; color: var(--ink); padding: 0; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 18px; font-weight: 900; margin: 0; }
.spacer { width: 44px; }
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 22px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
.card-title { font-size: 16px; font-weight: 900; margin: 0; }
.field-label { font-size: 14px; font-weight: 700; }
.choices { display: grid; gap: 6px; }
.choices.two { grid-template-columns: 1fr 1fr; }
.choices.three { grid-template-columns: repeat(3, 1fr); }
.choices button { height: 44px; border: 0; border-radius: 22px; background: var(--bg); color: var(--ink); font-size: 14px; font-weight: 700; }
.choices button.active { background: var(--primary); color: var(--on-primary); }
.row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 10px; border-top: 1px solid var(--line); }
.row-label { font-size: 14px; font-weight: 700; }
.input-wrap { display: flex; align-items: center; gap: 8px; }
.input { width: 100px; height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 14px; text-align: right; font-size: 18px; font-weight: 900; color: var(--ink); }
.unit { min-width: 40px; font-size: 13px; color: var(--muted); font-weight: 700; white-space: nowrap; }
.option { min-height: 60px; border: 0; border-top: 1px solid var(--line); background: transparent; padding: 8px 0; display: flex; align-items: center; gap: 12px; text-align: left; color: var(--ink); }
.option-text { flex: 1; display: flex; flex-direction: column; gap: 2px; white-space: normal; }
.option-label { font-size: 15px; font-weight: 700; }
.option-desc { font-size: 12px; color: var(--muted); font-weight: 700; }
.radio { width: 22px; height: 22px; border-radius: 11px; border: 2px solid #C9CEDA; flex-shrink: 0; }
.option.active .radio { border: 7px solid var(--primary); }
.hint { margin: 0; font-size: 12px; color: var(--muted); font-weight: 700; line-height: 1.6; }
.result-row { display: flex; justify-content: space-between; font-size: 14px; }
.result-main { display: flex; justify-content: space-between; align-items: baseline; padding-top: 10px; border-top: 1px solid var(--line); font-size: 15px; font-weight: 900; }
.big { font-size: 28px; font-weight: 900; }
.unit-inline { font-family: 'Huninn', sans-serif; font-size: 15px; }
.warn { margin: 0; padding: 10px 14px; border-radius: 14px; background: #FDE8DF; color: #9A3412; font-size: 13px; font-weight: 700; line-height: 1.6; }
.notice { font-size: 13px; color: var(--muted); font-weight: 700; margin: 0 6px 12px; }
.notice.error { color: #B42318; }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); }
.main-btn { width: 100%; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 900; }
.main-btn:disabled { background: #C9CEDA; color: var(--muted); }
</style>