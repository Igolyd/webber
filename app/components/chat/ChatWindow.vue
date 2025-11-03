<template>
  <div class="chat-window scope-main">
    <div v-if="pinnedList.length" class="pinned-bar">
      <v-icon class="mr-1" size="18">mdi-pin</v-icon>
      Закреплённые: {{ pinnedList.length }}
      <v-spacer />
      <v-menu
        v-model="pinnedMenu"
        location="bottom"
        transition="fade-transition"
      >
        <template #activator="{ props: actProps }">
          <v-btn size="small" variant="text" v-bind="actProps">
            Открыть
            <v-icon end size="16">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" class="pinned-list">
          <v-list-item
            v-for="pm in pinnedList"
            :key="pm.id"
            @click="scrollToMessage(pm.id, true)"
          >
            <v-list-item-title class="text-truncate">
              {{ senderName(pm) }} — {{ shortText(pm) }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Лента сообщений -->
    <div ref="scrollPane" class="messages-scroll">
      <v-list density="comfortable" class="messages-list">
        <template v-for="(m, idx) in items" :key="m.id">
          <div
            class="message-row"
            :class="{
              'is-me': m.senderId === meId,
              'is-highlighted': highlightedId === m.id,
              'group-start': isGroupStart(idx),
              'group-cont': !isGroupStart(idx),
            }"
            @mouseenter="hoverId = m.id"
            @mouseleave="onRowMouseLeave(m.id)"
            :ref="(el) => registerMsgEl(m.id, el)"
          >
            <!-- Левая колонка -->
            <div class="left-col">
              <template v-if="isGroupStart(idx)">
                <v-avatar size="40" class="msg-avatar">
                  <v-img :src="senderAvatar(m)" cover />
                </v-avatar>
              </template>
              <template v-else>
                <div class="left-time" v-show="hoverId === m.id">
                  {{ fmtTime(m.createdAt) }}
                </div>
              </template>
            </div>

            <!-- Тело -->
            <div class="msg-body">
              <div v-if="isGroupStart(idx)" class="msg-header">
                <span class="msg-author">{{ senderName(m) }}</span>
                <span class="msg-time">
                  {{ fmtTime(m.createdAt) }}
                  <span v-if="m.editedAt" class="edited-tag"> • изменено</span>
                  <span v-if="m.pinned" class="pinned-tag">
                    <v-icon size="14">mdi-pin</v-icon> закреплено
                  </span>
                </span>
              </div>

              <div
                v-if="hoverId === m.id || isAnyMenuOpen(m.id)"
                class="msg-actions"
              >
                <v-btn size="x-small" variant="text" @click="togglePin(m)">
                  <v-icon size="16" start>mdi-pin</v-icon>
                  {{ m.pinned ? "Открепить" : "Закрепить" }}
                </v-btn>

                <!-- Реакции -->
                <v-menu
                  v-model="reactionMenus[m.id]"
                  :close-on-content-click="false"
                  location="bottom"
                >
                  <template #activator="{ props: actProps }">
                    <v-btn size="x-small" variant="text" v-bind="actProps">
                      <v-icon size="16" start>mdi-emoticon-outline</v-icon>
                      Реакция
                    </v-btn>
                  </template>

                  <div class="pa-2 emoji-panel">
                    <div class="quick-row">
                      <v-btn
                        v-for="e in getRecentEmojis(5)"
                        :key="e"
                        size="small"
                        variant="text"
                        class="quick-emoji"
                        @click="onQuickReaction(m, e)"
                      >
                        {{ e }}
                      </v-btn>

                      <v-btn
                        size="small"
                        variant="tonal"
                        @click="toggleFullPicker(m.id)"
                      >
                        <v-icon start size="16">mdi-emoticon-outline</v-icon>
                        Все
                      </v-btn>
                    </div>

                    <transition name="fade">
                      <div v-if="reactionFullOpen[m.id]" class="mt-2">
                        <EmojiPicker
                          tooltip
                          @emoji-sent="(e) => onPickReaction(m, e)"
                        />
                      </div>
                    </transition>
                  </div>
                </v-menu>

                <v-btn size="x-small" variant="text" @click="onReply(m)">
                  <v-icon size="16" start>mdi-reply</v-icon>Ответить
                </v-btn>

                <template v-if="m.senderId === meId">
                  <v-btn size="x-small" variant="text" @click="startEdit(m)">
                    <v-icon size="16" start>mdi-pencil-outline</v-icon>Изменить
                  </v-btn>
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="onDelete(m)"
                  >
                    <v-icon size="16" start>mdi-delete-outline</v-icon>Удалить
                  </v-btn>
                </template>
              </div>

              <!-- Редактирование -->
              <div v-if="editingId === m.id" class="msg-edit">
                <v-textarea
                  v-model="editText"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  auto-grow
                  hide-details
                  placeholder="Измените сообщение..."
                />

                <div class="edit-attach mt-2">
                  <div v-if="editAttach" class="current-attach">
                    <div class="d-flex align-center gap-2 mb-2">
                      <v-icon>mdi-paperclip</v-icon>
                      <span class="text-medium-emphasis">
                        {{ editAttach.name }} ({{
                          formatSize(editAttach.size)
                        }})
                      </span>
                      <v-spacer />
                      <v-btn
                        size="x-small"
                        variant="text"
                        @click="removeEditAttachment"
                      >
                        <v-icon size="16" start>mdi-close</v-icon>Удалить файл
                      </v-btn>
                    </div>
                    <div class="attach-preview">
                      <v-img
                        v-if="isImage(editAttach)"
                        :src="editAttach.dataUrl"
                        max-width="280"
                        class="rounded"
                      />
                      <video
                        v-else-if="isVideo(editAttach)"
                        :src="editAttach.dataUrl"
                        controls
                        style="
                          max-width: 420px;
                          max-height: 280px;
                          border-radius: 8px;
                        "
                      />
                      <audio
                        v-else-if="isAudio(editAttach)"
                        :src="editAttach.dataUrl"
                        controls
                        style="width: 100%"
                      />
                      <div v-else class="d-flex align-center">
                        <v-icon class="mr-2">mdi-file-outline</v-icon>
                        <span>{{ editAttach.name }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="d-flex align-center gap-2">
                    <input
                      :ref="(el) => setEditFileInputRef(m.id, el as HTMLInputElement | null)"
                      type="file"
                      class="d-none"
                      @change="onEditFileChange"
                    />
                    <v-btn
                      size="small"
                      variant="tonal"
                      @click="triggerEditFile(m.id)"
                    >
                      <v-icon size="18" start>mdi-paperclip</v-icon>
                      {{ editAttach ? "Заменить файл" : "Добавить файл" }}
                    </v-btn>

                    <v-menu
                      v-model="editEmojiMenu"
                      :close-on-content-click="false"
                      location="bottom"
                    >
                      <template #activator="{ props: actProps }">
                        <v-btn size="small" variant="text" v-bind="actProps">
                          <v-icon size="18" start>mdi-emoticon-outline</v-icon>
                          Эмодзи
                        </v-btn>
                      </template>

                      <div class="pa-2 emoji-panel">
                        <div class="quick-row">
                          <v-btn
                            v-for="e in getRecentEmojis()"
                            :key="e"
                            size="small"
                            variant="text"
                            class="quick-emoji"
                            @click="onQuickEmojiEdit(e)"
                          >
                            {{ e }}
                          </v-btn>

                          <v-btn
                            size="small"
                            variant="tonal"
                            @click="editEmojiFullOpen = !editEmojiFullOpen"
                          >
                            <v-icon start size="16">mdi-emoticon-outline</v-icon
                            >Все
                          </v-btn>
                        </div>

                        <transition name="fade">
                          <div v-if="editEmojiFullOpen" class="mt-2">
                            <EmojiPicker
                              tooltip
                              @emoji-sent="onSelectEmojiEdit"
                            />
                          </div>
                        </transition>
                      </div>
                    </v-menu>
                  </div>
                </div>

                <div class="mt-2 d-flex gap-2">
                  <v-btn
                    size="small"
                    class="btn-primary-tonal"
                    variant="tonal"
                    @click="confirmEdit(m)"
                    >Сохранить</v-btn
                  >
                  <v-btn size="small" variant="text" @click="cancelEdit"
                    >Отмена</v-btn
                  >
                </div>
              </div>

              <!-- Отображение -->
              <div v-else class="msg-content">
                <div
                  v-if="m.replyToId"
                  class="reply-preview"
                  @click="scrollToMessage(m.replyToId)"
                >
                  <div class="reply-author">
                    {{ replyAuthorName(m.replyToId) }}
                  </div>
                  <div class="reply-text">
                    {{ replyShortText(m.replyToId) }}
                  </div>
                </div>

                <div v-if="m.type === 'text'">
                  <div class="pre-wrap">{{ m.content }}</div>
                </div>

                <div v-else-if="m.type === 'file'">
                  <div class="mb-2">
                    <img
                      v-if="hasImage(getAttachment(m))"
                      :src="getAttachment(m)?.dataUrl"
                      :alt="getAttachment(m)?.name"
                      :class="[
                        'rounded',
                        'clickable',
                        imageClassByMeta(getAttachment(m)),
                      ]"
                      @click="onImageOrStickerClick(m)"
                    />
                    <ClientOnly v-else-if="hasVideo(getAttachment(m))">
                      <VuePlayer
                        class="vue-player chat-video"
                        :sources="videoSourcesFromAttachment(getAttachment(m)!)"
                        :poster="videoPosterFromAttachment(getAttachment(m)!)"
                        :autoplay="false"
                        :muted="false"
                        :controls="false"
                        preload="metadata"
                        :toggle-play-on-click="true"
                      >
                        <ChatVideoControls
                          :src="getAttachment(m)?.dataUrl || ''"
                          :file-name="getAttachment(m)?.name || ''"
                        />
                      </VuePlayer>
                    </ClientOnly>

                    <audio
                      v-else-if="hasAudio(getAttachment(m))"
                      :src="getAttachment(m)?.dataUrl"
                      controls
                      style="width: 100%"
                    />
                    <div v-else class="d-flex align-center">
                      <v-icon class="mr-2">mdi-file-outline</v-icon>
                      <span>
                        {{ getAttachment(m)?.name }} ({{
                          formatSize(getAttachment(m)?.size ?? 0)
                        }})
                      </span>
                      <v-spacer />
                      <v-btn
                        v-if="getAttachment(m)?.dataUrl"
                        size="x-small"
                        variant="text"
                        @click="downloadAttachment(m)"
                      >
                        <v-icon size="16" start>mdi-download</v-icon>Скачать
                      </v-btn>
                    </div>
                  </div>
                  <div v-if="m.content" class="pre-wrap">{{ m.content }}</div>
                </div>

                <!-- Реакции -->
                <div
                  class="reactions mt-1"
                  v-if="
                    reactionEntries(m).length ||
                    hoverId === m.id ||
                    reactionMenusInline[m.id]
                  "
                >
                  <div class="d-flex flex-wrap gap-1">
                    <v-chip
                      v-for="r in reactionEntries(m)"
                      :key="r.emoji"
                      size="x-small"
                      :color="r.reactedByMe ? 'primary' : undefined"
                      variant="tonal"
                      @click="toggleReaction(m, r.emoji)"
                    >
                      <span class="emoji">{{ r.emoji }}</span>
                      <span class="ml-1">{{ r.count }}</span>
                    </v-chip>

                    <v-menu
                      v-model="reactionMenusInline[m.id]"
                      :close-on-content-click="false"
                      location="bottom"
                    >
                      <template #activator="{ props: actProps }">
                        <v-btn
                          size="x-small"
                          variant="text"
                          class="add-reaction"
                          v-bind="actProps"
                        >
                          <v-icon size="14">mdi-plus</v-icon>
                        </v-btn>
                      </template>

                      <div class="pa-2 emoji-panel">
                        <div class="quick-row">
                          <v-btn
                            v-for="e in getRecentEmojis(5)"
                            :key="e"
                            size="small"
                            variant="text"
                            class="quick-emoji"
                            @click="onQuickReaction(m, e)"
                          >
                            {{ e }}
                          </v-btn>

                          <v-btn
                            size="small"
                            variant="tonal"
                            @click="toggleFullPicker(m.id, true)"
                          >
                            <v-icon start size="16">mdi-emoticon-outline</v-icon
                            >Все
                          </v-btn>
                        </div>

                        <transition name="fade">
                          <div v-if="reactionFullOpen[m.id]" class="mt-2">
                            <EmojiPicker
                              tooltip
                              @emoji-sent="(e) => onPickReaction(m, e)"
                            />
                          </div>
                        </transition>
                      </div>
                    </v-menu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </v-list>
    </div>

    <!-- Бейдж ответа -->
    <div v-if="replyTo" class="reply-bar">
      <v-icon size="18" class="mr-1">mdi-reply</v-icon>
      Ответ на: <span class="ml-1">{{ replyShortText(replyTo.id) }}</span>
      <v-spacer />
      <v-btn icon size="small" variant="text" @click="clearReply">
        <v-icon size="18">mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Композер -->
    <div class="composer">
      <InputMulti
        ref="composerRef"
        v-model="draft"
        :context="props.context"
        :me-id="meReactionsId"
        :group-id="props.context === 'channel' ? inferredGroupId : undefined"
        @send="send"
        @gif="gifSend"
        @attach="onAttach"
        @alert="openAlertDialog"
        @sticker="onSticker"
      />
    </div>

    <AlertSendDialog
      v-model="alertDialog"
      :context="props.context"
      :me-id="meId"
      :peer-id="props.context === 'dm' ? peerId : undefined"
      :group-id="props.context === 'channel' ? inferredGroupId : undefined"
      :channel-id="props.context === 'channel' ? props.channelId : undefined"
    />

    <!-- Просмотр вложения -->
    <v-dialog v-model="attachDialog.open" max-width="720">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-paperclip</v-icon>
          Предпросмотр вложения
          <v-spacer />
          <v-btn icon variant="text" @click="closeAttachDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div
            v-if="attachDialog.previewUrl"
            class="mb-3 d-flex justify-center"
          >
            <v-img
              v-if="attachDialog.file?.type?.startsWith('image/')"
              :src="attachDialog.previewUrl"
              :alt="attachDialog.file?.name"
              max-width="560"
              class="rounded"
            />
            <video
              v-else-if="attachDialog.file?.type?.startsWith('video/')"
              :src="attachDialog.previewUrl"
              controls
              style="max-width: 640px; max-height: 360px; border-radius: 8px"
            />
            <audio
              v-else-if="attachDialog.file?.type?.startsWith('audio/')"
              :src="attachDialog.previewUrl"
              controls
              style="width: 100%"
            />
            <div v-else class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-outline</v-icon>
              <span>
                {{ attachDialog.file?.name }}
                ({{ formatSize(attachDialog.file?.size ?? 0) }})
              </span>
            </div>
          </div>

          <v-textarea
            v-model="attachDialog.comment"
            label="Комментарий к файлу (необязательно)"
            auto-grow
            rows="2"
            variant="outlined"
            hide-details
          />

          <div class="mt-2">
            <v-menu
              v-model="attachEmojiMenu"
              :close-on-content-click="false"
              location="bottom"
            >
              <template #activator="{ props: actProps }">
                <v-btn size="small" variant="text" v-bind="actProps">
                  <v-icon size="18" start>mdi-emoticon-outline</v-icon>Эмодзи
                </v-btn>
              </template>

              <div class="pa-2 emoji-panel">
                <div class="quick-row">
                  <v-btn
                    v-for="e in getRecentEmojis()"
                    :key="e"
                    size="small"
                    variant="text"
                    class="quick-emoji"
                    @click="onQuickEmojiAttach(e)"
                  >
                    {{ e }}
                  </v-btn>

                  <v-btn
                    size="small"
                    variant="tonal"
                    @click="attachEmojiFullOpen = !attachEmojiFullOpen"
                  >
                    <v-icon start size="16">mdi-emoticon-outline</v-icon>Все
                  </v-btn>
                </div>

                <transition name="fade">
                  <div v-if="attachEmojiFullOpen" class="mt-2">
                    <EmojiPicker tooltip @emoji-sent="onSelectEmojiAttach" />
                  </div>
                </transition>
              </div>
            </v-menu>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeAttachDialog">Отмена</v-btn>
          <v-btn color="primary" @click="confirmSendAttachment"
            >Отправить</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Полноэкранный просмотр изображения -->
    <v-dialog
      v-model="imageViewer.open"
      fullscreen
      transition="fade-transition"
      class="image-viewer"
    >
      <div class="image-viewer__wrap" @click.self="closeViewer">
        <img
          class="image-viewer__img"
          :src="imageViewer.src"
          :alt="imageViewer.alt"
          :style="imageTransform"
          @wheel.prevent="onViewerWheel"
          @dblclick.prevent="toggleZoom"
        />

        <div class="image-viewer__topbar">
          <div class="iv-left">
            <v-avatar size="28" class="mr-2">
              <v-img :src="imageViewer.avatar" />
            </v-avatar>
            <div class="iv-meta">
              <div class="iv-author">{{ imageViewer.author }}</div>
              <div class="iv-time">{{ imageViewer.time }}</div>
            </div>
          </div>

          <div class="iv-controls">
            <v-btn size="small" icon variant="text" @click.stop="zoomOut">
              <v-icon>mdi-magnify-minus-outline</v-icon>
            </v-btn>
            <v-btn size="small" icon variant="text" @click.stop="zoomIn">
              <v-icon>mdi-magnify-plus-outline</v-icon>
            </v-btn>
            <v-btn size="small" icon variant="text" @click.stop="resetZoom">
              <v-icon>mdi-aspect-ratio</v-icon>
            </v-btn>
            <v-btn size="small" icon variant="text" @click.stop="closeViewer">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- Диалог предпросмотра набора -->
    <PackPreviewDialog
      v-model="previewOpen"
      :pack-id="previewPackId"
      :kind="previewKind"
      @open-in-picker="openInPickerFromPreview"
      @copied="onCopiedFromPreview"
    />
  </div>
  <AlertOverlayStack />
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import { EmojiPicker } from "vue-gif-emoji-picker";
import type { Emoji, Gif } from "vue-gif-emoji-picker";
import InputMulti from "@/components/InputMulti.vue";
import { useProfilesStore } from "@/stores/user/profiles";
import { useUserAccountStore } from "@/stores/user/account";
import { useUsersStore } from "@/stores/users";
import { useChannelsStore } from "@/stores/channels";
import {
  useMessagesStore,
  type DirectMessage,
  type FileAttachment as DMFile,
} from "@/stores/messages";
import {
  useGroupMessagesStore,
  type ChannelMessage,
  type FileAttachment as CHFile,
} from "@/stores/groupMessages";
import { useStorage } from "@vueuse/core";
import DfAvatar from "../../assets/profile/profile_exp.jpg";
import { VuePlayer } from "@display-studio/vue-player";
import ChatVideoControls from "./ChatVideoControls.vue";
import AlertSendDialog from "@/components/alerts/AlertSendDialog.vue";
import AlertOverlayStack from "@/components/alerts/AlertOverlayStack.vue";
import PackPreviewDialog from "@/components/market/PackPreviewDialog.vue";

