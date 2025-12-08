// stores/app/av.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAVStore = defineStore('av', () => {
  const inputDeviceId = ref<string>('')   // микрофон
  const outputDeviceId = ref<string>('')  // динамики
  const inputVolume = ref<number>(100)
  const outputVolume = ref<number>(100)
  const inputSensitivity = ref<number>(-50)
  const lastMicLevel = ref<number>(0)

  function saveDevices({ inputId, outputId }: { inputId?: string; outputId?: string }) {
    if (inputId) inputDeviceId.value = inputId
    if (outputId) outputDeviceId.value = outputId

    try {
      if (inputDeviceId.value) {
        localStorage.setItem('microphoneDevice', inputDeviceId.value)
      }
      if (outputDeviceId.value) {
        localStorage.setItem('audioOutputDevice', outputDeviceId.value)
      }
    } catch {}
  }

  return {
    inputDeviceId,
    outputDeviceId,
    inputVolume,
    outputVolume,
    inputSensitivity,
    lastMicLevel,
    saveDevices,
  }
})