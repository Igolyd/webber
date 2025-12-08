<!-- components/GroupsSettings/ModerationSafety.vue -->
<template>
<div class="pa-4 scope-main">
    <h2 class="text-h6 mb-2">Настройка безопасности</h2>
    <p class="text-medium-emphasis">Здесь будут параметры безопасности и фильтров.</p>
  </div>
</template>

<script setup lang="ts"></script>
<style scoped>
/* Маппинг секции main */
.scope-main {
  --v-theme-surface: var(--main-background);
  --v-theme-on-surface: var(--main-on-surface);
  --v-theme-outline: var(--main-border);
  --v-theme-surface-variant: var(--main-elev-1);
  color: var(--main-on-surface);
}
.main-card {
  background: var(--main-background) !important;
  color: var(--main-on-surface) !important;
  border: 1px solid var(--main-border) !important;
  box-shadow: none;
  border-radius: 12px;
}
</style>