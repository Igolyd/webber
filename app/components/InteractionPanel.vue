<!-- InteractionPanel.vue -->
<template>
  <v-navigation-drawer location="top" :width="60">
    <v-card elevation="10">
      <div class="toolbar-header">
        <div class="info-frd-user">
          <img :src="avatarSrc" alt="Avatar" class="int_img" />
          <h6>{{ title }}</h6>
        </div>
        <div class="interaction-controls">
          <slot></slot>
        </div>
      </div>
    </v-card>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'InteractionPanel',
  props: {
    avatarSrc: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
  },
})
</script>

<style scoped>
.toolbar-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.info-frd-user {
  display: flex;
  align-items: center;
}

.int_img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 8px;
}

.interaction-controls {
  display: flex;
  align-items: center;
}

.interaction-btn {
  background-color: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.interaction-btn img {
  width: 20px;
  height: 20px;
}
</style>