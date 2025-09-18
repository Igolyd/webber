<template>
  <!-- Глобально смонтированное окно звонка -->
  <CallWindow @update:modelValue="ui.callWindowOpen = $event" v-model="ui.callWindowOpen"  />
</template>

<script setup lang="ts">
import { useUiStore } from "~/stores/ui";
import CallWindow from "~/components/CallWindow.vue";

const ui = useUiStore();
</script>