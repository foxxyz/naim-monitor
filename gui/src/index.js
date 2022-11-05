import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createSocket } from 'ws-plus/vue'

import App from './app.vue'
import HomePage from './pages/home.vue'

// Set up app
const app = createApp(App)

// Set up router
const routes = [
    { path: '/', component: HomePage }
]
const router = createRouter({ routes, history: createWebHistory() })
app.use(router)

// Connect to server
const socketClient = createSocket('ws://localhost:8090')
app.use(socketClient)

app.mount('body')
