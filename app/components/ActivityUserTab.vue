<!-- ActivityUserTab.vue -->
<template>
  <v-navigation-drawer
    v-model="internalModel"
    location="right"
    :permanent="permanent"
    :temporary="temporary"
    :width="width"
     class="theme-drawer-right"
    app
  >
    <v-card elevation="10" class="py-4 px-4">
      <h5 class="card-title">Друзья в сети</h5>
      <!-- Тут можно отрисовать список друзей онлайн -->

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
.theme-drawer-right {
  background-color: transparent !important;
  color: var(--app-text-color);
  border-left: 1px solid var(--app-border-color);
  box-shadow: none !important;
}
.card-title { font-weight: 600; }
</style>