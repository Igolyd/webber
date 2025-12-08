<template>
  <v-dialog v-model="model" max-width="560">
    <v-card>
      <v-card-title>Опубликовать новость</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="title"
          label="Заголовок"
          variant="outlined"
          density="comfortable"
        />
        <v-textarea
          v-model="text"
          label="Текст новости"
          variant="outlined"
          auto-grow
          rows="3"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancel">Отмена</v-btn>
        <v-btn color="primary" @click="submit" :disabled="!title.trim()">
          Опубликовать
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useNewsStore, type OwnerType } from "@/stores/news";
import { useUserAccountStore } from "@/stores/user/account";

const props = defineProps<{
  modelValue: boolean;
  ownerType: OwnerType; // 'group' | 'author'
  ownerId: string;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "created", id: string): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const title = ref("");
const text = ref("");

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      title.value = "";
      text.value = "";
    }
  }
);

const newsStore = useNewsStore();
const account = useUserAccountStore();

function cancel() {
  model.value = false;
}

function submit() {
  if (!props.ownerId || !props.ownerType) return;
  const meId = account.userId || "anon";
  const n = newsStore.create({
    ownerType: props.ownerType,
    ownerId: props.ownerId,
    title: title.value.trim(),
    text: text.value.trim(),
    authorId: meId,
  });
  emit("created", n.id);
  model.value = false;
}
</script>