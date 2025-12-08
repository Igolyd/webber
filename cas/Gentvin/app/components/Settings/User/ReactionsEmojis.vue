<template>
  <div class="pa-4 scope-main">
    <h2 class="text-h6 mb-2">Мои эмодзи</h2>
    <div class="text-medium-emphasis mb-3">
      Создавайте личные наборы эмодзи и импортируйте сторонние по уникальному
      имени.
    </div>
    <v-alert type="info" variant="flat" class="mb-3">
      Лимит собственных наборов: {{ limits.USER_OWN_EMOJI_PACKS_LIMIT }}. В
      одном паке не более {{ limits.EMOJI_LIMIT_PER_PACK }} эмодзи.
    </v-alert>

    <div class="text-caption text-medium-emphasis mb-2">
      meId: {{ meId }} | ownIds:
      {{ (reactions.state?.userOwnEmoji?.[meId] || []).length }}
    </div>

    <div class="d-flex flex-wrap gap-3">
      <v-card class="pa-3 main-card" width="420">
        <div class="text-subtitle-2 mb-2">Создать мой пак</div>
        <v-text-field
          v-model="create.uniqueName"
          label="Уникальное имя"
          density="comfortable"
          hide-details
        />
        <v-text-field
          v-model="create.title"
          label="Заголовок"
          density="comfortable"
          hide-details
          class="mt-2"
        />
        <div class="d-flex align-center gap-2 mt-2">
          <v-btn size="small" variant="outlined" @click="pickAvatar"
            >Аватарка</v-btn
          >
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            :style="hiddenFileInputStyle"
            @change="onAvatarPicked"
          />
          <v-avatar v-if="create.avatar" size="28"
            ><v-img :src="create.avatar"
          /></v-avatar>
        </div>
        <div class="mt-3">
          <v-btn
            color="primary"
            :disabled="!create.uniqueName.trim()"
            @click="onCreate"
            >Создать</v-btn
          >
        </div>
      </v-card>

      <v-card class="pa-3 main-card" width="420">
        <div class="text-subtitle-2 mb-2">Импорт по уникальному имени</div>
        <v-text-field
          v-model="importName"
          label="Уникальное имя"
          density="comfortable"
          hide-details
        />
        <div class="mt-2 d-flex gap-2">
          <v-btn
            color="primary"
            :disabled="!importName.trim()"
            @click="onImport"
            >Импортировать</v-btn
          >
        </div>
        <div class="text-caption text-medium-emphasis mt-2">
          Импорт не ограничен. Вы можете отключать импорт в любое время.
        </div>
      </v-card>
    </div>
  </div>

  <v-divider class="my-4" />

  <h3 class="text-subtitle-2 mb-2">Мои пакеты</h3>
  <div class="d-flex flex-wrap gap-2">
    <v-card
      v-for="p in ownPacks"
      :key="p.id"
      class="pa-2 main-card"
      width="260"
    >
      <div class="d-flex align-center gap-2">
        <v-avatar size="28"><v-img :src="p.avatar" /></v-avatar>
        <div class="text-truncate">
          {{ p.title }}
          <span class="text-caption text-medium-emphasis"
            >({{ p.uniqueName }})</span
          >
        </div>
      </div>
      <div class="text-caption mt-1">Эмодзи: {{ p.itemsCount || 0 }}</div>
      <div class="mt-2 d-flex gap-1">
        <v-btn size="x-small" variant="tonal" @click="openEditor('emoji', p.id)"
          >Заполнить</v-btn
        >
        <v-btn
          size="x-small"
          variant="text"
          color="error"
          @click="removePack(p.id)"
          >Удалить</v-btn
        >
      </div>
    </v-card>
    <div v-if="!ownPacks.length" class="text-medium-emphasis">
      Нет собственных паков
    </div>
  </div>

  <PacksPackEditorDialog
    v-if="editor.open && editor.kind && editor.packId"
    v-model="editor.open"
    :kind="editor.kind!"
    :pack-id="editor.packId!"
    @changed="onEditorChanged"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, type CSSProperties } from "vue";
