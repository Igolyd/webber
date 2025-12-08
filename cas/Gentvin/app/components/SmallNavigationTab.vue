<template>
  <v-navigation-drawer
    v-model="drawer"
    rail
    permanent
    location="left"
    color="transparent"
    elevation="0"
    class="theme-drawer-left scope-rnav"
  >
    <v-container class="functional-panel">
      <NuxtLink to="/">
        <v-btn icon="mdi-message-text-outline" :title="'ЛС'"></v-btn>
      </NuxtLink>

      <v-btn icon @click="$emit('toggleChannels')" :title="'Каналы'">
        <v-icon>mdi-view-list</v-icon>
      </v-btn>
      <NuxtLink to="/market">
        <v-btn icon :title="'Магазин'">
          <v-icon>mdi-store</v-icon>
        </v-btn>
      </NuxtLink>
    </v-container>
    <v-list density="compact" nav class="center-list" color="transparent">
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

// const openPrivateMessage = () => {
//   // TODO: заменить на роутер
//   window.location.href = "/";
// };
</script>

<style scoped>
.scope-rnav {
  --v-theme-surface: var(--rnav-surface);
  --v-theme-on-surface: var(--rnav-on-surface);
  --v-theme-outline: var(--rnav-border);
  --v-theme-surface-variant: var(--rnav-elev-1);
}
.theme-drawer-left {
  background: linear-gradient(
    to top,
    /* низ — почти белый, но с тоном темы */
    color-mix(in srgb, var(--lnav-background) 70%, var(--gradient-bg-color) 30%) 0%,
    /* дальше — нормальный цвет темы */ var(--rnav-elev-1) 60%,
    var(--rnav-elev-1) 100%
  );
  color: var(
    --rnav-on-surface,
    var(--app-on-surface, var(--v-theme-on-surface))
  );
  border-right: 1px solid var(--rnav-border, var(--app-outline-variant));
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
.center-list :deep(.v-list-item) {
  padding-inline: 0;
}
.centered-item :deep(.v-list-item__content) {
  display: flex;
  justify-content: center;
}
</style>
