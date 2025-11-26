<template>
  <div class="content-area rounded-te-lg">
    <v-navigation-drawer
      location="top"
      :model-value="true"
      :height="headerHeight"
      :width="headerHeight"
      absolute
      floating
      elevation="0"
      color="transparent"
      class="content-header-drawer scope-hdr rounded-te-lg"
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
    <section class="content-scroll scope-main">
      <v-card flat class="messages-theme pa-0" color="transparent">
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
.scope-hdr {
  --v-theme-surface: var(--topnav-background);
  --v-theme-on-surface: var(--topnav-on-surface);
  --v-theme-outline: var(--topnav-border);
  --v-theme-surface-variant: var(--topnav-elev-1);
}
.content-area{
  border: 0px;
}
.content-header-drawer {
  border-bottom: 1px solid var(--topnav-border, var(--app-outline-variant));
  border-top: 1px solid var(--topnav-border, var(--app-outline-variant));
  background: var(--topnav-elev-1, var(--topnav-background, var(--app-surface)));
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

.scope-main {
  --v-theme-surface: var(--main-background);
  --v-theme-on-surface: var(--main-on-surface);
  --v-theme-outline: var(--main-border);
  --v-theme-surface-variant: var(--main-elev-1);
}
.content-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  background: var(--main-background, transparent);
  color: var(--main-on-surface, inherit);
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
