export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: '久坐', desc: '幾乎不運動，大部分時間坐著', factor: 1.2 },
  { key: 'light', label: '輕度活動', desc: '每週運動 1～3 天', factor: 1.375 },
  { key: 'moderate', label: '中度活動', desc: '每週運動 3～5 天', factor: 1.55 },
  { key: 'active', label: '高度活動', desc: '每週運動 6～7 天', factor: 1.725 },
  { key: 'veryActive', label: '非常高', desc: '體力勞動的工作，或一天訓練兩次', factor: 1.9 },
]

export const GOAL_TYPES = [
  { key: 'lose', label: '減重', desc: '每週約減 0.5 公斤', delta: -500 },
  { key: 'maintain', label: '維持', desc: '維持目前的體重', delta: 0 },
  { key: 'gain', label: '增重', desc: '每週約增 0.25～0.5 公斤', delta: 300 },
]

// Mifflin-St Jeor 公式
export function calcBmr({ sex, age, height, weight }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

export function suggestKcal(profile) {
  const bmr = calcBmr(profile)
  const activity = ACTIVITY_LEVELS.find((a) => a.key === profile.activity) ?? ACTIVITY_LEVELS[0]
  const goal = GOAL_TYPES.find((g) => g.key === profile.goalType) ?? GOAL_TYPES[1]
  const tdee = bmr * activity.factor
  const raw = tdee + goal.delta
  const floored = raw < bmr
  const kcal = Math.round(Math.max(raw, bmr) / 10) * 10
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), delta: goal.delta, kcal, floored }
}