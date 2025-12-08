<template>
  <v-dialog v-model="model" max-width="640">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-avatar size="36" class="mr-2"
          ><v-img :src="pack?.avatar"
        /></v-avatar>
        <div class="text-truncate">
          {{ pack?.title }}
          <div class="text-caption text-medium-emphasis">
            {{ pack?.uniqueName }}
          </div>
        </div>
        <v-spacer />
        <v-chip size="x-small" class="ml-2" v-if="pack">
          {{ pack.kind === "emoji" ? "Эмодзи" : "Стикеры" }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <div v-if="pack" class="grid">
          <div v-for="it in items" :key="it.id" class="cell">
            <template v-if="pack.kind === 'emoji'">
              <span v-if="it.type === 'unicode'" class="big-emoji">{{
                it.emoji
              }}</span>
              <img v-else :src="it.dataUrl" />
            </template>
            <template v-else>
              <img :src="it.dataUrl" />
            </template>
          </div>
        </div>
        <div v-else class="text-medium-emphasis">Пак не найден</div>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="text" @click="model = false">Закрыть</v-btn>
        <v-spacer />
        <v-btn v-if="pack && !alreadyHave" color="primary" @click="copyToMe"
          >Скопировать себе</v-btn
        >
        <v-btn v-else-if="pack" variant="tonal" disabled>У вас уже есть</v-btn>
        <v-btn
          v-if="pack"
          variant="tonal"
          @click="$emit('open-in-picker', pack)"
          >Открыть в пикере</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useProfilesStore } from "@/stores/user/profiles";
import {
  useReactionsStore,
  type EmojiItem,
  type StickerItem,
} from "@/stores/reactions";

const props = defineProps<{
  modelValue: boolean;
  packId?: string;
  kind?: "emoji" | "sticker";
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "open-in-picker", pack: any): void;
  (e: "copied"): void;
}>();

const profiles = useProfilesStore();
const reactions = useReactionsStore();
const meId = computed(() => profiles.profileId || "");

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const pack = computed(() => {
  if (!props.packId || !props.kind) return null;
  return reactions.getPackById(props.kind, props.packId);
});

const items = ref<(EmojiItem | StickerItem)[]>([]);
async function loadItems() {
  items.value = [];
  if (props.packId && props.kind) {
    items.value = await reactions.getPackItems(props.kind, props.packId);
  }
}
watch(
  () => [props.packId, props.kind, model.value],
  () => {
    if (model.value) loadItems();
  },
  { immediate: true }
);

const alreadyHave = computed(() => {
  const p = pack.value;
  if (!p || !meId.value) return false;
  return reactions.userHasPack(meId.value, p.kind, p.uniqueName);
});

function copyToMe() {
  const p = pack.value;
  if (!p || !meId.value) return;
  try {
    reactions.importToUser(meId.value, p.kind, p.uniqueName);
    emit("copied");
  } catch (e: any) {
    alert(e?.message || "Не удалось скопировать");
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-hover-color);
  border: 1px solid var(--app-border-color);
}
.cell img {
  max-width: 58px;
  max-height: 58px;
  border-radius: 6px;
}
.big-emoji {
  font-size: 32px;
}
</style>
