<template>
  <div
    class="user-tile"
    :class="{ speaking: participant.isSpeaking, big }"
    :style="bgStyle"
  >
    <div class="media" :class="{ big }">
      <video
        :ref="setVideo"
        v-show="showVideo"
        autoplay
        playsinline
        muted
        :style="{ objectFit: videoFit }"
      />
      <div
        class="placeholder d-flex flex-column align-center justify-center"
        v-show="showAvatar"
      >
        <v-avatar size="64">
          <v-img :src="participant.avatarUrl || defaultAvatar" />
        </v-avatar>
        <div class="text-caption mt-2">{{ participant.display }}</div>
      </div>

      <!-- overlay: имя + аватарка -->
      <div class="overlay-info">
        <v-avatar size="28">
          <v-img :src="participant.avatarUrl || defaultAvatar" />
        </v-avatar>
        <span class="overlay-name">{{ participant.display }}</span>
      </div>

      <!-- Индикатор "Говорит" -->
      <div v-if="participant.isSpeaking" class="speaking-indicator-overlay">
        <span>Говорит</span>
      </div>

      <!-- Удалённый звук -->
      <audio v-if="!isLocal" :ref="setAudio" autoplay playsinline></audio>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onBeforeUnmount } from "vue";
import { useCallStore } from "~/stores/call";
import dfAvatar from "~/assets/profile/profile_exp.jpg";

export default defineComponent({
  name: "UserTile",
  props: {
    participant: { type: Object, required: true },
    big: { type: Boolean, default: false },
  },
  setup(props) {
    const call = useCallStore();
    const isLocal = computed(() => props.participant.id === "local");

    const showAvatar = ref(!props.participant.hasVideo);
    const showVideo = computed(() => !showAvatar.value);

    watch(
      () => props.participant.hasVideo,
      (has) => {
        // Мгновенно переключаем, без таймеров
        showAvatar.value = !has;
      },
      { immediate: true }
    );

    // Камера — cover, шеринг — contain
    const isScreenshare = computed(
      () => props.participant.hasScreen && props.participant.hasVideo
    );
    const videoFit = computed(() =>
      isScreenshare.value ? "contain" : "cover"
    );

    async function setVideo(el: HTMLVideoElement | null) {
      if (el && props.participant.stream) {
        if (el.srcObject !== props.participant.stream) {
          el.srcObject = props.participant.stream;
        }
        el.style.width = "100%";
        el.style.height = "100%";
        try {
          await el.play();
        } catch {}
      }
    }

    async function setAudio(el: HTMLAudioElement | null) {
      if (el && props.participant.stream) {
        if (el.srcObject !== props.participant.stream) {
          el.srcObject = props.participant.stream;
        }
        if (
          call.selectedOutputId &&
          typeof (el as any).setSinkId === "function"
        ) {
          try {
            await (el as any).setSinkId(call.selectedOutputId);
          } catch {}
        }
      }
    }

    const bgStyle = { background: "linear-gradient(135deg, #2a2f45, #1d2033)" };
    const defaultAvatar = dfAvatar;

    return {
      setVideo,
      setAudio,
      bgStyle,
      isLocal,
      showAvatar,
      showVideo,
      videoFit,
      defaultAvatar,
    };
  },
});
</script>

<style scoped>
.user-tile {
  position: relative;
  border-radius: 8px;
  transition: background-color 0.3s, border 0.3s;
  padding: 0;
}

.user-tile.speaking {
  outline: 2px solid #1976d2;
}

.media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9; /* фикс пропорций */
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.media video,
.media .placeholder {
  width: 100%;
  height: 100%;
  display: block;
}

.placeholder {
  background: #191b22;
  color: #cfd8dc;
}

/* Крупный режим не ломает пропорции — просто шире, выше за счёт контейнера */
.user-tile.big .media {
  aspect-ratio: 16 / 9;
}

/* Оверлей с именем и аватаркой внутри медиа */
.overlay-info {
  position: absolute;
  left: 8px;
  top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  border-radius: 999px;
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.overlay-name {
  font-size: 12px;
  font-weight: 600;
}

.speaking-indicator-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(25, 118, 210, 0.85);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}
.media video,
.media .placeholder {
  width: 100%;
  height: 100%;
  display: block;
  transition: opacity .2s ease;
}
/* Больше не нужен нижний footer: вся информация — в оверлее */
</style>
