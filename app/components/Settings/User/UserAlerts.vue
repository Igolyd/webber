<template>
  <v-container class="scope-main">
    <v-card class="main-card">
      <v-card-title>Мои алерты</v-card-title>
      <v-card-text>
        Загрузка и управление видео/аудио-алертами (всего: видео ≤10, аудио ≤20)
      </v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-2">Видео</h3>
          <div class="d-flex flex-wrap ga-2">
            <v-card
              v-for="a in myVideo"
              :key="a.id"
              class="pa-2 elevation-1"
              style="width: 180px"
            >
              <v-img :src="a.poster" height="90" cover class="mb-2 rounded" />
              <div class="text-truncate">{{ a.name }}</div>
              <div class="text-caption">~{{ a.durationSec || 0 }}s</div>
              <div class="mt-2 d-flex flex-wrap ga-1">
                <v-btn size="x-small" variant="text" @click="testShow(a)"
                  >Тест: показать</v-btn
                >
                <v-btn size="x-small" variant="text" @click="testSendToSelf(a)"
                  >Тест: себе</v-btn
                >
                <v-btn size="x-small" variant="text" @click="openEdit(a)">
                  Редактировать
                </v-btn>
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
            <v-btn size="small" variant="tonal" @click="pick('video')">
              <v-icon start>mdi-upload</v-icon>Загрузить видео
            </v-btn>
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
              v-for="a in myAudio"
              :key="a.id"
              class="pa-2 elevation-1"
              style="width: 180px"
            >
              <v-icon class="mb-2">mdi-music</v-icon>
              <div class="text-truncate">{{ a.name }}</div>
              <div class="mt-2 d-flex flex-wrap ga-1">
                <v-btn size="x-small" variant="text" @click="testShow(a)"
                  >Тест: показать</v-btn
                >
                <v-btn size="x-small" variant="text" @click="testSendToSelf(a)"
                  >Тест: себе</v-btn
                >
                <v-btn size="x-small" variant="text" @click="openEdit(a)">
                  Редактировать
                </v-btn>
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
            <v-btn size="small" variant="tonal" @click="pick('audio')">
              <v-icon start>mdi-upload</v-icon>Загрузить аудио
            </v-btn>
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

      <v-divider class="my-6" />

      <h3 class="text-subtitle-1 mb-2">Настройки воспроизведения</h3>
      <v-switch
        v-model="settings.autoplay"
        label="Автовоспроизведение (без звука)"
      />
      <v-slider
        v-model="settings.volume"
        min="0"
        max="1"
        step="0.05"
        label="Громкость"
        thumb-label
        style="max-width: 360px"
      />
      <v-select
        v-model="settings.playMode"
        :items="[
          { value: 'overlay', title: 'Внутри приложения (оверлей)' },
          { value: 'pip', title: 'Картинка в картинке (PiP)' },
          { value: 'popup', title: 'Отдельное окно (popup)' },
        ]"
        label="Режим воспроизведения"
        style="max-width: 420px"
      />
      <v-text-field
        v-model="settings.testMessage"
        label="Сообщение для теста (показывается в алерте)"
        variant="outlined"
        hide-details
        style="max-width: 420px"
      />
      <div class="d-flex ga-2 align-end" style="max-width: 420px">
        <v-select
          v-model="settings.testFrom"
          :items="[
            { value: 'me', title: 'Я' },
            { value: 'custom', title: 'Другое имя' },
          ]"
          label="От кого"
          density="comfortable"
          style="flex: 0 0 200px"
        />
        <v-text-field
          v-if="settings.testFrom === 'custom'"
          v-model="settings.testFromName"
          label="Имя отправителя"
          variant="outlined"
          hide-details
          style="flex: 1 1 auto"
          :placeholder="profile.name || 'Я'"
        />
      </div>
      <AlertTrimDialog
        v-model="trimDialog.open"
        :file="trimDialog.file"
        :kind="trimDialog.kind"
        @cancel="closeTrim"
        @trimmed="onTrimmed"
      />
      <AlertEditDialog v-model="editState.open" :asset-id="editState.id" />
    </v-card>
  </v-container>
</template>
<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from "vue";
import { useUserAccountStore } from "@/stores/user/account";
import { useProfilesStore } from "~/stores/user/profiles";
import {
  useAlertsLibraryStore,
  useUserAlertsSettingsStore,
  MAX_FILE_SIZE,
  useAlertsRuntimeStore,
  type AlertAsset,
  MAX_VIDEO_DURATION,
  probeAudio,
  probeVideo,
} from "@/stores/alerts";

import AlertTrimDialog from "@/components/alerts/AlertTrimDialog.vue";
import AlertEditDialog from "~/components/alerts/AlertEditDialog.vue";

type ActionsCtx = {
  setHandlers: (h: {
    onSave?: () => Promise<void> | void;
    onReset?: () => void;
  }) => void;
  clearHandlers: () => void;
  saving: { value: boolean };
  markDirty?: () => void;
  clearDirty?: () => void;
};
const actions = inject<ActionsCtx | null>("settingsActions", null);

const trimDialog = ref<{
  open: boolean;
  file: File | null;
  kind: "video" | "audio";
}>({
  open: false,
  file: null,
  kind: "video",
});
const editState = ref<{ open: boolean; id: string | null }>({
  open: false,
  id: null,
});
const account = useUserAccountStore();
const lib = useAlertsLibraryStore();
const settings = useUserAlertsSettingsStore();
const runtime = useAlertsRuntimeStore();
const profile = useProfilesStore(); // NEW

