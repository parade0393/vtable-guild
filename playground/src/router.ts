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
    {
      path: '/advanced',
      name: 'advanced',
      component: () => import('./pages/AdvancedPage.vue'),
    },
    {
      path: '/virtual',
      name: 'virtual',
      component: () => import('./pages/VirtualPage.vue'),
    },
    {
      path: '/tree',
      name: 'tree',
      component: () => import('./pages/TreePage.vue'),
    },
    {
      path: '/antdv-full',
      name: 'antdv-full',
      component: () => import('./pages/AntdvFull.vue'),
    },
  ],
})
