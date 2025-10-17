<template>
  <div>
    <v-list>
      <v-hover v-for="friend in friends" :key="friend.id" v-slot="{ isHovering, props: hoverProps }">
        <v-list-item
          v-bind="hoverProps"
          rounded="lg"
          :style="friendItemStyle(friend, isHovering)"
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
            <span class="text-caption text-medium-emphasis">@{{ friend.uniqueName }}</span>
          </v-list-item-title>
          <template #append>
            <v-icon v-if="friend.online" color="green" size="14">mdi-circle</v-icon>
          </template>
        </v-list-item>
      </v-hover>
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
import type { AppUser } from '@/stores/users'

export default defineComponent({
  name: 'FriendList',
  props: {
    friends: { type: Array as () => AppUser[], required: true },
  },
  setup() {
    const router = useRouter()
    const confirmRemoveDialog = ref(false)
    const removeId = ref<string | null>(null)

const open = (id: string) => router.push(`/dm/${id}`)
const askRemove = (id: string) => { removeId.value = id; confirmRemoveDialog.value = true }
const confirmRemoveConfirm = () => {
  confirmRemoveDialog.value = false
  removeId.value = null
}

function isGradientLike(v?: string) {
  if (!v) return false
  const s = v.toLowerCase().trim()
  return s.includes('gradient(') || s.startsWith('url(')
}
function friendItemStyle(friend: AppUser, isHovering: boolean) {
  const c = (friend.badge as any)?.color as string | undefined
  const style: Record<string, string> = {
    transition: 'filter .18s ease, background .18s ease, background-color .18s ease, border-radius .18s ease',
    filter: isHovering ? 'none' : 'opacity(0.75) saturate(0.92) brightness(0.98)',
    borderRadius: '12px',
    overflow: 'hidden',
  }
  if (c) {
    if (isGradientLike(c)) style.background = c
    else style.backgroundColor = c
  }
  return style
}

return { open, askRemove, confirmRemoveDialog, confirmRemoveConfirm, friendItemStyle }
  
},
})
</script>