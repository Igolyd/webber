<template>
  <div class="content-area">
    <header class="content-header">
      <h2 class="text-h6"># {{ activeTextChannelName }}</h2>
      <div class="spacer"></div>
      <v-btn icon :title="'Участники'" aria-label="Участники" @click="$emit('toggle-users')">
        <v-icon>mdi-account-multiple-outline</v-icon>
      </v-btn>
      <v-btn icon :title="'Видео-комната'" aria-label="Видео-комната" @click="$emit('toggle-video')">
        <v-icon>mdi-video-outline</v-icon>
      </v-btn>
    </header>

    <section class="content-scroll">
      <v-card flat class="messages-theme pa-0">
        <ChatWindow
          context="channel"
          :channel-id="activeTextChannelId"
        />
      </v-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import ChatWindow from "../chat/ChatWindow.vue";

defineProps<{
  activeTextChannelName: string
  activeTextChannelId: string
  isVideoRoomOpen: boolean
}>()

defineEmits(['toggle-users', 'toggle-video'])
</script>

<style scoped>
.content-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent; /* было #1f1f1f */
}
.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--app-border-color);
}
.content-header .spacer { flex: 1; }
.content-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}
.messages-theme {
  background: transparent; /* было #1f1f1f */
  height: 100%;
  overflow: hidden;
}
@media (max-width: 600px) {
  .content-scroll { padding: 0; }
  .content-header { padding: 6px 8px; }
}
</style>