const fVideo = ref<HTMLInputElement | null>(null);

const fAudio = ref<HTMLInputElement | null>(null);

const myVideo = computed<AlertAsset[]>(
  () => lib.listByOwner("user", account.userId || "", "video") as any
);

const myAudio = computed<AlertAsset[]>(
  () => lib.listByOwner("user", account.userId || "", "audio") as any
);

function pick(kind: "video" | "audio") {
  if (kind === "video") fVideo.value?.click();
  else fAudio.value?.click();
}
function openEdit(a: AlertAsset) {
  editState.value = { open: true, id: a.id };
}
async function onPick(kind: "video" | "audio", e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !account.userId) return;

  if (file.size > MAX_FILE_SIZE) {
    alert("Файл превышает 100 МБ");
    input.value = "";
    return;
  }

  try {
    let durationSec = 0;

    if (kind === "video") {
      const { durationSec: d } = await probeVideo(file);
      durationSec = d;
      if (durationSec <= MAX_VIDEO_DURATION) {
        await addFileAsAsset(file, kind);
      } else {
        trimDialog.value = { open: true, file, kind };
      }
    } else {
      const { durationSec: d } = await probeAudio(file);
      durationSec = d;
      if (durationSec <= MAX_VIDEO_DURATION) {
        await addFileAsAsset(file, kind);
      } else {
        trimDialog.value = { open: true, file, kind };
      }
    }
  } catch (e: any) {
    alert(e?.message || "Ошибка обработки файла");
  } finally {
    input.value = "";
  }
}
async function onTrimmed(payload: { file: File; durationSec: number }) {
  const { file, durationSec } = payload;
  const kind = trimDialog.value.kind;
  try {
    await addFileAsAsset(file, kind, durationSec);
  } catch (e: any) {
    console.error("TRIM ERROR", e);
    alert(e?.message || "Не удалось сохранить обрезанный файл");
  } finally {
    closeTrim();
  }
}

function closeTrim() {
  trimDialog.value = { open: false, file: null, kind: "video" };
}

async function addOriginal() {
  if (!account.userId || !trimDialog.value.file) return;
  const file = trimDialog.value.file;
  const kind = trimDialog.value.kind;
  try {
    const dataUrl = await read(file);
    await lib.addAsset({
      ownerType: "user",
      ownerId: account.userId,
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
    closeTrim();
  }
}
async function addFileAsAsset(
  file: File,
  kind: "video" | "audio",
  durationSec?: number
) {
  if (!account.userId) return;
  const dataUrl = await read(file);
  await lib.addAsset({
    ownerType: "user",
    ownerId: account.userId,
    kind,
    name: file.name,
    mime: file.type || (kind === "video" ? "video/mp4" : "audio/mpeg"),
    size: file.size,
    dataUrl, // <— есть!
    file,
    durationSec,
  } as any);
}
function humanSize(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  return (n / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function read(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read error"));
    r.readAsDataURL(file);
  });
}

// Тестовые действия
function testShow(asset: any) {
  if (!account.userId) return;
  const from =
    settings.testFrom === "me"
      ? profile.name || "Я"
      : settings.testFromName || "Я";
  runtime.show({
    id: crypto.randomUUID(),
    asset,
    meta: {
      context: "dm",
      peerId: account.userId,
      action: "openTextChat",
    } as any,
    senderId: account.userId,
    recipients: { users: [account.userId], roles: [] },
    // NEW:
    text: settings.testMessage || "",
    fromName: from,
  } as any);
}
function testSendToSelf(asset: any) {
  if (!account.userId) return;
  const from =
    settings.testFrom === "me"
      ? profile.name || "Я"
      : settings.testFromName || "Я";

  runtime.sendAlertDM({
    meId: account.userId,
    peerId: account.userId,
    asset,
    action: "openTextChat",
    // NEW:
    text: settings.testMessage || "",
    fromName: from,
  } as any);
}

// Подключение к общему ActionsBar через provide/inject
onMounted(() => {
  actions?.setHandlers({
    onSave: async () => {
      // “Сохраняются” и так (useStorage), но используем диалог как UX-индикатор.
      // Фактического доп. сохранения не требуется.
    },
    onReset: () => {
      settings.autoplay = true as any;
      settings.volume = 0.8 as any;
      settings.playMode = "overlay" as any;
      actions?.clearDirty?.();
    },
  });

  // Отслеживаем изменения настроек — показываем диалог
  watch(
    () => settings.autoplay,
    () => actions?.markDirty?.()
  );
  watch(
    () => settings.volume,
    () => actions?.markDirty?.()
  );
  watch(
    () => settings.playMode,
    () => actions?.markDirty?.()
  );
});
onBeforeUnmount(() => {
  actions?.clearHandlers();
});
</script>
<style scoped>
.scope-main {
  --v-theme-surface: var(--main-background);
  --v-theme-on-surface: var(--main-on-surface);
  --v-theme-outline: var(--main-border);
  --v-theme-surface-variant: var(--main-elev-1);
  color: var(--main-on-surface);
}
.main-card {
  background: var(--main-background) !important;
  color: var(--main-on-surface) !important;
  border: 1px solid var(--main-border) !important;
  box-shadow: none;
  border-radius: 12px;
}
</style>
