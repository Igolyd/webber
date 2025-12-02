<!-- components/Settings/App/AppAV.vue -->
<template>
  <v-container>
    <v-tabs v-model="tab" grow>
      <v-tab value="audio">Аудио</v-tab>
      <v-tab value="video">Видео</v-tab>
      <v-tab value="soundbar">Звуковая панель</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-4">
      <v-window-item value="audio">
        <v-card>
          <v-card-text>
            <v-row class="mb-4" align="center">
              <v-col cols="12" md="6">
                <v-select
                  :items="audioInputs"
                  item-title="label"
                  item-value="deviceId"
                  v-model="av.inputDeviceId"
                  label="Устройство ввода (микрофон)"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  :items="audioOutputs"
                  item-title="label"
                  item-value="deviceId"
                  v-model="av.outputDeviceId"
                  label="Устройство вывода (динамики)"
                />
              </v-col>
            </v-row>

            <v-row class="mb-2">
              <v-col cols="12" md="6">
                <v-slider
                  v-model="av.inputVolume"
                  min="0"
                  max="200"
                  step="1"
                  label="Громкость ввода (%)"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-slider
                  v-model="av.outputVolume"
                  min="0"
                  max="200"
                  step="1"
                  label="Громкость вывода (%)"
                />
              </v-col>
            </v-row>

            <v-row class="mb-2">
              <v-col cols="12" md="8">
                <div class="text-subtitle-2">
                  Чувствительность микрофона (порог, дБ)
                </div>
                <v-slider
                  v-model="av.inputSensitivity"
                  min="-80"
                  max="-10"
                  step="1"
                />
                <div class="text-caption">
                  Звук ниже порога будет игнорироваться (noise gate).
                </div>
              </v-col>
            </v-row>

            <v-row align="center" class="mb-2 ga-4">
              <v-btn color="primary" @click="toggleTest">{{
                testing ? "Остановить проверку" : "Проверка"
              }}</v-btn>
              <div class="d-flex align-center ga-2">
                <div style="width: 240px">
                  <v-progress-linear
                    :model-value="meterValue"
                    height="16"
                    color="green"
                  />
                </div>
                <div class="text-caption">{{ meterValue }}%</div>
              </div>
            </v-row>

            <audio ref="monitor" autoplay muted></audio>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="video">
        <v-card>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  :items="videoInputs"
                  item-title="label"
                  item-value="deviceId"
                  v-model="cameraDeviceId"
                  label="Камера"
                />
              </v-col>
            </v-row>
            <video
              ref="videoEl"
              autoplay
              playsinline
              style="max-width: 100%; border-radius: 8px"
            ></video>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="soundbar">
        <v-card>
          <v-card-text>
            Здесь может быть микшер источников/уведомлений, баланс, тест
            воспроизведения и т.п. (пока заглушка).
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useDevicesList, useUserMedia } from "@vueuse/core";
import { useAVStore } from "~/stores/app/av";
import { useCallStore } from "~/stores/call";

