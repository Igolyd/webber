<template>
  <v-menu location="bottom end" transition="fade-transition">
    <template #activator="{ props }">
      <v-btn
        icon
        variant="text"
        v-bind="props"
        :title="'Действия группы'"
        aria-label="Действия группы"
      >
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </template>

    <v-list density="compact">
      <v-list-item @click="$emit('open-group-settings')">
        <template #prepend><v-icon>mdi-cog-outline</v-icon></template>
        <v-list-item-title>Настройки группы</v-list-item-title>
      </v-list-item>

      <v-divider class="my-1" />

      <v-list-item @click="$emit('invite-people')">
        <template #prepend><v-icon>mdi-account-plus-outline</v-icon></template>
        <v-list-item-title>Пригласить людей</v-list-item-title>
      </v-list-item>

      <v-list-item @click="$emit('open-create-channel')">
        <template #prepend><v-icon>mdi-pound</v-icon></template>
        <v-list-item-title>Создать канал</v-list-item-title>
      </v-list-item>

      <v-list-item @click="$emit('open-create-directory')">
        <template #prepend><v-icon>mdi-folder-plus-outline</v-icon></template>
        <v-list-item-title>Создать категорию</v-list-item-title>
      </v-list-item>

      <v-list-item @click="$emit('create-event')">
        <template #prepend><v-icon>mdi-calendar-plus</v-icon></template>
        <v-list-item-title>Создать событие</v-list-item-title>
      </v-list-item>

      <v-list-item @click="$emit('publish-news')">
        <template #prepend><v-icon>mdi-newspaper-variant-outline</v-icon></template>
        <v-list-item-title>Опубликовать новость</v-list-item-title>
      </v-list-item>

      <v-divider class="my-1" />

      <v-list-item @click="$emit('open-notification-settings')">
        <template #prepend><v-icon>mdi-bell-cog-outline</v-icon></template>
        <v-list-item-title>Параметры уведомления</v-list-item-title>
      </v-list-item>

      <v-list-item @click="$emit('open-privacy-settings')">
        <template #prepend><v-icon>mdi-shield-lock-outline</v-icon></template>
        <v-list-item-title>Настройки конфиденциальности</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
defineEmits([
  "open-group-settings",
  "invite-people",
  "open-create-channel",
  "open-create-directory",
  "create-event",
  "publish-news",
  "open-notification-settings",
  "open-privacy-settings",
]);
</script>