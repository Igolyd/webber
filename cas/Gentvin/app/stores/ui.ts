// ~/stores/ui.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  const callWindowOpen = ref(false);
  return { callWindowOpen };
});