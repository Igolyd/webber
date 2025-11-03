<!-- components/layout/ContentHeader.vue -->
<template>
  <v-navigation-drawer
    location="top"
    :model-value="true"
    :height="headerHeight"
    :width="headerHeight"
    absolute
    floating
    elevation="0"
    rounded="0"
    color="transparent"
    class="content-header-drawer scope-hdr"
  >
    <div class="content-header" color="transparent" elevation="0">
      <v-btn
        v-if="isSmAndDown"
        icon
        variant="text"
        :title="'Меню'"
        @click="$emit('open-left')"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <div class="spacer"></div>

      <slot name="right-before"></slot>

      <v-btn
        icon
        variant="text"
        :title="'Поиск'"
        v-if="showSearch"
        @click="$emit('search')"
      >
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn
        icon
        variant="text"
        :title="plusTitle"
        v-if="showPlus"
        @click="$emit('plus')"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useDisplay } from "vuetify";

export default defineComponent({
  name: "ContentHeader",
  props: {
    title: { type: String, required: true },
    plusTitle: { type: String, default: "Добавить" },
    showPlus: { type: Boolean, default: true },
    showSearch: { type: Boolean, default: true },
  },
  emits: ["open-left", "plus", "search"],
  setup() {
    const { smAndDown } = useDisplay();
    const isSmAndDown = computed(() => smAndDown.value);
    const headerHeight = computed(() => (isSmAndDown.value ? 58 : 58));
    return { isSmAndDown, headerHeight };
  },
});
</script>

<style scoped>
/* Внешняя «рамка» — прозрачная; бордер из токена (может быть полупрозрачным) */
.content-header-drawer {
  border-top: 1px solid var(--topnav-border, var(--app-outline-variant));
  border-right: 1px solid var(--topnav-border, var(--app-outline-variant));
  background: var(--topnav-elev-1, var(--topnav-background, var(--app-surface)));
}
.scope-hdr {
  --v-theme-surface: var(--topnav-background);
  --v-theme-on-surface: var(--topnav-on-surface);
  --v-theme-outline: var(--topnav-border);
  --v-theme-surface-variant: var(--topnav-elev-1);
}
/* Сам контент — фон из токена секции шапки; если нужен «сквозной», задаёшь --topnav-background: transparent */
.content-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

/* На всякий случай перекрываем дефолт v-card */
:deep(.v-card) {
  background: var(--topnav-background) !important;
  color: var(--topnav-on-surface);
  box-shadow: none !important;
}

.content-header .spacer {
  flex: 1;
}
</style>
