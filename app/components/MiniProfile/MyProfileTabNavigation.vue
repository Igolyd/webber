<template>
  <div class="my-profile-wrapper">
    <v-hover v-slot="{ isHovering, props: hoverProps }">
      <v-card
        v-bind="hoverProps"
        elevation="8"
        color="transparent"
        class="my-profile-container w-100"
        :style="profileBadgeStyle(isHovering)"
      >
        <v-card-item class="py-2 px-3">
          <div class="d-flex align-center justify-space-between ga-2">
            <!-- Меню полного профиля -->
            <v-menu
              v-model="showFullProfile"
              location="top"
              origin="bottom"
              :close-on-content-click="false"
              :scrim="false"
              transition="scale-transition"
              content-class="my-profile-menu"
            >
              <template #activator="{ props }">
                <div
                  class="profile-activator d-flex align-center ga-3 flex-1-1 cursor-pointer"
                  v-bind="props"
                  role="button"
                  tabindex="0"
                  @keydown.enter.prevent="showFullProfile = true"
                  @keydown.space.prevent="showFullProfile = true"
                >
                  <div class="avatar-cell">
                    <!-- Оставляем компактный аватар, BannerAvatar в мини-виде тяжёлый.
                         Баннер полноценно показываем в карточках (напр., GroupMemberProfileCard) -->
                    <v-avatar :size="avatarSize" :rounded="99999">
                      <v-img
                        :src="profiles.avatar || defaultAvatar"
                        cover
                        eager
                      />
                    </v-avatar>
                    <span
                      class="mini-status-dot"
                      :class="`st-${profiles.status || 'online'}`"
                    ></span>
                  </div>

                  <div class="text-truncate" style="min-width: 0">
                    <div
                      class="text-subtitle-2 font-weight-medium text-truncate"
                    >
                      {{ profiles.name || "Без имени" }}
                    </div>
                    <div
                      class="text-caption text-medium-emphasis text-truncate"
                    >
                      {{ profiles.quote || "Без цитаты" }}
                    </div>
                  </div>
                </div>
              </template>

              <div class="menu-surface">
                <FullProfileTabNavigation />
              </div>
            </v-menu>
            <div class="d-flex align-center ga-1">
              <!-- Микрофон -->
              <div class="activator-wrap">
                <v-btn
                  :class="
                    settings.microphoneEnabled
                      ? 'btn-primary-tonal'
                      : 'btn-surface-variant'
                  "
                  variant="text"
                  :icon="
                    settings.microphoneEnabled
                      ? 'mdi-microphone'
                      : 'mdi-microphone-off'
                  "
                  :density="btnDensity"
                  @click.stop="onToggleMic"
                  @contextmenu.prevent.stop="openMicMenu = true"
                />
                <v-menu
                  v-model="openMicMenu"
                  activator="parent"
                  location="bottom"
                >
                  <v-list density="compact" style="min-width: 260px">
                    <v-list-subheader>Микрофон</v-list-subheader>
                    <v-list-item
                      v-for="d in inputDevices"
                      :key="d.deviceId"
                      @click="setMic(d.deviceId)"
                    >
                      <v-list-item-title>{{
                        d.label || "Микрофон"
                      }}</v-list-item-title>
                      <template #append>
                        <v-icon
                          v-if="call.selectedMicId === d.deviceId"
                          color="primary"
                          >mdi-check</v-icon
                        >
                      </template>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <!-- Динамики -->
              <div class="activator-wrap">
                <v-btn
                  :class="
                    settings.audioEnabled
                      ? 'btn-primary-tonal'
                      : 'btn-surface-variant'
                  "
                  variant="text"
                  :icon="
                    settings.audioEnabled ? 'mdi-volume-high' : 'mdi-volume-off'
                  "
                  :density="btnDensity"
                  @click.stop="onToggleAudio"
                  @contextmenu.prevent.stop="openSpkMenu = true"
                />
                <v-menu
                  v-model="openSpkMenu"
                  activator="parent"
                  location="bottom"
                >
                  <v-list density="compact" style="min-width: 260px">
                    <v-list-subheader>Динамики</v-list-subheader>
                    <v-list-item
                      v-for="d in outputDevices"
                      :key="d.deviceId"
                      @click="setOutput(d.deviceId)"
                    >
                      <v-list-item-title>{{
                        d.label || "Динамики"
                      }}</v-list-item-title>
                      <template #append>
                        <v-icon
                          v-if="call.selectedOutputId === d.deviceId"
                          color="primary"
                          >mdi-check</v-icon
                        >
                      </template>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <!-- Настройки -->
              <NuxtLink to="/SettingsProfileUser">
                <v-btn
                  icon="mdi-cog-outline"
                  :density="btnDensity"
                  variant="text"
                />
              </NuxtLink>
            </div>
          </div>
        </v-card-item>

        <v-expand-transition>
          <div v-show="call.callEnabled">
            <v-divider />
            <v-card-text class="py-2">
              <div class="d-flex align-center ga-2 flex-wrap">
                <v-btn
                  variant="text"
                  color="error"
                  prepend-icon="mdi-phone-hangup"
                  :density="btnDensity"
                  @click="leave"
                >
                  Отключиться
                </v-btn>

                <!-- Камера -->
                <div class="activator-wrap">
                  <v-btn
                    :class="
                      settings.videoEnabled
                        ? 'btn-primary-tonal'
                        : 'btn-surface-variant'
                    "
                    variant="text"
                    :prepend-icon="
                      settings.videoEnabled ? 'mdi-video' : 'mdi-video-off'
                    "
                    :density="btnDensity"
                    @click="onToggleCamera"
                    @contextmenu.prevent.stop="openCamMenu = true"
                  >
                    Видео
                  </v-btn>
                  <v-menu
                    v-model="openCamMenu"
                    activator="parent"
                    location="bottom"
                  >
                    <v-list density="compact" style="min-width: 260px">
                      <v-list-subheader>Камера</v-list-subheader>
                      <v-list-item
                        v-for="d in videoDevices"
                        :key="d.deviceId"
                        @click="setCam(d.deviceId)"
                      >
                        <v-list-item-title>{{
                          d.label || "Камера"
                        }}</v-list-item-title>
                        <template #append>
                          <v-icon
                            v-if="call.selectedCamId === d.deviceId"
                            color="primary"
                            >mdi-check</v-icon
                          >
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>

                <!-- Трансляция -->
                <div class="activator-wrap">
                  <v-btn
                    variant="text"
                    :color="
                      call.localVideoKind === 'screenshare'
                        ? 'primary'
                        : 'surface-variant'
                    "
                    :prepend-icon="
                      call.localVideoKind === 'screenshare'
                        ? 'mdi-television-play'
                        : 'mdi-television-stop'
                    "
                    :density="btnDensity"
                    @click="toggleShareDefault"
                    @contextmenu.prevent.stop="openShareMenu = true"
                  >
                    Трансляция
                  </v-btn>
                  <v-menu
                    v-model="openShareMenu"
                    activator="parent"
                    location="bottom"
                  >
                    <v-list density="compact">
                      <v-list-subheader>Качество шэринга</v-list-subheader>
                      <v-list-item @click="toggleSharePreset(1280, 720, 60)"
                        >720p @ 60fps</v-list-item
                      >
                      <v-list-item @click="toggleSharePreset(1280, 720, 30)"
                        >720p @ 30fps</v-list-item
                      >
                      <v-list-item @click="toggleSharePreset(854, 480, 30)"
                        >480p @ 30fps</v-list-item
                      >
                      <v-list-item @click="toggleSharePreset(854, 480, 15)"
                        >480p @ 15fps</v-list-item
                      >
                    </v-list>
                  </v-menu>
                </div>
              </div>
            </v-card-text>
          </div>
        </v-expand-transition>
      </v-card>
    </v-hover>
  </div>
