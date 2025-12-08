<!-- ~/components/Settings/User/UserSoundboard.vue -->
<template>
  <v-container class="scope-main scroll-y">
    <v-card class="main-card pa-4">
      <v-card-title>Звуковая панель</v-card-title>
      <v-card-text class="mb-4">
        Настройте свои звуковые клипы (макс. длина 10 секунд).
      </v-card-text>

      <v-row>
        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-2">Мои звуки</h3>

          <div class="d-flex flex-wrap ga-2">
            <v-card
              v-for="clip in myClips"
              :key="clip.id"
              class="pa-2 elevation-1"
              style="width: 220px"
            >
              <div class="d-flex align-center ga-2 mb-1">
                <v-icon color="primary">mdi-music</v-icon>
                <div class="text-truncate">{{ clip.name }}</div>
              </div>
              <div class="text-caption mb-2">
                ~{{ clip.durationSec.toFixed(1) }} с •
                {{ humanSize(clip.size) }}
              </div>

              <div class="d-flex flex-wrap ga-1">
                <v-btn size="x-small" variant="text" @click="playPreview(clip)">
                  Прослушать
                </v-btn>
                <v-btn
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="removeClip(clip)"
                >
                  Удалить
                </v-btn>
              </div>
            </v-card>
          </div>

          <div class="mt-3">
            <v-btn size="small" variant="tonal" @click="pickFile">
              <v-icon start>mdi-upload</v-icon>
              Загрузить звук
            </v-btn>
            <input
              ref="fileInput"
              type="file"
              class="d-none"
              accept="audio/*"
              @change="onFilePicked"
            />
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <h3 class="text-subtitle-1 mb-2">
            Обрезка звука (макс. {{ maxDuration }} с)
          </h3>

          <div v-if="selectedFile" class="mb-2">
            <div class="text-body-2 mb-1">
              Файл: {{ selectedFile.name }} ({{ humanSize(selectedFile.size) }})
            </div>
            <AudioTrimEditor
              ref="trimRef"
              :file="selectedFile"
              :max-duration="maxDuration"
              @update:selection="onSelectionUpdate"
            />
            <div class="mt-3 d-flex ga-2">
              <v-btn
                size="small"
                color="primary"
                :loading="savingTrim"
                @click="saveTrimmed"
              >
                Сохранить клип
              </v-btn>
              <v-btn size="small" variant="text" @click="clearSelected">
                Отменить
              </v-btn>
            </div>
          </div>
          <div v-else class="text-caption text-medium-emphasis">
            Выберите аудиофайл, чтобы обрезать его до звукового клипа.
          </div>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount } from "vue";
import AudioTrimEditor from "~/components/trim/AudioTrimEditor.vue";
import { useUserAccountStore } from "@/stores/user/account";
import {
  useSoundboardStore,
  MAX_SOUND_DURATION,
  type SoundClip,
} from "@/stores/soundboard";

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

const account = useUserAccountStore();
const soundboard = useSoundboardStore();

const myClips = computed(() => soundboard.myClips);

const maxDuration = MAX_SOUND_DURATION;

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const trimRef = ref<InstanceType<typeof AudioTrimEditor> | null>(null);

const savingTrim = ref(false);

// выбор файла
function pickFile() {
  fileInput.value?.click();
}
function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  if (!file) return;
  selectedFile.value = file;
  actions?.markDirty?.();
  input.value = "";
}

function clearSelected() {
  selectedFile.value = null;
}

// текущее выделение (для информации; AudioTrimEditor сам управляет)
const selection = ref<{ start: number; end: number }>({ start: 0, end: 0 });
function onSelectionUpdate(payload: { start: number; end: number }) {
  selection.value = payload;
}

// Сохранение триммированного файла как клипа
async function saveTrimmed() {
  if (!selectedFile.value || !account.userId || !trimRef.value) return;
  try {
    savingTrim.value = true;
    const { file, durationSec } = await trimRef.value.trim();

    // дополнительно страхуемся, что не больше maxDuration
    const dur = Math.min(durationSec, maxDuration);

    const dataUrl = await readAsDataUrl(file);

    await soundboard.addClip({
      ownerId: account.userId,
      name: file.name,
      mime: file.type || "audio/wav",
      size: file.size,
      dataUrl,
      durationSec: dur,
    });

    selectedFile.value = null;
    actions?.markDirty?.();
  } catch (e: any) {
    alert(e?.message || "Не удалось сохранить клип");
  } finally {
    savingTrim.value = false;
  }
}

function removeClip(clip: SoundClip) {
  if (!account.userId) return;
  soundboard.removeClip(account.userId, clip.id);
  actions?.markDirty?.();
}

// Локальное прослушивание клипа
async function playPreview(clip: SoundClip) {
  try {
    const audio = new Audio(clip.dataUrl);
    audio.volume = 1;
    await audio.play();
  } catch (e) {
    console.warn("preview play error", e);
  }
}

function humanSize(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  return (n / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read error"));
    r.readAsDataURL(file);
  });
}

// Подключаем к ActionsBar (save/reset)
onMounted(() => {
  actions?.setHandlers({
    onSave: async () => {
      // useStorage уже сохраняет, поэтому здесь можем ничего не делать
      actions?.clearDirty?.();
    },
    onReset: () => {
      // Полный сброс звуков не делаем автоматом, чтобы не потерять клипы.
      // Можно, например, сделать очистку только текущего выбора:
      selectedFile.value = null;
      actions?.clearDirty?.();
    },
  });
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
.scroll-y {
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.scroll-y::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.scroll-y {
  scrollbar-width: none;
}
</style>
