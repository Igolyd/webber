<template>
  <v-snackbar
    v-model="model"
    location="bottom center"
    contained
    elevation="8"
    class="settings-actions-snackbar"
  >
    <div class="d-flex align-center ga-3" style="min-width: 320px">
      <v-icon color="primary">mdi-content-save-edit</v-icon>
      <div class="text-body-2">Есть несохранённые изменения</div>
      <v-spacer />
      <v-btn size="small" variant="text" @click="$emit('reset')"
        >Сбросить</v-btn
      >
      <v-btn
        size="small"
        color="primary"
        :loading="saving"
        @click="$emit('save')"
        >Сохранить</v-btn
      >
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ modelValue: boolean; saving?: boolean }>();
const emit = defineEmits(["update:modelValue", "save", "reset"]);
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
</script>

<style scoped>
.settings-actions-snackbar :deep(.v-snackbar__content) {
  padding: 8px 12px;
  background: var(--app-surface-3);
  color: var(--app-on-surface);
  border: 1px solid var(--app-outline-variant);
  border-radius: 12px;
}
</style>
