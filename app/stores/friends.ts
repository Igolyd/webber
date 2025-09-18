// stores/friends.ts (адаптер поверх users)
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useUserAccountStore } from '@/stores/user/account'

export interface Friend {
  id: string
  name: string
  avatar?: string
  online?: boolean
}

export const useFriendsStore = defineStore('friends', () => {
  const usersStore = useUsersStore()
  const account = useUserAccountStore()

  const friends = computed<Friend[]>(() => {
    if (!account.userId) return []
    return usersStore.getFriendsOf(account.userId).map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      online: u.online,
    }))
  })

  function addFriend(f: Friend) {
    // если пользователя нет в users — добавим
    const exists = usersStore.getById(f.id)
    if (!exists) {
      usersStore.addUser({
        name: f.name,
        avatar: f.avatar || '',
        online: f.online ?? false,
      } as any)
    }
    if (account.userId) usersStore.addFriend(account.userId, f.id, true)
  }

  function removeFriend(id: string) {
    if (account.userId) usersStore.removeFriend(account.userId, id, true)
  }

  function setFriends(list: Friend[]) {
    // полная замена: сначала удалить всех, затем добавить
    if (!account.userId) return
    const current = new Set(usersStore.getFriendsOf(account.userId).map(u => u.id))
    for (const fid of current) usersStore.removeFriend(account.userId, fid, true)
    for (const f of list) addFriend(f)
  }

  return { friends, setFriends, addFriend, removeFriend }
})