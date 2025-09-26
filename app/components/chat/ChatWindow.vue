<template>
  <div class="chat-window">
    <!-- Панель закреплённых -->
    <div v-if="pinnedList.length" class="pinned-bar">
      <v-icon class="mr-1" size="18">mdi-pin</v-icon>
      Закреплённые: {{ pinnedList.length }}
      <v-spacer />
      <v-menu
        v-model="pinnedMenu"
        location="bottom"
        transition="fade-transition"
      >
        <template #activator="{ props }">
          <v-btn size="small" variant="text" v-bind="props">
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
        <template v-for="m in items" :key="m.id">
          <div
            class="message-row"
            :class="{
              'is-me': m.senderId === meId,
              'is-highlighted': highlightedId === m.id,
            }"
            @mouseenter="hoverId = m.id"
            @mouseleave="hoverId = null"
            :ref="(el) => registerMsgEl(m.id, el)"
          >
            <!-- Аватар -->
            <v-avatar size="32" class="msg-avatar">
              <v-img :src="senderAvatar(m)" cover />
            </v-avatar>

            <!-- Тело -->
            <div class="msg-body">
              <div class="msg-header">
                <span class="msg-author">{{ senderName(m) }}</span>
                <span class="msg-time">
                  {{ fmtTime(m.createdAt) }}
                  <span v-if="m.editedAt" class="edited-tag"> • изменено</span>
                  <span v-if="m.pinned" class="pinned-tag">
                    <v-icon size="14">mdi-pin</v-icon> закреплено
                  </span>
                </span>
              </div>

              <!-- Действия на hover -->
              <div v-if="hoverId === m.id" class="msg-actions">
                <v-btn size="x-small" variant="text" @click="togglePin(m)">
                  <v-icon size="16" start>mdi-pin</v-icon
                  >{{ m.pinned ? "Открепить" : "Закрепить" }}
                </v-btn>

                <v-menu
                  v-model="reactionMenus[m.id]"
                  :close-on-content-click="false"
                  location="bottom"
                >
                  <template #activator="{ props }">
                    <v-btn size="x-small" variant="text" v-bind="props">
                      <v-icon size="16" start>mdi-emoticon-outline</v-icon
                      >Реакция
                    </v-btn>
                  </template>
                  <div class="pa-2">
                    <EmojiPicker
                      :native="true"
                      :disable-skin-tones="true"
                      picker-type="input"
                      @select="(e) => onPickReaction(m, e)"
                    />
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

                <!-- Вложение при редактировании -->
                <div class="edit-attach mt-2">
                  <div v-if="editAttach" class="current-attach">
                    <div class="d-flex align-center gap-2 mb-2">
                      <v-icon>mdi-paperclip</v-icon>
                      <span class="text-medium-emphasis"
                        >{{ editAttach.name }} ({{
                          formatSize(editAttach.size)
                        }})</span
                      >
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
                        v-if="editAttach.type?.startsWith('image/')"
                        :src="editAttach.dataUrl"
                        max-width="280"
                        class="rounded"
                      />
                      <video
                        v-else-if="editAttach.type?.startsWith('video/')"
                        :src="editAttach.dataUrl"
                        controls
                        style="
                          max-width: 420px;
                          max-height: 280px;
                          border-radius: 8px;
                        "
                      />
                      <audio
                        v-else-if="editAttach.type?.startsWith('audio/')"
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
                      <v-icon size="18" start>mdi-paperclip</v-icon
                      >{{ editAttach ? "Заменить файл" : "Добавить файл" }}
                    </v-btn>

                    <v-menu
                      v-model="editEmojiMenu"
                      :close-on-content-click="false"
                      location="bottom"
                    >
                      <template #activator="{ props }">
                        <v-btn size="small" variant="text" v-bind="props">
                          <v-icon size="18" start>mdi-emoticon-outline</v-icon
                          >Эмодзи
                        </v-btn>
                      </template>
                      <div class="pa-2 emoji-panel">
                        <v-text-field
                          variant="outlined"
                          density="compact"
                          hide-details
                          placeholder="Выберите эмодзи"
                          @focus="editEmojiFullOpen = true"
                        />
                        <div class="quick-row">
                          <v-btn
                            v-for="e in getRecentEmojis()"
                            :key="e"
                            size="small"
                            variant="text"
                            class="quick-emoji"
                            @click="onQuickEmojiEdit(e)"
                            >{{ e }}</v-btn
                          >
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
                              :native="true"
                              :disable-skin-tones="true"
                              picker-type="textarea"
                              @select="onSelectEmojiEdit"
                            />
                          </div>
                        </transition>
                      </div>
                    </v-menu>
                  </div>
                </div>

                <div class="mt-2 d-flex gap-2">
                  <v-btn size="small" color="primary" @click="confirmEdit(m)"
                    >Сохранить</v-btn
                  >
                  <v-btn size="small" variant="text" @click="cancelEdit"
                    >Отмена</v-btn
                  >
                </div>
              </div>

              <!-- Отображение -->
              <div v-else class="msg-content">
                <!-- Reply-превью (переход к исходному) -->
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

                <!-- Текст / Файл -->
                <div v-if="m.type === 'text'">
                  <div class="pre-wrap">{{ m.content }}</div>
                </div>

                <div v-else-if="m.type === 'file'">
                  <div class="mb-2">
                    <v-img
                      v-if="m.attachment?.type?.startsWith('image/')"
                      :src="m.attachment?.dataUrl"
                      :alt="m.attachment?.name"
                      max-width="320"
                      class="rounded"
                      @click="openInNew(m.attachment!.dataUrl)"
                    />
                    <video
                      v-else-if="m.attachment?.type?.startsWith('video/')"
                      :src="m.attachment?.dataUrl"
                      controls
                      style="
                        max-width: 420px;
                        max-height: 280px;
                        border-radius: 8px;
                      "
                    />
                    <audio
                      v-else-if="m.attachment?.type?.startsWith('audio/')"
                      :src="m.attachment?.dataUrl"
                      controls
                      style="width: 100%"
                    />
                    <div v-else class="d-flex align-center">
                      <v-icon class="mr-2">mdi-file-outline</v-icon>
                      <span
                        >{{ m.attachment?.name }} ({{
                          formatSize(m.attachment?.size || 0)
                        }})</span
                      >
                      <v-spacer />
                      <v-btn
                        v-if="m.attachment?.dataUrl"
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

                <!-- Реакции (показываем, когда есть, или на hover) -->
                <div
                  class="reactions mt-1"
                  v-if="reactionEntries(m).length || hoverId === m.id"
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
                      <template #activator="{ props }">
                        <v-btn
                          size="x-small"
                          variant="text"
                          class="add-reaction"
                          v-bind="props"
                        >
                          <v-icon size="14">mdi-plus</v-icon>
                        </v-btn>
                      </template>
                      <div class="pa-2">
                        <EmojiPicker
                          :native="true"
                          :disable-skin-tones="true"
                          picker-type="input"
                          @select="(e) => onPickReaction(m, e)"
                        />
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

    <!-- Композер (InputMulti) -->
    <div class="composer">
      <InputMulti v-model="draft" @send="send" @attach="onAttach" />
    </div>

    <!-- Диалог предпросмотра вложения перед отправкой -->
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
              <span
                >{{ attachDialog.file?.name }} ({{
                  formatSize(attachDialog.file?.size || 0)
                }})</span
              >
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
              <template #activator="{ props }">
                <v-btn size="small" variant="text" v-bind="props">
                  <v-icon size="18" start>mdi-emoticon-outline</v-icon>Эмодзи
                </v-btn>
              </template>
              <div class="pa-2 emoji-panel">
                <v-text-field
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="Выберите эмодзи"
                  @focus="reactionFullOpen[m.id] = true"
                />
                <div class="quick-row">
                  <v-btn
                    v-for="e in getRecentEmojis()"
                    :key="e"
                    size="small"
                    variant="text"
                    class="quick-emoji"
                    @click="onQuickReaction(m, e)"
                    >{{ e }}</v-btn
                  >
                  <v-btn
                    size="small"
                    variant="tonal"
                    @click="reactionFullOpen[m.id] = !reactionFullOpen[m.id]"
                  >
                    <v-icon start size="16">mdi-emoticon-outline</v-icon>Все
                  </v-btn>
                </div>
                <transition name="fade">
                  <div v-if="reactionFullOpen[m.id]" class="mt-2">
                    <EmojiPicker
                      :native="true"
                      :disable-skin-tones="true"
                      picker-type="input"
                      @select="(e) => onPickReaction(m, e)"
                    />
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
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import EmojiPicker from "vue3-emoji-picker";
import "vue3-emoji-picker/css";
import InputMulti from "@/components/InputMulti.vue";
import { useProfilesStore } from "@/stores/user/profiles";
import { useUserAccountStore } from "@/stores/user/account";
import { useUsersStore } from "@/stores/users";
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
import { useStorage } from "@vueuse/core"; // (нужно для recent emojis)

