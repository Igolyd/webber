// src/stores/settings.ts
import { defineStore } from "pinia";

interface SettingsState {
  microphoneEnabled: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  translateEnabled: boolean;
  callEnabled: boolean;
}

export const useSettingsStore = defineStore("settings", {
  state: () =>
    ({
      microphoneEnabled: true,
      audioEnabled: true,
      videoEnabled: false,
      translateEnabled: false,
      callEnabled: false,
    } as SettingsState),

  actions: {
    toggleMicrophone(value: boolean) {
      this.microphoneEnabled = value;
    },
    toggleAudio(value: boolean) {
      this.audioEnabled = value;
    },
    toggleVideo(value: boolean) {
      this.videoEnabled = value;
    },
    toggleTranslate(value: boolean) {
      this.translateEnabled = value;
    },
    toggleCall(value: boolean) {
      this.callEnabled = value;
    },
  },
});
