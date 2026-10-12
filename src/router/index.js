import { createRouter, createWebHistory } from 'vue-router'


/* Page transfering url components */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: () => import('../Components/LobbyView.vue'),
    },
    {
      path: '/host',
      name: 'host',
      component: () => import('../Components/HostView.vue'),
    },
    {
      path: '/GameRoom/:code',
      name: 'GameRoom',
      component: () => import('../Components/GameRoom.vue'),
    },
    {
      path: '/game/:code',
      name: 'GameView',
      component: () => import('../Components/GameView.vue'),
    },
  ],
})

export default router
