<!-- components/DevicePicker.vue -->
<template>
  <v-list density="compact">
    <v-list-subheader>{{ title }}</v-list-subheader>
    <v-list-item
      v-for="d in devices"
      :key="d.deviceId"
      @click="$emit('pick', d.deviceId)"
    >
      <v-list-item-title>{{ d.label || defaultLabel(d.kind) }}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{ kind: 'audioinput' | 'audiooutput' | 'videoinput' }>()
const devices = ref<MediaDeviceInfo[]>([])
const title = props.kind === 'audioinput' ? 'Микрофоны' : props.kind === 'audiooutput' ? 'Динамики' : 'Камеры'

function defaultLabel(kind: string) {
  return kind === 'audioinput' ? 'Микрофон' : kind === 'audiooutput' ? 'Динамик' : 'Камера'
}

async function load() {
  try {
    const list = await navigator.mediaDevices.enumerateDevices()
    devices.value = list.filter(d => d.kind === props.kind)
  } catch (e) {
    console.warn('enumerateDevices error', e)
  }
}

onMounted(load)
</script>