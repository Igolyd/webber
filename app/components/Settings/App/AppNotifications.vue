<!-- components/Settings/App/AppNotifications.vue -->
<template>
  <v-container class="scope-main">
    <v-card class="main-card">
      <v-card-title>Уведомления</v-card-title>
      <v-card-text>
        <v-switch label="Уведомления в группах" v-model="store.groups" />
        <v-switch
          label="Уведомления в личных сообщениях"
          v-model="store.direct"
        />
        <v-switch label="Новости" v-model="store.news" />
        <div class="text-caption">Функционал пока не реализован.</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useNotificationsStore } from "~/stores/app/notifications";

export default defineComponent({
  setup() {
    const store = useNotificationsStore();
    return { store };
  },
});
</script>
<style lang="css" scoped>
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
</style>