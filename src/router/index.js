import { createRouter, createWebHistory } from 'vue-router'
import AddFoodView from '../views/AddFoodView.vue'
import TodayView from '../views/TodayView.vue'
import ProgressView from '../views/ProgressView.vue'
import MoreView from '../views/MoreView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'today', component: TodayView },
    { path: '/progress', name: 'progress', component: ProgressView },
    { path: '/more', name: 'more', component: MoreView },
    { path: '/add', name: 'add', component: AddFoodView, meta: { hideNav: true } },
  ],
})

export default router