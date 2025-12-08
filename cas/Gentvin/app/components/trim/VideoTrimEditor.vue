<!-- src/components/alerts/VideoTrimEditor.vue -->
<template>
  <div class="video-trim-root">
    <div class="video-wrapper">
      <video
        ref="videoRef"
        class="video-element"
        @loadedmetadata="onLoadedMetadata"
      ></video>
    </div>

    <!-- Блок управления под видео -->
    <div class="video-controls">
      <div class="controls-row">
        <button class="play-btn" @click="togglePlay">
          <v-icon size="20">
            {{ isPlaying ? "mdi-pause" : "mdi-play" }}
          </v-icon>
        </button>
        <div class="time-labels">
          {{ currentTime.toFixed(1) }} / {{ duration.toFixed(1) }} c
          <span
            class="length-indicator"
            :class="{
              ok: trimmedDuration <= props.maxDuration && trimmedDuration > 0,
              bad: trimmedDuration > props.maxDuration || trimmedDuration <= 0,
            }"
          >
            {{ trimmedDuration.toFixed(1) }} c
            <span v-if="trimmedDuration <= props.maxDuration">
              (≤ {{ props.maxDuration }} c)
            </span>
            <span v-else> (> {{ props.maxDuration }} c) </span>
          </span>
        </div>
      </div>
      <div class="controls-row">
        <v-icon size="16" class="mr-1">
          {{
            volume === 0
              ? "mdi-volume-mute"
              : volume < 0.5
              ? "mdi-volume-low"
              : "mdi-volume-high"
          }}
        </v-icon>
        <v-slider
          v-model="volume"
          min="0"
          max="1"
          step="0.05"
          density="default"
          color="#fff"
          hide-details
          style="max-width: 200px"
        />
      </div>
      <div
        v-if="duration > 0"
        ref="timelineRef"
        class="timeline"
        @click="onTimelineClick"
      >
        <div class="timeline-bg"></div>

        <!-- Прогресс воспроизведения -->
        <div class="timeline-progress" :style="progressStyle"></div>

        <!-- Выделенный фрагмент -->
        <div class="timeline-selection" :style="selectionStyle"></div>

        <!-- Ручки -->
        <div
          class="timeline-handle handle-start"
          :style="startHandleStyle"
          @mousedown.prevent="startDrag('start', $event)"
        >
          <span class="handle-label"></span>
        </div>
        <div
          class="timeline-handle handle-end"
          :style="endHandleStyle"
          @mousedown.prevent="startDrag('end', $event)"
        >
          <span class="handle-label"></span>
        </div>
      </div>
    </div>

    <div class="mt-2 d-flex ga-2">
      <v-btn size="small" @click="previewSegment">Просмотреть фрагмент</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  computed,
  watchEffect,
  defineExpose,
  onBeforeUnmount,
} from "vue";

const props = defineProps<{
  file: File | null;
  maxDuration: number;
}>();

