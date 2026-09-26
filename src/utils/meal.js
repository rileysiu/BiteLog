export const MEALS = [
  { key: 'breakfast', name: '早餐', color: '#D08A1E' },
  { key: 'lunch', name: '午餐', color: '#2BA59A' },
  { key: 'dinner', name: '晚餐', color: '#4F55C9' },
  { key: 'snack', name: '點心', color: '#C8467A' },
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