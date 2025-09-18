<!-- ActivityUserTab.vue -->
<template>
  <v-navigation-drawer
    v-model="internalModel"
    location="right"
    :permanent="permanent"
    :temporary="temporary"
    :width="width"
    app
  >
    <v-card elevation="10" class="py-4 px-4">
      <h5 class="card-title">Друзья в сети</h5>
      <!-- Тут можно отрисовать список друзей онлайн -->
      <!-- Пример:
      <v-list density="compact">
        <v-list-item v-for="friend in friendsOnline" :key="friend.id">
          <template #prepend>
            <v-avatar size="28"><v-img :src="friend.avatar" /></v-avatar>
          </template>
          <v-list-item-title>{{ friend.name }}</v-list-item-title>
          <template #append>
            <v-badge color="green" dot />
          </template>
        </v-list-item>
      </v-list>
      -->
    </v-card>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "ActivityUserTab",
  props: {
    modelValue: {
      type: Boolean,
      default: true,
    },
    permanent: {
      type: Boolean,
      default: true,
    },
    temporary: {
      type: Boolean,
      default: false,
    },
    width: {
      type: [Number, String],
      default: 300,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const internalModel = computed<boolean>({
      get: () => props.modelValue,
      set: (val) => emit("update:modelValue", val),
    });

    return { internalModel };
  },
});
</script>

<style scoped>
.card-title {
  font-weight: 600;
}
</style>