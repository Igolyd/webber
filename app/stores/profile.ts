// src/stores/settings.ts
import { defineStore } from 'pinia'

interface ProfileState {
  imgProfileSrc: string
  BgProfileSrc: string
}

export const useProfileStore = defineStore('settings', {
  state: () =>
    ({
      imgProfileSrc: 'ssd',
      BgProfileSrc: 'string',
    }) as ProfileState,

  actions: {
    // toggleMicrophone(value: boolean) {
    //   this.microphoneEnabled = value
    // },
    // toggleAudio(value: boolean) {
    //   this.audioEnabled = value
    // },
    // toggleVideo(value: boolean) {
    //   this.videoEnabled = value
    // },
    // toggleTranslate(value: boolean) {
    //   this.translateEnabled = value
    // },
  },
})
