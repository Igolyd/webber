<template>
  <v-dialog v-model="model" max-width="560">
    <v-card>
      <v-card-title>Создать событие</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="title"
          label="Название события"
          variant="outlined"
          density="comfortable"
        />
        <v-textarea
          v-model="description"
          label="Описание события"
          variant="outlined"
          auto-grow
          rows="3"
        />

        <v-text-field
          v-model="startsAt"
          label="Начало"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
        />
        <v-text-field
          v-model="endsAt"
          label="Конец"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancel">Отмена</v-btn>
        <v-btn
          color="primary"
          @click="submit"
          :disabled="!title.trim() || !startsAt || !endsAt"
        >
          Создать
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useEventsStore, type OwnerType } from "@/stores/events";
import { useUserAccountStore } from "@/stores/user/account";

const props = defineProps<{
  modelValue: boolean;
  ownerType: OwnerType;
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
const description = ref(""); // ← исправлено
const startsAt = ref("");
const endsAt = ref("");

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      title.value = "";
      description.value = "";
      startsAt.value = "";
      endsAt.value = "";
    }
  }
);

const eventsStore = useEventsStore();
const account = useUserAccountStore();

function cancel() {
  model.value = false;
}

function submit() {
  if (!props.ownerId || !props.ownerType) return;
  const meId = account.userId || "anon";
  const ev = eventsStore.create({
    ownerType: props.ownerType,
    ownerId: props.ownerId,
    title: title.value.trim(),
    description: description.value.trim(),
    startsAt: new Date(startsAt.value).toISOString(),
    endsAt: new Date(endsAt.value).toISOString(),
    authorId: meId,
  });
  emit("created", ev.id);
  model.value = false;
}
</script>
<style scoped></style>
