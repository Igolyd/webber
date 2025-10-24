<template>
  <div class="content-area">
    <v-navigation-drawer
      location="top"
      :model-value="true"
      :height="headerHeight"
      :width="headerHeight"
      absolute
      floating
      elevation="0"
      class="content-header-drawer"
    >
      <div class="content-header">
        <h2 class="text-h6"># {{ activeTextChannelName }}</h2>
        <div class="spacer"></div>
        <v-btn
          icon
          :title="'Участники'"
          aria-label="Участники"
          @click="$emit('toggle-users')"
        >
          <v-icon>mdi-account-multiple-outline</v-icon>
        </v-btn>
        <v-btn
          icon
          :title="'Видео-комната'"
          aria-label="Видео-комната"
          @click="$emit('toggle-video')"
        >
          <v-icon>mdi-video-outline</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>

    <section class="content-scroll">
      <v-card flat class="messages-theme pa-0">
        <ChatWindow context="channel" :channel-id="activeTextChannelId" />
      </v-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDisplay } from "vuetify";
import ChatWindow from "../chat/ChatWindow.vue";

defineProps<{
  activeTextChannelName: string;
  activeTextChannelId: string;
  isVideoRoomOpen: boolean;
}>();

defineEmits(["toggle-users", "toggle-video"]);

const { smAndDown } = useDisplay();
const headerHeight = computed(() => (smAndDown.value ? 58 : 66));
</script>

<style scoped>
.content-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
}

.content-header-drawer {
  border-bottom: 1px solid var(--app-border-color);
  border-top: 1px solid var(--app-border-color);
  background: color-mix(in oklab, var(--app-surface) 70%, transparent);
}

.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  height: 100%;
}

.content-header .spacer {
  flex: 1;
}

.content-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.messages-theme {
  background: transparent;
  height: 100%;
  overflow: hidden;
  padding-top: 0;
}

@media (max-width: 600px) {
  .content-header {
    padding: 6px 8px;
  }
}
</style>
