// stores/app/notifications.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const groups = ref<boolean>(false)
  const direct = ref<boolean>(false)
  const news = ref<boolean>(false)
  return { groups, direct, news }
})