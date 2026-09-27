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
import CustomFoodView from '../views/CustomFoodView.vue'
import RecipeView from '../views/RecipeView.vue'
import CalculatorView from '../views/CalculatorView.vue'
import QuickAddView from '../views/QuickAddView.vue'

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
    { path: '/custom-food/new', name: 'newCustomFood', component: CustomFoodView, meta: { hideNav: true } },
    { path: '/custom-food/:id', name: 'editCustomFood', component: CustomFoodView, meta: { hideNav: true } },
    { path: '/recipe/new', name: 'newRecipe', component: RecipeView, meta: { hideNav: true } },
    { path: '/recipe/:id', name: 'editRecipe', component: RecipeView, meta: { hideNav: true } },
    { path: '/goals/calculator', name: 'calculator', component: CalculatorView, meta: { hideNav: true } },
    { path: '/quick-add', name: 'quickAdd', component: QuickAddView, meta: { hideNav: true } },
    { path: '/quick-add/:id', name: 'editQuick', component: QuickAddView, meta: { hideNav: true } },
  ],
})

export default router