// stores/app/appearance.ts
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import type { SystemTheme } from '../../../theme/presets'

type Theme = SystemTheme | 'custom' | 'light' | 'dark'

export const useAppearanceStore = defineStore('appearance', () => {
  const theme = useLocalStorage<Theme>('app.theme', 'classic')
  const preferPersonalThemeInGroups = useLocalStorage<boolean>('app.preferPersonalThemeInGroups', false)

  const normalizedTheme = computed<SystemTheme | 'custom'>(() => {
    if (theme.value === 'light') return 'sakura'
    if (theme.value === 'dark') return 'classic'
    return theme.value as SystemTheme | 'custom'
  })

  function setTheme(t: Theme) { theme.value = t }
  function setPreferPersonalThemeInGroups(v: boolean) { preferPersonalThemeInGroups.value = v }

  return { theme, setTheme, preferPersonalThemeInGroups, setPreferPersonalThemeInGroups, normalizedTheme }
})