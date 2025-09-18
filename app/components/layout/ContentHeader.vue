<!-- components/layout/ContentHeader.vue -->
<template>
  <header class="content-header">
    <v-btn
      v-if="isSmAndDown"
      icon
      variant="text"
      :title="'Меню'"
      @click="$emit('open-left')"
    >
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <h2 class="text-subtitle-1">{{ title }}</h2>
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
  </header>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useDisplay } from 'vuetify'

export default defineComponent({
  name: 'ContentHeader',
  props: {
    title: { type: String, required: true },
    plusTitle: { type: String, default: 'Добавить' },
    showPlus: { type: Boolean, default: true },
    showSearch: { type: Boolean, default: true },
  },
  emits: ['open-left', 'plus', 'search'],
  setup() {
    const { smAndDown } = useDisplay()
    const isSmAndDown = computed(() => smAndDown.value)
    return { isSmAndDown }
  },
})
</script>

<style scoped>
.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #2c2c2c;
}
.content-header .spacer {
  flex: 1;
}
</style>