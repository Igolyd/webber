import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
  width?: number
  height?: number
  duration?: number
  alert?: {
    action: 'openTextChat' | 'joinVoiceChannel' | 'callInDM'
    context: 'dm' | 'channel'
    groupId?: string
    channelId?: string
    peerId?: string
  }
}

export type MessageType = 'text' | 'file'

export interface ChannelMessage {
  id: string
  channelId: string
  senderId: string
  content: string
  createdAt: string
  type: MessageType
  attachment?: FileAttachment | null
  replyToId?: string
  editedAt?: string
  reactions?: Record<string, string[]>
  pinned?: boolean
}

export const useGroupMessagesStore = defineStore('groupMessages', () => {
  const messages = useStorage<ChannelMessage[]>('app.channelMessages', [])

  function getByChannel(channelId: string) {
    return messages.value
      .filter(m => m.channelId === channelId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  function getById(id: string) {
    return messages.value.find(m => m.id === id) || null
  }

  function sendMessage(senderId: string, channelId: string, content: string, replyToId?: string) {
    const text = content.trim()
    if (!text) return
    const msg: ChannelMessage = {
      id: crypto.randomUUID(),
      channelId,
      senderId,
      content: text,
      createdAt: new Date().toISOString(),
      type: 'text',
      replyToId,
      reactions: {},
      pinned: false,
    }
    messages.value = [...messages.value, msg]
    return msg
  }

  function sendAttachment(senderId: string, channelId: string, attachment: FileAttachment, comment = '', replyToId?: string) {
    const msg: ChannelMessage = {
      id: crypto.randomUUID(),
      channelId,
      senderId,
      content: comment.trim(),
      createdAt: new Date().toISOString(),
      type: 'file',
      attachment,
      replyToId,
      reactions: {},
      pinned: false,
    }
    messages.value = [...messages.value, msg]
    return msg
  }

  // Патч: корректируем content/attachment и type
  function editMessage(id: string, patch: { content?: string; attachment?: FileAttachment | null }) {
    messages.value = messages.value.map(m => {
      if (m.id !== id) return m
      let type = m.type
      let attachment = m.attachment
      if (patch.attachment !== undefined) {
        attachment = patch.attachment
        type = attachment ? 'file' : 'text'
      }
      const content = patch.content !== undefined ? patch.content : m.content
      return { ...m, content, attachment, type, editedAt: new Date().toISOString() }
    })
  }

  function deleteMessage(id: string) {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  function clearChannel(channelId: string) {
    messages.value = messages.value.filter(m => m.channelId !== channelId)
  }

  function toggleReaction(id: string, emoji: string, userId: string) {
    messages.value = messages.value.map(m => {
      if (m.id !== id) return m
      const reactions = { ...(m.reactions || {}) }
      const users = new Set(reactions[emoji] || [])
      if (users.has(userId)) users.delete(userId)
      else users.add(userId)
      reactions[emoji] = Array.from(users)
      return { ...m, reactions }
    })
  }

  function togglePin(id: string, pinned?: boolean) {
    messages.value = messages.value.map(m =>
      m.id === id ? { ...m, pinned: pinned ?? !m.pinned } : m
    )
  }

  function getPinnedInChannel(channelId: string) {
    return messages.value
      .filter(m => m.channelId === channelId && m.pinned)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  return {
    messages,
    getByChannel,
    getById,
    sendMessage,
    sendAttachment,
    editMessage,
    deleteMessage,
    clearChannel,
    toggleReaction,
    togglePin,
    getPinnedInChannel,
  }
})