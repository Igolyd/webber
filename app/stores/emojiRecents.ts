import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useEmojiRecentsStore = defineStore('emojiRecents', () => {
  // Храним только символы эмодзи
  const recents = useStorage<string[]>('app.emojiRecents', [])

  function push(emojiChar: string) {
    if (!emojiChar) return
    const i = recents.value.indexOf(emojiChar)
    if (i !== -1) recents.value.splice(i, 1)
    recents.value.unshift(emojiChar)
    if (recents.value.length > 40) recents.value.length = 40
  }

  function top(n = 8) {
    return recents.value.slice(0, n)
  }

  return { recents, push, top }
})