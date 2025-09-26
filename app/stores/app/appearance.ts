// stores/app/appearance.ts (фрагмент)
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { ref } from 'vue'

type Theme = 'light' | 'dark' | 'custom'

export const useAppearanceStore = defineStore('appearance', () => {
  const theme = useLocalStorage<Theme>('app.theme', 'dark')
  const preferPersonalThemeInGroups = useLocalStorage<boolean>('app.preferPersonalThemeInGroups', false)

  function setTheme(t: Theme) { theme.value = t }
  function setPreferPersonalThemeInGroups(v: boolean) { preferPersonalThemeInGroups.value = v }

  return { theme, setTheme, preferPersonalThemeInGroups, setPreferPersonalThemeInGroups }
})