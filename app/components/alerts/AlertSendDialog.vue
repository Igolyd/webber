<template>
  <v-dialog v-model="model" max-width="720">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-bullhorn</v-icon> Отправить алерт
        <v-spacer />
        <v-btn icon variant="text" @click="model = false"
          ><v-icon>mdi-close</v-icon></v-btn
        >
      </v-card-title>

      <v-card-text>
        <v-tabs v-model="kind" grow>
          <v-tab value="video">Видео</v-tab>
          <v-tab value="audio">Аудио</v-tab>
        </v-tabs>

        <v-window v-model="kind" class="mt-3">
          <v-window-item value="video">
            <div class="d-flex ga-3 align-start">
              <div class="flex-1-1">
                <div class="text-caption mb-1">
                  Библиотека (личные{{
                    allowPersonalInGroup ? " + группы" : ""
                  }})
                </div>
                <div class="d-flex flex-wrap ga-2">
                  <v-card
                    v-for="a in libraryVideo"
                    :key="a.id"
                    :class="[
                      'pa-2',
                      selectedAsset?.id === a.id
                        ? 'elevation-4 border-primary'
                        : 'elevation-1',
                    ]"
                    style="width: 160px; cursor: pointer"
                    @click="selectedAsset = a"
                  >
                    <v-img
                      v-if="a.poster"
                      :src="a.poster"
                      height="90"
                      cover
                      class="mb-2 rounded"
                    />
                    <div class="text-truncate">{{ a.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ (a.durationSec ?? 0) + "s" }}
                    </div>
                  </v-card>
                </div>
                <div class="mt-2">
                  <v-btn
                    size="small"
                    variant="tonal"
                    @click="triggerFile('video')"
                  >
                    <v-icon start size="18">mdi-upload</v-icon>Загрузить (≤10с,
                    ≤100МБ)
                  </v-btn>
                  <input
                    ref="fileVideo"
                    type="file"
                    class="d-none"
                    accept="video/*"
                    @change="onFilePicked('video', $event)"
                  />
                </div>
              </div>

              <div class="flex-1-1">
                <div class="text-caption mb-1">Превью</div>
                <video
                  v-if="selectedAsset"
                  :src="runtime.getAssetUrl(selectedAsset as any)"
                  :poster="selectedAsset.poster"
                  controls
                  muted
                  style="max-width: 320px; border-radius: 8px"
                />
              </div>
            </div>
          </v-window-item>

          <v-window-item value="audio">
            <div class="d-flex ga-3 align-start">
              <div class="flex-1-1">
                <div class="text-caption mb-1">
                  Библиотека (личные{{
                    allowPersonalInGroup ? " + группы" : ""
                  }})
                </div>
                <div class="d-flex flex-wrap ga-2">
                  <v-card
                    v-for="a in libraryAudio"
                    :key="a.id"
                    :class="[
                      'pa-2',
                      selectedAsset?.id === a.id
                        ? 'elevation-4 border-primary'
                        : 'elevation-1',
                    ]"
                    style="width: 160px; cursor: pointer"
                    @click="selectedAsset = a"
                  >
                    <v-icon class="mb-2">mdi-music</v-icon>
                    <div class="text-truncate">{{ a.name }}</div>
                  </v-card>
                </div>
                <div class="mt-2">
                  <v-btn
                    size="small"
                    variant="tonal"
                    @click="triggerFile('audio')"
                  >
                    <v-icon start size="18">mdi-upload</v-icon>Загрузить
                    (≤100МБ)
                  </v-btn>
                  <input
                    ref="fileAudio"
                    type="file"
                    class="d-none"
                    accept="audio/*"
                    @change="onFilePicked('audio', $event)"
                  />
                </div>
              </div>

              <div class="flex-1-1">
                <div class="text-caption mb-1">Превью</div>
                <audio
                  v-if="selectedAsset"
                  :src="runtime.getAssetUrl(selectedAsset as any)"
                  controls
                  style="width: 100%"
                />
              </div>
            </div>
          </v-window-item>
        </v-window>

        <v-divider class="my-4" />

        <div class="d-flex ga-3 flex-wrap">
          <div class="flex-1-1">
            <div class="text-caption mb-1">Действие при клике</div>
            <v-radio-group v-model="alertAction" density="compact">
              <v-radio label="Перейти в чат" value="openTextChat" />
              <v-radio
                label="Зайти в голосовой канал"
                value="joinVoiceChannel"
                :disabled="!isChannel"
              />
              <v-radio
                label="Позвонить (ЛС)"
                value="callInDM"
                :disabled="!isDM"
              />
            </v-radio-group>
          </div>

          <div v-if="context === 'channel'" class="flex-1-1">
            <div class="text-caption mb-1">Кому</div>
            <v-autocomplete
              v-model="recipientsUsers"
              :items="usersInGroup"
              item-title="name"
              item-value="id"
              chips
              multiple
              clearable
              density="comfortable"
              label="Пользователи"
            />
            <v-autocomplete
              v-model="recipientsRoles"
              :items="rolesInGroup"
              item-title="name"
              item-value="id"
              chips
              multiple
              clearable
              density="comfortable"
              label="Роли"
            />
          </div>
        </div>

        <v-text-field
          class="mt-2"
          v-model="comment"
          label="Комментарий (в чат)"
          variant="outlined"
          hide-details
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="model = false">Отмена</v-btn>
        <v-btn color="primary" :disabled="!selectedAsset" @click="onSend"
          >Отправить</v-btn
        >
      </v-card-actions>
    </v-card>
    <AlertTrimDialog
      v-model="trimState.open"
      :file="trimState.file"
      :kind="trimState.kind"
      @cancel="() => (trimState = { open: false, file: null, kind: 'video' })"
      @trimmed="onTrimmedFromDialog"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useAlertsLibraryStore,
  useAlertsRuntimeStore,
  useGroupAlertsSettingsStore,
  MAX_FILE_SIZE,
  MAX_VIDEO_DURATION,
  probeAudio,
  type AlertAsset,
  type AlertKind,
} from "@/stores/alerts";
import { useUsersStore } from "@/stores/users";
import { useRolesStore } from "@/stores/roles";
import AlertTrimDialog from "@/components/alerts/AlertTrimDialog.vue";

