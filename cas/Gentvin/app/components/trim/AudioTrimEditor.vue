<!-- src/components/alerts/AudioTrimEditor.vue -->
<template>
  <div class="audio-trim-root">
    <!-- Скрытый или минимальный стандартный плеер -->
    <audio
      ref="audioRef"
      @loadedmetadata="onLoadedMetadata"
      class="hidden-audio"
    />

    <div class="controls-row">
      <v-btn
        size="small"
        icon
        variant="tonal"
        @click="togglePlay"
        :title="isPlaying ? 'Пауза' : 'Воспроизвести'"
      >
        <v-icon>{{ isPlaying ? "mdi-pause" : "mdi-play" }}</v-icon>
      </v-btn>
      <div class="time-labels text-caption">
        <span>{{ currentTime.toFixed(1) }} / {{ duration.toFixed(1) }} c</span>
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
    <!-- Визуализация + таймлиния + ручки -->
    <div v-if="duration > 0" class="wave-container">
      <canvas ref="canvasRef" class="wave-canvas"></canvas>

      <!-- Прогресс воспроизведения -->
      <div class="playback-progress" :style="playbackStyle"></div>

      <!-- Слой с выделением и ручками -->
      <div ref="timelineRef" class="wave-timeline" @click="onTimelineClick">
        <div class="wave-selection" :style="selectionStyle"></div>
        <div
          class="wave-handle handle-start"
          :style="startHandleStyle"
          @mousedown.prevent="startDrag('start', $event)"
        ></div>
        <div
          class="wave-handle handle-end"
          :style="endHandleStyle"
          @mousedown.prevent="startDrag('end', $event)"
        ></div>
      </div>
    </div>

    <div class="mt-1 text-caption">
      Фрагмент: {{ trimmedDuration.toFixed(1) }} c (максимум
      {{ props.maxDuration }} c)
    </div>

    <div class="mt-2 d-flex ga-2">
      <v-btn size="small" @click="previewSegment">
        Прослушать только фрагмент
      </v-btn>
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
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";

const props = defineProps<{
  file: File | null;
  maxDuration: number;
}>();

const emit = defineEmits<{
  (e: "update:selection", payload: { start: number; end: number }): void;
}>();

const audioRef = ref<HTMLAudioElement | null>(null);
const duration = ref(0);
const currentTime = ref(0);
const isPlaying = ref(false);

const startSec = ref(0);
const endSec = ref(0);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const timelineRef = ref<HTMLDivElement | null>(null);

const trimmedDuration = computed(() =>
  endSec.value > startSec.value ? endSec.value - startSec.value : 0
);

// --- синхронизация selection наружу
watch([startSec, endSec], ([s, e]) => {
  if (s > e) {
    if (s === startSec.value) endSec.value = s;
    else startSec.value = e;
  }
  emit("update:selection", { start: startSec.value, end: endSec.value });
});
const volume = ref(1);

watch(volume, (v) => {
  if (!audioRef.value) return;
  const val = Math.min(1, Math.max(0, v));
  try {
    audioRef.value.volume = val;
    audioRef.value.muted = val === 0;
  } catch {}
});
// --- src для аудио
watchEffect(() => {
  if (props.file && audioRef.value) {
    const url = URL.createObjectURL(props.file);
    audioRef.value.src = url;
  }
});

async function onLoadedMetadata() {
  if (!audioRef.value) return;
  duration.value = Number(audioRef.value.duration || 0);
  audioRef.value.volume = volume.value;
  audioRef.value.muted = volume.value === 0;
  const end = Math.min(duration.value, props.maxDuration);
  startSec.value = 0;
  endSec.value = end;
  emit("update:selection", { start: 0, end });

  if (props.file) {
    await nextTick();
    drawWaveform(props.file);
  }
}

function togglePlay() {
  if (!audioRef.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
  }
}

