<template>
  <v-navigation-drawer
    location="bottom"
    rail
    floating
    permanent
    class="input-multi"
  >
    <div class="wrap">
      <v-row class="align-center" no-gutters>
        <!-- Текстовая область -->
        <v-col class="pr-2">
          <v-textarea
            v-model="inner"
            variant="outlined"
            density="comfortable"
            auto-grow
            :rows="1"
            :placeholder="placeholder"
            hide-details
            @keydown.enter.exact.prevent="onSubmit"
          />
        </v-col>

        <!-- Панель кнопок -->
        <v-col cols="auto" class="d-flex align-center gap-1">
          <!-- Паки эмодзи -->
          <v-menu
            v-model="showEmojiPacks"
            :close-on-content-click="false"
            location="top"
            transition="slide-y-transition"
          >
            <template #activator="{ props }">
              <v-btn
                icon="mdi-emoticon-plus-outline"
                size="small"
                variant="text"
                v-bind="props"
                :title="'Паки эмодзи'"
              />
            </template>

            <div class="pa-2 picker">
              <!-- Ряд паков — горизонтальный скролл, закреплён сверху -->
              <div class="pack-row sticky">
                <v-chip
                  v-for="p in emojiPacks"
                  :key="p.id"
                  size="small"
                  class="ma-1"
                  :color="selectedEmojiPackId === p.id ? 'primary' : undefined"
                  @click="selectedEmojiPackId = p.id"
                >
                  <v-avatar start size="18"><v-img :src="p.avatar" /></v-avatar>
                  {{ p.title }}
                  <v-badge
                    v-if="p.itemsCount"
                    inline
                    color="grey"
                    :content="p.itemsCount"
                    class="ml-1"
                  />
                </v-chip>

                <v-chip
                  size="small"
                  class="ma-1"
                  :color="
                    selectedEmojiPackId === '__system__' ? 'primary' : undefined
                  "
                  @click="selectedEmojiPackId = '__system__'"
                >
                  <v-icon start size="16">mdi-emoticon-outline</v-icon>
                  Системные
                </v-chip>
              </div>

              <!-- Поиск -->
              <div class="mt-2" v-if="selectedEmojiPackId !== '__system__'">
                <v-text-field
                  v-model="emojiSearch"
                  density="compact"
                  variant="outlined"
                  hide-details
                  prepend-inner-icon="mdi-magnify"
                  placeholder="Поиск в паке"
                />
              </div>

              <div class="mt-2 content-area">
                <div v-if="selectedEmojiPackId === '__system__'">
                  <EmojiPicker tooltip @emoji-sent="onSystemEmojiPick" />
                </div>

                <div v-else>
                  <div v-if="emojiLoading" class="loading-box">
                    <v-progress-circular indeterminate size="22" class="mr-2" />
                    Загрузка…
                  </div>

                  <div v-else-if="!filteredEmojiItems.length" class="empty-box">
                    Нет элементов
                  </div>

                  <div v-else class="grid responsive">
                    <button
                      v-for="it in filteredEmojiItems"
                      :key="it.id"
                      class="cell"
                      @click="onEmojiItemClick(it)"
                    >
                      <span v-if="it.type === 'unicode'" class="big-emoji">
                        {{ it.emoji }}
                      </span>
                      <img v-else :src="it.dataUrl" :alt="it.id" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </v-menu>

          <!-- Паки стикеров -->
          <v-menu
            v-model="showStickerPacks"
            :close-on-content-click="false"
            location="top"
            transition="slide-y-transition"
          >
            <template #activator="{ props }">
              <v-btn
                icon="mdi-sticker-emoji"
                size="small"
                variant="text"
                v-bind="props"
                :title="'Стикеры'"
              />
            </template>

            <div class="pa-2 picker">
              <div class="pack-row sticky">
                <v-chip
                  v-for="p in stickerPacks"
                  :key="p.id"
                  size="small"
                  class="ma-1"
                  :color="
                    selectedStickerPackId === p.id ? 'primary' : undefined
                  "
                  @click="selectedStickerPackId = p.id"
                >
                  <v-avatar start size="18"><v-img :src="p.avatar" /></v-avatar>
                  {{ p.title }}
                  <v-badge
                    v-if="p.itemsCount"
                    inline
                    color="grey"
                    :content="p.itemsCount"
                    class="ml-1"
                  />
                </v-chip>
              </div>

              <div class="mt-2">
                <v-text-field
                  v-model="stickerSearch"
                  density="compact"
                  variant="outlined"
                  hide-details
                  prepend-inner-icon="mdi-magnify"
                  placeholder="Поиск в паке"
                />
              </div>

              <div class="mt-2 content-area">
                <div v-if="stickerLoading" class="loading-box">
                  <v-progress-circular indeterminate size="22" class="mr-2" />
                  Загрузка…
                </div>

                <div v-else-if="!filteredStickerItems.length" class="empty-box">
                  Нет элементов
                </div>

                <div v-else class="grid responsive">
                  <button
                    v-for="it in filteredStickerItems"
                    :key="it.id"
                    class="cell"
                    @click="onStickerItemClick(it)"
                  >
                    <img :src="it.dataUrl" :alt="it.id" />
                  </button>
                </div>
              </div>
            </div>
          </v-menu>

          <!-- Быстрый системный EmojiPicker -->
          <v-menu
            v-model="showEmojiPicker"
            :close-on-content-click="false"
            location="top"
            transition="slide-y-transition"
          >
            <template #activator="{ props }">
              <v-btn
                icon="mdi-emoticon-outline"
                size="small"
                variant="text"
                v-bind="props"
                :title="'Эмодзи'"
              />
            </template>
            <EmojiPicker :tooltip="true" @emoji-sent="onSelectEmoji" />
          </v-menu>

          <!-- GIF -->
          <v-menu
            v-model="showGifPicker"
            :close-on-content-click="false"
            location="top"
            transition="slide-y-transition"
          >
            <template #activator="{ props }">
              <v-btn
                icon
                size="small"
                variant="text"
                v-bind="props"
                :title="'GIF'"
              >
                <span class="gif-label">GIF</span>
              </v-btn>
            </template>
            <div class="pa-2" style="width: 420px; max-width: 80vw">
              <GifPicker
                api-key="AIzaSyAi283TC0_-LD8BKhTOhaP2kuZpqTsWl3o"
                @gif-sent="(g) => emit('gif', g)"
              />
            </div>
          </v-menu>

          <!-- Файл -->
          <v-btn
            icon="mdi-paperclip"
            size="small"
            variant="text"
            :title="'Прикрепить файл'"
            @click="triggerFile"
          />
          <input
            ref="fileInput"
            type="file"
            class="d-none"
            @change="onFilePicked"
          />

          <!-- Алерт -->
          <v-btn
            icon="mdi-bullhorn-outline"
            size="small"
            variant="text"
            :title="'Отправить алерт'"
            @click="emit('alert')"
          />

          <!-- Отправка -->
          <v-btn
            color="primary"
            size="small"
            variant="flat"
            :disabled="!inner.trim()"
            @click="onSubmit"
          >
            <v-icon start size="16">mdi-send</v-icon>
            Отправить
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { EmojiPicker, GifPicker } from "vue-gif-emoji-picker";
import type { Emoji, Gif } from "vue-gif-emoji-picker";
import {
  useReactionsStore,
  type EmojiItem,
  type StickerItem,
} from "@/stores/reactions";

