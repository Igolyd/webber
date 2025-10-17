<template>
  <v-container>
    <v-card>
      <v-card-title>Заблокированные пользователи</v-card-title>
      <v-card-text>
        <v-list v-if="blocked.length">
          <v-list-item v-for="u in blocked" :key="u.id" @click="openProfile(u.id)">
            <template #prepend>
              <v-avatar size="36"><v-img :src="u.avatar || defaultAvatar" /></v-avatar>
            </template>
            <v-list-item-title>{{ u.name }}</v-list-item-title>
            <template #append>
              <v-btn size="small" @click.stop="unblock(u.id)">Разблокировать</v-btn>
            </template>
          </v-list-item>
        </v-list>
        <div v-else>Список пуст</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useCommunicationStore } from '~/stores/user/communication'
import dfAvatar from '~/assets/profile/profile_exp.jpg'

export default defineComponent({
  setup() {
    const comm = useCommunicationStore()
    function unblock(id: string) { comm.unblock(id) }
    function openProfile(id: string) { /* TODO: переход к профилю пользователя */ }
    return { blocked: comm.blockedUsers, unblock, openProfile, dfAvatar }
  },
})
</script>
