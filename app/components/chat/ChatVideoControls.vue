<script setup lang="ts">
import { useVuePlayer } from '@display-studio/vue-player'

const props = defineProps<{
  src: string
  fileName?: string
}>()

const {
  playing,
  togglePlay,
  videoMuted,
  toggleMute,
  percentagePlayed,
  seekToPercentage,
  convertTimeToDuration,
  time,
  duration,
  openFullScreen,
  togglePictureInPicture,
} = useVuePlayer()

async function onDownload() {
  try {
    if (!props.src) return

    // Data URL / blob: — можно скачивать напрямую
    if (props.src.startsWith('data:') || props.src.startsWith('blob:')) {
      const a = document.createElement('a')
      a.href = props.src
      a.download = props.fileName || 'video'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }

    // Пытаемся скачать через fetch (если CORS разрешит)
    const res = await fetch(props.src)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.fileName || 'video'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    // Fallback: открываем в новой вкладке
    const a = document.createElement('a')
    a.href = props.src
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}
</script>

<template>
  <div class="chat-video__controls">
    <div class="left">
      <v-btn size="small" icon variant="text" @click.stop="togglePlay()">
        <v-icon>{{ playing ? 'mdi-pause' : 'mdi-play' }}</v-icon>
      </v-btn>
      <v-btn size="small" icon variant="text" @click.stop="toggleMute()">
        <v-icon>{{ videoMuted ? 'mdi-volume-off' : 'mdi-volume-high' }}</v-icon>
      </v-btn>
    </div>

    <div class="center">
      <input
        class="track"
        type="range"
        min="0"
        max="100"
        step="0.1"
        :value="percentagePlayed.toFixed(1)"
        @input="(e: any) => seekToPercentage(+e.target.value)"
      />
      <div class="time">
        {{ convertTimeToDuration(time) }} / {{ convertTimeToDuration(duration) }}
      </div>
    </div>

    <div class="right">
      <v-btn size="small" icon variant="text" @click.stop="togglePictureInPicture()">
        <v-icon>mdi-picture-in-picture-bottom-right</v-icon>
      </v-btn>
      <v-btn size="small" icon variant="text" @click.stop="openFullScreen()">
        <v-icon>mdi-fullscreen</v-icon>
      </v-btn>
      <v-btn size="small" icon variant="text" @click.stop="onDownload">
        <v-icon>mdi-download</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.chat-video__controls {
  position: absolute;
  inset: auto 0 0 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.55));
  color: #fff;
}

.left, .right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.center {
  display: grid;
  align-items: center;
  gap: 2px;
}

.track {
  width: 100%;
  appearance: none;
  height: 4px;
  border-radius: 3px;
  background: rgba(255,255,255,0.5);
}
.track::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px; height: 10px; border-radius: 50%;
  background: #fff; cursor: pointer;
}
.time {
  font-size: 12px;
  opacity: 0.9;
  user-select: none;
}
</style>