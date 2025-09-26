// stores/app/themeOverride.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

// минимальный слепок полей, которые мы можем переопределять
export type ThemeOverride = Partial<{
  textColor: string
  bgKind: 'color' | 'gradient' | 'image'
  bgColor: string
  bgGradient: string
  bgImage: string
  bgSize: string
  bgPosition: string
  bgRepeat: string
  overlayColor: string
  overlayOpacity: number
  cardBg: string
  borderColor: string
  hoverColor: string
  primaryColor: string
  surfaceVariantColor: string
}>

export const useThemeOverrideStore = defineStore('themeOverride', () => {
  const override = ref<ThemeOverride | null>(null)
  function set(v: ThemeOverride | null) {
    override.value = v
  }
  return { override, set }
})