const props = defineProps<{
  modelValue: boolean;
  context: "dm" | "channel";
  meId: string;
  peerId?: string;
  groupId?: string;
  channelId?: string;
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const trimState = ref<{
  open: boolean;
  file: File | null;
  kind: AlertKind;
}>({
  open: false,
  file: null,
  kind: "video",
});

const isDM = computed(() => props.context === "dm");
const isChannel = computed(() => props.context === "channel");

const kind = ref<"video" | "audio">("video");
const selectedAsset = ref<AlertAsset | null>(null);
const alertAction = ref<"openTextChat" | "joinVoiceChannel" | "callInDM">(
  "openTextChat"
);

const recipientsUsers = ref<string[]>([]);
const recipientsRoles = ref<string[]>([]);
const comment = ref("");

const lib = useAlertsLibraryStore();
const users = useUsersStore();
const roles = useRolesStore();
const groupSettings = useGroupAlertsSettingsStore();
const runtime = useAlertsRuntimeStore();

const allowPersonalInGroup = computed(() =>
  props.groupId ? groupSettings.getAllowPersonalAlerts(props.groupId) : true
);

const libraryVideo = computed(() => {
  const arr: AlertAsset[] = [];
  if (!props.groupId || allowPersonalInGroup.value) {
    arr.push(...(lib.listByOwner("user", props.meId, "video") as any));
  }
  if (props.groupId)
    arr.push(...(lib.listByOwner("group", props.groupId, "video") as any));
  return arr;
});
const libraryAudio = computed(() => {
  const arr: AlertAsset[] = [];
  if (!props.groupId || allowPersonalInGroup.value) {
    arr.push(...(lib.listByOwner("user", props.meId, "audio") as any));
  }
  if (props.groupId)
    arr.push(...(lib.listByOwner("group", props.groupId, "audio") as any));
  return arr;
});

const usersInGroup = computed(() =>
  !props.groupId ? [] : users.getUsersByGroup(props.groupId)
);
const rolesInGroup = computed(() =>
  !props.groupId ? [] : roles.getRolesByGroup(props.groupId)
);

const fileVideo = ref<HTMLInputElement | null>(null);
const fileAudio = ref<HTMLInputElement | null>(null);

function triggerFile(k: AlertKind) {
  if (k === "video") fileVideo.value?.click();
  else fileAudio.value?.click();
}
async function onFilePicked(k: AlertKind, e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    alert("Файл превышает 100 МБ");
    input.value = "";
    return;
  }

  try {
    let durationSec = 0;

    if (k === "video") {
      const { probeVideo } = await import("@/stores/alerts");
      const { durationSec: d } = await probeVideo(file);
      durationSec = d;
      if (durationSec <= MAX_VIDEO_DURATION) {
        selectedAsset.value = await addAlertFileFromDialog(file, k);
      } else {
        trimState.value = { open: true, file, kind: "video" };
      }
    } else {
      const { durationSec: d } = await probeAudio(file);
      durationSec = d;
      if (durationSec <= MAX_VIDEO_DURATION) {
        selectedAsset.value = await addAlertFileFromDialog(file, k);
      } else {
        trimState.value = { open: true, file, kind: "audio" };
      }
    }
  } catch (e: any) {
    alert(e?.message || "Не удалось обработать файл");
  } finally {
    input.value = "";
  }
}
async function onTrimmedFromDialog(payload: {
  file: File;
  durationSec: number;
}) {
  const { file, durationSec } = payload;
  const kind = trimState.value.kind;
  try {
    selectedAsset.value = await addAlertFileFromDialog(file, kind, durationSec);
  } catch (e: any) {
    console.error("TRIM ERROR", e);
    alert(e?.message || "Не удалось сохранить обрезанный файл");
  } finally {
    trimState.value = { open: false, file: null, kind: "video" };
  }
}

