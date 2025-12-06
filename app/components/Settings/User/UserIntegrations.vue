<!-- components/Settings/User/UserIntegrations.vue -->
<template>
  <v-container class="scope-main scroll-y">
    <v-card class="main-card">
      <v-card-title>Интеграции</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6" v-for="p in providers" :key="p.key">
            <v-card variant="outlined" class="main-card">
              <v-card-title class="d-flex justify-space-between">
                <span>{{ p.title }}</span>
                <v-chip variant="flat" :color="connected[p.key] ? 'green' : 'grey'">{{
                  connected[p.key] ? "Подключено" : "Отключено"
                }}</v-chip>
              </v-card-title>
              <v-card-actions>
                <v-btn v-if="!connected[p.key]" @click="connect(p.key)"
                  >Подключить</v-btn
                >
                <v-btn v-else variant="text" @click="disconnect(p.key)"
                  >Отключить</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        <div class="text-caption mt-2">
          Примечание: большинство интеграций требуют OAuth 2.0...
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {
  useIntegrationsStore,
  type Integration,
} from "~/stores/user/integrations";

export default defineComponent({
  setup() {
    const store = useIntegrationsStore();
    const providers = [
      { key: "vk", title: "VK" },
      { key: "telegram", title: "Telegram" },
      { key: "steam", title: "Steam" },
      { key: "boosty", title: "Boosty" },
      { key: "twitch", title: "Twitch" },
      { key: "x", title: "X" },
      { key: "youtube", title: "YouTube" },
      { key: "rutube", title: "RuTube" },
      { key: "vklive", title: "VK Live" },
      { key: "github", title: "GitHub" },
    ] as { key: Integration; title: string }[];
    return {
      providers,
      connected: store.connected,
      connect: store.connect,
      disconnect: store.disconnect,
    };
  },
});
</script>
<style scoped>
.scope-main {
  --v-theme-surface: var(--main-background);
  --v-theme-on-surface: var(--main-on-surface);
  --v-theme-outline: var(--main-border);
  --v-theme-surface-variant: var(--main-elev-1);
  color: var(--main-on-surface);
}
.main-card {
  background: var(--main-background) !important;
  color: var(--main-on-surface) !important;
  border: 1px solid var(--main-border) !important;
  box-shadow: none;
  border-radius: 12px;
}
.scroll-y {
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.scroll-y::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.scroll-y {
  scrollbar-width: none;
}
</style>