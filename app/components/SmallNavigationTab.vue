<template>
  <v-navigation-drawer
    v-model="drawer"
    rail
    permanent
    location="left"
    class="theme-drawer-left"
  >
    <v-container class="functional-panel">
      <v-btn
        icon="mdi-message-text-outline"
        @click="openPrivateMessage"
        :title="'ЛС'"
      ></v-btn>
      <v-btn icon @click="$emit('toggleChannels')" :title="'Каналы'">
        <v-icon>mdi-view-list</v-icon>
      </v-btn>
      <NuxtLink to="/market">
        <v-icon>mdi-store</v-icon>
      </NuxtLink>
    </v-container>

    <v-list density="compact" nav class="center-list">
      <v-list-item
        v-for="group in groups"
        :key="group.id"
        :active="group.id === selectedGroupId"
        rounded="lg"
        class="centered-item px-0"
        @click="$emit('updateSelectedGroup', group.id)"
      >
        <div class="w-100 d-flex justify-center">
          <v-avatar size="40">
            <template v-if="group.avatar && group.avatar.length">
              <v-img :src="group.avatar" :alt="group.name" cover />
            </template>
            <template v-else>
              <v-icon>mdi-account-group-outline</v-icon>
            </template>
          </v-avatar>
        </div>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Group {
  id: string; // фикс: id — строка, как в сторе
  name: string;
  avatar?: string; // фикс: avatar может отсутствовать
}

const props = defineProps<{
  groups: Group[];
  selectedGroupId?: string; // фикс: строка
}>();

const emit = defineEmits<{
  (e: "updateSelectedGroup", id: string): void;
  (e: "toggleChannels"): void;
}>();

const drawer = ref(true);

const openPrivateMessage = () => {
  // TODO: заменить на роутер
  window.location.href = "/";
};
</script>

<style scoped>
.theme-drawer-left {
  background-color: transparent !important;
  color: var(--app-text-color);
  border-right: 1px solid var(--app-border-color);
  box-shadow: none !important;
}
.functional-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  padding-right: 2px;
  padding-left: 2px;
}

/* Центрируем содержимое элемента списка и убираем боковые паддинги */
.center-list :deep(.v-list-item) {
  padding-inline: 0;
}
.centered-item :deep(.v-list-item__content) {
  display: flex;
  justify-content: center;
}
</style>
