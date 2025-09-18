<template>
  <v-navigation-drawer
    v-model="model"
    :permanent="!isSmAndDown"
    :temporary="isSmAndDown"
    location="right"
    width="280"
    class="users-theme"
    :scrim="isSmAndDown"
  >
    <h2 class="text-h6 px-4 py-2">Участники</h2>
    <v-list>
      <v-list-item
        v-for="u in users"
        :key="u.id"
        @click="$emit('view-user', u.id, u.name)"
        @contextmenu.prevent="openContextMenu($event, u)"
      >
        <template #prepend>
          <v-avatar size="28">
            <v-img
              :src="u.avatarUrl || '/app/assets/profile/profile_exp.jpg'"
              cover
            />
          </v-avatar>
        </template>
        <v-list-item-title>{{ u.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: boolean;
  isSmAndDown: boolean;
  users: { id: number; name: string }[];
}>();

const emit = defineEmits(["update:modelValue", "view-user"]);

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});
</script>

<style scoped>
.users-theme {
  background: #111;
  color: #fff;
}
</style>
