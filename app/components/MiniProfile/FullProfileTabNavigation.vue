<template>
  <v-card class="profile-card" elevation="10">
    <v-card-title class="pa-0">
      <BannerAvatar
        :src="avatar || defaultAvatar"
        :fallback="defaultAvatar"
        :banner="banner || ''"
        :banner-color="bannerColor || defaultBanner"
        :overlay-color="bannerOverlayColor"
        :overlay-opacity="bannerOverlayOpacity"
        :size="avatarSize"
        :show-status="true"
        :status="status"
      />
    </v-card-title>

    <v-card-text class="pt-1 px-4">
      <div class="d-flex align-center flex-wrap ga-2">
        <div class="text-subtitle-1 font-weight-medium text-truncate">
          {{ displayName || "Без имени" }}
        </div>

        <v-tooltip text="Нажмите, чтобы скопировать ID" location="bottom">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              size="small"
              variant="plain"
              color="primary"
              class="cursor-pointer text-no-wrap"
              @click="copyUserId()"
            >
              <v-icon start size="16">mdi-pound</v-icon>
              <span class="id-clip">{{ userId || "—" }}</span>
              <v-icon end size="16" class="ml-1">mdi-content-copy</v-icon>
            </v-chip>
          </template>
        </v-tooltip>
      </div>

      <div class="mt-2 text-center text-body-2 text-medium-emphasis quote">
        {{ quote || "Без цитаты" }}
      </div>

      <div class="mt-2 d-flex justify-center">
        <v-chip size="small" variant="outlined" prepend-icon="mdi-music">
          {{ groupTag || "Без группы" }}
        </v-chip>
      </div>

      <div class="mt-4">
        <div class="text-overline text-medium-emphasis">Обо мне</div>
        <div class="about pre-wrap">
          {{ about || "Описание профиля" }}
        </div>
      </div>
    </v-card-text>

    <v-card-actions class="px-4 pt-2">
      <div class="w-100 d-flex ga-2 flex-wrap">
        <div class="activator-wrap">
          <v-btn
            class="flex-1-1 btn-primary-tonal"
            variant="outlined"
            :prepend-icon="statusIcon"
            :density="btnDensity"
            @click.stop="openStatusMenu = true"
          >
            Статус: {{ statusLabel }}
          </v-btn>
          <v-menu
            v-model="openStatusMenu"
            activator="parent"
            location="bottom"
            :close-on-content-click="true"
          >
            <v-list density="compact" style="min-width: 220px">
              <v-list-subheader>Статус в сети</v-list-subheader>
              <v-list-item
                v-for="s in statuses"
                :key="s.value"
                @click="setStatus(s.value)"
              >
                <template #prepend>
                  <v-icon :color="s.color" class="mr-1">{{ s.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ s.label }}</v-list-item-title>
                <template #append>
                  <v-icon v-if="status === s.value" color="primary"
                    >mdi-check</v-icon
                  >
                </template>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <v-btn
          class="flex-1-1"
          variant="outlined"
          :density="btnDensity"
          prepend-icon="mdi-pencil-outline"
          @click="onEditProfile"
        >
          Редактировать профиль
        </v-btn>
      </div>
    </v-card-actions>

    <v-card-actions class="px-4 pb-4">
      <div class="w-100 d-flex ga-2 flex-wrap">
        <v-btn
          class="flex-1-1"
          variant="elevated"
          :density="btnDensity"
          prepend-icon="mdi-account-switch"
          @click="onSwitchAccounts"
        >
          Переключение аккаунта
        </v-btn>

        <v-btn
          class="flex-1-1 btn-primary-elevated"
          variant="elevated"
          :density="btnDensity"
          prepend-icon="mdi-content-copy"
          @click="copyUserId()"
        >
          Скопировать имя
        </v-btn>
      </div>
    </v-card-actions>

    <v-snackbar v-model="copiedSnack" timeout="1600" variant="tonal">
      Имя скопировано
    </v-snackbar>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useDisplay } from "vuetify";
import { storeToRefs } from "pinia";
import { useProfilesStore } from "~/stores/user/profiles";
import { useUserAccountStore } from "~/stores/user/account";
import BannerAvatar from "./BannerAvatar.vue";
import dfAvatal from "@/assets/profile/profile_exp.jpg";

type StatusVal = "online" | "idle" | "dnd" | "invisible";

export default defineComponent({
  name: "FullProfileTabNavigation",
  components: { BannerAvatar },
  setup() {
    const display = useDisplay();
    const btnDensity = computed(() =>
      display.xs.value ? "compact" : "comfortable"
    );
    const avatarSize = computed(() => (display.xs.value ? 92 : 104));

    const profiles = useProfilesStore();
    const account = useUserAccountStore();

    const {
      name,
      avatar,
      banner,
      bannerColor,
      bannerOverlayColor,
      bannerOverlayOpacity,
      about,
      quote,
      groupTag,
      status,
    } = storeToRefs(profiles);
    const { userId } = storeToRefs(account);

    const displayName = name;
    const defaultAvatar = dfAvatal;
    const defaultBanner = "linear-gradient(180deg, #8ec5e5, #4f9cf9)";

    const statuses = [
      {
        value: "online",
        label: "В сети",
        icon: "mdi-circle",
        color: "#3fb950",
      },
      {
        value: "idle",
        label: "Неактивен",
        icon: "mdi-circle",
        color: "#f2c94c",
      },
      {
        value: "dnd",
        label: "Не беспокоить",
        icon: "mdi-minus-circle",
        color: "#f44336",
      },
      {
        value: "invisible",
        label: "Невидимка",
        icon: "mdi-circle-outline",
        color: "#9aa0a6",
      },
    ] as const;
    const statusMeta = computed(
      () => statuses.find((s) => s.value === (status.value as StatusVal))!
    );
    const statusLabel = computed(() => statusMeta.value.label);
    const statusIcon = computed(() => statusMeta.value.icon);
    const openStatusMenu = ref(false);
    function setStatus(v: StatusVal) {
      profiles.updateStatus(v);
      openStatusMenu.value = false;
    }

    const copiedSnack = ref(false);
    async function copyUserId() {
      const text = userId.value || "";
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      copiedSnack.value = true;
    }

    function onEditProfile() {
      /* роутинг сделаешь сам */
    }
    function onSwitchAccounts() {
      /* no-op */
    }

    return {
      avatar,
      banner,
      bannerColor,
      bannerOverlayColor,
      bannerOverlayOpacity,
      about,
      quote,
      groupTag,
      status,
      userId,
      displayName,
      btnDensity,
      avatarSize,
      defaultAvatar,
      defaultBanner,
      statuses,
      statusLabel,
      statusIcon,
      openStatusMenu,
      setStatus,
      copiedSnack,
      copyUserId,
      onEditProfile,
      onSwitchAccounts,
    };
  },
});
</script>

<style scoped>
.profile-card {
  border-radius: 14px;
  width: clamp(280px, 92vw, 320px);
  min-height: 540px;
  max-height: 680px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.quote {
  font-style: italic;
}
.pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 380px) {
  .profile-card {
    width: 96vw;
  }
}

.id-clip {
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cursor-pointer {
  cursor: pointer;
}
.flex-1-1 {
  flex: 1 1 0;
}
</style>
