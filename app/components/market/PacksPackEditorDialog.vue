<template>
  <v-dialog v-model="model" max-width="980" :scrim="true">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-avatar size="36" class="mr-2">
          <v-img :src="pack?.avatar" />
        </v-avatar>
        <div class="text-truncate">
          {{ pack?.title }}
          <div class="text-caption text-medium-emphasis">
            {{ pack?.uniqueName }}
          </div>
        </div>
        <v-spacer />
        <v-chip size="x-small" class="ml-2" v-if="pack">
          {{ kind === "emoji" ? "Эмодзи" : "Стикеры" }}
        </v-chip>
      </v-card-title>

      <v-card-text>
        <div class="d-flex align-start" style="gap: 16px">
          <div class="flex-grow-1">
            <div class="d-flex align-center gap-2 mb-3">
              <v-chip size="small" variant="tonal">
                Всего: {{ items.length }} / {{ limit }}
              </v-chip>
              <v-spacer />
              <v-btn
                size="small"
                variant="tonal"
                @click="triggerFile"
                :disabled="pending"
              >
                Добавить изображения
              </v-btn>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                :style="hiddenInputStyle"
                @change="onFilesChosen"
              />
            </div>

            <draggable
              v-model="items"
              item-key="id"
              class="grid"
              :animation="150"
              handle=".handle"
              @change="onOrderChanged"
            >
              <template #item="{ element, index }">
                <div
                  class="cell"
                  :class="{ selected: selectedIndex === index }"
                  @click="selectedIndex = index"
                >
                  <div class="toolbar">
                    <v-btn
                      size="x-small"
                      icon
                      variant="text"
                      class="handle"
                      title="Перетащить"
                    >
                      <span class="mdi mdi-drag"></span>
                    </v-btn>
                    <v-btn
                      size="x-small"
                      icon
                      variant="text"
                      color="error"
                      @click.stop="removeItem(element.id)"
                      title="Удалить"
                    >
                      <span class="mdi mdi-close"></span>
                    </v-btn>
                  </div>

                  <img :src="element.dataUrl" alt="" />
                </div>
              </template>
            </draggable>

            <div v-if="pending" class="text-medium-emphasis mt-2">
              Обработка…
            </div>
          </div>

          <div class="all-preview mt-4" v-if="items.length">
            <div class="text-subtitle-2 mb-2">Предпросмотр всех элементов</div>
            <div
              class="preview-grid"
              :class="kind === 'emoji' ? 'is-emoji' : 'is-sticker'"
            >
              <template v-if="kind === 'emoji'">
                <div v-for="it in items" :key="it.id" class="preview-cell">
                  <div class="transparent-wrap">
                    <img :src="it.dataUrl" class="p24" />
                  </div>
                </div>
              </template>
              <template v-else>
                <div v-for="it in items" :key="it.id" class="preview-cell">
                  <div class="transparent-wrap">
                    <img :src="it.dataUrl" class="s200" />
                  </div>
                </div>
              </template>
            </div>

            <v-alert type="info" variant="tonal" class="mt-3">
              <div class="mb-1">
                <strong>Рекомендации по изображениям:</strong>
              </div>
              <ul class="pl-4">
                <li>
                  Эмодзи (кастомные): PNG/WebP с прозрачностью, 48–64px, квадрат
                  1:1. В чате отображаются около 24px.
                </li>
                <li>
                  Стикеры: PNG/WebP с прозрачностью, до 512px по большей стороне
                  (рекомендуем 256–512px), любой аспект.
                </li>
                <li>
                  Анимация: для GIF/WebP-анимаций загружайте исходник — мы не
                  ресайзим их, чтобы сохранить анимацию.
                </li>
              </ul>
            </v-alert>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="model = false">Готово</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { VueDraggableNext as draggable } from "vue-draggable-next";
import {
  useReactionsStore,
  type EmojiItem,
  type StickerItem,
} from "@/stores/reactions";

type PackItemBase = {
  id: string;
  dataUrl: string;
  mime: string;
};
type PackItem = (EmojiItem & PackItemBase) | (StickerItem & PackItemBase);

const props = defineProps<{
  modelValue: boolean;
  kind: "emoji" | "sticker";
  packId: string;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "changed"): void;
}>();

const reactions = useReactionsStore();

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => {
    emit("update:modelValue", v);
  },
});

const pack = computed(() => reactions.getPackById(props.kind, props.packId));
const limit = computed(() =>
  props.kind === "emoji"
    ? reactions.EMOJI_LIMIT_PER_PACK
    : reactions.STICKER_LIMIT_PER_PACK
);

const items = ref<PackItem[]>([]);
const selectedIndex = ref<number>(-1);

const pending = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const hiddenInputStyle = {
  position: "absolute",
  left: "-10000px",
  width: "1px",
  height: "1px",
  opacity: "0",
} as const;

watch(
  () => [props.kind, props.packId, model.value] as const,
  () => {
    if (model.value && props.packId) {
      loadItems();
    }
  },
  { immediate: true }
);

