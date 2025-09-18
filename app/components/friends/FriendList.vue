<!-- components/friends/FriendList.vue -->
<template>
  <div>
    <v-list>
      <v-list-item
        v-for="friend in friends"
        :key="friend.id"
        rounded="lg"
        @click="open(friend.id)"
        @contextmenu.prevent.stop="askRemove(friend.id)"
      >
        <template #prepend>
          <v-avatar size="40">
            <v-img :src="friend.avatar || '/avatars/default.jpg'" alt="" />
          </v-avatar>
        </template>
        <v-list-item-title>
          {{ friend.name }}
          <span class="text-caption text-medium-emphasis">
            @{{ friend.uniqueName }}
          </span>
        </v-list-item-title>
        <template #append>
          <v-icon v-if="friend.online" color="green" size="14">mdi-circle</v-icon>
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="confirmRemoveDialog" max-width="420">
      <v-card>
        <v-card-title>Удалить из друзей?</v-card-title>
        <v-card-text>Вы уверены, что хотите удалить этого пользователя из списка друзей?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmRemoveDialog = false">Отмена</v-btn>
          <v-btn color="error" @click="confirmRemoveConfirm">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useUserAccountStore } from '@/stores/user/account'

export default defineComponent({
  name: 'FriendList',
  props: {
    friends: { type: Array, required: true },
  },
  setup() {
    const router = useRouter()
    const users = useUsersStore()
    const account = useUserAccountStore()

    const confirmRemoveDialog = ref(false)
    const removeId = ref<string | null>(null)

    const open = (id: string) => {
      router.push(`/dm/${id}`)
    }

    const askRemove = (id: string) => {
      removeId.value = id
      confirmRemoveDialog.value = true
    }

    const confirmRemoveConfirm = () => {
      if (removeId.value && account.userId) {
        users.removeFriend(account.userId, removeId.value, true)
      }
      confirmRemoveDialog.value = false
      removeId.value = null
    }

    return {
      open,
      askRemove,
      confirmRemoveDialog,
      confirmRemoveConfirm,
    }
  },
})
</script>