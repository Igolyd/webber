<template>
  <v-app class="theme-root">
    <div class="app-bg-base"></div>
    <div class="app-bg-overlay"></div>

    <v-app-bar color="var(--rnav-elev-1)" elevation="0" height="48">
      <template #image>
        <v-img :gradient="appBarGradient" />
      </template>

      <v-spacer />
      <v-spacer />
    </v-app-bar>

    <v-main class="app-main">
      <NuxtPage />
    </v-main>

    <client-only>
      <CallWindowProvider />
      <AlertOverlayStack />
    </client-only>

    <ThemeBridge />
  </v-app>
</template>

<script setup lang="ts">
import CallWindowProvider from "~/components/CallWindowProvider.vue";
// import defaultLogo from "./assets/app/logo.png";
import ThemeBridge from "./components/system/ThemeBridge.vue";
import AlertOverlayStack from "./components/alerts/AlertOverlayStack.vue";
import "vue-gif-emoji-picker/dist/style.css";

const appBarGradient =
  "linear-gradient(" +
  "to top," +
  "color-mix(in srgb, var(--lnav-background) 70%, var(--gradient-bg-color) 30%) 0%," +
  "var(--rnav-elev-1) 60%," +
  "var(--rnav-elev-1) 100%" +
  ")";
</script>

<style>
/* v-app делаем "прозрачным", фоном рулит .app-bg-base */
.v-application {
  background: transparent !important;
  position: relative;
  z-index: 1;
}

.theme-root {
  color: var(--app-text-color);
}
/* Общий фон-контейнер — одна «единая» картинка на всё приложение */
.app-bg-base {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-color: var(--app-bg-color);
  background-image: var(--app-bg-image);
  background-size: var(--app-bg-size);
  background-position: var(--app-bg-position);
  background-repeat: var(--app-bg-repeat);
  will-change: transform;
}

/* Overlay для контраста текста */
.app-bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--app-bg-overlay-color);
  opacity: var(--app-bg-overlay-opacity);
}

html,
body,
#\__nuxt {
  height: 100%;
  overflow: hidden; /* прячем глобальный скролл */
}

.v-application,
.v-application__wrap {
  height: 100%;
  overflow: hidden; /* на всякий случай */
}

.app-main {
  /* без явной высоты — Vuetify сам учитывает v-app-bar */
  min-height: 0; /* важно, чтобы flex-контейнеры внутри могли сжиматься */
  overflow: hidden; /* убираем прокрутку у main, пусть скроллятся внутренние области */
}
.v-app-bar {
  backdrop-filter: blur(6px);
}
</style>