type CommonAttachment = DMFile | CHFile;

type CommonMessage = DirectMessage | ChannelMessage;

function getAttachment(m: CommonMessage): CommonAttachment | null {
  return (
    (m as Partial<CommonMessage> & { attachment?: CommonAttachment })
      .attachment || null
  );
}
function hasImage(att: CommonAttachment | null) {
  return !!att?.type?.startsWith("image/");
}
function hasVideo(att: CommonAttachment | null) {
  return !!att?.type?.startsWith("video/");
}
function hasAudio(att: CommonAttachment | null) {
  return !!att?.type?.startsWith("audio/");
}
const props = defineProps<{
  context: "dm" | "channel";
  channelId?: string;
  groupId?: string;
  peerId?: string;
}>();
const meAuthId = computed(() => account.userId || ""); // для сообщений
const meReactionsId = computed(() => profiles.profileId || meAuthId.value); // для паков

const profiles = useProfilesStore();
const account = useUserAccountStore();
const users = useUsersStore();
const dmStore = useMessagesStore();
const chStore = useGroupMessagesStore();
const channels = useChannelsStore();

const meId = computed(() => account.userId || "");

const isImage = hasImage as (att: CommonAttachment | null) => boolean;
const isVideo = hasVideo as (att: CommonAttachment | null) => boolean;
const isAudio = hasAudio as (att: CommonAttachment | null) => boolean;

