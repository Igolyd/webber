// stores/user/devices.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SessionDevice = {
  id: string
  device: string
  location?: string
  lastActive: string
  current?: boolean
}

export const useDevicesStore = defineStore('devices', () => {
  const sessions = ref<SessionDevice[]>([])

  async function fetchSessions() {
    // TODO: API
    sessions.value = [
      { id: '1', device: 'Windows • Chrome', lastActive: '2025-09-01 12:00', current: true },
      { id: '2', device: 'Android • App', lastActive: '2025-08-28 19:22' },
    ]
  }

  async function logoutAll() {
    // TODO: API
    sessions.value = sessions.value.filter(s => s.current)
  }

  return { sessions, fetchSessions, logoutAll }
})