async function loadItems() {
  if (!props.packId) return;
  try {
    const list = await reactions.getPackItems(props.kind, props.packId);
    items.value = list as PackItem[];
    if (items.value.length > 0) {
      if (selectedIndex.value < 0) selectedIndex.value = 0;
      else selectedIndex.value = Math.min(selectedIndex.value, items.value.length - 1);
    } else {
      selectedIndex.value = -1;
    }
  } catch (e) {
    console.error("[Editor] loadItems error", e);
  }
}

function triggerFile() {
  fileInput.value?.click();
}
async function onFilesChosen(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (files.length == 0) return;
  await addImages(files);
}
async function addImages(files: File[]) {
  if (!props.packId) return;
  try {
    pending.value = true;
    const free = Math.max(0, limit.value - items.value.length);
    if (free <= 0) {
      alert(`Лимит достигнут: ${limit.value}`);
      return;
    }
    const slice = files.slice(0, free);
    const processed = await Promise.all(
      slice.map(async (f): Promise<PackItem> => {
        const isGif = f.type == "image/gif";
        const isWebp = f.type == "image/webp";
        let dataUrl: string;
        let mime: string;
        if (isGif || isWebp) {
          const r = await fileToDataUrl(f);
          dataUrl = r.dataUrl;
          mime = r.mime;
        } else {
          const target = props.kind === "emoji" ? 64 : 200;
          const r = await resizeImageKeepAlpha(f, target);
          dataUrl = r.dataUrl;
          mime = r.mime;
        }
        if (props.kind === "emoji") {
          const it: EmojiItem & PackItemBase = {
            id: crypto.randomUUID(),
            // остальные поля EmojiItem, если в сторах есть отличия, добавьте тут
            dataUrl,
            mime,
          } as EmojiItem & PackItemBase;
          return it;
        }
        const st: StickerItem & PackItemBase = {
          id: crypto.randomUUID(),
          dataUrl,
          mime,
        } as StickerItem & PackItemBase;
        return st;
      })
    );
    if (props.kind === "emoji") {
      await reactions.addEmojiItems(props.packId, processed as unknown as EmojiItem[]);
    } else {
      await reactions.addStickerItems(props.packId, processed as unknown as StickerItem[]);
    }
    await loadItems();
    emit("changed");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Не удалось добавить";
    alert(msg);
  } finally {
    pending.value = false;
  }
}
async function removeItem(id: string) {
  try {
    pending.value = true;
    await reactions.removePackItems(props.kind, props.packId, [id]);
    await loadItems();
    if (items.value.length === 0) {
      selectedIndex.value = -1;
    } else {
      selectedIndex.value = Math.min(selectedIndex.value, items.value.length - 1);
    }
    emit("changed");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Не удалось удалить";
    alert(msg);
  } finally {
    pending.value = false;
  }
}
async function onOrderChanged() {
  try {
    const ids = items.value.map((it) => it.id);
    await reactions.reorderPackItems(props.kind, props.packId, ids);
    emit("changed");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Не удалось сохранить порядок";
    alert(msg);
  }
}

function fileToDataUrl(file: File): Promise<{ dataUrl: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        dataUrl: String(reader.result),
        mime: file.type || "application/octet-stream",
      });
    reader.onerror = () => reject(new Error("file read error"));
    reader.readAsDataURL(file);
  });
}

function resizeImageKeepAlpha(
  file: File,
  target: number
): Promise<{ dataUrl: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const w = img.width;
        const h = img.height;
        const scale = Math.min(target / w, target / h, 1);
        const nw = Math.max(1, Math.round(w * scale));
        const nh = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = nw;
        canvas.height = nh;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("no canvas context"));
          return;
        }
        ctx.clearRect(0, 0, nw, nh);
        ctx.drawImage(img, 0, 0, nw, nh);
        const dataUrl = canvas.toDataURL("image/png");
        resolve({ dataUrl, mime: "image/png" });
      };
      img.onerror = () => reject(new Error("image load error"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("file read error"));
    reader.readAsDataURL(file);
  });
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(6, 64px);
  gap: 8px;
}
.cell {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--app-border-color);
  cursor: pointer;
}
.cell.selected {
  outline: 2px solid var(--v-theme-primary);
}
.cell img {
  max-width: 58px;
  max-height: 58px;
  border-radius: 6px;
}
.toolbar {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  gap: 2px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 1px;
}
.handle {
  cursor: grab;
}

.all-preview {
  border-top: 1px solid var(--app-border-color);
  padding-top: 12px;
}
.preview-grid {
  display: grid;
  gap: 10px;
}
.preview-grid.is-emoji {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}
.preview-grid.is-sticker {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.preview-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.transparent-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  background: transparent;
  border: 1px dashed var(--app-border-color);
}
.p24 {
  width: 24px;
  height: 24px;
}
.s200 {
  width: 200px;
  height: 200px;
  object-fit: contain;
}
</style>