// Недавние эмодзи
const recentEmojis = useStorage<string[]>("app.recentEmojis", []);

// Реф для file-input при редактировании
const editFileInputMap = ref<Record<string, HTMLInputElement | null>>({});

const inferredGroupId = computed(
  () =>
    props.groupId ||
    (props.channelId ? channels.getById(props.channelId)?.groupId : "")
);
// Сообщения
const items = computed<CommonMessage[]>(() => {
  if (props.context === "dm") {
    if (!meId.value || !props.peerId) return [];
    return dmStore.getConversation(meId.value, props.peerId);
  } else {
    if (!props.channelId) return [];
    return chStore.getByChannel(props.channelId);
  }
});

// Черновик, hover, подсветка
const draft = ref("");
const hoverId = ref<string | null>(null);
const highlightedId = ref<string | null>(null);

const alertDialog = ref(false);
function openAlertDialog() {
  alertDialog.value = true;
}
// Группировка по времени и отправителю (10 минут)
const GROUP_INTERVAL_MS = 10 * 60 * 1000;
function isGroupStart(idx: number) {
  if (idx == 0) return true;
  const curr = items.value[idx];
  const prev = items.value[idx - 1];
  if (!curr || !prev) return true;
  if (curr.senderId !== prev.senderId) return true;
  const tCurr = new Date(curr.createdAt).getTime();
  const tPrev = new Date(prev.createdAt).getTime();
  return tCurr - tPrev > GROUP_INTERVAL_MS;
}
function onRowMouseLeave(id: string) {
  if (isAnyMenuOpen(id)) return;
  hoverId.value = null;
}
function videoSourcesFromAttachment(att: CommonAttachment) {
  return [
    {
      src: att.dataUrl,
      type: att.type || "video/mp4",
    },
  ];
}
function videoPosterFromAttachment(_att: CommonAttachment) {
  return undefined as string | undefined;
}
// DOM-рефы для скролла к сообщениям
const msgElMap = new Map<string, HTMLElement>();
function registerMsgEl(
  id: string,
  el: Element | ComponentPublicInstance | null
) {
  const real = (el as HTMLElement) || null;
  if (real) msgElMap.set(id, real);
}

