<template>
  <div>
    <!-- формы создания/импорта без изменений -->
    <v-divider class="my-4" />

    <h3 class="text-subtitle-2 mb-2">Каталог стикеров</h3>
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
            <span class="text-caption text-medium-emphasis"
              >({{ p.uniqueName }})</span
            >
          </div>
        </div>
        <div class="text-caption mt-1">
          Стикеров: {{ p.itemsCount || 0 }}
        </div>
        <div class="mt-2 d-flex gap-1">
          <v-btn size="x-small" variant="tonal" @click.stop="openPreview(p)"
            >Предпросмотр</v-btn
          >
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
      kind="sticker"
      @copied="onCopied"
      @open-in-picker="onOpenInPicker"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import PackPreviewDialog from "@/components/market/PackPreviewDialog.vue";
import { useReactionsStore } from "@/stores/reactions";
import { useProfilesStore } from "~/stores/user/profiles";

const profiles = useProfilesStore();
const reactions = useReactionsStore();

const meId = computed(() => profiles.profileId || "");

// Безопасный доступ к packs
const externalPacks = computed<any[]>(() => {
  const packsMap = reactions.state.value?.stickerPacks ?? {};
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
    reactions.createPack("sticker", "external", "", {
      uniqueName: create.value.uniqueName,
      title: create.value.title || create.value.uniqueName,
      avatar: create.value.avatar,
    });
    create.value = { uniqueName: "", title: "", avatar: undefined };
    alert("Пак добавлен в каталог.");
  } catch (e: any) {
    alert(e?.message || "Не удалось добавить в каталог");
  }
}

function onImport() {
  if (!meId.value) return;
  try {
    reactions.importToUser(meId.value, "sticker", importName.value);
    importName.value = "";
  } catch (e: any) {
    alert(e?.message || "Не удалось импортировать");
  }
}
function userHasPack(p: any) {
  return reactions.userHasPack(meId.value, "sticker", p?.uniqueName);
}
function copyToMe(p: any) {
  if (!meId.value) return;
  try {
    reactions.importToUser(meId.value, "sticker", p?.uniqueName);
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
  previewOpen.value = false;
}
</script>
