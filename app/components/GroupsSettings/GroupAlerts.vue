<template>
  <div class="pa-4">
    <h2 class="text-h6 mb-2">Алерты группы</h2>
    <p class="text-medium-emphasis mb-4">
      Управляйте библиотекой видео/аудио-алертов, которые доступны участникам
      группы.
    </p>
    <v-switch v-model="allowPersonal" label="Использовать личные алерты" />

    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <h3 class="text-subtitle-1 mb-2">Видео</h3>
        <div class="d-flex flex-wrap ga-2">
          <v-card
            v-for="a in groupVideo"
            :key="a.id"
            class="pa-2 elevation-1"
            style="width: 180px"
          >
            <v-img :src="a.poster" height="90" cover class="mb-2 rounded" />
            <div class="text-truncate">{{ a.name }}</div>
            <div class="text-caption">~{{ a.durationSec || 0 }}s</div>
            <div class="mt-2">
              <v-btn
                size="x-small"
                variant="text"
                color="error"
                @click="lib.removeAsset(a.id)"
                >Удалить</v-btn
              >
            </div>
          </v-card>
        </div>
        <div class="mt-2">
          <v-btn size="small" variant="tonal" @click="pick('video')"
            ><v-icon start>mdi-upload</v-icon>Загрузить видео</v-btn
          >
          <input
            ref="fVideo"
            type="file"
            class="d-none"
            accept="video/*"
            @change="onPick('video', $event)"
          />
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <h3 class="text-subtitle-1 mb-2">Аудио</h3>
        <div class="d-flex flex-wrap ga-2">
          <v-card
            v-for="a in groupAudio"
            :key="a.id"
            class="pa-2 elevation-1"
            style="width: 180px"
          >
            <v-icon class="mb-2">mdi-music</v-icon>
            <div class="text-truncate">{{ a.name }}</div>
            <div class="mt-2">
              <v-btn
                size="x-small"
                variant="text"
                color="error"
                @click="lib.removeAsset(a.id)"
                >Удалить</v-btn
              >
            </div>
          </v-card>
        </div>
        <div class="mt-2">
          <v-btn size="small" variant="tonal" @click="pick('audio')"
            ><v-icon start>mdi-upload</v-icon>Загрузить аудио</v-btn
          >
          <input
            ref="fAudio"
            type="file"
            class="d-none"
            accept="audio/*"
            @change="onPick('audio', $event)"
          />
        </div>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import {
  useAlertsLibraryStore,
  useGroupAlertsSettingsStore,
  MAX_FILE_SIZE,
} from "@/stores/alerts";

const route = useRoute();
const groupId = computed(() => String(route.params.id || ""));
const lib = useAlertsLibraryStore();
const settings = useGroupAlertsSettingsStore();

const allowPersonal = ref<boolean>(true);
watch(
  groupId,
  () => {
    allowPersonal.value = settings.getAllowPersonalAlerts(groupId.value);
  },
  { immediate: true }
);
watch(allowPersonal, (v) => settings.setAllowPersonalAlerts(groupId.value, v));

const groupVideo = computed(() =>
  lib.listByOwner("group", groupId.value, "video")
);
const groupAudio = computed(() =>
  lib.listByOwner("group", groupId.value, "audio")
);

const fVideo = ref<HTMLInputElement | null>(null);

const fAudio = ref<HTMLInputElement | null>(null);

function pick(kind: "video" | "audio") {
  (kind === "video" ? fVideo : fAudio).value?.click();
}

async function onPick(kind: "video" | "audio", e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !groupId.value) return;
  if (file.size > MAX_FILE_SIZE) {
    alert("Файл превышает 100 МБ");
    input.value = "";
    return;
  }
  const dataUrl = await read(file);
  try {
    await lib.addAsset({
      ownerType: "group",
      ownerId: groupId.value,
      kind,
      name: file.name,
      mime: file.type || (kind === "video" ? "video/mp4" : "audio/mpeg"),
      size: file.size,
      dataUrl,
      file,
    } as any);
  } catch (e: any) {
    alert(e?.message || "Ошибка загрузки");
  } finally {
    input.value = "";
  }
}
function read(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read error"));
    r.readAsDataURL(file);
  });
}
</script>