// Скролл
const scrollPane = ref<HTMLElement | null>(null);
watch(
  items,
  async () => {
    await nextTick();
    scrollToBottom();
  },
  { deep: true }
);
onMounted(() => scrollToBottom());
function scrollToBottom() {
  const el = scrollPane.value;
  if (el) el.scrollTop = el.scrollHeight;
}
function scrollToMessage(id: string, highlightOnly = false) {
  const container = scrollPane.value;
  const el = msgElMap.get(id);
  if (!container || !el) return;
  container.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
  highlightedId.value = id;
  setTimeout(() => {
    if (highlightedId.value === id) highlightedId.value = null;
  }, 1600);
  if (!highlightOnly) replyTo.value = null;
}

// Автор/аватар/время
function senderName(m: CommonMessage) {
  if (m.senderId === meId.value) return profiles.name || "Me";
  return users.getById(m.senderId)?.name || "User";
}
function senderAvatar(m: CommonMessage) {
  if (m.senderId === meId.value) return profiles.avatar || DfAvatar;
  return users.getById(m.senderId)?.avatar || DfAvatar;
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function shortText(m: CommonMessage) {
  if (m.type === "file") return m.attachment?.name || "[файл]";
  return m.content?.slice(0, 160) || "";
}

// Reply helpers
const replyTo = ref<CommonMessage | null>(null);
function onReply(m: CommonMessage) {
  replyTo.value = m;
}
function clearReply() {
  replyTo.value = null;
}
function setEditFileInputRef(id: string, el: HTMLInputElement | null) {
  if (el) {
    editFileInputMap.value[id] = el;
  } else {
    const { ...rest } = editFileInputMap.value;
    editFileInputMap.value = rest;
  }
}
function triggerEditFile(messageId: string) {
  const el = editFileInputMap.value[messageId];
  el?.click();
}
function getMessageById(id: string): CommonMessage | null {
  return props.context === "dm"
    ? (dmStore.getById(id) as any)
    : (chStore.getById(id) as any);
}
function replyAuthorName(id: string) {
  const m = getMessageById(id);
  if (!m) return "";
  return senderName(m);
}
function replyShortText(id: string) {
  const m = getMessageById(id);
  if (!m) return "";
  return shortText(m);
}

// Редактирование
const editingId = ref<string | null>(null);
const editText = ref("");
const editAttach = ref<CommonAttachment | null>(null);
const editEmojiMenu = ref(false);
const editEmojiFullOpen = ref(false);

function startEdit(m: CommonMessage) {
  if (m.senderId !== meId.value) return;
  editingId.value = m.id;
  editText.value = m.content;
  const att = getAttachment(m);
  editAttach.value = att ? { ...att } : null;
}
function cancelEdit() {
  editingId.value = null;
  editText.value = "";
  editAttach.value = null;
  editEmojiMenu.value = false;
  editEmojiFullOpen.value = false;
}
function confirmEdit(m: CommonMessage) {
  const newText = editText.value.trim();
  const hasAttach = !!editAttach.value;
  if (!newText && !hasAttach) return;
  const patch = { content: newText, attachment: editAttach.value ?? null };
  if (props.context === "dm") dmStore.editMessage(m.id, patch as never);
  else chStore.editMessage(m.id, patch as never);
  cancelEdit();
}
function onSelectEmojiEdit(emoji: Emoji) {
  const e = emoji?.emoji ?? "";
  editText.value += e;
  pushRecentEmoji(e);
}
function onQuickEmojiEdit(e: string) {
  editText.value += e;
  pushRecentEmoji(e);
  editEmojiMenu.value = false;
  editEmojiFullOpen.value = false;
}
function onEditFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result);
    editAttach.value = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      dataUrl,
    };
  };
  reader.readAsDataURL(file);
  input.value = "";
}
function removeEditAttachment() {
  editAttach.value = null;
}

