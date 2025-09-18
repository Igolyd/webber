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
        <v-virtual-scroll :items="messages" height="100%" item-height="56">
          <template #default="{ item }">
            <div class="message-item">
              <strong class="message-author">{{ item.author }}</strong>
              <span class="message-text">{{ item.content }}</span>
            </div>
          </template>
        </v-virtual-scroll>
      </v-card>
    </section>

    <footer class="content-composer">
      <InputMulti @send="$emit('send', $event)" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import InputMulti from "~/components/InputMulti.vue";

defineProps<{
  activeTextChannelName: string;
  messages: { id: number; author: string; content: string }[];
  isVideoRoomOpen: boolean;
}>();

defineEmits(["toggle-users", "toggle-video", "send"]);
</script>

<style scoped>
.content-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1f1f1f;
}
.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #2c2c2c;
}
.content-header .spacer {
  flex: 1;
}
.content-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 8px;
}
.messages-theme {
  background: #292929;
  height: 100%;
  overflow: hidden;
}
.message-item {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  align-items: baseline;
}
.message-author {
  color: #fff;
}
.message-text {
  color: #ddd;
  word-break: break-word;
}
.content-composer {
  border-top: 1px solid #2c2c2c;
  padding: 8px;
  background: #1f1f1f;
}
@media (max-width: 600px) {
  .content-scroll {
    padding: 4px;
  }
  .content-header {
    padding: 6px 8px;
  }
}
</style>