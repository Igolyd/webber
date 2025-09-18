vue
<!-- components/Settings/SettingsProfileUser.vue -->
<template>
  <div class="settings-profile-user d-flex">
    <SettingsPanel class="mr-4" @navigate="onNavigate" />
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

<script lang="ts">
import { defineComponent, computed, ref, h, defineAsyncComponent } from 'vue'
import SettingsPanel from '~/components/Settings/SettingsPanel.vue'

type GroupKey = 'app' | 'user'
type SectionKey =
  | 'notifications'
  | 'language'
  | 'appearance'
  | 'accessibility'
  | 'chat'
  | 'hotkeys'
  | 'streamer'
  | 'av'
  | 'account'
  | 'communication'
  | 'devices'
  | 'integration'
  | 'privacy'
  | 'profiles'
  | 'privacyAC'
  | 'overlay'
  | 'SetAC'

export default defineComponent({
  name: 'SettingsProfileUser',
  components: { SettingsPanel },
  setup() {
    const group = ref<GroupKey>('app')
    const section = ref<SectionKey>('notifications')

    const Loading = {
      name: 'SettingsAsyncLoading',
      render() {
        return h('div', { class: 'skeleton' }, 'Загрузка…')
      },
    }

    const ErrorComp = {
      name: 'SettingsAsyncError',
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
      // app
      'app:notifications': makeAsync(() => import('~/components/Settings/App/AppNotifications.vue')),
      'app:language':      makeAsync(() => import('~/components/Settings/App/AppLanguage.vue')),
      'app:appearance':    makeAsync(() => import('~/components/Settings/App/AppAppearance.vue')),
      'app:accessibility': makeAsync(() => import('~/components/Settings/App/AppAccessibility.vue')),
      'app:chat':          makeAsync(() => import('~/components/Settings/App/AppChat.vue')),
      'app:hotkeys':       makeAsync(() => import('~/components/Settings/App/AppHotkeys.vue')),
      'app:streamer':      makeAsync(() => import('~/components/Settings/App/AppStreamer.vue')),
      'app:av':            makeAsync(() => import('~/components/Settings/App/AppAV.vue')),

      // user
      'user:account':       makeAsync(() => import('~/components/Settings/User/UserAccount.vue')),
      'user:communication': makeAsync(() => import('~/components/Settings/User/UserCommunication.vue')),
      'user:devices':       makeAsync(() => import('~/components/Settings/User/UserDevices.vue')),
      'user:integration':   makeAsync(() => import('~/components/Settings/User/UserIntegrations.vue')),
      'user:privacy':       makeAsync(() => import('~/components/Settings/User/UserPrivacy.vue')),
      'user:profiles':      makeAsync(() => import('~/components/Settings/User/UserProfiles.vue')),

      // activity
      'activity:privacyAC': makeAsync(() => import('~/components/Settings/Activity/ActivityPrivacy.vue')),
      'activity:overlay':   makeAsync(() => import('~/components/Settings/Activity/ActivityOverlay.vue')),
      'activity:SetAC':     makeAsync(() => import('~/components/Settings/Activity/ActivityApps.vue')),
    }

    const currentKey = computed(() => `${group.value}:${section.value}`)
    const currentComponent = computed(() => map[currentKey.value] ?? {
      render: () => h('div', 'Секция не найдена'),
    })

    function onNavigate(payload: { group: GroupKey; section: SectionKey }) {
      group.value = payload.group
      section.value = payload.section
    }

    // Безопасный дефолт
    if (!map[currentKey.value]) {
      group.value = 'app'
      section.value = 'notifications'
    }

    return { onNavigate, currentComponent, currentKey }
  },
})
</script>