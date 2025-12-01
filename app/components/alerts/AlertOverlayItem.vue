<template>
  <transition name="fade" appear @after-leave="emit('dismiss')">
    <div
      v-if="visible"
      ref="rootRef"
      class="alert-item"
      :style="itemStyle"
      @pointerdown="onPointerDown"
    >
      <template v-if="alert.asset.kind === 'video'">
        <video
          ref="videoRef"
          :src="dataUrl"
          :poster="alert.asset.poster"
          playsinline
          autoplay
          :disablepictureinpicture="playMode !== 'pip'"
          controlslist="nodownload noplaybackrate nofullscreen noremoteplayback"
          class="media media-video"
          @ended="onRequestDismiss"
          @loadedmetadata="setupAutoCloseFromMeta"
          @contextmenu.prevent
        />
      </template>

      <template v-else>
        <audio
          ref="audioRef"
          :src="dataUrl"
          autoplay
          controlslist="nodownload noplaybackrate nofullscreen noremoteplayback"
          class="media media-audio"
          @ended="onRequestDismiss"
          @loadedmetadata="setupAutoCloseFromMeta"
          @contextmenu.prevent
          @error="(e) => console.error('ALERT AUDIO ERROR', e, audioRef?.error)"
        />
      </template>

      <!-- NEW: текст и подпись "От: ..." -->
      <div class="meta" v-if="alert.text || fromLabel">
        <div v-if="alert.text" class="msg">{{ alert.text }}</div>
        <div v-if="fromLabel" class="from">От: {{ fromLabel }}</div>
      </div>

      <div class="actions">
        <v-btn size="small" color="primary" @click.stop="onOpenTarget">
          <v-icon start size="16">mdi-open-in-new</v-icon>Перейти
        </v-btn>
      </div>
      <div class="cta">Принять приглашение</div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import {
  onMounted,
  onBeforeUnmount,
  ref,
  computed,
  watch,
  nextTick,
} from "vue";
import { useRouter } from "vue-router";
import {
  useUserAlertsSettingsStore,
  useAlertsRuntimeStore,
  type PlayMode,
  type IncomingAlert,
} from "@/stores/alerts";

const props = defineProps<{ alert: IncomingAlert; index: number }>();
const emit = defineEmits<{ (e: "dismiss"): void }>();
const fromLabel = computed(() => props.alert.fromName || "");
const visible = ref(true);
const rootRef = ref<HTMLDivElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const audioRef = ref<HTMLAudioElement | null>(null);

const settings = useUserAlertsSettingsStore();
const runtime = useAlertsRuntimeStore();
const router = useRouter();

const playMode = computed<PlayMode>(() => settings.playMode);

// dataUrl (IndexedDB -> dataUrl)
const dataUrl = computed(() => {
  const url = runtime.getAssetUrl(props.alert.asset);
  console.log(
    "[Overlay] asset",
    props.alert.asset.id,
    "mime =",
    props.alert.asset.mime,
    "url =",
    url?.slice?.(0, 60)
  );
  return url;
});

// Позиция
const pos = ref<{ x: number; y: number }>({ x: 16, y: 16 });

const itemStyle = computed(
  () =>
    ({
      position: "absolute",
      left: pos.value.x + "px",
      top: pos.value.y + "px",
      background: "rgba(20,20,20,0.92)",
      borderRadius: "12px",
      color: "#fff",
      width: "min(360px, 90vw)",
      padding: "8px",
      boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
      pointerEvents: "auto",
      touchAction: "none",
    } as Record<string, string>)
);

let closeTimer: number | null = null;
let pipRequested = false;
let popupWin: Window | null = null;

function clampToViewport(x: number, y: number, w: number, h: number) {
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - w - pad);
  const maxY = Math.max(pad, window.innerHeight - h - pad);
  return {
    x: Math.min(Math.max(pad, x), maxX),
    y: Math.min(Math.max(pad, y), maxY),
  };
}

async function initPosition() {
  const saved = runtime.getPosition(props.alert.id);
  await nextTick();
  const el = rootRef.value;
  const w =
    el?.offsetWidth || Math.min(360, Math.round(window.innerWidth * 0.9));
  const h = el?.offsetHeight || 160;

  if (saved) {
    pos.value = clampToViewport(saved.x, saved.y, w, h);
    return;
  }

  // Дефолт: снизу справа, «ступенькой» по индексу, но строго в границах окна
  const pad = 16;
  const baseX = window.innerWidth - w - pad;
  const baseY = window.innerHeight - h - pad - props.index * 12;
  pos.value = clampToViewport(baseX, baseY, w, h);
  runtime.setPosition(props.alert.id, pos.value);
}