const emit = defineEmits<{
  (e: "update:selection", payload: { start: number; end: number }): void;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const timelineRef = ref<HTMLDivElement | null>(null);

const duration = ref(0);
const currentTime = ref(0);
const isPlaying = ref(false);

const startSec = ref(0);
const endSec = ref(0);

const trimmedDuration = computed(() =>
  endSec.value > startSec.value ? endSec.value - startSec.value : 0
);

// src для видео
watchEffect(() => {
  if (props.file && videoRef.value) {
    const url = URL.createObjectURL(props.file);
    videoRef.value.src = url;
    videoRef.value.muted = false;
  }
});

function onLoadedMetadata() {
  if (!videoRef.value) return;
  duration.value = Number(videoRef.value.duration || 0);
  videoRef.value.volume = volume.value;
  videoRef.value.muted = volume.value === 0;
  const end = Math.min(duration.value, props.maxDuration);
  startSec.value = 0;
  endSec.value = end;
  emit("update:selection", { start: 0, end });

  setupVideoEvents();
}

function setupVideoEvents() {
  if (!videoRef.value) return;
  const v = videoRef.value;
  v.ontimeupdate = () => {
    currentTime.value = v.currentTime || 0;
  };
  v.onplay = () => {
    isPlaying.value = true;
  };
  v.onpause = () => {
    isPlaying.value = false;
  };
}

function togglePlay() {
  if (!videoRef.value) return;
  if (isPlaying.value) videoRef.value.pause();
  else videoRef.value.play();
}

// синхронизация selection наружу
watch([startSec, endSec], ([s, e]) => {
  if (s > e) {
    if (s === startSec.value) endSec.value = s;
    else startSec.value = e;
  }
  emit("update:selection", { start: startSec.value, end: endSec.value });
});
const volume = ref(1); // 0..1

watch(volume, (v) => {
  if (!videoRef.value) return;
  const val = Math.min(1, Math.max(0, v));
  try {
    videoRef.value.volume = val;
    // mute, если 0
    videoRef.value.muted = val === 0;
  } catch {}
});

// превью только фрагмента
async function previewSegment() {
  if (!videoRef.value || !duration.value) return;
  const v = videoRef.value;
  v.currentTime = startSec.value;
  await new Promise<void>((resolve) => {
    v.onseeked = () => resolve();
  });

  const stopAt = endSec.value;

  v.ontimeupdate = () => {
    currentTime.value = v.currentTime || 0;
    if (v.currentTime >= stopAt) {
      v.pause();
    }
  };

  await v.play();
}

// таймлиния + ручки
type DragTarget = "start" | "end" | null;
const dragging = ref<DragTarget>(null);

function timeToPercent(t: number) {
  if (!duration.value) return 0;
  return (t / duration.value) * 100;
}
function percentToTime(p: number) {
  p = Math.min(100, Math.max(0, p));
  return (p / 100) * duration.value;
}

const progressStyle = computed(() => {
  if (!duration.value) return { width: "0%" };
  const p = (currentTime.value / duration.value) * 100;
  return { width: `${Math.min(100, Math.max(0, p))}%` };
});

const selectionStyle = computed(() => {
  const left = timeToPercent(startSec.value);
  const width = timeToPercent(endSec.value) - left;
  const ok =
    trimmedDuration.value > 0 && trimmedDuration.value <= props.maxDuration;
  return {
    left: `${left}%`,
    width: `${Math.max(0, width)}%`,
    backgroundColor: ok
      ? "rgba(76, 175, 80, 0.7)" // зелёный, если ≤ 10с
      : "rgba(244, 67, 54, 0.7)", // красный, если > 10с или 0
  };
});

const startHandleStyle = computed(() => ({
  left: `${timeToPercent(startSec.value)}%`,
}));

const endHandleStyle = computed(() => ({
  left: `${timeToPercent(endSec.value)}%`,
}));

function updateTimeFromClientX(target: DragTarget, clientX: number) {
  if (!timelineRef.value || !duration.value || !target) return;
  const rect = timelineRef.value.getBoundingClientRect();
  const rel = (clientX - rect.left) / rect.width;
  const percent = rel * 100;
  const t = percentToTime(percent);

  if (target === "start") {
    startSec.value = Math.min(t, endSec.value);
  } else {
    endSec.value = Math.max(t, startSec.value);
  }
}

function startDrag(target: DragTarget, e: MouseEvent) {
  dragging.value = target;
  updateTimeFromClientX(target, e.clientX);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", stopDrag);
}

function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return;
  updateTimeFromClientX(dragging.value, e.clientX);
}

function stopDrag() {
  dragging.value = null;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", stopDrag);
}

function onTimelineClick(e: MouseEvent) {
  if (!timelineRef.value || !duration.value || !videoRef.value) return;
  const rect = timelineRef.value.getBoundingClientRect();
  const rel = (e.clientX - rect.left) / rect.width;
  const t = percentToTime(rel * 100);

  // Перематываем
  videoRef.value.currentTime = Math.min(Math.max(0, t), duration.value);
  // Если уже играет — продолжает играть с новой позиции
  // Если на паузе — просто перемотка
}

onBeforeUnmount(() => {
  stopDrag();
  if (videoRef.value) videoRef.value.pause();
});

