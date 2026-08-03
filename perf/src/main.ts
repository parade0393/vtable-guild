import { createApp } from 'vue'
import { createVTableGuild } from '@vtable-guild/vtable-guild'

// prebuilt 模式：这是绝大多数用户的默认接入方式，对照就该测这个。
// 同时它的内部 utility 带 vtg- 前缀，天然不会和 antdv / element-plus 的样式互相污染。
import '@vtable-guild/vtable-guild/css/style'

import App from './App.vue'
import './style.css'

// 刻意不 app.use(Antd) / app.use(ElementPlus)：
// 三个被测库各自在 subject 组件里按需引入，同一时刻只有一个进 DOM。
createApp(App).use(createVTableGuild()).mount('#app')