function setupAudioEvents() {
  if (!audioRef.value) return;
  audioRef.value.ontimeupdate = () => {
    currentTime.value = audioRef.value!.currentTime || 0;
  };
  audioRef.value.onplay = () => {
    isPlaying.value = true;
  };
  audioRef.value.onpause = () => {
    isPlaying.value = false;
  };
}

onMounted(() => {
  setupAudioEvents();
});

onBeforeUnmount(() => {
  if (audioRef.value) {
    audioRef.value.pause();
  }
});

// --- визуализация (упрощённая волна)
async function drawWaveform(file: File) {
  if (!canvasRef.value) return;

  const arrayBuffer = await file.arrayBuffer();

  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

  const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
    audioCtx.decodeAudioData(
      arrayBuffer.slice(0),
      (buf) => resolve(buf),
      (err) => reject(err)
    );
  });

  const rawData = audioBuffer.getChannelData(0);
  if (!rawData || rawData.length === 0) {
    audioCtx.close();
    return;
  }

  const samples = 800; // побольше столбиков, "классическая" плотная волна
  const blockSize = Math.floor(rawData.length / samples);
  const filteredData: number[] = [];
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[i * blockSize + j] || 0);
    }
    filteredData.push(sum / blockSize);
  }

  const canvas = canvasRef.value;
  // гарантируем не-ноль размеры
  const cssWidth = canvas.parentElement?.clientWidth || 600;
  const cssHeight = 80;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    audioCtx.close();
    return;
  }
  ctx.scale(dpr, dpr);

  // фон
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  // осевая линия
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, cssHeight / 2);
  ctx.lineTo(cssWidth, cssHeight / 2);
  ctx.stroke();

  // волна
  ctx.fillStyle = "#4fc3f7"; // светлый голубой на тёмном
  const max = Math.max(...filteredData) || 1;
  const barWidth = cssWidth / samples;

  for (let i = 0; i < samples; i++) {
    const x = i * barWidth;
    const val = filteredData[i] / max;
    const barHeight = val * (cssHeight - 8);
    const y = (cssHeight - barHeight) / 2;
    ctx.fillRect(x, y, Math.max(1, barWidth * 0.9), barHeight);
  }

  audioCtx.close();
}

// --- прогресс воспроизведения
const playbackStyle = computed(() => {
  if (!duration.value) return { width: "0%" };
  const p = (currentTime.value / duration.value) * 100;
  return { width: `${Math.min(100, Math.max(0, p))}%` };
});

// --- тайм-линия + ручки
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

