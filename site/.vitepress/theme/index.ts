import DefaultTheme from 'vitepress/theme'
import PlaygroundDemo from './components/PlaygroundDemo.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlaygroundDemo', PlaygroundDemo)
  },
}
