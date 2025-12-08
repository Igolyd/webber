<template>
  <section class="settings-section scope-main">
    <h1>Настройки пользователя — Приватность</h1>
    <p>Заглушка компонента. Здесь появятся настройки приватности профиля.</p>
  </section>
</template>

<script setup>
</script>

<style scoped>
.settings-section { padding: 16px; }
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