<!-- vue -->
<!-- pages/groups/[id]/settings.vue -->
<template>
  <div class="settings-groups d-flex">
    <SettingGroupPanel class="mr-4" @navigate="onNavigate" />

    <div class="flex-grow-1">
      <ClientOnly>
        <component :is="currentComponent" :key="currentKey" />
        <template #placeholder>
          <div class="skeleton">Загрузка…</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, h, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import SettingGroupPanel from '~/components/GroupsSettings/SettingGroupPanel.vue'

// Ключи групп (категории)
type GroupKey = 'group' | 'reactions' | 'people' | 'moderation' | 'advanced'
const validGroups: GroupKey[] = ['group', 'reactions', 'people', 'moderation', 'advanced']

// Ключи секций (подкатегории)
type SectionKey =
  | 'profile'
  | 'serverTag'
  | 'emojis'
  | 'stickers'
  | 'soundboard'
  | 'members'
  | 'roles'
  | 'permissions'
  | 'safety'
  | 'auditLog'
  | 'bans'
  | 'template'
  | 'delete'
const validSections: SectionKey[] = [
  'profile','serverTag','emojis','stickers','soundboard','members','roles','permissions','safety','auditLog','bans','template','delete',
]

const route = useRoute()
// groupId пока не используется в этом файле, но пригодится для дочерних компонентов
const groupId = computed(() => String(route.params.id ?? ''))

// Текущее выбранное
const group = ref<GroupKey>('group')
const section = ref<SectionKey>('profile')

const Loading = {
  name: 'SettingsGroupsAsyncLoading',
  render() {
    return h('div', { class: 'skeleton' }, 'Загрузка…')
  },
}
const ErrorComp = {
  name: 'SettingsGroupsAsyncError',
  render() {
    return h('div', { class: 'text-danger' }, 'Не удалось загрузить секцию')
  },
}

function makeAsync(loader: () => Promise<any>) {
  return defineAsyncComponent({
    loader,
    suspensible: false,
    loadingComponent: Loading,
    errorComponent: ErrorComp,
    delay: 150,
    timeout: 30000,
    onError(_error, retry, fail, attempts) {
      if (attempts <= 2) retry()
      else fail()
    },
  })
}

// Карта секций
const map: Record<string, any> = {
  // 1. Настройки группы
  'group:profile':   makeAsync(() => import('~/components/GroupsSettings/GroupProfile.vue')),
  'group:serverTag': makeAsync(() => import('~/components/GroupsSettings/GroupServerTag.vue')),

  // 2. Реакции
  'reactions:emojis':     makeAsync(() => import('~/components/GroupsSettings/ReactionsEmojis.vue')),
  'reactions:stickers':   makeAsync(() => import('~/components/GroupsSettings/ReactionsStickers.vue')),
  'reactions:soundboard': makeAsync(() => import('~/components/GroupsSettings/ReactionsSoundboard.vue')),

  // 3. Люди
  'people:members':     makeAsync(() => import('~/components/GroupsSettings/PeopleMembers.vue')),
  'people:roles':       makeAsync(() => import('~/components/GroupsSettings/PeopleRoles.vue')),
  'people:permissions': makeAsync(() => import('~/components/GroupsSettings/PeoplePermissions.vue')),

  // 4. Модерация
  'moderation:safety':   makeAsync(() => import('~/components/GroupsSettings/ModerationSafety.vue')),
  'moderation:auditLog': makeAsync(() => import('~/components/GroupsSettings/ModerationAuditLog.vue')),
  'moderation:bans':     makeAsync(() => import('~/components/GroupsSettings/ModerationBans.vue')),

  // 5. Дополнительные
  'advanced:template': makeAsync(() => import('~/components/GroupsSettings/AdvancedTemplate.vue')),
  'advanced:delete':   makeAsync(() => import('~/components/GroupsSettings/AdvancedDelete.vue')),
}

const currentKey = computed(() => `${group.value}:${section.value}`)
const FallbackNotFound = {
  name: 'SettingsGroupsSectionNotFound',
  render: () => h('div', 'Секция не найдена'),
}
const currentComponent = computed(() => map[currentKey.value] ?? FallbackNotFound)

function onNavigate(payload: { group: GroupKey; section: SectionKey }) {
  // Валидация входящих значений на всякий случай
  const nextGroup = validGroups.includes(payload.group) ? payload.group : 'group'
  const nextSection = validSections.includes(payload.section) ? payload.section : 'profile'
  const nextKey = `${nextGroup}:${nextSection}`
  if (!map[nextKey]) {
    group.value = 'group'
    section.value = 'profile'
    return
  }
  group.value = nextGroup
  section.value = nextSection
}

// Безопасный дефолт (если кто-то изменил group/section снаружи)
if (!map[currentKey.value]) {
  group.value = 'group'
  section.value = 'profile'
}
</script>

<style scoped>
.settings-groups {
  min-height: 100%;
}
.skeleton {
  padding: 16px;
  opacity: 0.7;
}
</style>