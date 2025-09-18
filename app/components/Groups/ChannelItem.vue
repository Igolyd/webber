<template>
  <v-list-item
    rounded="lg"
    :active="active"
    @click="$emit('click')"
    @contextmenu.prevent.stop="menuOpen = true"
  >
    <template #prepend>
      <v-icon>{{ channel.type === 'voice' ? 'mdi-volume-high' : 'mdi-pound' }}</v-icon>
    </template>
    <v-list-item-title>{{ channel.name }}</v-list-item-title>

    <v-menu
      v-model="menuOpen"
      activator="parent"
      location="end"
      :open-on-click="false"
    >
      <v-list density="compact">
        <v-list-item @click.stop="$emit('edit', channel.id); menuOpen = false;">
          <template #prepend><v-icon>mdi-pencil</v-icon></template>
          <v-list-item-title>Настроить</v-list-item-title>
        </v-list-item>

        <v-divider class="my-1" />

        <v-list-item class="text-error" @click.stop="$emit('delete', channel.id); menuOpen = false;">
          <template #prepend><v-icon color="error">mdi-delete-outline</v-icon></template>
          <v-list-item-title>Удалить</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-list-item>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  channel: {
    id: string;
    name: string;
    type: "text" | "voice";
  };
  active: boolean;
}>();

defineEmits(["edit", "delete", "click"]);

const menuOpen = ref(false);
</script>