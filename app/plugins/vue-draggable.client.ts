// plugins/vue-draggable.client.ts
import { defineNuxtPlugin } from '#app'
import { VueDraggableNext } from 'vue-draggable-next'
export default defineNuxtPlugin((nuxtApp) => {
  // Глобальная регистрация только на клиенте
  nuxtApp.vueApp.component('Draggable', VueDraggableNext)
})