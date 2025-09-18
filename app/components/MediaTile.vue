<!-- components/MediaTile.vue -->
<template>
  <div class="media-tile" :class="{ speaking: participant.speakingLevel > 0.1 }">
    <div class="media-wrap">
      <template v-if="hasVisual">
        <video v-if="videoEl" ref="videoRef" autoplay playsinline muted :class="{ large }"></video>
        <video v-else-if="screenEl" ref="screenRef" autoplay playsinline :class="{ large }"></video>
      </template>
      <template v-else>
        <div class="avatar-fallback">
          <v-avatar size="96">
            <img v-if="participant.avatar" :src="participant.avatar" alt="avatar" />
            <v-icon v-else size="64">mdi-account</v-icon>
          </v-avatar>
        </div>
      </template>
      <audio ref="audioRef" autoplay />
    </div>
    <div class="meta">
      <div class="name">{{ participant.display }}</div>
      <div class="badges">
        <v-icon v-if="participant.hasAudio" size="16">mdi-microphone</v-icon>
        <v-icon v-else size="16" color="grey">mdi-microphone-off</v-icon>
        <v-icon v-if="participant.hasVideo" size="16">mdi-video</v-icon>
        <v-icon v-else size="16" color="grey">mdi-video-off</v-icon>
        <v-icon v-if="participant.hasScreen" size="16">mdi-monitor-share</v-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { useJanusClient } from '~/composables/useJanusClient'
import { useSettingsStore } from '~/stores/settings'

const props = defineProps<{
  participant: {
    id: string
    display: string
    hasVideo: boolean
    hasScreen: boolean
    hasAudio: boolean
    isLocal: boolean
    speakingLevel: number
  }
  large?: boolean
  outputDeviceId?: string
}>()

const janus = useJanusClient()
const settings = useSettingsStore()

const audioRef = ref<HTMLAudioElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const screenRef = ref<HTMLVideoElement | null>(null)

const hasVisual = computed(() => props.participant.hasVideo || props.participant.hasScreen)
const videoEl = computed(() => props.participant.hasVideo)
const screenEl = computed(() => !props.participant.hasVideo && props.participant.hasScreen)

let sub: any = null

async function mountStreams() {
  if (!props.participant) return
  // для local/remote получаем подписчика и присваиваем потоки
  sub = await janus.subscribeToPublisher(props.participant.id).catch(() => null)
  const mediaStream = sub?.getMediaStream?.()
  if (!mediaStream) return

  if (audioRef.value) {
    audioRef.value.srcObject = mediaStream
    // mute/unmute с учетом настроек
    audioRef.value.muted = !settings.audioEnabled || props.participant.isLocal
    // output device
    if (props.outputDeviceId && 'setSinkId' in (audioRef.value as any)) {
      try { await (audioRef.value as any).setSinkId(props.outputDeviceId) } catch {}
    }
  }
  if (videoRef.value && props.participant.hasVideo) {
    videoRef.value.srcObject = mediaStream
  }
  if (screenRef.value && props.participant.hasScreen && !props.participant.hasVideo) {
    screenRef.value.srcObject = mediaStream
  }
}

onMounted(() => { mountStreams() })
onBeforeUnmount(() => {
  sub = null
})

watch(() => props.outputDeviceId, async (id) => {
  if (audioRef.value && id && 'setSinkId' in (audioRef.value as any)) {
    try { await (audioRef.value as any).setSinkId(id) } catch {}
  }
})

watch(() => settings.audioEnabled, (v) => {
  if (audioRef.value) {
    audioRef.value.muted = !v || props.participant.isLocal
  }
})
</script>

<style scoped>
.media-tile {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.06);
}
.media-tile.speaking {
  box-shadow: 0 0 0 2px rgba(0,180,120,0.7);
}
.media-wrap { position: relative; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; background: #141416; }
.media-wrap video { width: 100%; height: 100%; object-fit: cover; }
.media-wrap video.large { object-fit: contain; }
.avatar-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #191a1c; }
.meta { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; font-size: 12px; color: #ddd; }
.badges { display: flex; gap: 6px; align-items: center; }
</style>