import Vue from 'vue'
import Router from 'vue-router'
//import Router from './hash-router.vue'

import Home from './views/Home.vue'
import Accounts from './views/Accounts.vue'
import Profile from './views/Profile.vue'
import Overview from './views/Overview.vue'

import NotFound from './views/NotFound.vue'

Vue.use(Router)

export default new Router({
//  mode: 'history',
//  base: process.env.PUBLIC_URL,
  routes: [

    {
      path: '/',
      name: 'home',
      component: Home
    },

    {
      path: '/Accounts',
      name: 'accounts',
      component: Accounts
    },

    {
      path: '/Profile',
      name: 'profile',
      component: Profile
    },

    {
      path: '/Overview',
      name: 'overview',
      component: Overview
    },

   
    {
      path: '/*',
      component: NotFound
    },
  ]
})
