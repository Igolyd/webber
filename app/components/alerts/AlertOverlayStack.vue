<template>
  <ClientOnly>
    <div class="alert-stack">
      <AlertOverlayItem
        v-for="(a, idx) in actives"
        :key="a.id"
        :alert="a"
        :index="idx"
        @dismiss="onDismiss(a.id)"
      />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAlertsRuntimeStore } from '@/stores/alerts'
import AlertOverlayItem from './AlertOverlayItem.vue'

const runtime = useAlertsRuntimeStore()
const { actives } = storeToRefs(runtime)

function onDismiss(id: string) {
  runtime.dismiss(id)
}
</script>

<style scoped>
.alert-stack {
  position: fixed;
  inset: 0;
  z-index: 3000;
  pointer-events: none;
}
</style>