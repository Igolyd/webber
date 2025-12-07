<template>
  <v-navigation-drawer
    app
    permanent
    class="settings-panel scope-lnav theme-drawer-left"
  >
    <v-list density="compact" color="transparent">
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
      <v-list-item @click="select('user', 'soundboard')">
        Звуковая панель
      </v-list-item>
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
    <template #append>
      <v-divider />
      <v-list density="compact" color="transparent">
        <nuxt-link to="/">
          <v-list-item @click="$emit('logout')">
            <template #prepend><v-icon>mdi-logout</v-icon></template>
            <v-list-item-title>Назад</v-list-item-title>
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
  | "overlay"
  | "soundboard";
export default {
  emits: ["navigate", "logout"],
  methods: {
    select(group: GroupKey, section: SectionKey) {
      this.$emit("navigate", { group, section });
    },
  },
};
</script>
<style scoped>
.settings-panel.scope-lnav {
  --v-theme-surface: var(--lnav-background);
  --v-theme-on-surface: var(--lnav-on-surface);
  --v-theme-outline: var(--lnav-border);
  --v-theme-surface-variant: var(--lnav-elev-1);
}
.settings-panel.theme-drawer-left {
  position: relative;
  width: 280px;
  top: 0;
  background: transparent !important;
  color: var(--lnav-on-surface);
  border-right: 1px solid var(--lnav-border);
  border-top: 1px solid var(--lnav-border);
  box-shadow: none !important;
  backdrop-filter: blur(6px);
}
.settings-panel.theme-drawer-left::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--lnav-background);
  pointer-events: none;
  z-index: 0;
}
.settings-panel :deep(.v-navigation-drawer__content),
.settings-panel :deep(.v-list),
.settings-panel :deep(.v-divider) {
  position: relative;
  z-index: 1;
  background: transparent !important;
  color: var(--lnav-on-surface);
}
.settings-panel :deep(.v-list-item:hover) {
  background: var(
    --lnav-hover,
    color-mix(in oklab, var(--lnav-on-surface) 10%, transparent)
  ) !important;
}
.settings-panel :deep(.v-list-item__overlay) {
  background: transparent !important;
}
.settings-panel :deep(.v-list-item:hover .v-list-item__overlay) {
  background: var(
    --lnav-hover,
    var(
      --app-hover-color,
      color-mix(in oklab, var(--lnav-on-surface) 10%, transparent)
    )
  ) !important;
  opacity: 1 !important;
}
.settings-panel :deep(.v-list-item--active .v-list-item__overlay) {
  background: var(--app-selected-color) !important;
  opacity: 1 !important;
}
.settings-panel :deep(.v-list-subheader) {
  color: var(--app-on-surface-variant);
}
</style>