const props = defineProps<{
  modelValue: string;
  minHeight?: number;
  maxRows?: number;
  context?: "dm" | "channel";
  meId?: string;
  groupId?: string;
}>();
type StickerMeta = { kind: "emoji" | "sticker"; packId?: string | null };
type StickerPayload = {
  dataUrl: string;
  mime: string;
  name: string;
  meta?: StickerMeta;
};

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "send"): void;
  (e: "attach", file: File): void;
  (e: "gif", gif: Gif): void;
  (e: "alert"): void;
  (e: "sticker", payload: StickerPayload): void;
}>();

// Внутреннее value — это строка, без .content
const inner = computed({
  get: () => props.modelValue || "",
  set: (v: string) => emit("update:modelValue", v),
});

const placeholder = computed(() => "Напишите сообщение...");

// Refs
const fileInput = ref<HTMLInputElement | null>(null);

// Reactions store / паки
const reactions = useReactionsStore();

const showEmojiPacks = ref(false);
const showStickerPacks = ref(false);
const showEmojiPicker = ref(false);
const showGifPicker = ref(false);

const selectedEmojiPackId = ref<string | "__system__" | null>(null);
const selectedStickerPackId = ref<string | null>(null);

const emojiPacks = computed(() =>
  reactions.getAvailablePacks({
    kind: "emoji",
    userId: props.meId || "",
    context: props.context || "dm",
    groupId: props.groupId,
  })
);
const stickerPacks = computed(() =>
  reactions.getAvailablePacks({
    kind: "sticker",
    userId: props.meId || "",
    context: props.context || "dm",
    groupId: props.groupId,
  })
);
watch(
  emojiPacks,
  (list) => {
    console.debug("[InputMulti] emojiPacks", {
      meId: props.meId,
      count: list.length,
      ids: list.map((p) => p.id),
    });
  },
  { immediate: true }
);
watch(showEmojiPacks, (open) => {
  if (!open) return;
  // если ничего не выбрано — приоритет: первый доступный, затем системные
  if (!selectedEmojiPackId.value) {
    selectedEmojiPackId.value = emojiPacks.value[0]?.id ?? "__system__";
  }
});

watch(showStickerPacks, (open) => {
  if (!open) return;
  if (!selectedStickerPackId.value) {
    selectedStickerPackId.value = stickerPacks.value[0]?.id ?? null;
  }
});
const currentEmojiItems = ref<EmojiItem[]>([]);
const currentStickerItems = ref<StickerItem[]>([]);
const emojiLoading = ref(false);
const stickerLoading = ref(false);
const emojiSearch = ref("");
const stickerSearch = ref("");

