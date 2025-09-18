<template>
  <div class="my-profile-wrapper">
    <v-card elevation="8" class="my-profile-container w-100">
      <v-card-item class="py-2 px-3">
        <div class="d-flex align-center justify-space-between ga-2">
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
                <v-avatar :size="avatarSize">
                  <v-img :src="profiles.avatar || defaultAvatar" cover />
                </v-avatar>
                <div class="text-truncate" style="min-width: 0">
                  <div class="text-subtitle-2 font-weight-medium text-truncate">
                    {{ profiles.name || "Без имени" }}
                  </div>
                  <div class="text-caption text-medium-emphasis text-truncate">
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
            <div class="activator-wrap">
              <v-btn
                variant="tonal"
                :color="
                  settings.microphoneEnabled ? 'primary' : 'surface-variant'
                "
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
                variant="tonal"
                :color="settings.audioEnabled ? 'primary' : 'surface-variant'"
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
            <nuxt-link to="/SettingsProfileUser">
              <v-btn
                icon="mdi-cog-outline"
                :density="btnDensity"
                variant="text"
              />
            </nuxt-link>
          </div>
        </div>
      </v-card-item>
      <v-expand-transition>
        <div v-show="call.callEnabled">
          <v-divider />
          <v-card-text class="py-2">
            <div class="d-flex align-center ga-2 flex-wrap">
              <v-btn
                variant="outlined"
                color="error"
                prepend-icon="mdi-phone-hangup"
                :density="btnDensity"
                @click="leave"
              >
                Отключиться
              </v-btn>
              <div class="activator-wrap">
                <v-btn
                  variant="tonal"
                  :color="settings.videoEnabled ? 'primary' : 'surface-variant'"
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
                  variant="tonal"
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
    };
  },
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.my-profile-menu {
  /* при необходимости донастройка меню профиля */
}
</style>
