<template>
  <v-container class="pa-4">
    <div class="d-flex align-center gap-2 mb-4">
      <NuxtLink to="/market/emojis">
        <v-btn color="primary" variant="tonal">Эмодзи</v-btn>
      </NuxtLink>
      <NuxtLink to="/market/stickers">
        <v-btn color="primary" variant="tonal">Стикеры</v-btn>
      </NuxtLink>
      <NuxtLink to="/market/templates">
        <v-btn variant="tonal">Шаблоны серверов</v-btn>
      </NuxtLink>
      <NuxtLink to="/market/sound-packs">
        <v-btn variant="tonal">Звуковые паки</v-btn>
      </NuxtLink>
      <NuxtLink to="/market/alert-video">
        <v-btn variant="tonal">Алерты видео</v-btn>
      </NuxtLink>
      <NuxtLink to="/market/alert-audio">
        <v-btn variant="tonal">Алерты аудио</v-btn>
      </NuxtLink>
    </div>
    <NuxtPage />
  </v-container>
</template>
<script setup lang="ts">
// дочерние страницы будут подставлены в <NuxtPage />
</script>