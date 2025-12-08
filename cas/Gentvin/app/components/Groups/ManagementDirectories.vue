<template>
  <v-dialog
    v-model="model"
    max-width="480"
    persistent
    content-class="dlg-scope"
  >
    <v-card color="transparent" elevation="0" class="dlg-card">
      <v-card-title class="text-h6">
        {{ isEdit ? "Редактирование категории" : "Создание категории" }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" v-model="isValid">
          <v-text-field
            v-model="nameLocal"
            label="Название категории"
            :rules="[(v) => !!v || 'Укажите название']"
            prepend-inner-icon="mdi-folder-outline"
            hide-details="auto"
            autofocus
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="onCancel">Отмена</v-btn>
        <v-btn color="primary" :disabled="!isValid" @click="onSubmit">
          {{ isEdit ? "Сохранить" : "Создать" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
  modelValue: boolean;
  directory?: { id: string; name: string };
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "submit", payload: { id?: string; name: string }): void;
  (e: "cancel"): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const isEdit = computed(() => !!props.directory?.id);
const formRef = ref();
const isValid = ref(false);
const nameLocal = ref("");

watch(
  () => props.directory,
  (val) => {
    nameLocal.value = val?.name ?? "";
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (opened) => {
    if (!opened) return;
    isValid.value = !!nameLocal.value;
  }
);

function onCancel() {
  emit("cancel");
  model.value = false;
}

async function onSubmit() {
  const valid = await formRef.value?.validate();
  if (!valid?.valid) return;
  emit("submit", {
    id: props.directory?.id,
    name: nameLocal.value.trim(),
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