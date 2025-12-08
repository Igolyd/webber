<template>
  <div>
    <div class="d-flex flex-wrap gap-3 mb-4">
      <v-card class="pa-3" width="420">
        <div class="text-subtitle-2 mb-2">Добавить свой пак в каталог</div>
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
          <v-btn size="small" variant="tonal" @click="pickAvatar"
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
          >
            Опубликовать
          </v-btn>
          <div class="text-caption text-medium-emphasis mt-2">
            Элементы можно добавить позже.
          </div>
        </div>
      </v-card>

      <v-card class="pa-3" width="420">
        <div class="text-subtitle-2 mb-2">Импорт в мой профиль</div>
        <v-text-field
          v-model="importName"
          label="Уникальное имя"
          density="comfortable"
          hide-details
        />
        <div class="mt-2">
          <v-btn
            color="primary"
            :disabled="!importName.trim()"
            @click="onImport"
          >
            Скопировать себе
          </v-btn>
        </div>
      </v-card>
    </div>

    <v-divider class="my-4" />

    <h3 class="text-subtitle-2 mb-2">Каталог эмодзи</h3>
    <div class="d-flex flex-wrap gap-2">
      <v-card
        v-for="p in externalPacks"
        :key="p.id"
        class="pa-2"
        width="260"
        @click="openPreview(p)"
      >
        <div class="d-flex align-center gap-2">
          <v-avatar size="28"><v-img :src="p.avatar" /></v-avatar>
          <div class="text-truncate">
            {{ p.title }}
            <span class="text-caption text-medium-emphasis">
              ({{ p.uniqueName }})
            </span>
          </div>
        </div>
        <div class="text-caption mt-1">Эмодзи: {{ p.itemsCount || 0 }}</div>
        <div class="mt-2 d-flex gap-1">
          <v-btn size="x-small" variant="tonal" @click.stop="openPreview(p)">
            Предпросмотр
          </v-btn>
          <v-btn
            size="x-small"
            variant="text"
            :disabled="userHasPack(p)"
            @click.stop="copyToMe(p)"
          >
            {{ userHasPack(p) ? "У вас уже есть" : "Скопировать" }}
          </v-btn>
        </div>
      </v-card>
    </div>

    <PackPreviewDialog
      v-model="previewOpen"
      :pack-id="previewId"
      kind="emoji"
      @copied="onCopied"
      @open-in-picker="onOpenInPicker"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import PackPreviewDialog from "@/components/market/PackPreviewDialog.vue";
import { useProfilesStore } from "~/stores/user/profiles";
import { useReactionsStore } from "@/stores/reactions";

const profiles = useProfilesStore();
const reactions = useReactionsStore();

const meId = computed(() => profiles.profileId || "");

// Защита от undefined state и пустых коллекций
const externalPacks = computed<any[]>(() => {
  const packsMap = reactions.state.value?.emojiPacks ?? {};
  const arr = Object.values(packsMap as Record<string, any>);
  return arr
    .filter((p: any) => p?.ownerType === "external")
    .sort((a: any, b: any) => (a?.title || "").localeCompare(b?.title || ""));
});

const create = ref<{ uniqueName: string; title: string; avatar?: string }>({
  uniqueName: "",
  title: "",
  avatar: undefined,
});

const avatarInput = ref<HTMLInputElement | null>(null);
const importName = ref("");

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
  try {
    reactions.createPack("emoji", "external", "", {
      uniqueName: create.value.uniqueName,
      title: create.value.title || create.value.uniqueName,
      avatar: create.value.avatar,
    });
    create.value = { uniqueName: "", title: "", avatar: undefined };
    alert("Пак добавлен в каталог. Элементы можно добавить позже.");
  } catch (e: any) {
    alert(e?.message || "Не удалось добавить в каталог");
  }
}

function onImport() {
  if (!meId.value) return;
  try {
    reactions.importToUser(meId.value, "emoji", importName.value);
    importName.value = "";
  } catch (e: any) {
    alert(e?.message || "Не удалось импортировать");
  }
}
function userHasPack(p: any) {
  return reactions.userHasPack(meId.value, "emoji", p?.uniqueName);
}
function copyToMe(p: any) {
  if (!meId.value) return;
  try {
    reactions.importToUser(meId.value, "emoji", p?.uniqueName);
  } catch (e: any) {
    alert(e?.message);
  }
}

// Предпросмотр
const previewOpen = ref(false);
const previewId = ref<string | undefined>(undefined);

function openPreview(p: any) {
  previewId.value = p?.id;
  previewOpen.value = true;
}
function onCopied() {
  previewOpen.value = false;
}
function onOpenInPicker(_p: any) {
  // Здесь можно пробросить в глобальный эмит/шину, чтобы открыть пикер в чате
  previewOpen.value = false;
}
</script>