// Прикрепление (с предпросмотром)
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const attachDialog = ref<{
  open: boolean;
  file: File | null;
  previewUrl: string | null;
  comment: string;
  dataUrl: string | null;
}>({
  open: false,
  file: null,
  previewUrl: null,
  comment: "",
  dataUrl: null,
});
const attachEmojiMenu = ref(false);
const attachEmojiFullOpen = ref(false);

// Реакции
const reactionMenus = ref<Record<string, boolean>>({});
const reactionMenusInline = ref<Record<string, boolean>>({});
const reactionFullOpen = ref<Record<string, boolean>>({});

function onAttach(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    alert("Файл превышает 50 МБ");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    attachDialog.value.previewUrl = String(reader.result);
    attachDialog.value.dataUrl = String(reader.result);
    attachDialog.value.open = true;
  };
  reader.onerror = () => {
    alert("Не удалось прочитать файл");
  };
  attachDialog.value.file = file;
  attachDialog.value.comment = draft.value || "";
  reader.readAsDataURL(file);
}
function closeAttachDialog() {
  attachDialog.value.open = false;
  attachDialog.value.file = null;
  attachDialog.value.previewUrl = null;
  attachDialog.value.dataUrl = null;
  attachDialog.value.comment = "";
}
function onSelectEmojiAttach(emoji: Emoji) {
  const e = emoji?.emoji ?? "";
  attachDialog.value.comment += e;
  pushRecentEmoji(e);
}
function onQuickEmojiAttach(e: string) {
  attachDialog.value.comment += e;
  pushRecentEmoji(e);
  attachEmojiMenu.value = false;
  attachEmojiFullOpen.value = false;
}
function confirmSendAttachment() {
  const d = attachDialog.value;
  if (!meId.value || !d.file || !d.dataUrl) return;
  const att = {
    id: crypto.randomUUID(),
    name: d.file.name,
    size: d.file.size,
    type: d.file.type || "application/octet-stream",
    dataUrl: d.dataUrl,
  };
  if (props.context === "dm") {
    if (!props.peerId) return;
    dmStore.sendAttachment(
      meId.value,
      props.peerId,
      att as any,
      d.comment.trim(),
      replyTo.value?.id
    );
  } else {
    if (!props.channelId) return;
    chStore.sendAttachment(
      meId.value,
      props.channelId,
      att as any,
      d.comment.trim(),
      replyTo.value?.id
    );
  }
  draft.value = "";
  replyTo.value = null;
  closeAttachDialog();
}

