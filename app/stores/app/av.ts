// stores/app/av.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAVStore = defineStore('av', () => {
  const inputDeviceId = ref<string>('')
  const outputDeviceId = ref<string>('') // output selection (для Chrome через setSinkId на <audio>)
  const inputVolume = ref<number>(100)
  const outputVolume = ref<number>(100)
  const inputSensitivity = ref<number>(-50) // дБ порог "noise gate" (пример)
  const lastMicLevel = ref<number>(0)

  function saveDevices({ inputId, outputId }: { inputId?: string; outputId?: string }) {
    if (inputId) inputDeviceId.value = inputId
    if (outputId) outputDeviceId.value = outputId
    // persist in localStorage if needed
    localStorage.setItem('cameraDevice', inputDeviceId.value) // совместимость, при желании можно разделить ключи
    localStorage.setItem('audioOutputDevice', outputDeviceId.value)
  }

  return {
    inputDeviceId, outputDeviceId, inputVolume, outputVolume, inputSensitivity, lastMicLevel, saveDevices
  }
})