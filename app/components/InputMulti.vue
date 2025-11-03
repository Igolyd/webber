<template>
  <v-navigation-drawer
    location="bottom"
    floating
    permanent
    :height="drawerHeight"
    :width="drawerHeight"
    class="input-multi"
  >
    <div class="wrap">
      <v-row class="align-center" no-gutters>
        <v-col class="pr-2">
          <v-textarea
            ref="vta"
            v-model="innerLimited"
            class="input-field"
            variant="plain"
            density="compact"
            :rows="1"
            :maxlength="MAX_LENGTH"
            no-resize
            :placeholder="placeholder"
            hide-details
            @input="onInputLimit"
            @paste="onPasteLimit"
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
            class="btn-primary-tonal"
            size="small"
            variant="tonal"
            :disabled="!innerLimited.trim()"
            @click="onSubmit"
          >
            <v-icon start size="16">mdi-send</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, nextTick } from "vue";
import { EmojiPicker, GifPicker } from "vue-gif-emoji-picker";
import type { Emoji, Gif } from "vue-gif-emoji-picker";
import {
  useReactionsStore,
  type EmojiItem,
  type StickerItem,
} from "@/stores/reactions";

const props = defineProps<{
  modelValue: string;
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

const MAX_LENGTH = 5000;
const MAX_ROWS = 10;

// v-textarea model c жёстким лимитом
const inner = computed({
  get: () => props.modelValue || "",
  set: (v: string) => emit("update:modelValue", v ?? ""),
});
const innerLimited = computed({
  get: () => inner.value.slice(0, MAX_LENGTH),
  set: (v: string) => emit("update:modelValue", (v || "").slice(0, MAX_LENGTH)),
});

const placeholder = computed(() => "Напишите сообщение...");

// refs
const vta = ref(); // ссылка на v-textarea
const textareaEl = ref<HTMLTextAreaElement | null>(null);

const currentRows = ref(1);
const drawerHeight = ref(0); // фактическая высота нижнего бара

// измерение и установка высоты
function measureAndApply() {
  if (!textareaEl.value) return;

  const ta = textareaEl.value;
  // Сброс высоты, чтобы корректно посчитать scrollHeight
  ta.style.height = "auto";

  const cs = window.getComputedStyle(ta);
  const lineHeight = parseFloat(cs.lineHeight || "20") || 20;
  const padTop = parseFloat(cs.paddingTop || "0") || 0;
  const padBottom = parseFloat(cs.paddingBottom || "0") || 0;

  // Сколько строк требуется по факту
  const contentHeight = ta.scrollHeight - padTop - padBottom;
  const neededRows = Math.max(1, Math.ceil(contentHeight / lineHeight));
  const rows = Math.min(MAX_ROWS, neededRows);
  currentRows.value = rows;

  // Устанавливаем видимую высоту textarea ровно под строки
  const newTaHeight = rows * lineHeight + padTop + padBottom;
  ta.style.height = `${newTaHeight}px`;
  ta.style.overflowY = neededRows > MAX_ROWS ? "auto" : "hidden";

  // Посчитаем высоту всего нижнего бара:
  // обёртка .wrap: padding 8 сверху и снизу => 16
  const wrapPadding = 16;
  // Высота ряда кнопок — как минимум 36px (кнопки small)
  const controlsMin = 36;

  const rowHeight = Math.max(newTaHeight, controlsMin);
  drawerHeight.value = Math.ceil(rowHeight + wrapPadding);
}

// ограничение при вводе/вставке
function onInputLimit(e: Event) {
  const el = e.target as HTMLTextAreaElement | null;
  if (!el) return;
  if (el.value.length > MAX_LENGTH) {
    el.value = el.value.slice(0, MAX_LENGTH);
    emit("update:modelValue", el.value);
  }
  // после любого ввода пересчитать высоту
  nextTick(measureAndApply);
}

function onPasteLimit(e: ClipboardEvent) {
  const paste = e.clipboardData?.getData("text") ?? "";
  const current = innerLimited.value || "";
  const space = MAX_LENGTH - current.length;
  if (space <= 0) {
    e.preventDefault();
    return;
  }
  if (paste.length > space) {
    e.preventDefault();
    emit("update:modelValue", current + paste.slice(0, space));
  }
  nextTick(measureAndApply);
}

// стартовая и последующие инициализации
onMounted(async () => {
  await nextTick();
  // получаем внутренний textarea из v-textarea
  const root = (vta.value?.$el as HTMLElement | null) || null;
  textareaEl.value = root?.querySelector("textarea") || null;

  measureAndApply();

  // наблюдаем за изменением шрифта/ресайзом окна
  const ro = new ResizeObserver(() => measureAndApply());
  if (textareaEl.value) ro.observe(textareaEl.value);
  window.addEventListener("resize", measureAndApply, { passive: true });
});

watch(
  () => innerLimited.value,
  () => nextTick(measureAndApply)
);

// Пакеты/пикеры (без изменений в логике)
const reactions = useReactionsStore();
const showEmojiPacks = ref(false);
const showStickerPacks = ref(false);
const showGifPicker = ref(false);
const selectedEmojiPackId = ref<string | "system" | null>(null);
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
watch(showEmojiPacks, (open) => {
  if (!open) return;
  if (!selectedEmojiPackId.value)
    selectedEmojiPackId.value = emojiPacks.value[0]?.id ?? "system";
});
watch(showStickerPacks, (open) => {
  if (!open) return;
  if (!selectedStickerPackId.value)
    selectedStickerPackId.value = stickerPacks.value[0]?.id ?? null;
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
    if (!selectedEmojiPackId.value || selectedEmojiPackId.value === "system") {
      currentEmojiItems.value = [];
      return;
    }
    emojiLoading.value = true;
    try {
      currentEmojiItems.value = (await reactions.getPackItems(
        "emoji",
        selectedEmojiPackId.value
      )) as EmojiItem[];
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
      currentStickerItems.value = (await reactions.getPackItems(
        "sticker",
        selectedStickerPackId.value
      )) as StickerItem[];
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
    if (it.type === "unicode")
      return [it.emoji, ...(kw || [])].some((x) =>
        String(x || "")
          .toLowerCase()
          .includes(q)
      );
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
function focusTextarea() {
  // сфокусируем textarea после вставки
  const el = textareaEl.value;
  if (!el) return;
  requestAnimationFrame(() => {
    el.focus();
    // ставим курсор в конец
    const len = el.value.length;
    el.setSelectionRange(len, len);
  });
}
// Выборы
function onSystemEmojiPick(e: Emoji) {
  const ch = e?.emoji || "";
  if (!ch) return;
  innerLimited.value = (innerLimited.value || "") + ch;
  nextTick(measureAndApply);
  focusTextarea();
}
function onEmojiItemClick(it: EmojiItem) {
  if (it.type === "unicode") {
    innerLimited.value = (innerLimited.value || "") + it.emoji;
    nextTick(measureAndApply);
    focusTextarea();
  } else {
    // стикер отправляем как раньше (если нужно менять — скажите)
    emit("sticker", {
      dataUrl: it.dataUrl,
      mime: it.mime || "image/png",
      name: "emoji.png",
      meta: { kind: "emoji", packId: selectedEmojiPackId.value },
    });
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

// Файлы
const fileInput = ref<HTMLInputElement | null>(null);
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
  const text = (innerLimited.value || "").trim();
  if (!text) return;
  emit("send");
}
</script>

<style scoped>
.input-multi {
  border-top: 1px solid var(--app-border-color);
  overflow: hidden !important;
}
.input-multi :deep(.v-navigation-drawer__content) {
  overflow: hidden !important;
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

.input-field :deep(.v-field) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  min-height: auto !important;
}
.input-field :deep(.v-fieldoutline),
.input-field :deep(.v-fieldoverlay) {
  display: none !important;
}
.input-field :deep(.v-input__control) {
  --v-field-border-width: 0;
}

.input-field :deep(textarea) {
  padding: 8px 12px !important;
  line-height: 20px !important;
  background: transparent !important;
  color: var(--app-on-surface) !important;
  resize: none !important;
  overflow-y: hidden;
}

.input-field :deep(textarea)::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.input-field :deep(textarea) {
  scrollbar-width: none;
}

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
