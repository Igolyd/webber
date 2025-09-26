// stores/groupThemes.ts
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export type GroupThemeSnapshot = {
  textColor?: string
  bgKind?: 'color' | 'gradient' | 'image'
  bgColor?: string
  bgGradient?: string
  bgImage?: string
  bgSize?: string
  bgPosition?: string
  bgRepeat?: string
  overlayColor?: string
  overlayOpacity?: number
  cardBg?: string
  borderColor?: string
  hoverColor?: string
  primaryColor?: string
  surfaceVariantColor?: string
}

type Dict = Record<string, GroupThemeSnapshot | undefined>

export const useGroupThemesStore = defineStore('groupThemes', () => {
  const dict = useLocalStorage<Dict>('app.groupThemes', {})

  function get(groupId: string): GroupThemeSnapshot | null {
    return dict.value[groupId] ?? null
  }
  function set(groupId: string, snap: GroupThemeSnapshot) {
    dict.value = { ...dict.value, [groupId]: { ...snap } }
  }
  function remove(groupId: string) {
    const copy = { ...dict.value }; delete copy[groupId]; dict.value = copy
  }
  function has(groupId: string) {
    return !!dict.value[groupId]
  }

  return { dict, get, set, remove, has }
})