// plugins/theme-cssvars.client.ts
import { watch } from 'vue'
import { lightVars, darkVars } from '../../theme/presets'
import { useAppearanceStore } from '~/stores/app/appearance'
import { useCustomThemeStore } from '~/stores/app/themeCustom'

function applyCssVars(vars: Record<string, string>) {
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

export default defineNuxtPlugin(() => {
  const appearance = useAppearanceStore()
  const custom = useCustomThemeStore()

  const apply = () => {
    if (appearance.theme == 'light') applyCssVars(lightVars)
    else if (appearance.theme == 'dark') applyCssVars(darkVars)
    else applyCssVars(custom.cssVars)
  }

  watch(() => appearance.theme, apply, { immediate: true })
  // computed возвращает новый объект — deep не обязателен
  watch(() => custom.cssVars, () => {
    if (appearance.theme === 'custom') applyCssVars(custom.cssVars)
  })
})