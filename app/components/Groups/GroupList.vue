<template>
  <v-list>
    <v-hover
      v-for="group in groups"
      :key="group.id"
      v-slot="{ isHovering, props: hoverProps }"
    >
      <v-list-item
        v-bind="hoverProps"
        rounded="lg"
        :style="groupItemStyle(group.id, isHovering)"
        @click="open(group.id)"
      >
        <template #prepend>
          <v-avatar size="40">
            <v-img :src="group.avatar || defaultGroupAvatar" alt="" />
          </v-avatar>
        </template>
        <v-list-item-title>{{ group.name }}</v-list-item-title>
      </v-list-item>
    </v-hover>
  </v-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import groupExample from '@/assets/profile/group_example.jpg'
import { useGroupsStore } from '@/stores/groups'

export default defineComponent({
  name: 'GroupList',
  props: { groups: { type: Array, required: true } },
  setup() {
    const router = useRouter()
    const defaultGroupAvatar = groupExample
    const groupsStore = useGroupsStore()

    const open = (id: string) => {
      router.push('/GroupsView') // или реальный путь к группе
    }

    function isGradientLike(v?: string) {
      if (!v) return false
      const s = v.toLowerCase().trim()
      return s.includes('gradient(') || s.startsWith('url(')
    }

    function groupItemStyle(groupId: string, isHovering: boolean) {
      const prof = groupsStore.getProfile(groupId)
      const c = prof?.badge?.color as string | undefined
      const shape = ((prof as any)?.badgeShape || 'rounded') as 'pill' | 'rounded' | 'square'
      const style: Record<string, string> = {
        transition: 'filter .18s ease, background .18s ease, background-color .18s ease, border-radius .18s ease',
        filter: isHovering ? 'none' : 'opacity(0.75) saturate(0.92) brightness(0.98)',
        borderRadius: shape === 'pill' ? '9999px' : shape === 'square' ? '8px' : '12px',
      }
      if (c) {
        if (isGradientLike(c)) style.background = c
        else style.backgroundColor = c
      }
      return style
    }

    return { defaultGroupAvatar, open, groupItemStyle }
  },
})
</script>