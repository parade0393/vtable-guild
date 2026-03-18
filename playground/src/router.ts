import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/basic',
    },
    {
      path: '/basic',
      name: 'basic',
      component: () => import('./pages/BasicPage.vue'),
    },
    {
      path: '/filter',
      name: 'filter',
      component: () => import('./pages/FilterPage.vue'),
    },
    {
      path: '/selection',
      name: 'selection',
      component: () => import('./pages/SelectionPage.vue'),
    },
    {
      path: '/sort',
      name: 'sort',
      component: () => import('./pages/SortPage.vue'),
    },
  ],
})