function applyVolume() {
  const vol = Math.max(0, Math.min(1, settings.volume));
  if (videoRef.value) {
    // iOS может игнорировать volume, тогда хотя бы muted/unmuted
    videoRef.value.muted = vol === 0;
    try {
      videoRef.value.volume = vol;
    } catch {}
  }
  if (audioRef.value) {
    try {
      audioRef.value.volume = vol;
    } catch {}
  }
  // Синхронизация в popup
  if (popupWin && !popupWin.closed) {
    try {
      popupWin.postMessage(
        { type: "alerts:set-volume", value: vol },
        window.location.origin
      );
    } catch {}
  }
}

function setupAutoClose(ttlSec: number) {
  clearAutoClose();
  const ttl = Math.max(2, Math.round(ttlSec || 10)) * 1000;
  closeTimer = window.setTimeout(() => onRequestDismiss(), ttl);
}
function setupAutoCloseFromMeta() {
  const dur =
    props.alert.asset.kind === "video"
      ? props.alert.asset.durationSec || videoRef.value?.duration || 10
      : audioRef.value?.duration || 10;
  setupAutoClose(Number(dur) + 1);
}
function onRequestDismiss() {
  clearAutoClose();
  if (document.pictureInPictureElement === videoRef.value) {
    (document as any).exitPictureInPicture?.().catch(() => {});
  }
  if (popupWin && !popupWin.closed) {
    try {
      popupWin.close();
    } catch {}
    popupWin = null;
  }
  visible.value = false;
}
function clearAutoClose() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function onResize() {
  const el = rootRef.value;
  const w = el?.offsetWidth || 320;
  const h = el?.offsetHeight || 160;
  const c = clampToViewport(pos.value.x, pos.value.y, w, h);
  if (c.x !== pos.value.x || c.y !== pos.value.y) pos.value = c;
}

onMounted(async () => {
  await initPosition();
  setupAutoClose(props.alert.asset.durationSec || 10);

  if (videoRef.value) {
    videoRef.value.addEventListener("leavepictureinpicture", () => {
      onRequestDismiss();
    });
  }

  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  clearAutoClose();
  window.removeEventListener("resize", onResize);
  window.removeEventListener("pointermove", onPointerMove as any);
  window.removeEventListener("pointerup", onPointerUp as any);
  if (popupWin && !popupWin.closed) {
    try {
      popupWin.close();
    } catch {}
    popupWin = null;
  }
});

// Автоплей со звуком + фолбэк
async function tryStartPlayback() {
  await nextTick();
  applyVolume();
  try {
    if (props.alert.asset.kind === "video") {
      videoRef.value!.muted = settings.volume === 0;
      console.log(
        "[Overlay] tryStartPlayback video, src =",
        videoRef.value?.src
      );
      await videoRef.value!.play();
    } else {
      console.log(
        "[Overlay] tryStartPlayback audio, src =",
        audioRef.value?.src
      );
      await audioRef.value!.play();
    }
  } catch (err) {
    console.warn("[Overlay] play() rejected", err);
    if (videoRef.value) {
      try {
        videoRef.value.muted = false;
        await videoRef.value.play();
        const unlock = () => {
          if (!videoRef.value) return;
          videoRef.value.muted = settings.volume === 0;
          applyVolume();
          videoRef.value.play().catch(() => {});
          window.removeEventListener("pointerdown", unlock, true);
          window.removeEventListener("keydown", unlock, true);
          window.removeEventListener("touchstart", unlock, true);
        };
        window.addEventListener("pointerdown", unlock, true);
        window.addEventListener("keydown", unlock, true);
        window.addEventListener("touchstart", unlock, true);
      } catch {}
    }
  }

  // Применяем выбранный режим
  handlePlayMode();
}

function handlePlayMode() {
  const mode = playMode.value;
  if (
    mode === "pip" &&
    props.alert.asset.kind === "video" &&
    videoRef.value &&
    !pipRequested
  ) {
    pipRequested = true;
    (videoRef.value as any)
      .requestPictureInPicture?.()
      .then(() => onRequestDismiss())
      .catch(() => {
        pipRequested = false;
      });
  } else if (mode === "popup" && !popupWin) {
    openPopupWindow();
  }
}

