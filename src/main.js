import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { app as firebaseApp } from './firebase'
console.log('Firebase 已連線：', firebaseApp.options.projectId)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')