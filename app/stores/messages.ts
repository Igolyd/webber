// stores/messages.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string // MIME
  dataUrl: string // base64 data URL (в демо-хранилище)
  width?: number
  height?: number
  duration?: number
}

export type MessageType = 'text' | 'file'

export interface DirectMessage {
  id: string
  senderId: string
  recipientId: string
  content: string // текст или комментарий к файлу
  createdAt: string
  type: MessageType
  attachment?: FileAttachment
}

function makeConvoKey(a: string, b: string) {
  return [a, b].sort().join(':')
}

export const useMessagesStore = defineStore('messages', () => {
  const messages = useStorage<DirectMessage[]>('app.dm', [])

  // селекторы
  const convoKey = (a: string, b: string) => makeConvoKey(a, b)

  const getConversation = (a: string, b: string) => {
    const [x, y] = [a, b].sort()
    return messages.value
      .filter(m => {
        const [sx, sy] = [m.senderId, m.recipientId].sort()
        return sx === x && sy === y
      })
      .sort((m1, m2) => m1.createdAt.localeCompare(m2.createdAt))
  }

  const listConversationsForUser = (userId: string) => {
    // вернем по одному последнему сообщению на диалог
    const lastByKey = new Map<string, DirectMessage>()
    for (const m of messages.value) {
      if (m.senderId !== userId && m.recipientId !== userId) continue
      const key = makeConvoKey(m.senderId, m.recipientId)
      const prev = lastByKey.get(key)
      if (!prev || prev.createdAt < m.createdAt) lastByKey.set(key, m)
    }
    return Array.from(lastByKey.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  const totalCount = computed(() => messages.value.length)

  // действия
  function sendMessage(senderId: string, recipientId: string, content: string) {
    const text = content.trim()
    if (!text) return
    const msg: DirectMessage = {
      id: crypto.randomUUID(),
      senderId,
      recipientId,
      content: text,
      createdAt: new Date().toISOString(),
      type: 'text',
    }
    messages.value = [...messages.value, msg] // иммутабельно — надежно для персиста
    return msg
  }

  function sendAttachment(
    senderId: string,
    recipientId: string,
    attachment: FileAttachment,
    comment: string = ''
  ) {
    const msg: DirectMessage = {
      id: crypto.randomUUID(),
      senderId,
      recipientId,
      content: comment.trim(),
      createdAt: new Date().toISOString(),
      type: 'file',
      attachment,
    }
    messages.value = [...messages.value, msg]
    return msg
  }

  function deleteMessage(messageId: string) {
    messages.value = messages.value.filter(m => m.id !== messageId)
  }

  function clearConversation(a: string, b: string) {
    const [x, y] = [a, b].sort()
    messages.value = messages.value.filter(m => {
      const [sx, sy] = [m.senderId, m.recipientId].sort()
      return !(sx === x && sy === y)
    })
  }

  return {
    // state
    messages,
    // getters/selectors
    convoKey,
    getConversation,
    listConversationsForUser,
    totalCount,
    // actions
    sendMessage,
    sendAttachment,
    deleteMessage,
    clearConversation,
  }
})