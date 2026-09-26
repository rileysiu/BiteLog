import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const RAW_DIR = 'data-raw'
const OUT_FILE = 'public/foods.json'

// App 要保留的營養素：App 用的名稱 → 資料庫的欄位
// factor 是換算倍數，例如反式脂肪原本是 mg，乘 0.001 變成 g
const KEEP = {
  kcal: { from: '修正熱量', label: '卡路里', unit: 'kcal' },
  carb: { from: '總碳水化合物', label: '碳水', unit: 'g' },
  fat: { from: '粗脂肪', label: '脂肪', unit: 'g' },
  protein: { from: '粗蛋白', label: '蛋白', unit: 'g' },
  satFat: { from: '飽和脂肪', label: '飽和脂肪', unit: 'g' },
  transFat: { from: '反式脂肪', label: '反式脂肪', unit: 'g', factor: 0.001 },
  fiber: { from: '膳食纖維', label: '膳食纖維', unit: 'g' },
  sugar: { from: '糖質總量', label: '糖', unit: 'g' },
  cholesterol: { from: '膽固醇', label: '膽固醇', unit: 'mg' },
  alcohol: { from: '酒精含量', label: '酒精', unit: 'g' },
  sodium: { from: '鈉', label: '鈉', unit: 'mg' },
  potassium: { from: '鉀', label: '鉀', unit: 'mg' },
  calcium: { from: '鈣', label: '鈣', unit: 'mg' },
  iron: { from: '鐵', label: '鐵', unit: 'mg' },
  magnesium: { from: '鎂', label: '鎂', unit: 'mg' },
  zinc: { from: '鋅', label: '鋅', unit: 'mg' },
  phosphorus: { from: '磷', label: '磷', unit: 'mg' },
  copper: { from: '銅', label: '銅', unit: 'mg' },
  manganese: { from: '錳', label: '錳', unit: 'mg' },
  vitA: { from: '視網醇當量(RE)', label: '維生素 A', unit: 'μg' },
  vitB1: { from: '維生素B1', label: '維生素 B1', unit: 'mg' },
  vitB2: { from: '維生素B2', label: '維生素 B2', unit: 'mg' },
  vitB6: { from: '維生素B6', label: '維生素 B6', unit: 'mg' },
  vitB12: { from: '維生素B12', label: '維生素 B12', unit: 'μg' },
  vitC: { from: '維生素C', label: '維生素 C', unit: 'mg' },
  vitD: { from: '維生素D總量(ug)', label: '維生素 D', unit: 'μg' },
  vitE: { from: 'α-維生素E當量(α-TE)', label: '維生素 E', unit: 'mg' },
  vitK: { from: '維生素K1', label: '維生素 K', unit: 'μg' },
  niacin: { from: '菸鹼素', label: '菸鹼素', unit: 'mg' },
  folate: { from: '葉酸', label: '葉酸', unit: 'μg' },
}

// 反查表：資料庫欄位 → App 名稱
const FROM_TO_KEY = Object.fromEntries(Object.entries(KEEP).map(([key, v]) => [v.from, key]))

function toNumber(value) {
  if (value === null || value === undefined) return null
  const s = String(value).replace('克', '').trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const round = (n) => Math.round(n * 100) / 100

// 1. 讀取原始檔
const jsonFile = readdirSync(RAW_DIR).find((f) => f.toLowerCase().endsWith('.json'))
if (!jsonFile) {
  console.error('找不到 data-raw 裡的 JSON 檔')
  process.exit(1)
}
let text = readFileSync(join(RAW_DIR, jsonFile), 'utf8')
if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
const rows = JSON.parse(text)
console.log('讀取檔案：', jsonFile, '，共', rows.length, '行')

// 2. 合併成「一種食品一筆」
const foods = new Map()
const rawKcal = new Map() // 未修正的「熱量」，只用來驗算，不會輸出

for (const r of rows) {
  const id = r['整合編號']
  if (!id) continue

  if (!foods.has(id)) {
    foods.set(id, {
      id,
      name: r['樣品名稱'] ?? '',
      alias: r['俗名'] ?? '',
      category: r['食品分類'] ?? '',
      desc: r['內容物描述'] ?? '',
      unitGrams: null,
      n: {},
    })
  }
  const food = foods.get(id)

  const grams = toNumber(r['每單位重'])
  if (!food.unitGrams && grams) food.unitGrams = grams

  const item = r['分析項']
  const value = toNumber(r['每100克含量'])
  if (value === null) continue

  if (item === '熱量') rawKcal.set(id, value)

  const key = FROM_TO_KEY[item]
  if (!key) continue
  food.n[key] = round(value * (KEEP[key].factor ?? 1))
}

// 3. 輸出
const output = {
  source: '衛生福利部食品藥物管理署 食品營養成分資料集',
  convertedAt: new Date().toISOString().slice(0, 10),
  nutrients: Object.fromEntries(Object.entries(KEEP).map(([key, v]) => [key, { label: v.label, unit: v.unit }])),
  foods: [...foods.values()],
}
mkdirSync('public', { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(output))

// 4. 報告
const sizeKB = Math.round(statSync(OUT_FILE).size / 1024)
console.log('\n===== 整理結果 =====')
console.log('食品數量：', output.foods.length)
console.log('輸出檔案：', OUT_FILE, `(${sizeKB} KB)`)
console.log('有「每單位重」的食品：', output.foods.filter((f) => f.unitGrams).length)

console.log('\n===== 各營養素有資料的食品數 =====')
for (const [key, v] of Object.entries(KEEP)) {
  const count = output.foods.filter((f) => f.n[key] !== undefined).length
  console.log(`${v.label}（${key}）：${count}`)
}

console.log('\n===== 驗算卡路里（誤差 2 卡以內算符合）=====')
let matchCorrected = 0
let matchRaw = 0
let checked = 0
for (const f of output.foods) {
  const { protein = 0, fat = 0, carb, fiber = 0, kcal } = f.n
  if (carb === undefined || kcal === undefined || !rawKcal.has(f.id)) continue
  checked++
  const withFiber2 = protein * 4 + fat * 9 + (carb - fiber) * 4 + fiber * 2
  const allCarb4 = protein * 4 + fat * 9 + carb * 4
  if (Math.abs(withFiber2 - kcal) <= 2) matchCorrected++
  if (Math.abs(allCarb4 - rawKcal.get(f.id)) <= 2) matchRaw++
}
console.log(`共驗算 ${checked} 種食品`)
console.log(`修正熱量 ≈ 蛋白×4 + 脂肪×9 + (碳水−纖維)×4 + 纖維×2：${matchCorrected} 種符合`)
console.log(`熱量 ≈ 蛋白×4 + 脂肪×9 + 碳水×4：${matchRaw} 種符合`)

console.log('\n===== 抽查：名稱或俗名含「吐司／土司」=====')
const toast = output.foods.filter((f) => /吐司|土司/.test(f.name + f.alias))
if (toast.length === 0) console.log('（找不到）')
toast.slice(0, 5).forEach((f) => {
  console.log(`${f.id}｜${f.name}｜俗名：${f.alias || '無'}｜每單位：${f.unitGrams ?? '無'} 克`)
  console.log('  每 100 克：', `卡路里 ${f.n.kcal}｜碳水 ${f.n.carb}｜脂肪 ${f.n.fat}｜蛋白 ${f.n.protein}｜鈉 ${f.n.sodium}`)
})