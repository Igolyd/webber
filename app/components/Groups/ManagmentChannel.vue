<template>
  <v-dialog
    v-model="model"
    max-width="520"
    persistent
    content-class="dlg-scope"
  >
    <v-card color="transparent" elevation="0" class="dlg-card">
      <v-card-title class="text-h6">
        {{ isEdit ? "Редактирование канала" : "Создание канала" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="isValid">
          <v-text-field
            v-model="form.name"
            label="Название канала"
            :rules="[(v) => !!v || 'Укажите название']"
            prepend-inner-icon="mdi-pound"
            hide-details="auto"
            autofocus
          />

          <v-select
            v-model="form.type"
            :items="typeItems"
            label="Тип канала"
            item-title="label"
            item-value="value"
            :rules="[(v) => !!v || 'Выберите тип']"
            prepend-inner-icon="mdi-shape"
            hide-details="auto"
            class="mt-4"
          />

          <v-select
            v-model="form.directoryId"
            :items="directoryItems"
            label="Категория"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-folder-outline"
            hide-details="auto"
            class="mt-4"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon size="18">{{
                    item.raw.value
                      ? "mdi-folder-outline"
                      : "mdi-folder-off-outline"
                  }}</v-icon>
                </template>
                <v-list-item-title>{{ item.raw.label }}</v-list-item-title>
              </v-list-item>
            </template>
          </v-select>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="onCancel">Отмена</v-btn>
        <v-btn color="primary" :disabled="!isValid" @click="onSubmit">
          {{ isEdit ? "Сохранить" : "Создать канал" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, reactive } from "vue";

type ChannelForm = {
  id?: string;
  name: string;
  type: "text" | "voice" | "";
  directoryId: string | null;
};

type DirectoryOption = { label: string; value: string | null };

const props = defineProps<{
  modelValue: boolean;
  groupId: string;
  directories: { id: string; name: string }[];
  // Если редактируем существующий — передаем объект
  channel?: {
    id: string;
    name: string;
    type: "text" | "voice";
    directoryId: string | null;
  };
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (
    e: "submit",
    payload: {
      id?: string;
      name: string;
      type: "text" | "voice";
      directoryId: string | null;
    }
  ): void;
  (e: "cancel"): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const isEdit = computed(() => !!props.channel?.id);
const formRef = ref();
const isValid = ref(false);

const form = reactive<ChannelForm>({
  id: undefined,
  name: "",
  type: "",
  directoryId: null,
});

const typeItems = [
  { label: "Текстовый", value: "text" },
  { label: "Голосовой", value: "voice" },
];

const directoryItems = computed<DirectoryOption[]>(() => [
  { label: "Без категории", value: null },
  ...props.directories.map((d) => ({ label: d.name, value: d.id })),
]);

watch(
  () => props.channel,
  (val) => {
    if (val) {
      form.id = val.id;
      form.name = val.name;
      form.type = val.type;
      form.directoryId = val.directoryId ?? null;
    } else {
      reset();
    }
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (opened) => {
    if (!opened) return;
    // Каждый раз при открытии валидность сбрасываем
    isValid.value = !!(form.name && form.type);
  }
);

function reset() {
  form.id = undefined;
  form.name = "";
  form.type = "";
  form.directoryId = null;
}

function onCancel() {
  emit("cancel");
  model.value = false;
}

async function onSubmit() {
  const valid = await formRef.value?.validate();
  if (!valid?.valid) return;
  emit("submit", {
    id: form.id,
    name: form.name.trim(),
    type: form.type as "text" | "voice",
    directoryId: form.directoryId,
  });
  model.value = false;
}
</script>
<style scoped>
:global(.dlg-scope) {
  --v-theme-surface: var(--dialog-surface);
  --v-theme-on-surface: var(--dialog-on-surface);
  --v-theme-outline: var(--dialog-border);
  --v-theme-surface-variant: var(--dialog-elev-1);
}
.dlg-card {
  background: var(--dialog-surface, var(--app-surface)) !important;
  color: var(--dialog-on-surface, var(--app-on-surface)) !important;
  border: 1px solid var(--dialog-border, var(--app-outline-variant));
  border-radius: 12px;
}
</style>