<!-- components/Settings/App/AppNotifications.vue -->
<template>
  <v-container>
    <v-card>
      <v-card-title>Уведомления</v-card-title>
      <v-card-text>
        <v-switch label="Уведомления в группах" v-model="store.groups" />
        <v-switch label="Уведомления в личных сообщениях" v-model="store.direct" />
        <v-switch label="Новости" v-model="store.news" />
        <div class="text-caption">Функционал пока не реализован.</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useNotificationsStore } from '~/stores/app/notifications'

export default defineComponent({
  setup() {
    const store = useNotificationsStore()
    return { store }
  },
})
</script>