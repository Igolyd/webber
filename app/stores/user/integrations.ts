// stores/user/integrations.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Integration =
  | 'vk' | 'telegram' | 'steam' | 'boosty' | 'twitch' | 'x'
  | 'youtube' | 'rutube' | 'vklive' | 'github'

export const useIntegrationsStore = defineStore('integrations', () => {
  const connected = ref<Record<Integration, boolean>>({
    vk: false, telegram: false, steam: false, boosty: false, twitch: false, x: false,
    youtube: false, rutube: false, vklive: false, github: false,
  })

  function connect(provider: Integration) {
    // TODO: redirect to OAuth / Telegram widget flow, then set connected[provider] = true
  }
  function disconnect(provider: Integration) {
    // TODO: API revoke
    connected.value[provider] = false
  }

  return { connected, connect, disconnect }
})