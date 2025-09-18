<!-- components/ParticipantsInline.vue -->
<template>
  <div class="d-flex flex-column gap-1">
    <div class="d-flex flex-wrap gap-2">
      <div
        v-for="p in participants"
        :key="p.id"
        class="d-flex align-center ga-2 participant-pill"
      >
        <v-avatar size="28" :class="speakingClass(p)">
          <img v-if="p.avatar" :src="p.avatar" alt="avatar" />
          <v-icon v-else>mdi-account</v-icon>
        </v-avatar>
        <span class="text-caption">{{ p.display }}</span>
        <div class="d-flex align-center ga-1">
          <v-icon size="16" :color="p.hasAudio ? 'primary' : 'grey'">{{ p.hasAudio ? 'mdi-microphone' : 'mdi-microphone-off' }}</v-icon>
          <v-icon size="16" :color="p.hasVideo ? 'primary' : 'grey'">{{ p.hasVideo ? 'mdi-video' : 'mdi-video-off' }}</v-icon>
          <v-icon size="16" v-if="p.hasScreen" color="primary">mdi-monitor-share</v-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCallStore } from '~/stores/call'

const props = defineProps({ channel-id: string })()
const call = useCallStore()
const participants = computed(() => call.getParticipantsList())

function speakingClass(p: { speakingLevel: number }) {
  return p.speakingLevel > 0.1 ? 'speaking' : ''
}
</script>

<style scoped>
.participant-pill { padding: 4px 6px; border-radius: 8px; background: rgba(255,255,255,0.04); }
.v-avatar.speaking { box-shadow: 0 0 0 2px rgba(0,180,120,0.8); }
</style>