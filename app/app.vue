<template>
  <v-app>
    <v-app-bar color="black" elevation="0" height="48">
      <v-spacer />
      <h2 class="text-white">Gentvin</h2>
      <v-spacer />
    </v-app-bar>

    <v-main class="app-main">
      <NuxtPage />
    </v-main>
    <client-only>
      <CallWindowProvider />
    </client-only>
  </v-app>
</template>

<script setup lang="ts">
import CallWindowProvider from "~/components/CallWindowProvider.vue";
</script>

<style scoped>
.app-main {
  height: calc(100vh - 48px);
}
</style>
