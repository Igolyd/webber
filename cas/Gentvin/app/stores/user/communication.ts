// stores/user/communication.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type BlockedUser = { id: string; name: string; avatar?: string }

export const useCommunicationStore = defineStore('communication', () => {
  const blockedUsers = ref<BlockedUser[]>([])

  function block(user: BlockedUser) {
    if (!blockedUsers.value.find(u => u.id === user.id)) blockedUsers.value.push(user)
  }
  function unblock(id: string) {
    blockedUsers.value = blockedUsers.value.filter(u => u.id !== id)
  }

  return { blockedUsers, block, unblock }
})