async function addAlertFileFromDialog(
  file: File,
  kind: AlertKind,
  durationSec?: number
): Promise<AlertAsset> {
  const ownerType = props.groupId ? "group" : "user";
  const ownerId = props.groupId || props.meId;
  const dataUrl = await readAsDataURL(file);
  const next = await lib.addAsset({
    ownerType,
    ownerId,
    kind,
    name: file.name,
    mime: file.type || (kind === "video" ? "video/mp4" : "audio/mpeg"),
    size: file.size,
    dataUrl,
    file,
    durationSec, // ВАЖНО
  });
  return next as any;
}
function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read error"));
    r.readAsDataURL(file);
  });
}

function onSend() {
  if (!selectedAsset.value) return;
  if (isDM.value) {
    if (!props.peerId) return;
    const act =
      alertAction.value === "joinVoiceChannel"
        ? "openTextChat"
        : alertAction.value;
    runtime.sendAlertDM({
      meId: props.meId,
      peerId: props.peerId,
      asset: selectedAsset.value as any,
      action: act,
      text: comment.value.trim(),
    });
  } else if (isChannel.value) {
    if (!props.groupId || !props.channelId) return;
    const act =
      alertAction.value === "callInDM" ? "openTextChat" : alertAction.value;
    runtime.sendAlertChannel({
      meId: props.meId,
      groupId: props.groupId,
      channelId: props.channelId,
      asset: selectedAsset.value as any,
      action: act,
      recipients: {
        users: recipientsUsers.value,
        roles: recipientsRoles.value,
      },
      text: comment.value.trim(),
    });
  }
  model.value = false;
}
</script>

<style scoped>
.border-primary {
  border: 1px solid var(--v-theme-primary);
}
</style>
