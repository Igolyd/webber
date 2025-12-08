<template>
  <div>
    <div
      class="px-4 py-2 d-flex align-center justify-space-between directory-header"
      @click="$emit('toggle-directory')"
      @contextmenu.prevent.stop="openDirMenu = true"
    >
      <h3 class="text-subtitle-2 mb-0">{{ section.dir.name }}</h3>
      <div class="d-flex align-center">
        <v-btn
          icon
          variant="text"
          size="small"
          :title="section.dir.isCollapsed ? 'Развернуть' : 'Свернуть'"
          aria-label="Свернуть/Развернуть"
        >
          <v-icon>{{
            section.dir.isCollapsed ? "mdi-chevron-down" : "mdi-chevron-up"
          }}</v-icon>
        </v-btn>
        <v-menu v-model="openDirMenu" activator="parent" location="end">
          <v-list density="compact">
            <v-list-item
              @click.stop="
                $emit('edit-directory', section.dir.id);
                openDirMenu = false;
              "
            >
              <template #prepend><v-icon>mdi-pencil</v-icon></template>
              <v-list-item-title>Редактировать</v-list-item-title>
            </v-list-item>
            <v-list-item
              @click.stop="
                $emit('open-create-channel');
                openDirMenu = false;
              "
            >
              <template #prepend><v-icon>mdi-plus</v-icon></template>
              <v-list-item-title>Создать канал</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item
              class="text-error"
              @click.stop="
                $emit('delete-directory', section.dir.id);
                openDirMenu = false;
              "
            >
              <template #prepend
                ><v-icon color="error">mdi-delete-outline</v-icon></template
              >
              <v-list-item-title>Удалить категорию</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
    <v-expand-transition>
      <div v-show="!section.dir.isCollapsed">
        <div v-for="ch in section.channels" :key="ch.id">
          <ChannelItem
            :channel="ch"
            :active="ch.type === 'text' && ch.id === activeTextChannelId"
            @edit="$emit('edit-channel', $event)"
            @delete="$emit('delete-channel', $event)"
            @click="onChannelClick(ch)"
          />

          <div
            v-if="ch.type === 'voice' && call.activeVoiceChannelId === ch.id"
            class="px-6 pb-2"
          >
            <div class="d-flex flex-column ga-1">
              <div
                v-for="p in call.participants"
                :key="p.id"
                class="d-flex align-center ga-2 participant-row"
                :class="{ speaking: p.isSpeaking }"
              >
                <v-avatar
                  size="28"
                  class="participant-avatar"
                  :color="p.isSpeaking ? 'primary' : 'grey-darken-3'"
                >
                  <v-img :src="p.avatarUrl || dfAvatar" cover />
                </v-avatar>

                <div class="text-body-2 d-flex align-center ga-2">
                  <span>{{ p.display }}</span>
                  <v-chip
                    v-if="p.isSpeaking"
                    size="x-small"
                    color="primary"
                    variant="flat"
                    class="ms-1"
                  >
                    Говорит
                  </v-chip>

                  <!-- Иконка камеры с предпросмотром -->
                  <v-menu
                    v-if="p.hasVideo"
                    open-on-hover
                    location="end"
                    :close-on-content-click="false"
                    :open-delay="100"
                    :close-delay="100"
                  >
                    <template #activator="{ props: act }">
                      <v-icon
                        v-bind="act"
                        size="16"
                        title="Камера включена"
                        class="pointer"
                      >
                        mdi-video
                      </v-icon>
                    </template>
                    <div class="preview-popover">
                      <video
                        :ref="(el: HTMLVideoElement | null) => setPreview(el, p)"
                        autoplay
                        muted
                        playsinline
                      ></video>
                      <v-btn
                        size="x-small"
                        color="primary"
                        block
                        class="mt-2"
                        @click="watchParticipant(p.id)"
                      >
                        Смотреть
                      </v-btn>
                    </div>
                  </v-menu>

                  <!-- Иконка шеринга с предпросмотром -->
                  <v-menu
                    v-if="p.hasScreen"
                    open-on-hover
                    location="end"
                    :close-on-content-click="false"
                    :open-delay="100"
                    :close-delay="100"
                  >
                    <template #activator="{ props: act }">
                      <v-icon
                        v-bind="act"
                        size="16"
                        title="Демонстрация экрана"
                        class="pointer"
                      >
                        mdi-monitor-share
                      </v-icon>
                    </template>
                    <div class="preview-popover">
                      <video
                        :ref="(el: HTMLVideoElement | null) => setPreview(el, p)"
                        autoplay
                        muted
                        playsinline
                      ></video>
                      <v-btn
                        size="x-small"
                        color="primary"
                        block
                        class="mt-2"
                        @click="watchParticipant(p.id)"
                      >
                        Смотреть
                      </v-btn>
                    </div>
                  </v-menu>
                </div>

                <div class="ms-auto d-flex align-center ga-1">
                  <v-icon :color="p.isSpeaking ? 'primary' : ''" size="16"
                    >mdi-waveform</v-icon
                  >
                </div>
              </div>
            </div>
          </div>

          <v-divider />
        </div>
      </div>
    </v-expand-transition>
    <v-divider />
  </div>
