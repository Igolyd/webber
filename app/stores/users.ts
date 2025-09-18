// stores/users.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { computed } from 'vue'
import { useUserAccountStore } from '@/stores/user/account'

export interface GroupMembership {
  groupId: string
  roleIds: string[]
}

export type Badge =
  | { id: 'founder'; label: 'Founder'; color: string }
  | { id: 'mod'; label: 'Moderator'; color: string }
  | { id: 'vip'; label: 'VIP'; color: string }

export type Decoration =
  | { id: 'sparkles'; name: 'Sparkles' }
  | { id: 'rings'; name: 'Rings' }
  | { id: 'lines'; name: 'Lines' }

export type ProfileEffect =
  | { id: 'glow'; name: 'Glow'; intensity: number }
  | { id: 'shadow'; name: 'Shadow'; intensity: number }

export interface AppUser {
  id: string
  name: string
  uniqueName: string
  avatar?: string
  banner: string
  badge: Badge | null
  decoration: Decoration | null
  effects: ProfileEffect[]
  about: string
  quote: string
  groupTag: string
  memberships: GroupMembership[]
  createdAt: string
  online?: boolean
  friendIds: string[]
}

function slugifyUniqueName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '')
    .slice(0, 24)
}

export const useUsersStore = defineStore('users', () => {
  // useStorage возвращает Ref<AppUser[]>, это ок для setup-стора
  const users = useStorage<AppUser[]>('app.users', [])

  // GETTERS (как функции/computed)
  const getById = (id: string) => users.value.find(u => u.id === id) || null

  const getByUniqueName = (uniqueName: string) =>
    users.value.find(u => u.uniqueName.toLowerCase() === uniqueName.toLowerCase()) || null

  const getUsersByGroup = (groupId: string) =>
    users.value.filter(u => u.memberships.some(m => m.groupId === groupId))

  const getUserRolesInGroup = (userId: string, groupId: string) => {
    const u = users.value.find(x => x.id === userId)
    return u?.memberships.find(m => m.groupId === groupId)?.roleIds ?? []
  }

  const getFriendsOf = (userId: string) => {
    const u = users.value.find(x => x.id === userId)
    if (!u) return []
    return u.friendIds
      .map(fid => users.value.find(x => x.id === fid))
      .filter(Boolean) as AppUser[]
  }

  const myFriends = computed<AppUser[]>(() => {
    const account = useUserAccountStore()
    if (!account.userId) return []
    return getFriendsOf(account.userId)
  })

  const searchUsers = (q: string, excludeIds: string[] = []) => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return users.value.filter(u => {
      if (excludeIds.includes(u.id)) return false
      return u.name.toLowerCase().includes(s) || u.uniqueName.toLowerCase().includes(s)
    })
  }

  // ACTIONS
  function addUser(payload: Partial<AppUser> & { name: string; uniqueName?: string }) {
    const now = new Date().toISOString()
    // гарантируем уникальность uniqueName
    let uniqueName = payload.uniqueName ? slugifyUniqueName(payload.uniqueName) : slugifyUniqueName(payload.name)
    const base = uniqueName || 'user'
    let suffix = 0
    while (getByUniqueName(uniqueName)) {
      suffix++
      uniqueName = `${base}${suffix}`
    }

    const user: AppUser = {
      id: crypto.randomUUID(),
      name: payload.name,
      uniqueName,
      avatar: payload.avatar || '',
      banner: payload.banner || '',
      badge: payload.badge ?? null,
      decoration: payload.decoration ?? null,
      effects: payload.effects ?? [],
      about: payload.about ?? '',
      quote: payload.quote ?? '',
      groupTag: payload.groupTag ?? '',
      memberships: payload.memberships || [],
      createdAt: now,
      online: payload.online ?? false,
      friendIds: payload.friendIds ?? [],
    }
    users.value = [user, ...users.value]
    return user
  }

  function ensureUserByAccount(payload: { userId?: string; name?: string; avatar?: string; uniqueName?: string }) {
    if (payload.userId) {
      const exists = users.value.find(u => u.id === payload.userId)
      if (exists) return exists
    }
    const created = addUser({
      name: payload.name || 'Me',
      avatar: payload.avatar || '',
      uniqueName: payload.uniqueName,
      online: true,
    })
    return created
  }

  function patchUser(userId: string, partial: Partial<Omit<AppUser, 'id' | 'createdAt'>>) {
    const idx = users.value.findIndex(x => x.id === userId)
    if (idx === -1) return
    const current = users.value[idx]

    // нельзя менять uniqueName на пустой/дубликат
    if (partial.uniqueName) {
      const norm = slugifyUniqueName(partial.uniqueName)
      if (!norm) return
      const taken = getByUniqueName(norm)
      if (taken && taken.id !== userId) return
      partial.uniqueName = norm
    }

    const updated = { ...current, ...partial }
    // иммутабельная замена, чтобы гарантировать запись в localStorage
    users.value = users.value.map(x => (x.id === userId ? updated : x))
  }

  function addUserToGroup(userId: string, groupId: string) {
    const u = users.value.find(x => x.id === userId)
    if (!u) return
    if (!u.memberships.some(m => m.groupId === groupId)) {
      const updated = { ...u, memberships: [...u.memberships, { groupId, roleIds: [] }] }
      users.value = users.value.map(x => (x.id === userId ? updated : x))
    }
  }

  function removeUserFromGroup(userId: string, groupId: string) {
    const u = users.value.find(x => x.id === userId)
    if (!u) return
    const updated = { ...u, memberships: u.memberships.filter(m => m.groupId !== groupId) }
    users.value = users.value.map(x => (x.id === userId ? updated : x))
  }

  function assignRole(userId: string, groupId: string, roleId: string) {
    const u = users.value.find(x => x.id === userId)
    if (!u) return
    const mem = u.memberships.find(m => m.groupId === groupId)
    let updated: AppUser
    if (!mem) {
      updated = { ...u, memberships: [...u.memberships, { groupId, roleIds: [roleId] }] }
    } else if (!mem.roleIds.includes(roleId)) {
      const newMemberships = u.memberships.map(m =>
        m.groupId === groupId ? { ...m, roleIds: [...m.roleIds, roleId] } : m
      )
      updated = { ...u, memberships: newMemberships }
    } else {
      return
    }
    users.value = users.value.map(x => (x.id === userId ? updated : x))
  }

  function removeRole(userId: string, groupId: string, roleId: string) {
    const u = users.value.find(x => x.id === userId)
    if (!u) return
    const mem = u.memberships.find(m => m.groupId === groupId)
    if (!mem) return
    const newMemberships = u.memberships.map(m =>
      m.groupId === groupId ? { ...m, roleIds: m.roleIds.filter(id => id !== roleId) } : m
    )
    const updated = { ...u, memberships: newMemberships }
    users.value = users.value.map(x => (x.id === userId ? updated : x))
  }

  function addFriend(userId: string, friendId: string, reciprocal = true) {
    if (userId === friendId) return
    const u = users.value.find(x => x.id === userId)
    const f = users.value.find(x => x.id === friendId)
    if (!u || !f) return

    const newU = u.friendIds.includes(friendId) ? u : { ...u, friendIds: [...u.friendIds, friendId] }
    let newF = f
    if (reciprocal && !f.friendIds.includes(userId)) {
      newF = { ...f, friendIds: [...f.friendIds, userId] }
    }

    users.value = users.value.map(x => (x.id === newU.id ? newU : x.id === newF.id ? newF : x))
  }

  function removeFriend(userId: string, friendId: string, reciprocal = true) {
    const u = users.value.find(x => x.id === userId)
    if (!u) return
    const f = users.value.find(x => x.id === friendId)

    const newU = { ...u, friendIds: u.friendIds.filter(id => id !== friendId) }
    let newF = f
    if (f && reciprocal) {
      newF = { ...f, friendIds: f.friendIds.filter(id => id !== userId) }
    }

    users.value = users.value.map(x => (x.id === userId ? newU : x.id === friendId ? (newF as AppUser) : x))
  }

  // первичное наполнение (5 пользователей, 2 — друзья текущего)
  function ensureSeed() {
    if (users.value.length > 0) return

    const u1 = addUser({
      name: 'Alice Johnson',
      uniqueName: 'alice',
      avatar: '/avatars/alice.jpg',
      banner: '/banners/alice.jpg',
      badge: { id: 'vip', label: 'VIP', color: '#f5c542' },
      decoration: { id: 'rings', name: 'Rings' },
      effects: [{ id: 'glow', name: 'Glow', intensity: 2 }],
      about: 'Frontend dev',
      quote: 'Keep it simple',
      groupTag: 'FRONT',
      online: true,
    })
    const u2 = addUser({
      name: 'Bob Martin',
      uniqueName: 'bob',
      avatar: '/avatars/bob.jpg',
      banner: '/banners/bob.jpg',
      badge: null,
      decoration: { id: 'lines', name: 'Lines' },
      effects: [],
      about: 'Backend enjoyer',
      quote: 'Code. Sleep. Repeat.',
      groupTag: 'BACK',
      online: true,
    })
    const u3 = addUser({
      name: 'Charlie Kim',
      uniqueName: 'charlie',
      avatar: '/avatars/charlie.jpg',
      banner: '/banners/charlie.jpg',
      badge: { id: 'mod', label: 'Moderator', color: '#4caf50' },
      decoration: { id: 'sparkles', name: 'Sparkles' },
      effects: [{ id: 'shadow', name: 'Shadow', intensity: 1 }],
      about: 'Moderator',
      quote: 'Be kind',
      groupTag: 'MOD',
      online: false,
    })
    const u4 = addUser({
      name: 'Diana Ross',
      uniqueName: 'diana',
      avatar: '/avatars/diana.jpg',
      banner: '/banners/diana.jpg',
      badge: null,
      decoration: null,
      effects: [],
      about: 'Designer',
      quote: 'Design is intelligence made visible',
      groupTag: 'UX',
      online: true,
    })
    const u5 = addUser({
      name: 'Ethan Page',
      uniqueName: 'ethan',
      avatar: '/avatars/ethan.jpg',
      banner: '/banners/ethan.jpg',
      badge: { id: 'founder', label: 'Founder', color: '#ff6b6b' },
      decoration: null,
      effects: [],
      about: 'Founder of the app',
      quote: 'Ship it',
      groupTag: 'CORE',
      online: false,
    })

    const account = useUserAccountStore()
    const me = ensureUserByAccount({
      userId: account.userId,
      name: account.name || 'Me',
      avatar: account.avatar,
      uniqueName: account.username || 'me',
    })
    if (!account.userId) {
      account.userId = me.id
      account.name = me.name
      account.username = me.uniqueName
    }

    addFriend(me.id, u1.id, true)
    addFriend(me.id, u2.id, true)
  }

  return {
    // state
    users,
    // getters/selector functions
    getById,
    getByUniqueName,
    getUsersByGroup,
    getUserRolesInGroup,
    getFriendsOf,
    myFriends,
    searchUsers,
    // actions
    addUser,
    ensureUserByAccount,
    patchUser,
    addUserToGroup,
    removeUserFromGroup,
    assignRole,
    removeRole,
    addFriend,
    removeFriend,
    ensureSeed,
  }
})