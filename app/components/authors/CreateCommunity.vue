<template>
  <v-dialog v-model="model" max-width="600" persistent>
    <v-card class="dialog-card">
      <v-toolbar
        density="comfortable"
        title="Создание сообщества"
        class="dialog-toolbar"
      >
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" :disabled="loading" @click="close" />
      </v-toolbar>
      <v-divider />
      <v-card-text>
        <v-form ref="formRef" v-model="formValid" @submit.prevent="create">
          <v-text-field
            v-model="name"
            label="Название сообщества"
            maxlength="48"
            counter="48"
            :rules="nameRules"
            required
          />
          <v-text-field
            v-model="quote"
            label="Цитата"
            maxlength="80"
            class="mt-3"
          />
          <v-textarea
            v-model="description"
            label="Описание"
            rows="3"
            auto-grow
            maxlength="300"
            class="mt-3"
          />

          <!-- Аватар -->
          <div class="mt-4">
            <label class="text-subtitle-2 mb-2 d-block">Аватар</label>
            <div class="d-flex align-center ga-3">
              <v-avatar size="72">
                <v-img :src="avatarPreview || defaultAvatar" />
              </v-avatar>
              <div class="d-flex ga-2">
                <v-btn size="small" :disabled="loading" @click="pickAvatar">
                  Сменить
                </v-btn>
                <v-btn
                  v-if="avatarPreview"
                  size="small"
                  variant="text"
                  :disabled="loading"
                  @click="removeAvatar"
                >
                  Удалить
                </v-btn>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="d-none"
                @change="onFileChange"
              />
            </div>
          </div>

          <!-- Готовые темы/категории (заглушка) -->
          <v-select
            v-model="topicId"
            :items="topics"
            item-title="label"
            item-value="id"
            label="Тема"
            class="mt-4"
            clearable
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn color="primary" :loading="loading" :disabled="!formValid" @click="create">
          Создать сообщество
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthorsStore } from "~/stores/authors";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "created", payload: any): void;
  (e: "cancel"): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const authors = useAuthorsStore();
const name = ref("");
const quote = ref("");
const description = ref("");
const topicId = ref<string | null>(null);
const topics = [
  { id: "dev", label: "Разработка" },
  { id: "art", label: "Искусство" },
  { id: "games", label: "Игры" },
];

const fileInput = ref<HTMLInputElement | null>(null);
const avatarPreview = ref<string>("");
const defaultAvatar = "/avatars/default_community.png";

const loading = ref(false);
const formRef = ref();
const formValid = ref(false);
const nameRules = [
  (v: string) => !!v?.trim() || "Укажите название",
  (v: string) => v.trim().length >= 3 || "Минимум 3 символа",
];

function pickAvatar() {
  if (loading.value) return;
  fileInput.value?.click();
}
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = (ev) => (avatarPreview.value = ev.target?.result as string);
  r.readAsDataURL(file);
}
function removeAvatar() {
  avatarPreview.value = "";
}
function reset() {
  name.value = "";
  quote.value = "";
  description.value = "";
  topicId.value = null;
  avatarPreview.value = "";
}
function close() {
  if (loading.value) return;
  emit("cancel");
  model.value = false;
}
async function create() {
  const res = await formRef.value?.validate();
  if (!res?.valid) return;
  loading.value = true;
  try {
    const created = authors.addCommunity({
      name: name.value.trim(),
      quote: quote.value.trim() || undefined,
      description: description.value.trim() || undefined,
      avatar: avatarPreview.value || undefined,
      topicId: topicId.value ?? null,
      isPublic: true,
    });
    emit("created", created);
    reset();
    model.value = false;
  } finally {
    loading.value = false;
  }
}
</script>