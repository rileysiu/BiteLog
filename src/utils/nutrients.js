// ref：每日參考值；'goal' 代表使用「我的目標」；null 代表未訂定
// limit：true 代表「吃太多不好」，超過參考值時會用橘色提醒
export const NUTRIENT_GROUPS = [
  {
    title: '碳水',
    items: [
      { key: 'carb', label: '碳水', unit: 'g', ref: 'goal' },
      { key: 'fiber', label: '膳食纖維', unit: 'g', ref: 25, sub: true },
      { key: 'sugar', label: '糖', unit: 'g', ref: null, sub: true, limit: true },
    ],
  },
  {
    title: '脂肪',
    items: [
      { key: 'fat', label: '脂肪', unit: 'g', ref: 'goal', limit: true },
      { key: 'satFat', label: '飽和脂肪', unit: 'g', ref: 18, sub: true, limit: true },
      { key: 'transFat', label: '反式脂肪', unit: 'g', ref: null, sub: true, limit: true },
      { key: 'cholesterol', label: '膽固醇', unit: 'mg', ref: 300, sub: true, limit: true },
    ],
  },
  {
    title: '蛋白',
    items: [{ key: 'protein', label: '蛋白', unit: 'g', ref: 'goal' }],
  },
  {
    title: '礦物質',
    items: [
      { key: 'sodium', label: '鈉', unit: 'mg', ref: 2000, limit: true },
      { key: 'potassium', label: '鉀', unit: 'mg', ref: null },
      { key: 'calcium', label: '鈣', unit: 'mg', ref: 1200 },
      { key: 'iron', label: '鐵', unit: 'mg', ref: 15 },
      { key: 'magnesium', label: '鎂', unit: 'mg', ref: 390 },
      { key: 'zinc', label: '鋅', unit: 'mg', ref: 15 },
      { key: 'phosphorus', label: '磷', unit: 'mg', ref: 1000 },
      { key: 'copper', label: '銅', unit: 'mg', ref: null },
      { key: 'manganese', label: '錳', unit: 'mg', ref: null },
    ],
  },
  {
    title: '維生素',
    items: [
      { key: 'vitA', label: '維生素 A', unit: 'μg', ref: 700 },
      { key: 'vitB1', label: '維生素 B1', unit: 'mg', ref: 1.4 },
      { key: 'vitB2', label: '維生素 B2', unit: 'mg', ref: 1.6 },
      { key: 'vitB6', label: '維生素 B6', unit: 'mg', ref: 1.6 },
      { key: 'vitB12', label: '維生素 B12', unit: 'μg', ref: 2.4 },
      { key: 'vitC', label: '維生素 C', unit: 'mg', ref: 100 },
      { key: 'vitD', label: '維生素 D', unit: 'μg', ref: 10 },
      { key: 'vitE', label: '維生素 E', unit: 'mg', ref: 13 },
      { key: 'vitK', label: '維生素 K', unit: 'μg', ref: 120 },
      { key: 'niacin', label: '菸鹼素', unit: 'mg', ref: 18 },
      { key: 'folate', label: '葉酸', unit: 'μg', ref: 400 },
    ],
  },
  {
    title: '其他',
    items: [{ key: 'alcohol', label: '酒精', unit: 'g', ref: null, limit: true }],
  },
]