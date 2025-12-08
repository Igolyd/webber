<!-- components/GroupsSettings/GroupServerTag.vue -->
<template>
  <div class="pa-4 scope-main">
    <h2 class="text-h6 mb-2">Тэг группы</h2>
    <p class="text-medium-emphasis mb-4">
      Короткий тег группы (до 5 символов, A–Z и цифры). Отображается рядом с
      названием.
    </p>

    <v-textarea
      v-model="local"
      label="Тег"
      variant="outlined"
      density="comfortable"
      auto-grow
      rows="1"
      counter="5"
      maxlength="5"
      :messages="helper"
      @input="onInput"
    />

    <v-snackbar v-model="showBar" location="bottom" timeout="-1" multi-line>
      Изменения не сохранены
      <template #actions>
        <v-btn color="primary" variant="flat" @click="save">Сохранить</v-btn>
        <v-btn variant="text" @click="reset">Сброс</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useGroupsStore } from "~/stores/groups";

const groups = useGroupsStore();

const storeTag = computed(() => groups.groupTag || "");

const local = ref<string>(storeTag.value);

watch(storeTag, (v) => {
  local.value = v || "";
});

const showBar = computed(() => (local.value || "") !== (storeTag.value || ""));

const helper = computed(() =>
  local.value
    ? `${local.value.length}/5 : 'Введите до 5 символов (A–Z, 0–9)'`
    : ""
);

function sanitize(input: string) {
  return (input || "")
    .toUpperCase()
    .replace(/A-Z0-9/g, "")
    .slice(0, 5);
}

function onInput() {
  local.value = sanitize(local.value);
}

async function save() {
  groups.updateMainProfile({ groupTag: local.value });
  const res = await groups.saveAndReport();
  if (!res.ok) {
    reset();
  }
}

function reset() {
  local.value = storeTag.value || "";
}
</script>
<style scoped>
/* Маппинг секции main */
.scope-main {
  --v-theme-surface: var(--main-background);
  --v-theme-on-surface: var(--main-on-surface);
  --v-theme-outline: var(--main-border);
  --v-theme-surface-variant: var(--main-elev-1);
  color: var(--main-on-surface);
}
.main-card {
  background: var(--main-background) !important;
  color: var(--main-on-surface) !important;
  border: 1px solid var(--main-border) !important;
  box-shadow: none;
  border-radius: 12px;
}
</style>