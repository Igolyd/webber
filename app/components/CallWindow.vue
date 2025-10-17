<template>
  <v-dialog v-model="model" eager max-width="1200" width="100%">
    <v-card class="pa-2">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-video-wireless</v-icon>
          <span>Звонок</span>
        </div>
        <div class="d-flex align-center ga-1">
          <div class="activator-wrap">
            <v-btn
              :icon="
                settings.audioEnabled ? 'mdi-volume-high' : 'mdi-volume-off'
              "
              :color="settings.audioEnabled ? 'primary' : ''"
              variant="tonal"
              @click="settings.toggleAudio(!settings.audioEnabled)"
              @contextmenu.prevent.stop="openSpkMenu = true"
            />
            <v-menu v-model="openSpkMenu" activator="parent">
              <DeviceList
                kind="audiooutput"
                @select="call.setOutputDevice"
                :selected="call.selectedOutputId || ''"
              />
            </v-menu>
          </div>

          <div class="activator-wrap">
            <v-btn
              :icon="settings.videoEnabled ? 'mdi-video' : 'mdi-video-off'"
              :color="settings.videoEnabled ? 'primary' : ''"
              variant="tonal"
              @click="call.toggleCamera(!settings.videoEnabled)"
              @contextmenu.prevent.stop="
                settings.videoEnabled ? (openCamMenu = true) : null
              "
            />
            <v-menu
              v-if="settings.videoEnabled"
              v-model="openCamMenu"
              activator="parent"
            >
              <DeviceList
                kind="videoinput"
                @select="call.setCamDevice"
                :selected="call.selectedCamId || ''"
              />
            </v-menu>
          </div>

          <div class="activator-wrap">
            <v-btn
              :icon="
                call.localVideoKind === 'screenshare'
                  ? 'mdi-television-play'
                  : 'mdi-television-stop'
              "
              :color="call.localVideoKind === 'screenshare' ? 'primary' : ''"
              variant="tonal"
              @click="toggleShareDefault"
              @contextmenu.prevent.stop="openShareMenu = true"
            />
            <v-menu v-model="openShareMenu" activator="parent">
              <v-list density="compact">
                <v-list-item @click="sharePreset(1280, 720, 60)"
                  >720p @60fps</v-list-item
                >
                <v-list-item @click="sharePreset(1280, 720, 30)"
                  >720p @30fps</v-list-item
                >
                <v-list-item @click="sharePreset(854, 480, 30)"
                  >480p @30fps</v-list-item
                >
                <v-list-item @click="sharePreset(854, 480, 15)"
                  >480p @15fps</v-list-item
                >
              </v-list>
            </v-menu>
          </div>

          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="mdi-phone-hangup"
            @click="leave"
          >
            Отключиться
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text>
        <template v-if="focused">
          <div class="stage mb-3">
            <UserTile :participant="focused" big />
            <v-btn
              class="exit-focus-btn"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-fullscreen-exit"
              @click="call.setFocusParticipant(null)"
            >
              Выйти из фокусировки
            </v-btn>
          </div>
          <div class="thumbs-row">
            <UserTile
              v-for="p in others"
              :key="p.id"
              :participant="p"
              @click="call.setFocusParticipant(p.id)"
            />
          </div>
        </template>

        <template v-else>
          <div class="tiles-grid">
            <UserTile
              v-for="p in others"
              :key="p.id"
              :participant="p"
              @click="call.setFocusParticipant(p.id)"
            />
          </div>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  onMounted,
  watch,
  nextTick,
} from "vue";
import { useCallStore } from "~/stores/call";
import { useSettingsStore } from "~/stores/settings";

export default defineComponent({
  name: "CallWindow",
  props: {
    modelValue: { type: Boolean, required: true },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const call = useCallStore();
    const settings = useSettingsStore();

    const model = computed({
      get: () => props.modelValue,
      set: (v: boolean) => emit("update:modelValue", v),
    });

    const focused = computed(() => call.focusedParticipant);
    const others = computed(() => {
      const arr = call.participants;
      const fid = call.focusParticipantId;
      // если есть фокус — показываем всех, иначе показываем всех (focused=null, others === все участники)
      return arr.filter((p) => p.id !== fid);
    });

    const openMicMenu = ref(false);
    const openSpkMenu = ref(false);
    const openCamMenu = ref(false);
    const openShareMenu = ref(false);

    function toggleShareDefault() {
      call.toggleScreenshare(call.localVideoKind !== "screenshare");
    }
    function sharePreset(w: number, h: number, fps: number) {
      call.toggleScreenshare(true, { width: w, height: h, frameRate: fps });
      openShareMenu.value = false;
    }
    function leave() {
      call.leaveCall();
      model.value = false;
    }
    onMounted(applySink);
    watch(
      () => model.value,
      async (open) => {
        if (open) {
          try {
            await call.resumeAnalysers();
          } catch {}
        }
      }
    );

    async function applySink() {
      await nextTick();
      if (!call.selectedOutputId) return;
      const audios = document.querySelectorAll("audio[playsinline]");
      for (const a of Array.from(audios)) {
        const el = a as any;
        if (typeof el.setSinkId === "function") {
          try {
            await el.setSinkId(call.selectedOutputId);
          } catch {}
        }
      }
    }
    return {
      call,
      settings,
      model,
      focused,
      others,
      openMicMenu,
      openSpkMenu,
      openCamMenu,
      openShareMenu,
      toggleShareDefault,
      sharePreset,
      leave,
    };
  },
});
</script>

<style scoped>
.tiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.stage {
  position: relative;
}
.stage :deep(.user-tile.big .media) {
  max-height: 70vh;
}
.exit-focus-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
}
.thumbs-row {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.mb-3 {
  margin-bottom: 1rem;
}
</style>
