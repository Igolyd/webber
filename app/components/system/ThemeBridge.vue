<!-- components/system/ThemeBridge.vue -->
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { storeToRefs } from 'pinia'
import { useAppearanceStore } from '~/stores/app/appearance'
import { useCustomThemeStore } from '~/stores/app/themeCustom'
import { useThemeOverrideStore } from '~/stores/app/themeOverride'

type ThemeName = 'light' | 'dark' | 'custom'

type CustomTheme = {
  textColor: string
  bgKind: 'color' | 'gradient' | 'image'
  bgColor?: string
  bgGradient?: string
  bgImage?: string
  bgSize?: string
  bgRepeat?: string
  bgPosition?: string
  overlayColor: string
  overlayOpacity: number
  cardBg: string
  borderColor: string
  // NEW
  hoverColor: string
  primaryColor: string
  surfaceVariantColor: string
}

const appearance = useAppearanceStore()
const { theme } = storeToRefs(appearance)

const custom = useCustomThemeStore()
const override = useThemeOverrideStore()
const vuetifyTheme = useTheme()

// Базовые пресеты (без overrides/кастома)
const PRESETS: Record<'light' | 'dark', CustomTheme> = {
  light: {
    textColor: '#111111',
    bgKind: 'color',
    bgColor: '#f5f6f8',
    overlayColor: '#000000',
    overlayOpacity: 0,
    cardBg: '#ffffff',
    borderColor: '#e5e7eb',
    // NEW
    hoverColor: 'rgba(0,0,0,0.06)',
    primaryColor: '#4f9cf9',
    surfaceVariantColor: '#f1f3f5',
  },
  dark: {
    textColor: '#eaeaea',
    bgKind: 'color',
    bgColor: '#121212',
    overlayColor: '#000000',
    overlayOpacity: 0,
    cardBg: '#1e1e1e',
    borderColor: '#2a2a2a',
    // NEW
    hoverColor: 'rgba(255,255,255,0.08)',
    primaryColor: '#4f9cf9',
    surfaceVariantColor: '#3a3a3a',
  },
}

function applyAll() {
  if (typeof window === 'undefined') return

  const currentTheme = theme.value as ThemeName

  // 1) База: пресет или сохранённый кастом
  const base = currentTheme === 'custom'
    ? clampCustom(custom.getSnapshot?.() ?? {})
    : PRESETS[currentTheme]

  // 2) Оверрайд (например, от группы) — поверх базы
  const ov = override.override // Partial
  const data = ov ? clampCustom({ ...base, ...ov }) : base

  // 3) CSS переменные
  applyCssVars(data)

  // 4) Vuetify тема
  applyVuetifyTheme(currentTheme, data)
}

function applyCssVars(data: CustomTheme) {
  const root = document.documentElement

  // Базовые
  root.style.setProperty('--app-text-color', data.textColor)
  root.style.setProperty('--app-card-bg', data.cardBg)
  root.style.setProperty('--app-border-color', data.borderColor)

  // Hover
  root.style.setProperty('--app-hover-color', data.hoverColor || 'rgba(127,127,127,0.08)')

  // Фон
  const kind = data.bgKind
  const bgColor = data.bgColor ?? 'transparent'
  root.style.setProperty('--app-bg-color', bgColor)

  if (kind === 'gradient') {
    const grad = (data.bgGradient?.trim() || 'none')
    root.style.setProperty('--app-bg-image', grad)
  } else if (kind === 'image') {
    const img = data.bgImage ? `url("${data.bgImage}")` : 'none'
    root.style.setProperty('--app-bg-image', img)
  } else {
    root.style.setProperty('--app-bg-image', 'none')
  }

  root.style.setProperty('--app-bg-size', data.bgSize || 'cover')
  root.style.setProperty('--app-bg-repeat', data.bgRepeat || 'no-repeat')
  root.style.setProperty('--app-bg-position', data.bgPosition || 'center')

  root.style.setProperty('--app-bg-overlay-color', data.overlayColor || 'transparent')
  root.style.setProperty('--app-bg-overlay-opacity', String(data.overlayOpacity ?? 0))
}

function applyVuetifyTheme(name: ThemeName, data: CustomTheme) {
  if (name !== 'custom') {
    vuetifyTheme.change(name) // no deprecation
    return
  }

  const baseColor = data.cardBg || data.bgColor || '#121212'
  const isDark = isDarkColor(baseColor)

  vuetifyTheme.themes.value.custom = {
    dark: isDark,
    colors: {
      background: data.bgColor || (isDark ? '#121212' : '#ffffff'),
      surface: data.cardBg,
      'on-surface': data.textColor,
      outline: data.borderColor,
      // ключевое — системные кнопки/тональные
      primary: data.primaryColor,
      'surface-variant': data.surfaceVariantColor,
      // второстепенное можно оставить из текущего набора
      secondary: isDark ? '#9aa0a6' : '#6c757d',
      error: '#ef4444',
      info: '#60a5fa',
      success: '#10b981',
      warning: '#f59e0b',
    },
    variables: {},
  }

  vuetifyTheme.change('custom')
}

// Утилиты

function clampCustom(raw: Partial<CustomTheme>): CustomTheme {
  const safe = { ...raw } as CustomTheme
  if (!safe.textColor) safe.textColor = '#eaeaea'
  if (!safe.cardBg) safe.cardBg = '#1e1e1e'
  if (!safe.borderColor) safe.borderColor = '#2a2a2a'
  if (!safe.bgKind) safe.bgKind = 'color'
  if (safe.bgKind === 'color' && !safe.bgColor) safe.bgColor = '#121212'
  if (!safe.overlayColor) safe.overlayColor = '#000000'
  if (typeof safe.overlayOpacity !== 'number') safe.overlayOpacity = Number(safe.overlayOpacity ?? 0) || 0
  if (!safe.bgSize) safe.bgSize = 'cover'
  if (!safe.bgRepeat) safe.bgRepeat = 'no-repeat'
  if (!safe.bgPosition) safe.bgPosition = 'center'
  // NEW
  if (!safe.hoverColor) safe.hoverColor = 'rgba(255,255,255,0.08)'
  if (!safe.primaryColor) safe.primaryColor = '#4f9cf9'
  if (!safe.surfaceVariantColor) safe.surfaceVariantColor = '#3a3a3a'
  return safe
}

function isDarkColor(color: string): boolean {
  const { r, g, b } = parseColor(color)
  const [R, G, B] = [r, g, b].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return luminance < 0.5
}

function parseColor(input: string): { r: number; g: number; b: number } {
  let s = input.trim().toLowerCase()

  if (s.startsWith('#')) {
    const hex = s.slice(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      return { r, g, b }
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return { r, g, b }
    }
  }

  if (s.startsWith('rgb')) {
    const re = new RegExp('rgba?<span>\</span>(([^)]+)<span>\</span>)')
    const m = s.match(re)
    if (m) {
      const parts = m[1].split(',').map((p) => p.trim())
      const r = clamp255(Number(parts[0]))
      const g = clamp255(Number(parts[1]))
      const b = clamp255(Number(parts[2]))
      return { r, g, b }
    }
  }

  return { r: 18, g: 18, b: 18 }
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

onMounted(() => {
  applyAll()
  watch(theme, () => applyAll())
  // любые изменения стора и внешних оверрайдов
  const unsub1 = (custom as any).$subscribe?.(() => applyAll())
  const unsub2 = (override as any).$subscribe?.(() => applyAll())
})
</script>

<template>
  <span style="display:none" />
</template>