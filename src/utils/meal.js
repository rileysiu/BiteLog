export const MEALS = [
  { key: 'breakfast', name: '早餐' },
  { key: 'lunch', name: '午餐' },
  { key: 'dinner', name: '晚餐' },
  { key: 'snack', name: '點心' },
]

export function suggestMeal(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 10) return 'breakfast'
  if (h >= 10 && h < 14) return 'lunch'
  if (h >= 17 && h < 21) return 'dinner'
  return 'snack'
}

export function mealName(key) {
  return MEALS.find((m) => m.key === key)?.name ?? ''
}