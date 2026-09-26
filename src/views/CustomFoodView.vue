<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomFoodsStore } from '../stores/customFoods'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const custom = useCustomFoodsStore()
const auth = useAuthStore()

const isEdit = computed(() => route.name === 'editCustomFood')
const existing = computed(() => (isEdit.value ? custom.getById(route.params.id) : null))

const REQUIRED = [
  { key: 'kcal', label: '卡路里', unit: '卡', color: 'var(--ink)' },
  { key: 'carb', label: '碳水', unit: 'g', color: 'var(--carb)' },
  { key: 'fat', label: '脂肪', unit: 'g', color: 'var(--fat)' },
  { key: 'protein', label: '蛋白', unit: 'g', color: 'var(--protein)' },
]
const OPTIONAL = [
  { key: 'sugar', label: '糖', unit: 'g' },
  { key: 'fiber', label: '膳食纖維', unit: 'g' },
  { key: 'satFat', label: '飽和脂肪', unit: 'g' },
  { key: 'transFat', label: '反式脂肪', unit: 'g' },
  { key: 'cholesterol', label: '膽固醇', unit: 'mg' },
  { key: 'sodium', label: '鈉', unit: 'mg' },
]

const form = reactive({
  name: '',
  brand: '',
  per: 'serving',
  servingSize: '',
  baseUnit: 'g',
  values: {},
  units: [],
})
const showOptional = ref(false)
const initialized = ref(false)

// 修改模式：把原本的資料填進表單
watch(
  existing,
  (f) => {
    if (initialized.value || !f) return
    const d = f.raw
    form.name = d.name
    form.brand = d.brand || ''
    form.per = d.per
    form.servingSize = String(d.servingSize)
    form.baseUnit = d.baseUnit
    form.values = Object.fromEntries(Object.entries(d.values || {}).map(([k, v]) => [k, String(v)]))
    form.units = (d.units || []).map((u) => ({ name: u.name, amount: String(u.amount) }))
    showOptional.value = OPTIONAL.some((o) => form.values[o.key] !== undefined)
    initialized.value = true
  },
  { immediate: true }
)

const baseLabel = computed(() => (form.baseUnit === 'ml' ? '毫升' : '克'))

const isNumber = (v) => v !== undefined && v !== '' && Number.isFinite(Number(v))

const canSave = computed(
  () =>
    auth.isLoggedIn &&
    form.name.trim() &&
    Number(form.servingSize) > 0 &&
    REQUIRED.every((r) => isNumber(form.values[r.key]))
)

function addUnit() {
  form.units.push({ name: '', amount: '' })
}

function removeUnit(i) {
  form.units.splice(i, 1)
}

function buildData() {
  const values = {}
  for (const item of [...REQUIRED, ...OPTIONAL]) {
    const v = form.values[item.key]
    if (isNumber(v)) values[item.key] = Number(v)
  }
  return {
    name: form.name.trim(),
    brand: form.brand.trim(),
    per: form.per,
    servingSize: Number(form.servingSize),
    baseUnit: form.baseUnit,
    values,
    units: form.units
      .filter((u) => u.name.trim() && Number(u.amount) > 0)
      .map((u) => ({ name: u.name.trim(), amount: Number(u.amount) })),
  }
}

const saving = ref(false)
const error = ref('')

async function save() {
  if (!canSave.value || saving.value) return
  const data = buildData()
  if (isEdit.value) {
    custom.updateFood(existing.value.id, data)
    router.back()
    return
  }
  saving.value = true
  error.value = ''
  try {
    const id = await custom.addFood(data)
    // 建立完直接進入「加入食品」頁，方便馬上記錄
    router.replace({ name: 'food', params: { id }, query: route.query })
  } catch (err) {
    console.error(err)
    error.value = '儲存失敗，請再試一次'
  } finally {
    saving.value = false
  }
}

const confirmDelete = ref(false)
function onDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  custom.deleteFood(existing.value.id)
  router.back()
}
</script>