</template>
<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import ChannelItem from "./ChannelItem.vue";
import { useCallStore } from "~/stores/call";
import { useUiStore } from "~/stores/ui";
import dfAvatar from "~/assets/profile/profile_exp.jpg";

const call = useCallStore();
const ui = useUiStore();

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  directoryId?: string | null;
  position?: number | null;
}
interface Directory {
  id: string;
  groupId: string;
  name: string;
  position: number;
  isCollapsed: boolean;
}
type Section = { dir: Directory; channels: Channel[] };

const props = defineProps<{
  section: Section;
  activeTextChannelId: string;
}>();

const emit = defineEmits([
  "toggle-directory",
  "edit-directory",
  "delete-directory",
  "open-create-channel",
  "edit-channel",
  "delete-channel",
  "channel-click",
]);

const openDirMenu = ref(false);

async function onChannelClick(ch: Channel) {
  emit("channel-click", ch);
}

/**
 * ----- Мини‑предпросмотр видео/экрана -----
 *
 * p.stream уже содержит нужный MediaStream (камера или шеринга),
 * нам остаётся только подвесить его к <video>.
 */

// Храним соответствие participantId → HTMLVideoElement
const previewMap = new Map<string, HTMLVideoElement>();

function setPreview(
  el: HTMLVideoElement | null,
  p: { id: string; stream: MediaStream }
) {
  const pid = p.id;

  // Элемент отмонтировался / меню закрылось
  if (!el) {
    const prev = previewMap.get(pid);
    if (prev) {
      // Отвязываем srcObject, чтобы не держать лишние ссылки
      try {
        // @ts-ignore
        prev.srcObject = null;
      } catch {}
      previewMap.delete(pid);
    }
    return;
  }

  // Новый элемент для данного участника
  previewMap.set(pid, el);

  try {
    // @ts-ignore
    el.srcObject = p.stream;
  } catch {
    // Fallback через createObjectURL (почти не нужен в современных браузерах)
    const url = URL.createObjectURL(p.stream as any);
    el.src = url;
    el.onloadeddata = () => {
      URL.revokeObjectURL(url);
    };
  }

  el.muted = true;
  el.playsInline = true;
  el.autoplay = true;

  // На всякий случай пробуем play(), если браузер требует жеста — просто
  // проигнорируем ошибку, главное чтобы превью не ломало UI.
  el.play().catch(() => {
    /* ignore */
  });
}

/**
 * Кнопка "Смотреть" в попапе:
 * - фокусируем участника
 * - открываем основное окно звонка
 */
function watchParticipant(id: string) {
  call.setFocusParticipant(id);
  ui.callWindowOpen = true;
}

onBeforeUnmount(() => {
  // Чистка ссылок при размонтировании компонента
  for (const el of previewMap.values()) {
    try {
      // @ts-ignore
      el.srcObject = null;
    } catch {}
  }
  previewMap.clear();
});
</script>