function openPopupWindow() {
  const src = dataUrl.value;
  if (!src) return;
  const vol = Math.max(0, Math.min(1, settings.volume));

  const features =
    "popup=yes,width=420,height=300,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no";
  popupWin = window.open("", "_blank", features);
  if (!popupWin) return; // заблокировано — остаёмся в оверлее

  const doc = popupWin.document;
  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Alert</title>
  <style>body{margin:0;background:#121212;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial}.wrap{padding:12px}</style>
</head>
<body><div class="wrap"></div></body>
</html>`);
  doc.close();

  const wrap = doc.querySelector(".wrap") as HTMLElement;
  const isVideo = props.alert.asset.kind === "video";
  const m = doc.createElement(isVideo ? "video" : "audio") as HTMLMediaElement;
  m.id = "m";
  m.src = src;
  m.autoplay = true;
  m.setAttribute(
    "controlslist",
    "nodownload noplaybackrate nofullscreen noremoteplayback"
  );
  m.style.width = "100%";
  m.style.borderRadius = "8px";
  if (isVideo) {
    (m as HTMLVideoElement).playsInline = true;
    if (props.alert.asset.poster)
      (m as HTMLVideoElement).poster = props.alert.asset.poster!;
  }
  wrap.appendChild(m);

  // Применение громкости и обработчики
  try {
    (m as any).volume = vol;
  } catch {}
  if (isVideo) (m as HTMLVideoElement).muted = vol === 0;
  m.addEventListener("ended", () => {
    try {
      popupWin?.close();
    } catch {}
  });

  // Получатель сообщений на стороне popup
  popupWin.addEventListener("message", (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if (e.data && e.data.type === "alerts:set-volume") {
      const v = Math.max(0, Math.min(1, Number(e.data.value) || 0));
      try {
        (m as any).volume = v;
      } catch {}
      if (isVideo) (m as HTMLVideoElement).muted = v === 0;
    }
  });

  // Старт воспроизведения (на всякий)
  m.play?.().catch(() => {
    /* если заблокировано — пользователь кликнет */
  });

  // Закрываем оверлей — играем в popup
  onRequestDismiss();
}

// dataUrl -> старт
watch(dataUrl, (src) => {
  if (!src) return;
  tryStartPlayback();
});

// громкость: сразу и при каждом изменении
watch(
  () => settings.volume,
  () => applyVolume(),
  { immediate: true }
);

// смена playMode на лету
watch(playMode, () => handlePlayMode());

// Drag’n’drop
const drag = {
  active: false,
  id: 0,
  dx: 0,
  dy: 0,
  w: 0,
  h: 0,
};
function onPointerDown(e: PointerEvent) {
  if (!rootRef.value) return;
  drag.active = true;
  drag.id = e.pointerId;
  rootRef.value.setPointerCapture(drag.id);
  const rect = rootRef.value.getBoundingClientRect();
  drag.w = rect.width;
  drag.h = rect.height;
  drag.dx = e.clientX - rect.left;
  drag.dy = e.clientY - rect.top;

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
}
function onPointerMove(e: PointerEvent) {
  if (!drag.active) return;
  const nextX = e.clientX - drag.dx;
  const nextY = e.clientY - drag.dy;
  const clamped = clampToViewport(nextX, nextY, drag.w, drag.h);
  pos.value = clamped;
}
function onPointerUp() {
  if (!drag.active || !rootRef.value) return;
  drag.active = false;
  runtime.setPosition(props.alert.id, pos.value);
  window.removeEventListener("pointermove", onPointerMove as any);
  window.removeEventListener("pointerup", onPointerUp as any);
}

// Навигация (опционально)
function onOpenTarget() {
  const a = props.alert;
  // if (a.meta.context === "dm" && a.meta.peerId) router.push(`/dm/${a.meta.peerId}`)
  // else if (a.meta.context === "channel" && a.meta.groupId && a.meta.channelId) router.push(`/groups/${a.meta.groupId}`)
  onRequestDismiss();
}
</script>

<style scoped>
.alert-item {
  /* стили задаём через :style */
}

.media {
  width: 100%;
  border-radius: 8px;
  pointer-events: none;
  user-select: none;
}
.media-audio {
  width: 100%;
}

.actions {
  margin-top: 6px;
  display: flex;
  gap: 8px;
}
.cta {
  opacity: 0.8;
  font-size: 12px;
  margin-top: 4px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.meta {
  margin-top: 8px;
}
.meta .msg {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 13px;
  line-height: 1.3;
  margin-bottom: 4px;
  word-break: break-word;
}
.meta .from {
  font-size: 12px;
  opacity: 0.8;
}
</style>
