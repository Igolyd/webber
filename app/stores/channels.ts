// stores/channels.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export type ChannelType = 'text' | 'voice'

export interface Channel {
  id: string
  groupId: string
  directoryId: string | null
  name: string
  type: ChannelType
  position: number
  createdAt: string
  // NEW: ID комнаты на Janus для голосовых каналов
  janusRoomId?: number | null
}

export const useChannelsStore = defineStore('channels', () => {
  const channels = useStorage<Channel[]>('app.channels', [])

  // payload теперь может содержать janusRoomId
  function addChannel(payload: Omit<Channel, 'id' | 'createdAt'>) {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const ch: Channel = { id, createdAt, ...payload }
    channels.value.push(ch)
    return ch
  }

  function removeChannel(id: string) {
    channels.value = channels.value.filter(c => c.id !== id)
  }

  // patch допускает janusRoomId, тип и др. поля
  function updateChannel(id: string, patch: Partial<Omit<Channel, 'id' | 'groupId'>>) {
    channels.value = channels.value.map(c => c.id === id ? { ...c, ...patch } : c)
  }

  function getByGroup(groupId: string) {
    return channels.value
      .filter(c => c.groupId === groupId)
      .sort((a, b) => a.position - b.position)
  }

  function getByGroupAndType(groupId: string, type: ChannelType) {
    return getByGroup(groupId).filter(c => c.type === type)
  }

  function getByDirectory(directoryId: string) {
    return channels.value
      .filter(c => c.directoryId === directoryId)
      .sort((a, b) => a.position - b.position)
  }

  function getById(id: string) {
    return channels.value.find(c => c.id === id) || null
  }

  return {
    channels,
    addChannel,
    removeChannel,
    updateChannel,
    getByGroup,
    getByGroupAndType,
    getByDirectory,
    getById,
  }
})