import Vue from 'vue'
import VueTailwind from 'vue-tailwind'
import App from './App.vue'
import router from './router'



import '@fortawesome/fontawesome-free/js/all.js';
import './css/main.css'
import './css/normalize.css'
import './css/webflow.css'
import './css/custom.webflow.css'

Vue.config.productionTip = false

Vue.use(VueTailwind)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