</template>
<script lang="ts">
import { defineComponent, reactive, toRefs, computed, onMounted } from "vue";
import { useDisplay } from "vuetify";
import { useSettingsStore } from "~/stores/settings";
import { useProfilesStore } from "~/stores/user/profiles";
import { useCallStore } from "~/stores/call";
import FullProfileTabNavigation from "./FullProfileTabNavigation.vue";
import dfAvatal from "../../assets/profile/profile_exp.jpg";
export default defineComponent({
  name: "MyProfileTabNavigation",
  components: { FullProfileTabNavigation },
  setup() {
    const settings = useSettingsStore();
    const profiles = useProfilesStore();
    const call = useCallStore();
    const defaultAvatar = dfAvatal;
    const state = reactive({
      showFullProfile: false,
      openMicMenu: false,
      openSpkMenu: false,
      openCamMenu: false,
      openShareMenu: false,
      inputDevices: [] as MediaDeviceInfo[],
      outputDevices: [] as MediaDeviceInfo[],
      videoDevices: [] as MediaDeviceInfo[],
    });

    const display = useDisplay();
    const avatarSize = computed(() => (display.xs.value ? 40 : 48));
    const btnDensity = computed(() =>
      display.xs.value ? "compact" : "comfortable"
    );

    async function refreshDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        state.inputDevices = devices.filter((d) => d.kind === "audioinput");
        state.outputDevices = devices.filter((d) => d.kind === "audiooutput");
        state.videoDevices = devices.filter((d) => d.kind === "videoinput");
      } catch (e) {
        console.warn("Не удалось получить устройства медиа:", e);
      }
    }
    onMounted(refreshDevices);

    const onToggleMic = () => call.toggleMic(!settings.microphoneEnabled);
    const onToggleAudio = () => settings.toggleAudio(!settings.audioEnabled);
    const onToggleCamera = () => call.toggleCamera(!settings.videoEnabled);
    const toggleShareDefault = () =>
      call.toggleScreenshare(call.localVideoKind !== "screenshare");
    const toggleSharePreset = (w: number, h: number, fps: number) => {
      call.toggleScreenshare(true, { width: w, height: h, frameRate: fps });
      state.openShareMenu = false;
    };
    const leave = () => call.leaveCall();
    const setMic = (id: string) => call.setMicDevice(id);
    const setCam = (id: string) => call.setCamDevice(id);
    const setOutput = (id: string) => call.setOutputDevice(id);

    function isGradientLike(val?: string) {
      if (!val) return false;
      const v = val.toLowerCase().trim();
      return v.includes("gradient(") || v.startsWith("url(");
    }

    // Фон карточки — по бейджу профиля, с ховером (полупрозрачный -> нормальный)
    function profileBadgeStyle(isHovering: boolean) {
      const badge = profiles.badge as any;
      const shape = (badge?.shape ||
        (profiles as any).badgeShape ||
        "rounded") as "pill" | "rounded" | "square";
      const color = badge?.color as string | undefined;
      const style: Record<string, string> = {
        transition:
          "filter .18s ease, background-color .18s ease, background .18s ease, border-radius .18s ease",
        borderRadius:
          shape === "pill" ? "9999px" : shape === "square" ? "8px" : "14px",
        // Фильтр для “полупрозрачности” без изменения контента
        filter: isHovering
          ? "none"
          : "opacity(0.75) saturate(0.92) brightness(0.98)",
      };
      if (color) {
        if (isGradientLike(color)) {
          style.background = color;
        } else {
          style.backgroundColor = color;
        }
      } else {
        // дефолт
        style.background =
          "linear-gradient(180deg, rgba(120,120,120,.15), rgba(80,80,80,.2))";
      }
      return style;
    }

    return {
      ...toRefs(state),
      settings,
      profiles,
      call,
      avatarSize,
      btnDensity,
      defaultAvatar,
      onToggleMic,
      onToggleAudio,
      onToggleCamera,
      toggleShareDefault,
      toggleSharePreset,
      leave,
      setMic,
      setCam,
      setOutput,
      profileBadgeStyle,
    };
  },
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.my-profile-menu {
}
.my-profile-wrapper {
  position: relative;
  background: transparent !important;
  color: var(--lnav-on-surface);
}

.my-profile-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  /* тот же слой, что у Drawer */
  background: var(--lnav-background);
  z-index: 0;
}

.my-profile-container {
  position: relative;
  z-index: 1;
  width: 100%;
}

/* Если используешь флаг для картинки — можно продублировать отключение, но теперь не обязательно */
.theme-drawer-left.lnav-has-image :deep(.my-profile-wrapper)::before {
  /* Можно скрыть полностью, если --lnav-layer даёт тинт, а тут не нужен */
  /* display: none; */
}

/* Когда у родителя включён режим фон-картинки — убираем подложку, чтобы картинка была видна */
.theme-drawer-left.lnav-has-image :deep(.my-profile-wrapper)::before {
  display: none;
}
.avatar-cell {
  position: relative;
  display: inline-block;
  line-height: 0;
}
.mini-status-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border: 2px solid #1f1f1f;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.18);
  transition: background-color 0.18s ease, border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.st-online {
  background: #3fb950;
}
.st-idle {
  background: #f2c94c;
}
.st-dnd {
  background: #f44336;
}
.st-invisible {
  background: #9aa0a6;
}
</style>