type Context = "dm" | "channel";
type CommonAttachment = DMFile | CHFile;
type CommonMessage = DirectMessage | ChannelMessage;

const props = defineProps<{
  context: Context;
  peerId?: string;
  channelId?: string;
}>();

const profiles = useProfilesStore();
const account = useUserAccountStore();
const users = useUsersStore();
const dmStore = useMessagesStore();
const chStore = useGroupMessagesStore();

const meId = computed(() => account.userId || "");

const recentEmojis = useStorage<string[]>("app.recentEmojis", []);
const editFileInputMap = ref<Record<string, HTMLInputElement | null>>({});
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
  if (m.senderId === meId.value)
    return profiles.avatar || "/avatars/default.jpg";
  return users.getById(m.senderId)?.avatar || "/avatars/default.jpg";
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  if (el) editFileInputMap.value[id] = el;
  else delete editFileInputMap.value[id];
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
// Редактирование
const editEmojiMenu = ref(false);
const editEmojiFullOpen = ref(false);

function startEdit(m: CommonMessage) {
  if (m.senderId !== meId.value) return;
  editingId.value = m.id;
  editText.value = m.content;
  editAttach.value = (m as any).attachment
    ? { ...(m as any).attachment }
    : null;
}
function cancelEdit() {
  editingId.value = null;
  editText.value = "";
  editAttach.value = null;
  editEmojiMenu.value = false;
}
function confirmEdit(m: CommonMessage) {
  const newText = editText.value.trim();
  const hasAttach = !!editAttach.value;
  if (!newText && !hasAttach) {
    // пустое сообщение сохранять не будем
    return;
  }
  const patch: any = { content: newText, attachment: editAttach.value ?? null };
  if (props.context === "dm") dmStore.editMessage(m.id, patch);
  else chStore.editMessage(m.id, patch);
  cancelEdit();
}
function onSelectEmojiEdit(emoji: any) {
  const e = emoji?.i ?? "";
  editText.value += e;
  pushRecentEmoji(e);
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
    } as any;
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
// Диалог вложения
const attachEmojiMenu = ref(false);
const attachEmojiFullOpen = ref(false);
// Реакции (для каждого сообщения свой флаг "раскрыт большой пикер")
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
function onSelectEmojiAttach(emoji: any) {
  const e = emoji?.i ?? "";
  attachDialog.value.comment += e;
  pushRecentEmoji(e);
}
function onQuickReaction(m: CommonMessage, e: string) {
  toggleReaction(m, e);
  pushRecentEmoji(e);
  reactionMenus.value[m.id] = false;
  reactionMenusInline.value[m.id] = false;
  reactionFullOpen.value[m.id] = false;
}

