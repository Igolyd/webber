<template>
   <div class="pa-4 scope-main">
    <h2 class="text-h6 mb-2">Эмодзи</h2>
    <div class="text-medium-emphasis mb-3">
      Собственные эмодзи-паки группы + подключение сторонних по уникальному
      имени.
    </div>
    <v-alert type="info" variant="flat" class="mb-3">
      В паке не более {{ limits.EMOJI_LIMIT_PER_PACK }} эмодзи. Пользовательские
      лимиты не действуют на группу.
    </v-alert>

    <div class="d-flex flex-wrap gap-3">
      <v-card class="pa-3 main-card" width="420">
        <div class="text-subtitle-2 mb-2">Создать пак</div>
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
          <v-btn size="small" variant="flat" @click="pickAvatar"
            >Аватарка</v-btn
          >
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="d-none"
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
        <div class="text-subtitle-2 mb-2">Подключить пак по имени</div>
        <v-text-field
          v-model="importName"
          label="Уникальное имя"
          density="comfortable"
          hide-details
        />
        <div class="mt-2">
          <v-btn color="primary" :disabled="!importName.trim()" @click="onLink"
            >Подключить</v-btn
          >
        </div>
        <v-switch
          class="mt-3"
          v-model="allowOnlyLinked"
          label="Разрешать только подключённые пакеты"
        />
      </v-card>
    </div>

    <v-divider class="my-4" />

    <h3 class="text-subtitle-2 mb-2">Паки группы</h3>
    <div class="d-flex flex-wrap gap-2">
      <v-card
        v-for="p in ownPacks"
        :key="p.id"
        class="pa-2 main-card"
        width="240"
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
          <v-btn size="x-small" variant="flat" @click="addItems(p.id)"
            >Добавить эмодзи</v-btn
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
      <input
        ref="itemsInput"
        type="file"
        accept="image/*"
        multiple
        class="d-none"
        @change="onItemsPicked"
      />
    </div>

    <h3 class="text-subtitle-2 mt-4 mb-2">Подключённые паки</h3>
    <div class="d-flex flex-wrap gap-1">
      <v-chip
        v-for="uname in linkedEmoji"
        :key="uname"
        class="ma-1"
        size="small"
        closable
        @click:close="onUnlink(uname)"
      >
        {{ uname }}
      </v-chip>
      <div v-if="!linkedEmoji.length" class="text-medium-emphasis">Нет</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { useGroupsStore } from "@/stores/groups";
import { useReactionsStore } from "@/stores/reactions";

const groups = useGroupsStore();
const reactions = useReactionsStore();

const gid = computed(() => groups.activeGroupId || "");

// prefs может быть null до инициализации
const prefs = computed(() =>
  gid.value ? reactions.getGroupPrefs(gid.value) : null
);

const ownPacks = computed(() => {
  const g = gid.value;
  if (!g) return [];
  const ids = reactions.state.value?.groupOwnEmoji?.[g] ?? [];
  return ids
    .map((id: string) => reactions.getPackById("emoji", id))
    .filter(Boolean) as any[];
});

const linkedEmoji = computed<string[]>(() => prefs.value?.linkedEmoji ?? []);

const allowOnlyLinked = computed({
  get: () => !!prefs.value?.allowOnlyLinkedEmoji,
  set: (v: boolean) => {
    if (gid.value) reactions.setGroupAllowOnlyLinked(gid.value, "emoji", v);
  },
});

const create = ref({
  uniqueName: "",
  title: "",
  avatar: "" as string | undefined,
});

const avatarInput = ref<HTMLInputElement | null>(null);

const itemsInput = ref<HTMLInputElement | null>(null);

const itemsTargetPack = ref<string | null>(null);

const importName = ref("");

const limits = {
  EMOJI_LIMIT_PER_PACK: reactions.EMOJI_LIMIT_PER_PACK,
};

function pickAvatar() {
  avatarInput.value?.click();
}
function onAvatarPicked(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => (create.value.avatar = String(r.result));
  r.readAsDataURL(f);
  (e.target as HTMLInputElement).value = "";
}
function onCreate() {
  if (!gid.value) return;
  try {
    const id = reactions.createPack("emoji", "group", gid.value, {
      uniqueName: create.value.uniqueName,
      title: create.value.title || create.value.uniqueName,
      avatar: create.value.avatar,
    });
    create.value = { uniqueName: "", title: "", avatar: undefined };
  } catch (e: any) {
    alert(e?.message || "Не удалось создать пак");
  }
}
function addItems(packId: string) {
  itemsTargetPack.value = packId;
  itemsInput.value?.click();
}
function onItemsPicked(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || []);
  (e.target as HTMLInputElement).value = "";
  const packId = itemsTargetPack.value;
  itemsTargetPack.value = null;
  if (!packId || !files.length) return;
  Promise.all(
    files.map((f) =>
      fileToDataUrl(f).then(
        (dataUrl) =>
          ({
            id: crypto.randomUUID(),
            type: "image",
            dataUrl,
            mime: f.type || "image/png",
          } as const)
      )
    )
  )
    .then((items) => reactions.addEmojiItems(packId, items as any))
    .catch((e) => {
      alert(e?.message || "Ошибка добавления");
    });
}
function fileToDataUrl(f: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read error"));
    r.readAsDataURL(f);
  });
}
function removePack(id: string) {
  reactions.deletePack("emoji", id);
}
function onLink() {
  if (!gid.value) return;
  try {
    reactions.linkPackToGroup(gid.value, "emoji", importName.value);
    importName.value = "";
  } catch (e: any) {
    alert(e?.message || "Не удалось подключить");
  }
}
function onUnlink(uname: string) {
  if (!gid.value) return;
  reactions.unlinkPackFromGroup(gid.value, "emoji", uname);
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