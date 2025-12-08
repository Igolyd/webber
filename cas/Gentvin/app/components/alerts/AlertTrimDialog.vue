<!-- src/components/alerts/AlertTrimDialog.vue -->
<template>
  <v-dialog v-model="model" max-width="960">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-content-cut</v-icon>
        {{ kind === "video" ? "Обрезка видео" : "Обрезка аудио" }}
        <v-spacer />
        <v-btn icon variant="text" @click="onCancel">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div class="mb-2 text-caption text-medium-emphasis">
          Максимальная длина алерта: <b>{{ maxDuration }} с</b><br />
          Выбранный фрагмент: <b>{{ trimmedDuration.toFixed(1) }}</b> с
          <span v-if="trimmedDuration > maxDuration" class="text-error">
            (слишком длинный, обрежьте до {{ maxDuration }} с)
          </span>
        </div>

        <v-progress-linear
          :model-value="progress"
          height="8"
          rounded
          :color="progressColor"
          class="mb-1"
        />
        <div class="text-caption text-medium-emphasis mb-3">
          Осталось {{ Math.max(0, maxDuration - trimmedDuration).toFixed(1) }} с
        </div>

        <div v-if="file">
          <VideoTrimEditor
            v-if="kind === 'video'"
            :key="
              'v-' +
              (file?.name || '') +
              '-' +
              file?.size +
              '-' +
              file?.lastModified
            "
            ref="videoEditor"
            :file="file"
            :max-duration="maxDuration"
            @update:selection="onSelectionChange"
          />
          <AudioTrimEditor
            v-else
            :key="
              'a-' +
              (file?.name || '') +
              '-' +
              file?.size +
              '-' +
              file?.lastModified
            "
            ref="audioEditor"
            :file="file"
            :max-duration="maxDuration"
            @update:selection="onSelectionChange"
          />
        </div>
        <div v-else class="text-caption text-medium-emphasis">
          Файл не выбран
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="onCancel">Отмена</v-btn>
        <v-btn
          color="primary"
          :disabled="!canSave || saving"
          :loading="saving"
          @click="onConfirm"
        >
          Сохранить ({{ trimmedDuration.toFixed(1) }} с)
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import VideoTrimEditor from "../trim/VideoTrimEditor.vue";
import AudioTrimEditor from "../trim/AudioTrimEditor.vue";

const props = defineProps<{
  modelValue: boolean;
  file: File | null;
  kind: "video" | "audio";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "cancel"): void;
  (e: "trimmed", payload: { file: File; durationSec: number }): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const maxDuration = 10;

const startSec = ref(0);
const endSec = ref(0);
const trimmedDuration = computed(() =>
  endSec.value > startSec.value ? endSec.value - startSec.value : 0
);

const progress = computed(() =>
  Math.min(100, (trimmedDuration.value / maxDuration) * 100)
);
const progressColor = computed(() => {
  if (trimmedDuration.value === 0) return "grey";
  if (trimmedDuration.value <= maxDuration) return "primary";
  return "error";
});

const videoEditor = ref<InstanceType<typeof VideoTrimEditor> | null>(null);
const audioEditor = ref<InstanceType<typeof AudioTrimEditor> | null>(null);
const saving = ref(false);

const canSave = computed(
  () =>
    !!props.file &&
    trimmedDuration.value > 0 &&
    trimmedDuration.value <= maxDuration
);

watch(
  () => [props.modelValue, props.file, props.kind] as const,
  ([open]) => {
    if (!open) {
      startSec.value = 0;
      endSec.value = 0;
      saving.value = false;
    } else {
      // при новом открытии мы ждём update:selection от редактора
      // и не трогаем startSec/endSec вручную
    }
  }
);

function onSelectionChange(sel: { start: number; end: number }) {
  startSec.value = sel.start;
  endSec.value = sel.end;
}

function onCancel() {
  model.value = false;
  emit("cancel");
}

async function onConfirm() {
  if (!canSave.value) return;

  saving.value = true;
  try {
    const editor =
      props.kind === "video" ? videoEditor.value : audioEditor.value;
    if (!editor || typeof (editor as any).trim !== "function") {
      throw new Error("Триммер не готов");
    }

    const { file, durationSec } = await (editor as any).trim();

    emit("trimmed", { file, durationSec });
    model.value = false;
  } catch (e) {
    console.error(e);
    // здесь можно показать snackbar / alert
  } finally {
    saving.value = false;
  }
}
</script>
