<!-- components/Settings/SettingsPanel.vue -->
<template>
  <v-navigation-drawer app permanent class="settings-panel">
    <v-list density="compact">
      <v-list-subheader>Настройки пользователя</v-list-subheader>
      <v-list-item @click="select('user', 'account')">Аккаунт</v-list-item>
      <v-list-item @click="select('user', 'profiles')">Профиль</v-list-item>
      <v-list-item @click="select('user', 'communication')"
        >Коммуникации</v-list-item
      >
      <v-list-item @click="select('user', 'devices')">Устройства</v-list-item>
      <v-list-item @click="select('user', 'integration')"
        >Интеграция</v-list-item
      >
      <v-list-item @click="select('user', 'privacy')">Приватность</v-list-item>
      <v-list-item @click="select('user', 'alerts')"
        >Настройки алертсов</v-list-item
      >
      <v-list-item @click="select('user', 'emoji')">Эмодзи</v-list-item>
      <v-list-item @click="select('user', 'stickers')">Стикеры</v-list-item>

      <v-list-subheader>Настройки приложения</v-list-subheader>
      <v-list-item @click="select('app', 'notifications')"
        >Уведомления</v-list-item
      >
      <v-list-item @click="select('app', 'language')">Язык</v-list-item>
      <v-list-item @click="select('app', 'appearance')"
        >Внешний вид</v-list-item
      >
      <v-list-item @click="select('app', 'accessibility')"
        >Доступность</v-list-item
      >
      <v-list-item @click="select('app', 'chat')">Чат</v-list-item>
      <v-list-item @click="select('app', 'hotkeys')"
        >Горячие клавиши</v-list-item
      >
      <v-list-item @click="select('app', 'streamer')"
        >Инструменты стримера</v-list-item
      >
      <v-list-item @click="select('app', 'av')">Аудио/Видео</v-list-item>

      <v-list-subheader>Настройки активности</v-list-subheader>
      <v-list-item @click="select('activity', 'SetAC')"
        >Настройки активности</v-list-item
      >
      <v-list-item @click="select('activity', 'overlay')">Оверлей</v-list-item>
      <v-list-item @click="select('activity', 'privacyAC')"
        >Приватность</v-list-item
      >
    </v-list>

    <!-- Разделитель и кнопка Выйти -->
    <template #append>
      <v-divider></v-divider>
      <v-list density="compact">
        <nuxt-link to="/">
          <v-list-item @click="$emit('logout')">
            <template #prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>Выйти</v-list-item-title>
          </v-list-item>
        </nuxt-link>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts">
type GroupKey = "app" | "user" | "activity";
type SectionKey =
  | "notifications"
  | "language"
  | "appearance"
  | "accessibility"
  | "chat"
  | "hotkeys"
  | "streamer"
  | "av"
  | "account"
  | "communication"
  | "devices"
  | "integration"
  | "privacy"
  | "profiles"
  | "privacyAC"
  | "SetAC"
  | "alerts"
  | "emoji"
  | "stickers"
  | "overlay";

export default {
  emits: ["navigate", "logout"], // добавили logout
  methods: {
    select(group: GroupKey, section: SectionKey) {
      this.$emit("navigate", { group, section });
    },
  },
};
</script>

<style scoped>
.settings-panel {
  width: 280px;
  position: sticky;
  top: 0;
  background: color-mix(
    in oklab,
    var(--lnav-background) 85%,
    transparent
  ) !important;
  backdrop-filter: blur(6px);
  color: var(--lnav-on-surface);
  border-right: 1px solid var(--lnav-border);
  border-top: 1px solid var(--lnav-border);
  box-shadow: none !important;
}
.settings-panel :deep(.v-list-item:hover) {
  background: var(--app-hover-color) !important;
}
.settings-panel :deep(.v-list-subheader) {
  color: var(--app-on-surface-variant);
}
</style>
