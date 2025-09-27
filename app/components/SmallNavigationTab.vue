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
      >
      </v-btn>
      <v-btn icon @click="$emit('toggleChannels')" :title="'Каналы'">
        <v-icon>mdi-view-list</v-icon>
      </v-btn>
    </v-container>

    <v-list density="compact" nav>
      <v-list-item
        v-for="group in groups"
        :key="group.id"
        :active="group.id === selectedGroupId"
        rounded="lg"
        @click="$emit('updateSelectedGroup', group.id)"
      >
        <template #prepend>
          <v-avatar size="40">
            <v-img :src="group.avatar" />
          </v-avatar>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Group {
  id: number;
  name: string;
  avatar: string;
}

const props = defineProps<{
  groups: Group[];
  selectedGroupId?: number;
}>();

const emit = defineEmits<{
  (e: "updateSelectedGroup", id: number): void;
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
</style>