<template>
  <div class="top">
    <button class="icon-btn" @click="router.back()" aria-label="關閉">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <h1 class="page-title">{{ isEdit ? '修改自訂食品' : '新增自訂食品' }}</h1>
    <div class="spacer"></div>
  </div>

  <p v-if="isEdit && !existing && custom.status !== 'ready'" class="empty">載入中…</p>
  <p v-else-if="isEdit && !existing" class="empty">找不到這個食品，可能已經被刪除了。</p>

  <template v-else>
    <p v-if="!auth.isLoggedIn" class="notice">請先到「更多」頁登入，才能新增自訂食品。</p>

    <section class="card">
      <div class="card-title">基本資料</div>
      <label for="cf-name" class="field-label">食品名稱<span class="hint">（必填）</span></label>
      <input id="cf-name" v-model="form.name" type="text" class="field" placeholder="例如：5.3 厚豆奶（無加糖）" />
      <label for="cf-brand" class="field-label">品牌<span class="hint">（選填）</span></label>
      <input id="cf-brand" v-model="form.brand" type="text" class="field" placeholder="例如：義美" />
    </section>

    <section class="card">
      <div class="card-head">
        <div class="card-title">營養標示</div>
        <div class="segment">
          <button :class="{ active: form.per === 'serving' }" :aria-pressed="form.per === 'serving'" @click="form.per = 'serving'">每份</button>
          <button :class="{ active: form.per === '100' }" :aria-pressed="form.per === '100'" @click="form.per = '100'">每 100 {{ baseLabel }}</button>
        </div>
      </div>
      <p class="hint">照著包裝上的營養標示填就好，選哪種看包裝怎麼寫。</p>

      <div class="row">
        <label for="cf-serving" class="row-label">每份份量<span class="required">*</span></label>
        <div class="input-wrap">
          <input id="cf-serving" v-model="form.servingSize" type="number" inputmode="decimal" class="num input" placeholder="0" />
          <select v-model="form.baseUnit" aria-label="份量單位" class="select">
            <option value="g">克</option>
            <option value="ml">毫升</option>
          </select>
        </div>
      </div>

      <div v-for="r in REQUIRED" :key="r.key" class="row divider">
        <label :for="'cf-' + r.key" class="row-label">
          <span class="dot" :style="{ background: r.color }"></span>{{ r.label }}<span class="required">*</span>
        </label>
        <div class="input-wrap">
          <input :id="'cf-' + r.key" v-model="form.values[r.key]" type="number" inputmode="decimal" class="num input" placeholder="0" />
          <span class="unit">{{ r.unit }}</span>
        </div>
      </div>

      <button class="soft-btn" @click="showOptional = !showOptional" :aria-expanded="showOptional">
        {{ showOptional ? '收合其他營養素' : '填寫其他營養素（選填）' }}
      </button>

      <template v-if="showOptional">
        <div v-for="o in OPTIONAL" :key="o.key" class="row">
          <label :for="'cf-' + o.key" class="row-label light">{{ o.label }}</label>
          <div class="input-wrap">
            <input :id="'cf-' + o.key" v-model="form.values[o.key]" type="number" inputmode="decimal" class="num input light" placeholder="—" />
            <span class="unit">{{ o.unit }}</span>
          </div>
        </div>
      </template>
      <p class="hint">標示 <span class="required">*</span> 的欄位為必填。</p>
    </section>

    <section class="card">
      <div class="card-title">常用單位<span class="hint">（選填）</span></div>
      <p class="hint">例如「1 瓶＝400 毫升」「1 條＝28 克」，記錄時就能直接選「瓶」「條」。「份」會自動加入，不用另外設定。</p>
      <div v-for="(u, i) in form.units" :key="i" class="unit-row">
        <span>1</span>
        <input v-model="u.name" type="text" class="field small" placeholder="瓶" aria-label="單位名稱" />
        <span>＝</span>
        <input v-model="u.amount" type="number" inputmode="decimal" class="num field small right" placeholder="0" aria-label="換算數量" />
        <span class="grow">{{ baseLabel }}</span>
        <button class="remove-btn" @click="removeUnit(i)" aria-label="刪除這個單位">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <button class="dashed-btn" @click="addUnit">＋ 新增單位</button>
    </section>

    <p v-if="error" class="notice error">{{ error }}</p>

    <div class="bottom">
      <button v-if="isEdit" class="delete-btn" @click="onDelete">{{ confirmDelete ? '確定刪除？' : '刪除' }}</button>
      <button class="main-btn" :disabled="!canSave || saving" @click="save">
        {{ saving ? '儲存中…' : isEdit ? '儲存修改' : '儲存食品' }}
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
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-title { font-size: 15px; font-weight: 900; }
.field-label { font-size: 13px; font-weight: 700; }
.hint { font-size: 12px; color: var(--muted); font-weight: 400; line-height: 1.6; margin: 0; }
.required { color: #B42318; margin-left: 2px; }
.field { height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 14px; font-size: 15px; color: var(--ink); font-family: inherit; }
.field.small { width: 80px; height: 44px; padding: 0 12px; }
.field.right { text-align: right; font-weight: 900; }
.segment { display: flex; gap: 2px; padding: 3px; background: var(--bg); border-radius: 20px; }
.segment button { height: 36px; padding: 0 12px; border: 0; border-radius: 18px; font-size: 13px; font-weight: 700; background: transparent; color: var(--muted); }
.segment button.active { background: var(--primary); color: var(--on-primary); }
.row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.row.divider { padding-top: 10px; border-top: 1px solid var(--line); }
.row-label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }
.row-label.light { font-weight: 400; }
.dot { width: 8px; height: 8px; border-radius: 4px; }
.input-wrap { display: flex; align-items: center; gap: 6px; }
.input { width: 96px; height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 12px; text-align: right; font-size: 18px; font-weight: 900; color: var(--ink); }
.input.light { background: var(--bg); height: 44px; font-size: 16px; }
.select { width: 84px; height: 48px; border: 0; border-radius: 14px; background: var(--soft); padding: 0 10px; font-size: 14px; font-weight: 700; color: var(--ink); font-family: inherit; }
.unit { width: 28px; font-size: 13px; color: var(--muted); white-space: nowrap; }
.soft-btn { height: 44px; border: 0; border-radius: 22px; background: var(--bg); color: var(--ink); font-size: 14px; font-weight: 700; }
.unit-row { display: flex; align-items: center; gap: 8px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 14px; white-space: nowrap; }
.grow { flex: 1; }
.remove-btn { width: 44px; height: 44px; border: 0; border-radius: 22px; background: transparent; color: var(--muted); padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dashed-btn { height: 44px; border: 1.5px dashed #9AA2B3; border-radius: 22px; background: transparent; color: var(--text-accent); font-size: 14px; font-weight: 700; }
.bottom { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: min(480px, 100%); padding: 16px 20px 28px; background: var(--bg); display: flex; gap: 10px; }
.main-btn { flex: 1; height: 56px; border: 0; border-radius: 28px; background: var(--primary); color: var(--on-primary); font-size: 16px; font-weight: 900; }
.main-btn:disabled { background: #C9CEDA; color: var(--muted); }
.delete-btn { height: 56px; padding: 0 22px; border: 1.5px solid #F3B8AE; border-radius: 28px; background: #FFFFFF; color: #B42318; font-size: 15px; font-weight: 700; }
</style>