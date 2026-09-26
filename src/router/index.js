import { createRouter, createWebHistory } from 'vue-router'
import AddFoodView from '../views/AddFoodView.vue'
import TodayView from '../views/TodayView.vue'
import ProgressView from '../views/ProgressView.vue'
import MoreView from '../views/MoreView.vue'
import FoodEntryView from '../views/FoodEntryView.vue'
import GoalsView from '../views/GoalsView.vue'
import WeightLogView from '../views/WeightLogView.vue'
import CopyMealView from '../views/CopyMealView.vue'
import SaveMealView from '../views/SaveMealView.vue'
import MealDetailView from '../views/MealDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'today', component: TodayView },
    { path: '/progress', name: 'progress', component: ProgressView },
    { path: '/more', name: 'more', component: MoreView },
    { path: '/add', name: 'add', component: AddFoodView, meta: { hideNav: true } },
    { path: '/add/:id', name: 'food', component: FoodEntryView, meta: { hideNav: true } },
    { path: '/goals', name: 'goals', component: GoalsView, meta: { hideNav: true } },
    { path: '/weight', name: 'weight', component: WeightLogView, meta: { hideNav: true } },
    { path: '/entry/:id', name: 'editEntry', component: FoodEntryView, meta: { hideNav: true } },
    { path: '/copy', name: 'copy', component: CopyMealView, meta: { hideNav: true } },
    { path: '/save-meal', name: 'saveMeal', component: SaveMealView, meta: { hideNav: true } },
    { path: '/meals/:id', name: 'meal', component: MealDetailView, meta: { hideNav: true } },
  ],
})

export default router