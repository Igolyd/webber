<!-- components/GroupsSettings/SettingGroupPanel.vue -->
<template>
  <v-navigation-drawer
    app
    permanent
    color="grey-lighten-3"
    class="group-settings-panel"
  >
    <v-list density="compact">
      <v-list-subheader>Настройки группы</v-list-subheader>
      <v-list-item @click="select('group', 'profile')"
        >Профиль группы</v-list-item
      >
      <v-list-item @click="select('group', 'serverTag')"
        >Тэг сервера</v-list-item
      >
      <v-list-item @click="select('group', 'appearance')"
        >Внешний вид</v-list-item
      >
      <v-list-subheader>Реакции</v-list-subheader>
      <v-list-item @click="select('reactions', 'emojis')">Эмодзи</v-list-item>
      <v-list-item @click="select('reactions', 'stickers')"
        >Стикеры</v-list-item
      >
      <v-list-item @click="select('reactions', 'soundboard')"
        >Звуковая панель</v-list-item
      >

      <v-list-subheader>Люди</v-list-subheader>
      <v-list-item @click="select('people', 'members')">Участники</v-list-item>
      <v-list-item @click="select('people', 'roles')">Роли</v-list-item>
      <v-list-item @click="select('people', 'permissions')">Доступ</v-list-item>

      <v-list-subheader>Модерация</v-list-subheader>
      <v-list-item @click="select('moderation', 'safety')"
        >Настройка безопасности</v-list-item
      >
      <v-list-item @click="select('moderation', 'auditLog')"
        >Журнал аудита</v-list-item
      >
      <v-list-item @click="select('moderation', 'bans')">Баны</v-list-item>

      <v-list-subheader>Дополнительные настройки</v-list-subheader>
      <v-list-item @click="select('advanced', 'template')"
        >Шаблон группы</v-list-item
      >
      <v-list-item @click="select('advanced', 'delete')"
        >Удалить группу</v-list-item
      >
    </v-list>

    <template #append>
      <v-divider />
      <v-list density="compact">
        <nuxt-link :to="backUrl">
          <v-list-item>
            <template #prepend>
              <v-icon>mdi-arrow-left</v-icon>
            </template>
            <v-list-item-title>Назад к группе</v-list-item-title>
          </v-list-item>
        </nuxt-link>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

// Типы ключей
type GroupKey = "group" | "reactions" | "people" | "moderation" | "advanced";
type SectionKey =
  | "profile"
  | "serverTag"
  | "appearance"
  | "emojis"
  | "stickers"
  | "soundboard"
  | "members"
  | "roles"
  | "permissions"
  | "safety"
  | "auditLog"
  | "bans"
  | "template"
  | "delete";

const emit = defineEmits<{
  (e: "navigate", payload: { group: GroupKey; section: SectionKey }): void;
}>();

function select(group: GroupKey, section: SectionKey) {
  emit("navigate", { group, section });
}

const route = useRoute();
const backUrl = computed(() => `/groups/${route.params.id}`);
</script>

<style scoped>
.group-settings-panel {
  width: 280px;
  position: sticky;
  top: 0;
}
</style>