// trim() с остановкой по currentTime >= end
// trim() с захватом и видео, и аудио
// trim() — самостоятельный триммер, не зависящий от videoRef (по духу как в AudioTrimEditor)
async function trim() {
  if (!props.file) {
    throw new Error("Нет файла");
  }

  const start = startSec.value;
  const end = endSec.value;
  const durationSec = Math.max(0, end - start);
  if (durationSec <= 0) {
    throw new Error("Неверная длина фрагмента");
  }

  // 1. Создаём отдельный <video>, не зависящий от UI‑видео
  const url = URL.createObjectURL(props.file);
  const el = document.createElement("video");
  el.src = url;
  el.muted = true;
  (el as any).playsInline = true;
  el.preload = "auto";

  // Дождёмся метаданных, чтобы знать размеры
  await new Promise<void>((resolve, reject) => {
    el.onloadedmetadata = () => resolve();
    el.onerror = () =>
      reject(new Error("Не удалось загрузить видео для обрезки"));
  });

  const width = el.videoWidth || 640;
  const height = el.videoHeight || 360;

  // 2. Настраиваем canvas для видеокадров
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error("Не удалось получить контекст canvas");
  }

  // 3. Видео‑треки из canvas
  const canvasStream: MediaStream = canvas.captureStream();
  if (!canvasStream) {
    URL.revokeObjectURL(url);
    throw new Error("captureStream для canvas не поддерживается");
  }

  // 4. Аудио‑треки из самого видео (если браузер поддерживает captureStream)
  const videoStream: MediaStream | null =
    (el as any).captureStream?.() || (el as any).mozCaptureStream?.() || null;

  if (videoStream) {
    const audioTracks = videoStream.getAudioTracks();
    audioTracks.forEach((t) => canvasStream.addTrack(t));
  }

  // 5. Настраиваем MediaRecorder
  const chunks: BlobPart[] = [];
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(canvasStream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });
  } catch {
    // fallback без указания codecs
    recorder = new MediaRecorder(canvasStream, {
      mimeType: "video/webm",
    } as any);
  }

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  let stopped = false;
  let rejectOnce: ((e: any) => void) | null = null;

  const waitRecorderStop = new Promise<void>((resolve, reject) => {
    rejectOnce = reject;
    recorder.onstop = () => resolve();
    recorder.onerror = (ev) =>
      reject(ev.error || new Error("MediaRecorder error при обрезке видео"));
  });

  function stopRecording() {
    if (stopped) return;
    stopped = true;
    try {
      recorder.stop();
    } catch {}
    try {
      el.pause();
    } catch {}
    URL.revokeObjectURL(url);
  }

  el.onerror = () => {
    stopRecording();
    rejectOnce?.(new Error("Ошибка воспроизведения видео при обрезке"));
  };

  // 6. Перематываем на start и ждём seeked
  el.currentTime = start;
  await new Promise<void>((resolve) => {
    el.onseeked = () => resolve();
  });

  // 7. Рендерим кадры в canvas, пока не дойдём до end
  function drawFrame() {
    if (stopped) return;
    try {
      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    } catch {}
    requestAnimationFrame(drawFrame);
  }

  el.ontimeupdate = () => {
    if (el.currentTime >= end) {
      stopRecording();
    }
  };

  // 8. Старт записи и воспроизведения
  recorder.start(100);
  await el.play();
  drawFrame();

  // 9. Ждём окончания записи
  await waitRecorderStop;

  if (!chunks.length) {
    throw new Error("Не удалось записать обрезанный видеофрагмент");
  }

  const blob = new Blob(chunks, { type: "video/webm" });
  const file = new File(
    [blob],
    props.file.name.replace(/\.\w+$/, "") + "_trim.webm",
    {
      type: "video/webm",
    }
  );

  return { file, durationSec };
}

defineExpose({ trim });
</script>

<style scoped>
.video-trim-root {
  max-height: 70vh;
  overflow: hidden;
}

.video-wrapper {
  width: 100%;
  max-height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-element {
  max-width: 100%;
  max-height: 50vh;
  object-fit: contain;
  background: #000;
}

.video-controls {
  margin-top: 8px;
}

/* остальное оставляем как было */
.controls-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.play-btn {
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-labels {
  flex: 1 1 auto;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.length-indicator {
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 11px;
}
.length-indicator.ok {
  background: rgba(76, 175, 80, 0.2);
  color: #c8e6c9;
}
.length-indicator.bad {
  background: rgba(244, 67, 54, 0.2);
  color: #ffcdd2;
}

/* Таймлиния */
.timeline {
  position: relative;
  height: 18px;
  border-radius: 9px;
  margin-top: 4px;
  pointer-events: auto;
  cursor: pointer;
}

.timeline-bg {
  position: absolute;
  inset: 0;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.4);
}

/* прогресс воспроизведения */
.timeline-progress {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.08);
}

/* выделенный фрагмент */
.timeline-selection {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 9px;
}

/* Ручки */
.timeline-handle {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 26px;
  margin-top: -13px;
  margin-left: -7px;
  border-radius: 4px;
  background: #fff;
  border: 2px solid #2196f3;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
  cursor: ew-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}

.handle-label {
  font-size: 9px;
  font-weight: 600;
  color: #2196f3;
}
</style>
