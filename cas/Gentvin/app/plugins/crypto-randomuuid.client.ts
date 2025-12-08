export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return
  if (typeof window.crypto === 'undefined') return

  const cryptoAny = window.crypto as any

  if (typeof cryptoAny.randomUUID !== 'function') {
    cryptoAny.randomUUID = function () {
      // Простая реализация UUID v4
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (cryptoAny.getRandomValues(new Uint8Array(1))[0] & 0xf) >> 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
  }
})