// Отправка текста
function send() {
  const text = draft.value.trim();
  if (!text || !meId.value) return;
  if (props.context === "dm") {
    if (!props.peerId) return;
    dmStore.sendMessage(meId.value, props.peerId, text, replyTo.value?.id);
  } else {
    if (!props.channelId) return;
    chStore.sendMessage(meId.value, props.channelId, text, replyTo.value?.id);
  }
  draft.value = "";
  replyTo.value = null;
}

// Отправка GIF как вложения (оставляем ваш подход — прямая ссылка)
function gifSend(gif: Gif) {
  if (!meId.value) return;
  const url = pickGifUrl(gif);
  if (!url) return;
  const title = (gif as unknown as Record<string, unknown>)?.["title"];
  const name = typeof title === "string" && title ? `${title}.gif` : "gif.gif";

  const att = {
    id: crypto.randomUUID(),
    name,
    size: 0,
    type: "image/gif",
    dataUrl: url,
  };

  if (props.context === "dm") {
    if (!props.peerId) return;
    dmStore.sendAttachment(
      meId.value,
      props.peerId,
      att as any,
      (draft.value || "").trim(),
      replyTo.value?.id
    );
  } else {
    if (!props.channelId) return;
    chStore.sendAttachment(
      meId.value,
      props.channelId,
      att as any,
      (draft.value || "").trim(),
      replyTo.value?.id
    );
  }

  draft.value = "";
  replyTo.value = null;
}

function pickGifUrl(gif: Gif): string {
  // разные поставщики — пробуем несколько полей безопасно
  const asRec = gif as unknown as Record<string, unknown>;
  const path = [
    ["url"],
    ["images", "downsized_medium", "url"],
    ["images", "downsized", "url"],
    ["images", "original", "url"],
    ["media_formats", "gif", "url"],
    ["media_formats", "mediumgif", "url"],
    ["media", "0", "gif", "url"],
    ["media_formats", "tinygif", "url"],
  ];
  for (const p of path) {
    let cur: unknown = asRec;
    for (const k of p) {
      if (cur && typeof cur === "object") {
        cur = (cur as Record<string, unknown>)[k];
      } else {
        cur = undefined;
        break;
      }
    }
    if (typeof cur === "string" && cur) return cur;
  }
  return "";
}
// Реакции: хелперы
function pushRecentEmoji(e: string) {
  if (!e) return;
  const arr = recentEmojis.value;
  const i = arr.indexOf(e);
  if (i !== -1) arr.splice(i, 1); // было: if (i! - 1) ...
  arr.unshift(e);
  if (arr.length > 40) arr.length = 40;
}
function getRecentEmojis(limit = 8) {
  return recentEmojis.value.slice(0, limit);
}
function reactionEntries(m: CommonMessage) {
  const map = (m as any).reactions as Record<string, string[]> | undefined;
  if (!map) return [];
  const entries = Object.entries(map).map(([emoji, users]) => ({
    emoji,
    count: users.length,
    reactedByMe: users.includes(meId.value),
  }));
  const order = recentEmojis.value;
  entries.sort((a, b) => {
    const ia = order.indexOf(a.emoji);
    const ib = order.indexOf(b.emoji);
    if (ia == -1 && ib == -1) return b.count - a.count;
    if (ia == -1) return 1;
    if (ib == -1) return -1;
    return ia - ib;
  });
  return entries;
}
function toggleReaction(m: CommonMessage, emoji: string) {
  if (props.context === "dm") dmStore.toggleReaction(m.id, emoji, meId.value);
  else chStore.toggleReaction(m.id, emoji, meId.value);
}
function onPickReaction(m: CommonMessage, emojiPayload: Emoji) {
  const emoji = emojiPayload?.emoji || "";
  if (!emoji) return;
  toggleReaction(m, emoji);
  pushRecentEmoji(emoji);
  reactionMenus.value[m.id] = false;
  reactionMenusInline.value[m.id] = false;
  reactionFullOpen.value[m.id] = false;
}
function onQuickReaction(m: CommonMessage, e: string) {
  toggleReaction(m, e);
  pushRecentEmoji(e);
  reactionMenus.value[m.id] = false;
  reactionMenusInline.value[m.id] = false;
  reactionFullOpen.value[m.id] = false;
}
function toggleFullPicker(id: string, force?: boolean) {
  reactionFullOpen.value[id] =
    typeof force === "boolean" ? force : !reactionFullOpen.value[id];
}

