<!-- components/authors/AuthorsList.vue -->
<template>
  <v-list density="comfortable" class="py-0">
    <v-list-subheader>Сообщества авторов</v-list-subheader>

    <v-list-item v-for="c in communities" :key="c.id" rounded="lg">
      <template #prepend>
        <v-avatar size="32">
          <template v-if="c.avatar">
            <v-img :src="c.avatar" :alt="c.name" cover />
          </template>
          <template v-else>
            <v-icon>mdi-account-star-outline</v-icon>
          </template>
        </v-avatar>
      </template>

      <v-list-item-title class="text-truncate">
        {{ c.name }}
      </v-list-item-title>
      <v-list-item-subtitle v-if="c.quote" class="text-truncate">
        {{ c.quote }}
      </v-list-item-subtitle>
    </v-list-item>

    <v-list-item v-if="!communities.length" class="opacity-70">
      <v-list-item-title>Сообществ пока нет</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import type { AuthorCommunity } from "~/stores/authors";

defineProps<{
  communities: AuthorCommunity[];
}>();
</script>

<style scoped>
.opacity-70 {
  opacity: 0.7;
}
</style>
