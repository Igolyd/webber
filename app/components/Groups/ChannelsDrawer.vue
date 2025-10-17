<template>
  <v-navigation-drawer
    v-model="model"
    :permanent="!isSmAndDown"
    :temporary="isSmAndDown"
    width="360"
    class="theme-drawer-left"
    :scrim="isSmAndDown"
  >
    <div class="px-4 py-2 d-flex align-center justify-space-between">
      <h2 class="text-h6 mb-0" :title="selectedGroupName">
        “{{ selectedGroupName }}”
      </h2>
      <GroupActionsMenu
        @open-group-settings="$emit('open-group-settings')"
        @invite-people="$emit('invite-people')"
        @open-create-channel="$emit('open-create-channel')"
        @open-create-directory="$emit('open-create-directory')"
        @create-event="$emit('create-event')"
        @publish-news="$emit('publish-news')"
        @open-notification-settings="$emit('open-notification-settings')"
        @open-privacy-settings="$emit('open-privacy-settings')"
      />
    </div>
    <v-divider />
    <v-list class="py-0" density="comfortable">
      <DirectorySection
        v-for="section in directoriesWithChannels"
        :key="section.dir.id"
        :section="section"
        :active-text-channel-id="activeTextChannelId"
        @toggle-directory="$emit('toggle-directory', section.dir.id)"
        @edit-directory="$emit('edit-directory', $event)"
        @delete-directory="$emit('delete-directory', $event)"
        @edit-channel="$emit('edit-channel', $event)"
        @delete-channel="$emit('delete-channel', $event)"
        @channel-click="$emit('channel-click', $event)"
        @open-create-channel="$emit('open-create-channel')"
      />
    </v-list>
    <template #append>
      <slot name="append" />
    </template>
  </v-navigation-drawer>
</template>
<script setup lang="ts">
import { computed } from "vue";
import GroupActionsMenu from "./GroupActionsMenu.vue";
import DirectorySection from "./DirectorySection.vue";
interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  directoryId?: string | null;
  position?: number | null;
}
interface Directory {
  id: string;
  groupId: string;
  name: string;
  position: number;
  isCollapsed: boolean;
  createdAt?: string;
}
type Section = { dir: Directory; channels: Channel[] };
const props = defineProps<{
  modelValue: boolean;
  isSmAndDown: boolean;
  selectedGroupName: string;
  directoriesWithChannels: Section[];
  activeTextChannelId: string;
}>();
const emit = defineEmits([
  "update:modelValue",
  "open-group-settings",
  "invite-people",
  "open-create-channel",
  "open-create-directory",
  "create-event",
  "publish-news",
  "open-notification-settings",
  "open-privacy-settings",
  "toggle-directory",
  "edit-directory",
  "delete-directory",
  "edit-channel",
  "delete-channel",
  "channel-click",
]);
const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});
</script>
<style scoped>
.theme-drawer-left {
  background-color: transparent !important;
  color: var(--app-text-color);
  border-right: 1px solid var(--app-border-color);
  box-shadow: none !important;
}
</style>