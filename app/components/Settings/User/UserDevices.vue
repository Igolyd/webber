<!-- components/Settings/User/UserDevices.vue -->
<template>
  <v-container>
    <v-card>
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
              <v-chip size="small" v-if="s.current">Текущая</v-chip>
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