const selectionStyle = computed(() => {
  const left = timeToPercent(startSec.value);
  const width = timeToPercent(endSec.value) - left;
  return {
    left: `${left}%`,
    width: `${Math.max(0, width)}%`,
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
  if (!timelineRef.value || !duration.value || !audioRef.value) return;
  const rect = timelineRef.value.getBoundingClientRect();
  const rel = (e.clientX - rect.left) / rect.width;
  const t = percentToTime(rel * 100);

  // Перематываем
  audioRef.value.currentTime = Math.min(Math.max(0, t), duration.value);

  // Если звук уже играет — пусть продолжит с новой позиции
  // Если стоит на паузе — просто перемотка
}

onBeforeUnmount(() => {
  stopDrag();
});

// --- прослушать только выделенный фрагмент
async function previewSegment() {
  if (!audioRef.value || !duration.value) return;
  const a = audioRef.value;

  a.currentTime = startSec.value;
  await new Promise<void>((resolve) => {
    a.onseeked = () => resolve();
  });
  await a.play();

  function onUpdate() {
    if (a.currentTime >= endSec.value) {
      a.pause();
      a.ontimeupdate = null;
    }
  }

  a.ontimeupdate = onUpdate;
}

// --- trim() через WebAudio + OfflineAudioContext → WAV (audio/wav)
async function trim() {
  if (!props.file) {
    throw new Error("Нет файла");
  }

  const start = startSec.value;
  const end = endSec.value;
  const durationSec = Math.max(0, end - start);
  if (durationSec <= 0) throw new Error("Неверная длина фрагмента");

  // 1) Читаем файл в ArrayBuffer
  const arrayBuffer = await props.file.arrayBuffer();

  // 2) Декодируем в AudioBuffer
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const originalBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
    audioCtx.decodeAudioData(
      arrayBuffer.slice(0),
      (buf) => resolve(buf),
      (err) => reject(err)
    );
  });

  const sampleRate = originalBuffer.sampleRate;
  const channels = originalBuffer.numberOfChannels;

  // 3) Обрезаем [start; end] через OfflineAudioContext
  const length = Math.floor(durationSec * sampleRate);
  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate);

  const source = offlineCtx.createBufferSource();
  source.buffer = originalBuffer;
  source.connect(offlineCtx.destination);

  // Запуск с началом в start, длиной durationSec
  source.start(0, start, durationSec);

  const renderedBuffer = await offlineCtx.startRendering();

  audioCtx.close();

  // 4) Кодируем результат в WAV (16‑бит PCM)
  function encodeWAV(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitsPerSample = 16;

    const samples = buffer.length;
    const blockAlign = (numChannels * bitsPerSample) >> 3;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const headerSize = 44;
    const bufferSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    let offset = 0;
    function writeString(s: string) {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(offset++, s.charCodeAt(i));
      }
    }

    // RIFF header
    writeString("RIFF");
    view.setUint32(offset, 36 + dataSize, true);
    offset += 4;
    writeString("WAVE");

    // fmt chunk
    writeString("fmt ");
    view.setUint32(offset, 16, true); // fmt chunk size
    offset += 4;
    view.setUint16(offset, format, true); // format = PCM
    offset += 2;
    view.setUint16(offset, numChannels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, byteRate, true);
    offset += 4;
    view.setUint16(offset, blockAlign, true);
    offset += 2;
    view.setUint16(offset, bitsPerSample, true);
    offset += 2;

    // data chunk
    writeString("data");
    view.setUint32(offset, dataSize, true);
    offset += 4;

    // PCM данные
    const interleaved = new Float32Array(samples * numChannels);
    let idx = 0;
    const channelData: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channelData[ch] = buffer.getChannelData(ch);
    }

    for (let i = 0; i < samples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        interleaved[idx++] = channelData[ch][i];
      }
    }

    // записываем как 16‑бит
    for (let i = 0; i < interleaved.length; i++) {
      let s = Math.max(-1, Math.min(1, interleaved[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, s | 0, true);
      offset += 2;
    }

    return arrayBuffer;
  }

  const wavBuffer = encodeWAV(renderedBuffer);
  const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });

  const file = new File(
    [wavBlob],
    props.file.name.replace(/\.\w+$/, "") + "_trim.wav",
    {
      type: "audio/wav",
    }
  );

  return { file, durationSec };
}

defineExpose({ trim });
</script>

<style scoped>
.audio-trim-root {
  max-height: 70vh;
  overflow: hidden;
}

.hidden-audio {
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.time-labels {
  flex: 1 1 auto;
}

/* контейнер для волны и тайм-линии */
.wave-container {
  position: relative;
  width: 100%;
  height: 80px;
}

.wave-canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: #111;
  border-radius: 8px;
}

/* прогресс воспроизведения поверх волны */
.playback-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

/* слой для выделения, клика и ручек — на всю высоту */
.wave-timeline {
  position: absolute;
  inset: 0; /* top:0; right:0; bottom:0; left:0; */
  border-radius: 8px;
  cursor: pointer;
}

/* выделенный фрагмент — "заливка" дорожки */
.wave-selection {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
}

/* ручки — тонкие вертикальные полосы на всю высоту */
.wave-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  margin-left: -2px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  cursor: ew-resize;
  box-shadow: none;
}

.handle-start {
}
.handle-end {
}
</style>
