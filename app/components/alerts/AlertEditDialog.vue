<template>
  <v-dialog v-model="model" max-width="720">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-pencil</v-icon>
        Редактировать алерт
        <v-spacer />
        <v-btn icon variant="text" @click="model = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text v-if="asset">
        <v-text-field
          v-model="localName"
          label="Название"
          variant="outlined"
          hide-details
          class="mb-4"
        />

        <div class="mb-4">
          <div class="text-caption mb-1">
            {{
              isVideo
                ? "Постер (картинка для видео)"
                : "Аватар (картинка для аудио)"
            }}
          </div>
          <div class="d-flex ga-2 align-center">
            <v-avatar v-if="localPoster" size="64">
              <v-img :src="localPoster" />
            </v-avatar>
            <v-btn size="small" variant="tonal" @click="pickImage">
              <v-icon start>mdi-image</v-icon>Загрузить картинку
            </v-btn>
            <v-btn
              v-if="localPoster"
              size="small"
              variant="text"
              color="error"
              @click="localPoster = ''"
            >
              Убрать
            </v-btn>
            <input
              ref="fileImg"
              type="file"
              class="d-none"
              accept="image/*"
              @change="onImagePicked"
            />
          </div>
        </div>

        <!-- <v-divider class="my-4" />

        <div class="text-caption mb-2">
          Дополнительно: переобрезать файл (даже если он уже ≤
          {{ maxDuration }} c)
        </div>
        <v-btn size="small" @click="openTrim">
          <v-icon start>mdi-content-cut</v-icon>Обрезать
        </v-btn> -->
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="model = false">Отмена</v-btn>
        <v-btn color="primary" @click="onSave">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
    <v-dialog v-model="cropDialog" max-width="600px">
      <v-card>
        <v-card-title>Кадрирование изображения</v-card-title>
        <v-card-text>
          <Cropper
            v-if="selectedImage"
            ref="cropperRef"
            :debounce="false"
            :src="selectedImage"
            :stencil-component="CircleStencil"
            @change="onCropChange"
          />
          <Preview
            v-if="cropResult.coordinates && cropResult.image"
            :width="120"
            :height="120"
            :image="cropResult.image"
            :coordinates="cropResult.coordinates"
            :stencil-component="CircleStencil"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="applyCroppedPoster">Применить</v-btn>
          <v-btn variant="text" @click="cropDialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Диалог триммера для существующего ассета -->
    <AlertTrimDialog
      v-model="trimState.open"
      :file="trimState.file"
      :kind="asset?.kind || 'video'"
      @cancel="trimState.open = false"
      @trimmed="onTrimmed"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  useAlertsLibraryStore,
  useAlertsRuntimeStore,
  MAX_VIDEO_DURATION,
} from "@/stores/alerts";
import AlertTrimDialog from "@/components/alerts/AlertTrimDialog.vue";
import { Cropper, Preview, CircleStencil } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const props = defineProps<{
  modelValue: boolean;
  assetId: string | null;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
}>();
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const cropDialog = ref(false);
const cropperRef = ref<any>(null);
const selectedImage = ref<string | null>(null);
const cropResult = ref<{ coordinates: any | null; image: any | null }>({
  coordinates: null,
  image: null,
});

const lib = useAlertsLibraryStore();
const runtime = useAlertsRuntimeStore();
const maxDuration = MAX_VIDEO_DURATION;

const asset = computed(() =>
  props.assetId ? (lib.getMeta(props.assetId) as any) : null
);
const isVideo = computed(() => asset.value?.kind === "video");

const localName = ref("");
const localPoster = ref<string>("");

watch(asset, async (a) => {
  if (!a) return;
  localName.value = a.name || "";
  localPoster.value = a.poster || "";
});

const fileImg = ref<HTMLInputElement | null>(null);
function pickImage() {
  fileImg.value?.click();
}
function onImagePicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // GIF — без кадрирования, используем как есть
  if (file.type === "image/gif") {
    const r = new FileReader();
    r.onload = () => {
      localPoster.value = String(r.result || "");
      selectedImage.value = null;
      cropDialog.value = false;
    };
    r.readAsDataURL(file);
    input.value = "";
    return;
  }

  // Остальные форматы — через кроппер
  const r = new FileReader();
  r.onload = () => {
    selectedImage.value = String(r.result || "");
    cropDialog.value = true;
  };
  r.readAsDataURL(file);
  input.value = "";
}
function onCropChange({ coordinates, image }: any) {
  cropResult.value = { coordinates, image };
}

function applyCroppedPoster() {
  const result = cropperRef.value?.getResult();
  if (result?.canvas) {
    localPoster.value = result.canvas.toDataURL();
  }
  cropDialog.value = false;
}
// Трим существующего ассета
const trimState = ref<{ open: boolean; file: File | null }>({
  open: false,
  file: null,
});

async function openTrim() {
  if (!asset.value) return;
  // загружаем dataUrl ассета
  const dataUrl = await runtime.ensureDataUrl(asset.value as any);
  if (!dataUrl) return;

  // конвертируем dataUrl -> File
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], asset.value.name || "alert", {
    type: asset.value.mime || blob.type,
  });

  trimState.value = { open: true, file };
}

async function onTrimmed(payload: { file: File; durationSec: number }) {
  if (!asset.value) return;
  const { file, durationSec } = payload;
  const reader = new FileReader();
  reader.onload = async () => {
    const dataUrl = String(reader.result || "");
    await lib.replaceAssetData({
      id: asset.value!.id,
      dataUrl,
      mime: file.type || asset.value!.mime,
      size: file.size,
      durationSec,
      poster: isVideo.value ? asset.value!.poster : asset.value!.poster, // оставляем текущий постер
    });
    trimState.value = { open: false, file: null };
  };
  reader.readAsDataURL(file);
}

async function onSave() {
  if (!asset.value) return;
  await lib.updateAssetMeta(asset.value.id, {
    name: localName.value.trim() || asset.value.name,
    poster: localPoster.value || undefined,
  });
  model.value = false;
}
</script>
