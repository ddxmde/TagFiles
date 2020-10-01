import Vue from 'vue'
import App from './App.vue'

import './plugins/element.js'
import ElementUI from 'element-ui';

//import 'element-ui/lib/theme-chalk/index.css';
import './assets/theme/index.css'

import VueRouter from 'vue-router'



Vue.use(VueRouter)
Vue.use(ElementUI);
Vue.config.productionTip = false

import Main from './components/Main.vue'

import Folder from './components/Folder.vue'
import Setting from './components/Setting.vue'
const routes = [
  {
    name: 'Main',
    path: '/Main',
    component: Main
  },
  {
    name:'Folder',
    path: '/Folder',
    component: Folder
  }, {
    name: 'Setting',
    path: '/Setting',
    component: Setting
  }
]


import {
  message
} from './components/resetMessage';
Vue.prototype.$message = message;

// 3. 创建 router 实例，然后传 `routes` 配置
// 你还可以传别的配置参数, 不过先这么简单着吧。
const router = new VueRouter({
  routes // (缩写) 相当于 routes: routes
})

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