// Любое ли реакционное меню/пикер открыт для сообщения (для устойчивого hover)
function isAnyMenuOpen(id: string) {
  return !!(
    reactionMenus.value[id] ||
    reactionMenusInline.value[id] ||
    reactionFullOpen.value[id]
  );
}

// Закрепы
const pinnedMenu = ref(false);
const pinnedList = computed<CommonMessage[]>(() => {
  if (props.context === "dm") {
    if (!meId.value || !props.peerId) return [];
    return dmStore.getPinnedInConversation(meId.value, props.peerId);
  } else {
    if (!props.channelId) return [];
    return chStore.getPinnedInChannel(props.channelId);
  }
});
function togglePin(m: CommonMessage) {
  if (props.context === "dm") dmStore.togglePin(m.id);
  else chStore.togglePin(m.id);
}

// Утилиты
function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024,
    sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
function downloadAttachment(m: CommonMessage) {
  const a = getAttachment(m);
  if (!a?.dataUrl) return;
  const link = document.createElement("a");
  link.href = a.dataUrl;
  link.download = a.name || "file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const imageViewer = ref<{
  open: boolean;
  src: string;
  alt: string;
  author: string;
  avatar: string;
  time: string;
  scale: number;
}>({
  open: false,
  src: "",
  alt: "",
  author: "",
  avatar: "",
  time: "",
  scale: 1,
});

function openImageViewer(m: CommonMessage) {
  const att = (m as any).attachment as CommonAttachment | undefined;
  if (!att?.dataUrl || !att.type?.startsWith("image/")) return;
  imageViewer.value = {
    open: true,
    src: att.dataUrl,
    alt: att.name || "",
    author: senderName(m),
    avatar: senderAvatar(m),
    time: fmtDateTime(m.createdAt),
    scale: 1,
  };
}
function closeViewer() {
  imageViewer.value.open = false;
  imageViewer.value.scale = 1;
}
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const STEP = 0.2;
function zoomIn() {
  imageViewer.value.scale = Math.min(
    MAX_SCALE,
    +(imageViewer.value.scale + STEP).toFixed(2)
  );
}
function zoomOut() {
  imageViewer.value.scale = Math.max(
    MIN_SCALE,
    +(imageViewer.value.scale - STEP).toFixed(2)
  );
}
function resetZoom() {
  imageViewer.value.scale = 1;
}
function toggleZoom() {
  imageViewer.value.scale = imageViewer.value.scale === 1 ? 2 : 1;
}
const imageTransform = computed(() => {
  return {
    transform: `scale(${imageViewer.value.scale})`,
  };
});
function onViewerWheel(e: WheelEvent) {
  if (e.deltaY > 0) zoomOut();
  else zoomIn();
}

// Удаление
function onDelete(m: CommonMessage) {
  if (props.context === "dm") dmStore.deleteMessage(m.id);
  else chStore.deleteMessage(m.id);
  if (replyTo.value?.id === m.id) replyTo.value = null;
}

function onSticker(payload: {
  dataUrl: string;
  mime: string;
  name: string;
  meta?: any;
}) {
  if (!meId.value) return;
  const att: any = {
    id: crypto.randomUUID(),
    name: payload.name,
    size: 0,
    type: payload.mime || "image/png",
    dataUrl: payload.dataUrl,
    stickerMeta: payload.meta || null, // важно для предпросмотра набора
  };
  if (props.context === "dm") {
    if (!props.peerId) return;
    dmStore.sendAttachment(
      meId.value,
      props.peerId,
      att,
      (draft.value || "").trim(),
      replyTo.value?.id
    );
  } else {
    if (!props.channelId) return;
    chStore.sendAttachment(
      meId.value,
      props.channelId,
      att,
      (draft.value || "").trim(),
      replyTo.value?.id
    );
  }
  draft.value = "";
  replyTo.value = null;
}

// Клик по картинке — если есть stickerMeta, открываем предпросмотр набора
function onImageOrStickerClick(m: CommonMessage) {
  const meta = (
    getAttachment(m) as
      | (CommonAttachment & {
          stickerMeta?: { kind?: string; packId?: string };
        })
      | null
  )?.stickerMeta;
  if (meta?.kind && meta?.packId) {
    openPackPreview(meta.kind === "emoji" ? "emoji" : "sticker", meta.packId);
  } else {
    openImageViewer(m);
  }
}

