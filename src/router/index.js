import { createRouter, createWebHistory } from 'vue-router'
import AddFoodView from '../views/AddFoodView.vue'
import TodayView from '../views/TodayView.vue'
import ProgressView from '../views/ProgressView.vue'
import MoreView from '../views/MoreView.vue'
import FoodEntryView from '../views/FoodEntryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'today', component: TodayView },
    { path: '/progress', name: 'progress', component: ProgressView },
    { path: '/more', name: 'more', component: MoreView },
    { path: '/add', name: 'add', component: AddFoodView, meta: { hideNav: true } },
    { path: '/add/:id', name: 'food', component: FoodEntryView, meta: { hideNav: true } },
],
})

export default router