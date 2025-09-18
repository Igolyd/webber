// stores/app/appearance.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export type Theme = 'light' | 'dark' | 'custom'

export const useAppearanceStore = defineStore('appearance', () => {
  const theme = useLocalStorage<Theme>('app-theme', 'dark')

  watch(theme, (val) => {
    document.documentElement.setAttribute('data-theme', val)
    // Для Vuetify: vuetify.framework.theme.global.name = val
  }, { immediate: true })

  return { theme }
})