function imageClassByMeta(att: CommonAttachment | null): string {
  const meta = (att as any)?.stickerMeta as { kind?: string } | undefined;
  if (!meta?.kind) return "chat-image-regular";
  if (meta.kind === "emoji") return "chat-image-emoji";
  if (meta.kind === "sticker") return "chat-image-sticker";
  return "chat-image-regular";
}

const previewOpen = ref(false);
const previewKind = ref<"emoji" | "sticker" | undefined>(undefined);
const previewPackId = ref<string | undefined>(undefined);

function openPackPreview(kind: "emoji" | "sticker", packId: string) {
  previewKind.value = kind;
  previewPackId.value = packId;
  previewOpen.value = true;
}

const composerRef = ref<InstanceType<typeof InputMulti> | null>(null);

function openInPickerFromPreview(p: any) {
  if (p.kind === "sticker") composerRef.value?.openStickerPicker(p.id);
  else composerRef.value?.openEmojiPicker(p.id);
  previewOpen.value = false;
}
function onCopiedFromPreview() {
  previewOpen.value = false;
}
</script>

<style scoped>
.scope-main {
  --v-theme-surface: var(--main-background);
  --v-theme-on-surface: var(--main-on-surface);
  --v-theme-outline: var(--main-border);
  --v-theme-surface-variant: var(--main-elev-1);
}
.pinned-bar {
  background: var(--main-elev-1, var(--main-background));
  border-bottom: 1px solid var(--main-border, var(--app-outline-variant));
}
.messages-scroll {
  background: transparent;
}
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.pinned-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--app-card-bg);
  border-bottom: 1px solid var(--app-border-color);
}
.pinned-list {
  min-width: 320px;
}
.messages-scroll {
  flex: 1 1 auto;
  overflow: auto;
  padding: 8px;
  padding-top: 0;
  background: transparent;
}
.messages-list {
  background: transparent;
}
.messages-list :deep(.v-list) {
  padding-top: 0;
  padding-bottom: 8px;
}
.message-row {
  display: flex;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  position: relative;
  transition: background-color 0.15s ease;
}
.message-row:hover {
  background: var(--app-hover-color);
}
.message-row.is-highlighted {
  background: rgba(79, 156, 249, 0.18);
}
.left-col {
  flex: 0 0 40px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-top: 2px;
}
.left-time {
  color: #9aa0a6;
  font-size: 12px;
  line-height: 40px;
  min-width: 40px;
  text-align: center;
  user-select: none;
}
.msg-avatar {
  flex: 0 0 auto;
}
.msg-body {
  flex: 1 1 auto;
  min-width: 0;
}
.msg-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}
.msg-author {
  color: var(--app-text-color);
  font-weight: 600;
}
.msg-time {
  color: #9aa0a6;
  font-size: 12px;
}
.edited-tag {
  color: #9aa0a6;
  font-size: 12px;
  margin-left: 6px;
}
.pinned-tag {
  color: #f6d365;
  font-size: 12px;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.msg-actions {
  position: absolute;
  right: 8px;
  top: -6px;
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 6px;
  border-radius: 6px;
  z-index: 2;
}
.msg-edit .edit-attach .current-attach {
  background: var(--app-card-bg);
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  padding: 8px;
}
.rounded {
  border-radius: 8px;
}
.reply-preview {
  border-left: 2px solid #4f9cf9;
  background: var(--app-hover-color);
  padding: 6px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
}
.reply-preview:hover {
  background: var(--app-hover-color);
}
.reply-author {
  color: var(--app-text-color);
  opacity: 0.8;
  font-size: 12px;
  margin-bottom: 2px;
}
.reply-text {
  color: var(--app-text-color);
  opacity: 0.9;
  font-size: 13px;
}
.pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
.reactions .emoji {
  font-size: 14px;
}
.add-reaction {
  min-width: 28px;
  height: 22px;
}
.reply-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--app-card-bg);
  border-top: 1px solid var(--app-border-color);
}
/* Стало */
.image-viewer :deep(.v-overlay__content) {
  padding: 0 !important;
}
.image-viewer__wrap {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-viewer__img {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
  transition: transform 120ms ease;
  user-select: none;
  pointer-events: auto;
}
.image-viewer__topbar {
  position: absolute;
  top: 8px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #fff;
}
.iv-left {
  display: flex;
  align-items: center;
}
.iv-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.iv-author {
  font-weight: 600;
}
.iv-time {
  font-size: 12px;
  opacity: 0.85;
}
.iv-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.clickable {
  cursor: zoom-in;
}
.d-none {
  display: none !important;
}
.gap-1 {
  gap: 6px;
}
.gap-2 {
  gap: 8px;
}
.vue-player.chat-video {
  width: 100%;
  max-width: 420px;
  position: relative;
  line-height: 0;
  border-radius: 8px;
  overflow: hidden;
}
.vue-player.chat-video video {
  width: 100%;
  height: auto;
  max-height: 280px;
  display: block;
}

.chat-image-regular {
  max-width: 320px;
  display: inline-block;
}
.chat-image-emoji {
  width: 24px;
  height: 24px;
  image-rendering: auto;
  object-fit: contain;
  display: inline-block;
  vertical-align: middle;
}
.chat-image-sticker {
  width: 200px;
  height: 200px;
  object-fit: contain;
  display: inline-block;
  background: transparent;
}
</style>