import { useProfilesStore } from "~/stores/user/profiles";
import { useReactionsStore, type EmojiPack } from "@/stores/reactions";
import PacksPackEditorDialog from "~/components/market/PacksPackEditorDialog.vue";

const profiles = useProfilesStore();
const reactions = useReactionsStore();

const meId = computed(() => profiles.profileId || "");

watch(meId, (v) => console.debug("[EmojiScreen] meId changed", v), {
  immediate: true,
});

const ownPacks = computed(() => {
  const uid = meId.value;
  const ids = uid ? reactions.state.userOwnEmoji?.[uid] ?? [] : [];
  const res = ids
    .map((id: string) => reactions.getPackById("emoji", id))
    .filter((p): p is EmojiPack => Boolean(p));
  console.debug("[EmojiScreen] ownPacks computed", {
    uid,
    idsCount: ids.length,
    resCount: res.length,
  });
  return res;
});

// если список импортированных не используется в шаблоне — или удалите, или префиксуйте:
const _importedEmoji = computed<string[]>(
  () => reactions.state.userImportedEmoji?.[meId.value] ?? []
);

const create = ref<{ uniqueName: string; title: string; avatar?: string }>({
  uniqueName: "",
  title: "",
  avatar: undefined,
});
const avatarInput = ref<HTMLInputElement | null>(null);
const importName = ref("");

const hiddenFileInputStyle: CSSProperties = {
  position: "absolute",
  left: "-10000px",
  width: "1px",
  height: "1px",
  opacity: "0",
};

const limits = {
  EMOJI_LIMIT_PER_PACK: reactions.EMOJI_LIMIT_PER_PACK,
  USER_OWN_EMOJI_PACKS_LIMIT: reactions.USER_OWN_EMOJI_PACKS_LIMIT,
};

const editor = ref<{
  open: boolean;
  kind?: "emoji" | "sticker";
  packId?: string;
}>({ open: false });

function openEditor(kind: "emoji" | "sticker", packId: string) {
  console.debug("[EmojiScreen] openEditor", { kind, packId });
  editor.value = { open: true, kind, packId };
}

function pickAvatar() {
  console.debug("[EmojiScreen] pickAvatar");
  avatarInput.value?.click();
}
function onAvatarPicked(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => (create.value.avatar = String(r.result));
  r.readAsDataURL(f);
  (e.target as HTMLInputElement).value = "";
  console.debug("[EmojiScreen] onAvatarPicked");
}

function onCreate() {
  if (!meId.value) {
    console.warn("[EmojiScreen] onCreate: no meId");
    return;
  }
  try {
    console.debug("[EmojiScreen] onCreate start", {
      meId: meId.value,
      data: create.value,
    });
    const packId = reactions.createPack("emoji", "user", meId.value, {
      uniqueName: create.value.uniqueName,
      title: create.value.title || create.value.uniqueName,
      avatar: create.value.avatar,
    });
    console.debug("[EmojiScreen] onCreate created", { packId });
    openEditor("emoji", packId);
    create.value = { uniqueName: "", title: "", avatar: undefined };
  } catch (e: unknown) {
    console.error("[EmojiScreen] onCreate error", e);
    const msg = e instanceof Error ? e.message : "Не удалось создать пак";
    alert(msg);
  }
}
function removePack(id: string) {
  console.debug("[EmojiScreen] removePack", { id });
  reactions.deletePack("emoji", id);
}
function onImport() {
  if (!meId.value) return;
  try {
    console.debug("[EmojiScreen] onImport", { name: importName.value });
    reactions.importToUser(meId.value, "emoji", importName.value);
    importName.value = "";
  } catch (e: unknown) {
    console.error("[EmojiScreen] onImport error", e);
    const msg = e instanceof Error ? e.message : "Не удалось импортировать";
    alert(msg);
  }
}
function onEditorChanged() {
  console.debug("[EmojiScreen] onEditorChanged");
}
onMounted(() => {
  console.debug("[EmojiScreen] mounted", {
    meId: meId.value,
    ownIds: reactions.state.userOwnEmoji?.[meId.value] ?? [],
  });
});
</script>
<style lang="css" scoped>
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