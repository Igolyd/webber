// ~/stores/soundboard.ts
import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { computed } from "vue";
import { useUserAccountStore } from "@/stores/user/account";

export interface SoundClip {
  id: string;
  ownerId: string;
  name: string;
  mime: string;
  size: number;
  dataUrl: string; // base64
  durationSec: number;
  createdAt: string;
}

export const MAX_SOUND_DURATION = 10; // 10 секунд

export const useSoundboardStore = defineStore("soundboard", () => {
  // key: userId -> массив клипов
  const raw = useStorage<Record<string, SoundClip[]>>("app.soundboard", {});

  const account = useUserAccountStore();
  const meId = computed(() => account.userId || "");

  const myClips = computed<SoundClip[]>(() => {
    if (!meId.value) return [];
    return raw.value[meId.value] || [];
  });

  function listByOwner(ownerId: string): SoundClip[] {
    return raw.value[ownerId] || [];
  }

  async function addClip(params: {
    ownerId: string;
    name: string;
    mime: string;
    size: number;
    dataUrl: string;
    durationSec: number;
  }) {
    const { ownerId } = params;
    const clip: SoundClip = {
      id: crypto.randomUUID(),
      ownerId,
      name: params.name,
      mime: params.mime,
      size: params.size,
      dataUrl: params.dataUrl,
      durationSec: params.durationSec,
      createdAt: new Date().toISOString(),
    };
    const arr = raw.value[ownerId] || [];
    raw.value = {
      ...raw.value,
      [ownerId]: [...arr, clip],
    };
  }

  function removeClip(ownerId: string, id: string) {
    const arr = raw.value[ownerId] || [];
    raw.value = {
      ...raw.value,
      [ownerId]: arr.filter((c) => c.id !== id),
    };
  }

  function updateClip(
    ownerId: string,
    id: string,
    patch: Partial<Omit<SoundClip, "id" | "ownerId">>
  ) {
    const arr = raw.value[ownerId] || [];
    raw.value = {
      ...raw.value,
      [ownerId]: arr.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
  }

  return {
    myClips,
    listByOwner,
    addClip,
    removeClip,
    updateClip,
    MAX_SOUND_DURATION,
  };
});
