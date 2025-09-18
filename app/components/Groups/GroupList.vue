<!-- components/groups/GroupList.vue -->
<template>
  <v-list>
    <v-list-item
      v-for="group in groups"
      :key="group.id"
      rounded="lg"
      @click="open(group.id)"
    >
      <template #prepend>
        <v-avatar size="40">
          <v-img :src="group.avatar || defaultGroupAvatar" alt="" />
        </v-avatar>
      </template>
      <v-list-item-title>{{ group.name }}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import groupExample from '@/assets/profile/group_example.jpg'

export default defineComponent({
  name: 'GroupList',
  props: {
    groups: { type: Array, required: true },
  },
  emits: ['opened'],
  setup(_, { emit }) {
    const router = useRouter()
    const defaultGroupAvatar = groupExample

    const open = (id: string) => {
      router.push('/GroupsView') // при необходимости заменить на реальный путь группы
      emit('opened', id)
    }

    return { defaultGroupAvatar, open }
  },
})
</script>