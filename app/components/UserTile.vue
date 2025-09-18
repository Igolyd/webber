<template>
  <div
    class="user-tile"
    :class="{ speaking: participant.isSpeaking, big }"
    :style="bgStyle"
  >
    <div class="media">
      <!-- Видео всегда в DOM; показываем через v-show -->
      <video :ref="setVideo" v-show="showVideo" autoplay playsinline muted />

      <!-- Заглушка/аватарка — тоже всегда в DOM; показываем через v-show с задержкой -->
      <div
        class="placeholder d-flex flex-column align-center justify-center"
        v-show="showAvatar"
      >
        <v-avatar size="64">
          <v-img
            :src="participant.avatarUrl || '../assets/profile/profile_exp.jpg'"
          />
        </v-avatar>
        <div class="text-caption mt-2">{{ participant.display }}</div>
      </div>

      <!-- ВАЖНО: у удалённых участников всегда есть audio-элемент без mute -->
      <audio v-if="!isLocal" :ref="setAudio" autoplay playsinline></audio>

      <!-- Indikator "Speaking" -->
      <div v-if="participant.isSpeaking" class="speaking-indicator-overlay">
        <span>Говорит</span>
      </div>
    </div>

    <div class="footer">
      <div class="name">{{ participant.display }}</div>
      <div class="level">
        <div
          class="bar"
          :style="{
            transform: 'scaleX(' + (participant.speakingLevel || 0) + ')',
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onBeforeUnmount } from "vue";
import { useCallStore } from "~/stores/call";

export default defineComponent({
  name: "UserTile",
  props: {
    participant: { type: Object, required: true },
    big: { type: Boolean, default: false },
  },
  setup(props) {
    const call = useCallStore();
    const isLocal = computed(() => props.participant.id === "local");

    // Гистерезис на показ аватарки, чтобы избежать «мигания»
    const HIDE_DELAY = 500; // мс; при желании можно 300–600
    const showAvatar = ref(!props.participant.hasVideo);
    const showVideo = computed(() => !showAvatar.value);

    let hideTimer: number | null = null;

    function clearTimer() {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    }

    watch(
      () => props.participant.hasVideo,
      (has) => {
        if (has) {
          // Видео есть → мгновенно показываем, убираем аватарку
          clearTimer();
          showAvatar.value = false;
        } else {
          // Видео пропало → ждём HIDE_DELAY, вдруг вернётся
          clearTimer();
          hideTimer = window.setTimeout(() => {
            showAvatar.value = true;
            hideTimer = null;
          }, HIDE_DELAY);
        }
      },
      { immediate: true }
    );

    onBeforeUnmount(clearTimer);

    async function setVideo(el: HTMLVideoElement | null) {
      if (el && props.participant.stream) {
        // Если уже присвоено — повторно не трогаем
        if (el.srcObject !== props.participant.stream) {
          el.srcObject = props.participant.stream;
        }
        // Немного улучшим UX:
        el.style.objectFit = "cover";
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

    return { setVideo, setAudio, bgStyle, isLocal, showAvatar, showVideo };
  },
});
</script>

<style scoped>
.user-tile {
  position: relative;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s, border 0.3s;
}

.user-tile.speaking {
  border: 2px solid #1976d2;
}

.media {
  position: relative;
  width: 100%;
}

/* Фиксируем размеры, чтобы не дёргать лэйаут; можно адаптировать под big */
.media video,
.media .placeholder {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  display: block;
}

.user-tile.big .media video,
.user-tile.big .media .placeholder {
  height: 320px; /* подберите под ваш дизайн */
}

.placeholder {
  background: #2a2f45;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.level .bar {
  width: 50px;
  height: 4px;
  background: green;
  border-radius: 2px;
  transform-origin: left;
  transition: transform 0.3s;
}

/* Добавлено: Индикатор "Говорит" поверх видео/аватарки */
.speaking-indicator-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(25, 118, 210, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}
</style>
