<template>
  <v-card class="profile-card" elevation="8">
    <v-card-title class="pa-0">
      <BannerAvatar
        :src="user?.avatar || defaultAvatar"
        :fallback="defaultAvatar"
        :banner="user?.banner || ''"
        :banner-color="defaultBanner"
        :overlay-color="bannerOverlayColor"
        :overlay-opacity="bannerOverlayOpacity"
        :size="avatarSize"
      />
    </v-card-title>

    <v-card-text class="pt-1 px-4">
      <div class="d-flex align-center flex-wrap ga-2">
        <div class="text-subtitle-1 font-weight-medium text-truncate">
          {{ user?.name || 'Без имени' }}
        </div>

        <v-tooltip text="Нажмите, чтобы скопировать ID" location="bottom">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              size="small"
              variant="plain"
              color="primary"
              class="cursor-pointer text-no-wrap"
              @click="copy(user?.id || '')"
            >
              <v-icon start size="16">mdi-pound</v-icon>
              <span class="id-clip">{{ user?.id || '—' }}</span>
              <v-icon end size="16" class="ml-1">mdi-content-copy</v-icon>
            </v-chip>
          </template>
        </v-tooltip>
      </div>

      <div class="mt-1 text-body-2 text-medium-emphasis">
        @{{ user?.uniqueName }}
      </div>

      <div class="mt-2 text-center text-body-2 text-medium-emphasis quote">
        {{ user?.quote || 'Без цитаты' }}
      </div>

      <div class="mt-2 d-flex justify-center" v-if="user?.groupTag">
        <v-chip size="small" variant="outlined" prepend-icon="mdi-tag">
          {{ user?.groupTag }}
        </v-chip>
      </div>

      <div class="mt-4">
        <div class="text-overline text-medium-emphasis">Роли в группе</div>
        <div class="d-flex align-center flex-wrap gap-1 mt-1">
          <v-chip
            v-for="r in rolesInGroup"
            :key="r.id"
            size="small"
            variant="flat"
            :style="{ backgroundColor: r.color, color: '#000' }"
          >
            <v-icon v-if="r.icon" start size="16">{{ r.icon }}</v-icon>
            {{ r.name }}
          </v-chip>
          <div v-if="!rolesInGroup.length" class="text-body-2 text-medium-emphasis">
            Нет ролей
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="text-overline text-medium-emphasis">О пользователе</div>
        <div class="about pre-wrap">
          {{ user?.about || 'Описание отсутствует' }}
        </div>
      </div>
    </v-card-text>

    <v-card-actions class="px-4 pb-3 pt-1">
      <div class="w-100 d-flex ga-2 flex-wrap">
        <v-btn
          class="flex-1-1"
          size="small"
          variant="outlined"
          prepend-icon="mdi-message-outline"
          @click="$emit('dm', user?.id)"
        >
          Написать
        </v-btn>
        <v-btn
          class="flex-1-1"
          size="small"
          variant="outlined"
          
          prepend-icon="mdi-at"
          @click="$emit('mention', user?.id)"
        >
          Упомянуть
        </v-btn>
      </div>
    </v-card-actions>

    <v-snackbar v-model="copiedSnack" timeout="1400" variant="outlined">
      Скопировано
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import BannerAvatar from '~/components/MiniProfile/BannerAvatar.vue'
import { useUsersStore } from '@/stores/users'
import { useRolesStore } from '@/stores/roles'
import type { Role } from '@/stores/roles'
import dfAvatar from '@/assets/profile/profile_exp.jpg'

const props = defineProps<{
  userId: string
  groupId: string
}>()

const emit = defineEmits<{
  (e: 'dm', userId?: string): void
  (e: 'mention', userId?: string): void
}>()

const { xs } = useDisplay()
const avatarSize = computed(() => (xs.value ? 92 : 104))
const defaultAvatar = dfAvatar
const defaultBanner = 'linear-gradient(180deg, #8ec5e5, #4f9cf9)'
const bannerOverlayColor = '#000'
const bannerOverlayOpacity = 0.25

const users = useUsersStore()
const roles = useRolesStore()

const user = computed(() => users.getById(props.userId))

const rolesInGroup = computed<Role[]>(() => {
  if (!props.groupId || !user.value) return []
  const mem = user.value.memberships.find(m => m.groupId === props.groupId)
  const ids = mem?.roleIds ?? []
  const list = ids
    .map(id => roles.getRoleById(id))
    .filter(Boolean) as Role[]
  return list.sort((a, b) => a.name.localeCompare(b.name))
})

const copiedSnack = ref(false)
async function copy(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copiedSnack.value = true
}
</script>

<style scoped>
.profile-card {
  border-radius: 14px;
  width: clamp(280px, 92vw, 320px);
  min-height: 420px;
  max-height: 680px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.quote { font-style: italic; }
.pre-wrap { white-space: pre-wrap; word-break: break-word; }
.id-clip { display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.cursor-pointer { cursor: pointer; }
.flex-1-1 { flex: 1 1 0; }
.gap-1 { gap: 4px; }
</style>