function onQuickEmojiEdit(e: string) {
  editText.value += e;
  pushRecentEmoji(e);
  editEmojiMenu.value = false;
  editEmojiFullOpen.value = false;
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

// Реакции
const reactionMenus = ref<Record<string, boolean>>({});
const reactionMenusInline = ref<Record<string, boolean>>({});
function pushRecentEmoji(e: string) {
  if (!e) return;
  const arr = recentEmojis.value;
  const i = arr.indexOf(e);
  if (i !== -1) arr.splice(i, 1);
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
    if (ia === -1 && ib === -1) return b.count - a.count;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return entries;
}
function toggleReaction(m: CommonMessage, emoji: string) {
  if (props.context === "dm") dmStore.toggleReaction(m.id, emoji, meId.value);
  else chStore.toggleReaction(m.id, emoji, meId.value);
}
function onPickReaction(m: CommonMessage, emojiPayload: any) {
  const emoji = emojiPayload?.i || "";
  if (!emoji) return;
  toggleReaction(m, emoji);
  pushRecentEmoji(emoji);
  reactionMenus.value[m.id] = false;
  reactionMenusInline.value[m.id] = false;
  reactionFullOpen.value[m.id] = false;
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
function openInNew(url?: string) {
  if (url) window.open(url, "_blank");
}
function downloadAttachment(m: CommonMessage) {
  const a = (m as any).attachment;
  if (!a?.dataUrl) return;
  const link = document.createElement("a");
  link.href = a.dataUrl;
  link.download = a.name || "file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Удаление
function onDelete(m: CommonMessage) {
  if (props.context === "dm") dmStore.deleteMessage(m.id);
  else chStore.deleteMessage(m.id);
  if (replyTo.value?.id === m.id) replyTo.value = null;
}
</script>

<style scoped>
.chat-window { display: flex; flex-direction: column; height: 100%; }

/* Закреплённые */
.pinned-bar {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  background: var(--app-card-bg);
  border-bottom: 1px solid var(--app-border-color);
}
.pinned-list { min-width: 320px; }

/* Лента */
.messages-scroll {
  flex: 1 1 auto; overflow: auto; padding: 8px;
  background: transparent; /* общий фон */
}
.messages-list { background: transparent; }

/* Сообщение */
.message-row {
  display: flex; gap: 10px; padding: 6px 8px; border-radius: 8px; position: relative;
  transition: background-color .15s ease;
  /* лёгкий hover на базе текущего текста */
}
.message-row:hover {
  background: var(--app-hover-color);
}
.message-row.is-highlighted {
  background: rgba(79, 156, 249, 0.18);
}
.msg-avatar { flex: 0 0 auto; margin-top: 2px; }
.msg-body { flex: 1 1 auto; min-width: 0; }
.msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
.msg-author { color: var(--app-text-color); font-weight: 600; }
.msg-time { color: #9aa0a6; font-size: 12px; }
.edited-tag { color: #9aa0a6; font-size: 12px; margin-left: 6px; }
.pinned-tag { color: #f6d365; font-size: 12px; margin-left: 8px; display: inline-flex; align-items: center; gap: 2px; }

/* Действия */
.msg-actions {
  position: absolute; right: 8px; top: -6px; display: flex; gap: 4px;
  background: rgba(0,0,0,.5);
  padding: 2px 6px; border-radius: 6px; z-index: 2;
}

/* Редактирование */
.msg-edit .edit-attach .current-attach {
  background: var(--app-card-bg);
  border: 1px solid var(--app-border-color);
  border-radius: 8px; padding: 8px;
}
.rounded { border-radius: 8px; }

/* Reply-превью */
.reply-preview {
  border-left: 2px solid #4f9cf9;
  background: var(--app-hover-color);
  padding: 6px 8px; border-radius: 6px; margin-bottom: 6px; cursor: pointer;
}
.reply-preview:hover { background: var(--app-hover-color); }
.reply-author { color: var(--app-text-color); opacity: .8; font-size: 12px; margin-bottom: 2px; }
.reply-text { color: var(--app-text-color); opacity: .9; font-size: 13px; }
.pre-wrap { white-space: pre-wrap; word-break: break-word; }

/* Реакции */
.reactions .emoji { font-size: 14px; }
.add-reaction { min-width: 28px; height: 22px; }

/* Бейдж ответа / композер */
.reply-bar {
  display: flex; align-items: center; gap: 6px; padding: 6px 10px;
  background: var(--app-card-bg);
  border-top: 1px solid var(--app-border-color);
}

/* Мелочи */
.d-none { display: none !important; }
.gap-1 { gap: 6px; }
.gap-2 { gap: 8px; }
</style>
