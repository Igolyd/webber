<!-- components/Settings/User/UserDevices.vue -->
<template>
  <v-container class="scope-main scroll-y">
    <v-card class="main-card">
      <v-card-title class="d-flex justify-space-between">
        <span>Активные сессии</span>
        <v-btn color="primary" @click="fetch">Обновить</v-btn>
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="s in sessions" :key="s.id">
            <v-list-item-title>{{ s.device }}</v-list-item-title>
            <v-list-item-subtitle>Последняя активность: {{ s.lastActive }}</v-list-item-subtitle>
            <template #append>
              <v-chip variant="flat" size="small" v-if="s.current">Текущая</v-chip>
            </template>
          </v-list-item>
        </v-list>
        <v-btn color="red" class="mt-3" @click="logoutAll">Выйти со всех устройств</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { useDevicesStore } from '~/stores/user/devices'

export default defineComponent({
  setup() {
    const store = useDevicesStore()
    onMounted(() => store.fetchSessions())
    return { sessions: store.sessions, fetch: store.fetchSessions, logoutAll: store.logoutAll }
  },
})
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