export default defineComponent({
  setup() {
    const av = useAVStore();
    const call = useCallStore();
    const tab = ref<"audio" | "video" | "soundbar">("audio");

    const { devices, videoInputs, audioInputs, audioOutputs } =
      useDevicesList();
    // Видео media
    const cameraDeviceId = ref<string>("");
    const {
      stream: videoStream,
      start: startVideo,
      stop: stopVideo,
      constraints,
    } = useUserMedia({
      video: true,
      audio: false,
    });
    const videoEl = ref<HTMLVideoElement | null>(null);

    // Аудио тест/мониторинг
    const testing = ref(false);
    const monitor = ref<HTMLAudioElement | null>(null);
    let audioCtx: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let gainNode: GainNode | null = null;
    let rafId = 0;
    const meterValue = ref(0);

    async function startMicTest() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: av.inputDeviceId
              ? { exact: av.inputDeviceId }
              : undefined,
          },
          video: false,
        });
        audioCtx = new AudioContext();
        source = audioCtx.createMediaStreamSource(stream);
        gainNode = audioCtx.createGain();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;

        // Учитываем громкость ввода
        if (gainNode) gainNode.gain.value = av.inputVolume / 100;

        source.connect(gainNode);
        gainNode.connect(analyser);

        // Мониторинг в наушники (если надо) — не у всех браузеров setSinkId
        const dest = audioCtx.createMediaStreamDestination();
        gainNode.connect(dest);
        if (monitor.value) {
          monitor.value.srcObject = dest.stream;
          monitor.value.muted = false;
          // попытка выбрать устройство вывода (Chrome)
          // @ts-ignore
          if (monitor.value.setSinkId && av.outputDeviceId) {
            // @ts-ignore
            monitor.value.setSinkId(av.outputDeviceId).catch(() => {});
          }
          monitor.value.volume = Math.min(av.outputVolume / 100, 2);
        }

        testing.value = true;
        loopMeter();
      } catch (e) {
        console.error("Mic test error", e);
      }
    }

    function stopMicTest() {
      testing.value = false;
      cancelAnimationFrame(rafId);
      if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
      }
      if (monitor.value?.srcObject) {
        const tracks = (monitor.value.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
      monitor.value && (monitor.value.srcObject = null);
      source = null;
      analyser = null;
      gainNode = null;
      meterValue.value = 0;
    }

    function loopMeter() {
      if (!analyser) return;
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      const calc = () => {
        if (!analyser) return;
        analyser.getByteTimeDomainData(dataArray);
        // RMS и конвертация в дБ
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const db = 20 * Math.log10(rms || 0.000001);

        // Noise gate: если ниже порога — трактуем как 0
        const gated = db < av.inputSensitivity ? 0 : rms;
        const percent = Math.min(100, Math.max(0, Math.round(gated * 100 * 3))); // усиление визуализации
        meterValue.value = percent;

        rafId = requestAnimationFrame(calc);
      };
      rafId = requestAnimationFrame(calc);
    }

    function toggleTest() {
      testing.value ? stopMicTest() : startMicTest();
    }

    // Следим за изменениями громкостей/порогов
    watch(
      () => av.inputVolume,
      (v) => {
        if (gainNode) gainNode.gain.value = v / 100;
      }
    );
    watch(
      () => av.outputVolume,
      (v) => {
        if (monitor.value) monitor.value.volume = Math.min(v / 100, 2);
      }
    );

    // Видео превью
    watch(cameraDeviceId, async (id) => {
      if (!id) return;
      stopVideo();
      constraints.value = { video: { deviceId: { exact: id } } };
      await startVideo();
      if (videoEl.value && videoStream.value) {
        videoEl.value.srcObject = videoStream.value;
      }
    });
    // МИКРОФОН: при выборе в настройках — обновляем Janus
    watch(
      () => av.inputDeviceId,
      (id) => {
        if (!id) return;
        call.setMicDevice(id); // выставит selectedMicId + republish
        av.saveDevices({ inputId: id });
      }
    );

    // ДИНАМИКИ
    watch(
      () => av.outputDeviceId,
      (id) => {
        if (!id) return;
        call.setOutputDevice(id); // только сохраняет selectedOutputId
        av.saveDevices({ outputId: id });
      }
    );

    // КАМЕРА (cameraDeviceId — локальный ref)
    watch(cameraDeviceId, async (id) => {
      if (!id) return;
      // видео‑превью
      stopVideo();
      constraints.value = { video: { deviceId: { exact: id } } };
      await startVideo();
      if (videoEl.value && videoStream.value) {
        videoEl.value.srcObject = videoStream.value;
      }
      // и синхронно обновляем call‑store
      call.setCamDevice(id);
    });
    onMounted(async () => {
      await navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .catch(() => {});

      // Подхватываем из localStorage/CallStore, если в AV ещё пусто
      if (!av.inputDeviceId && audioInputs.value.length) {
        av.inputDeviceId = call.selectedMicId || audioInputs.value[0].deviceId;
      }
      if (!av.outputDeviceId && audioOutputs.value.length) {
        av.outputDeviceId =
          call.selectedOutputId || audioOutputs.value[0].deviceId;
      }
      if (!cameraDeviceId.value && videoInputs.value.length) {
        cameraDeviceId.value =
          call.selectedCamId || videoInputs.value[0].deviceId;
      }
    });

    onBeforeUnmount(() => {
      stopMicTest();
      stopVideo();
    });

    // Список для селектов
    return {
      av,
      tab,
      audioInputs,
      audioOutputs,
      videoInputs,
      cameraDeviceId,
      videoEl,
      monitor,
      testing,
      meterValue,
      toggleTest,
    };
  },
});
</script>
