<template>
  <v-list>
    <v-list-item
      v-for="device in devices"
      :key="device.deviceId"
      @click="selectDevice(device.deviceId)"
    >
      <v-list-item-title>{{ device.label || 'Устройство ' + device.deviceId }}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
  selected: string;
}>();

const emit = defineEmits<{
  (e: 'select', deviceId: string): void;
}>();

const devices = ref<MediaDeviceInfo[]>([]);

onMounted(async () => {
  try {
    const deviceInfos = await navigator.mediaDevices.enumerateDevices();
    devices.value = deviceInfos.filter(device => device.kind === props.kind);
  } catch (error) {
    console.error("Ошибка получения устройств:", error);
  }
});

function selectDevice(deviceId: string) {
  emit('select', deviceId);
}
</script>

<style scoped>
/* Добавьте стили при необходимости */
</style>