watch(
  [selectedEmojiPackId, () => props.groupId, () => props.meId],
  async () => {
    if (
      !selectedEmojiPackId.value ||
      selectedEmojiPackId.value === "__system__"
    ) {
      currentEmojiItems.value = [];
      return;
    }
    emojiLoading.value = true;
    try {
      const list = await reactions.getPackItems(
        "emoji",
        selectedEmojiPackId.value
      );
      currentEmojiItems.value = list as EmojiItem[];
    } finally {
      emojiLoading.value = false;
    }
  },
  { immediate: true }
);

watch(
  [selectedStickerPackId, () => props.groupId, () => props.meId],
  async () => {
    if (!selectedStickerPackId.value) {
      currentStickerItems.value = [];
      return;
    }
    stickerLoading.value = true;
    try {
      const list = await reactions.getPackItems(
        "sticker",
        selectedStickerPackId.value
      );
      currentStickerItems.value = list as StickerItem[];
    } finally {
      stickerLoading.value = false;
    }
  },
  { immediate: true }
);
const filteredEmojiItems = computed(() => {
  const q = emojiSearch.value.trim().toLowerCase();
  if (!q) return currentEmojiItems.value;
  return currentEmojiItems.value.filter((it) => {
    const kw = ("keywords" in it && it.keywords) || [];
    if (it.type === "unicode") {
      return [it.emoji, ...(kw || [])].some((x) =>
        String(x || "")
          .toLowerCase()
          .includes(q)
      );
    }
    return [...(kw || [])].some((x) =>
      String(x || "")
        .toLowerCase()
        .includes(q)
    );
  });
});

const filteredStickerItems = computed(() => {
  const q = stickerSearch.value.trim().toLowerCase();
  if (!q) return currentStickerItems.value;
  return currentStickerItems.value.filter((it) => {
    const kw = it.keywords || [];
    return kw.some((x) =>
      String(x || "")
        .toLowerCase()
        .includes(q)
    );
  });
});
// Выборы из пикеров
function onSelectEmoji(e: Emoji) {
  const ch = e?.emoji || "";
  if (!ch) return;
  inner.value = (inner.value || "") + ch;
}

function onSystemEmojiPick(e: Emoji) {
  const ch = e?.emoji || "";
  if (!ch) return;
  inner.value = (inner.value || "") + ch;
  showEmojiPacks.value = false;
  onSubmit();
}

function onEmojiItemClick(it: EmojiItem) {
  if (it.type === "unicode") {
    inner.value = (inner.value || "") + it.emoji;
    showEmojiPacks.value = false;
    onSubmit();
  } else {
    emit("sticker", {
      dataUrl: it.dataUrl,
      mime: it.mime || "image/png",
      name: "emoji.png",
      meta: { kind: "emoji", packId: selectedEmojiPackId.value },
    });
    showEmojiPacks.value = false;
  }
}

function onStickerItemClick(it: StickerItem) {
  emit("sticker", {
    dataUrl: it.dataUrl,
    mime: it.mime || "image/png",
    name: "sticker.png",
    meta: { kind: "sticker", packId: selectedStickerPackId.value },
  });
  showStickerPacks.value = false;
}

// API для открытия пикеров с предвыбранным паком
function openEmojiPicker(packId?: string) {
  selectedEmojiPackId.value = packId || emojiPacks.value[0]?.id || "__system__";
  showEmojiPacks.value = true;
}
function openStickerPicker(packId?: string) {
  selectedStickerPackId.value = packId || stickerPacks.value[0]?.id || null;
  showStickerPacks.value = true;
}
defineExpose({ openEmojiPicker, openStickerPicker });

// Файлы
function triggerFile() {
  fileInput.value?.click();
}
function onFilePicked(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  emit("attach", f);
  (e.target as HTMLInputElement).value = "";
}

// Отправка
function onSubmit() {
  const text = inner.value.trim();
  if (!text) return;
  emit("send");
}
</script>

<style scoped>
.input-multi {
  border-top: 1px solid var(--app-border-color);
}
.wrap {
  padding: 8px;
}
.d-none {
  display: none !important;
}
.gap-1 {
  gap: 8px;
}

/* Пикеры */
.picker {
  min-width: 360px;
  max-width: 560px;
  max-height: min(60vh, 520px);
  overflow: auto;
}
.pack-row {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 6px;
  padding-bottom: 6px;
}
.pack-row.sticky {
  position: sticky;
  top: 0;
  background: var(--v-theme-surface);
  z-index: 1;
}
.content-area {
  padding-bottom: 6px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(6, 48px);
  gap: 6px;
}
.grid.responsive {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 6px;
}

.cell {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: var(--app-hover-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid var(--app-border-color);
}
.cell img {
  width: 90%;
  height: 90%;
  border-radius: 6px;
  object-fit: contain;
}
.big-emoji {
  font-size: clamp(22px, 4.2vw, 28px);
}
.loading-box,
.empty-box {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-muted, #9aa0a6);
  height: 120px;
}
.gif-label {
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 1px;
}
</style>
