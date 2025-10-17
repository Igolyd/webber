import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { computed } from "vue";

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  alertRef?: { assetId: string };
  width?: number;
  height?: number;
  duration?: number;
  alert?: {
    action: "openTextChat" | "joinVoiceChannel" | "callInDM";
    context: "dm" | "channel";
    groupId?: string;
    channelId?: string;
    peerId?: string;
  };
}

export type MessageType = "text" | "file";

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  type: MessageType;
  attachment?: FileAttachment | null;
  replyToId?: string;
  editedAt?: string;
  reactions?: Record<string, string[]>; // emoji -> [userId]
  pinned?: boolean;
}

function makeConvoKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

export const useMessagesStore = defineStore("messages", () => {
  const messages = useStorage<DirectMessage[]>("app.dm", []);

  const convoKey = (a: string, b: string) => makeConvoKey(a, b);

  const getConversation = (a: string, b: string) => {
    const [x, y] = [a, b].sort();
    return messages.value
      .filter((m) => {
        const [sx, sy] = [m.senderId, m.recipientId].sort();
        return sx === x && sy === y;
      })
      .sort((m1, m2) => m1.createdAt.localeCompare(m2.createdAt));
  };

  const listConversationsForUser = (userId: string) => {
    const lastByKey = new Map<string, DirectMessage>();
    for (const m of messages.value) {
      if (m.senderId !== userId && m.recipientId !== userId) continue;
      const key = makeConvoKey(m.senderId, m.recipientId);
      const prev = lastByKey.get(key);
      if (!prev || prev.createdAt < m.createdAt) lastByKey.set(key, m);
    }
    return Array.from(lastByKey.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  };

  const totalCount = computed(() => messages.value.length);

  function getById(id: string) {
    return messages.value.find((m) => m.id === id) || null;
  }

  function sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    replyToId?: string
  ) {
    const text = content.trim();
    if (!text) return;
    const msg: DirectMessage = {
      id: crypto.randomUUID(),
      senderId,
      recipientId,
      content: text,
      createdAt: new Date().toISOString(),
      type: "text",
      replyToId,
      reactions: {},
      pinned: false,
    };
    messages.value = [...messages.value, msg];
    return msg;
  }

  function sendAttachment(
    senderId: string,
    recipientId: string,
    attachment: FileAttachment,
    comment: string = "",
    replyToId?: string
  ) {
    // ВАЖНО: attachment.dataUrl теперь опционален; желательно передавать alertRef.assetId вместо огромного dataUrl.
    const msg: DirectMessage = {
      id: crypto.randomUUID(),
      senderId,
      recipientId,
      content: (comment || "").trim(),
      createdAt: new Date().toISOString(),
      type: "file",
      attachment,
      replyToId,
      reactions: {},
      pinned: false,
    };
    messages.value = [...messages.value, msg];
    return msg;
  }

  // Универсальный патч: меняем текст и/или вложение; корректируем type
  function editMessage(
    id: string,
    patch: { content?: string; attachment?: FileAttachment | null }
  ) {
    messages.value = messages.value.map((m) => {
      if (m.id !== id) return m;
      let type = m.type;
      let attachment = m.attachment;
      if (patch.attachment !== undefined) {
        attachment = patch.attachment;
        type = attachment ? "file" : "text";
      }
      const content = patch.content !== undefined ? patch.content : m.content;
      return {
        ...m,
        content,
        attachment,
        type,
        editedAt: new Date().toISOString(),
      };
    });
  }

  function deleteMessage(messageId: string) {
    messages.value = messages.value.filter((m) => m.id !== messageId);
  }

  function clearConversation(a: string, b: string) {
    const [x, y] = [a, b].sort();
    messages.value = messages.value.filter((m) => {
      const [sx, sy] = [m.senderId, m.recipientId].sort();
      return !(sx === x && sy === y);
    });
  }

  // Реакции
  function toggleReaction(id: string, emoji: string, userId: string) {
    messages.value = messages.value.map((m) => {
      if (m.id !== id) return m;
      const reactions = { ...(m.reactions || {}) };
      const users = new Set(reactions[emoji] || []);
      if (users.has(userId)) users.delete(userId);
      else users.add(userId);
      reactions[emoji] = Array.from(users);
      return { ...m, reactions };
    });
  }

  // Закрепы
  function togglePin(id: string, pinned?: boolean) {
    messages.value = messages.value.map((m) =>
      m.id === id ? { ...m, pinned: pinned ?? !m.pinned } : m
    );
  }

  function getPinnedInConversation(a: string, b: string) {
    const [x, y] = [a, b].sort();
    return messages.value
      .filter((m) => {
        const [sx, sy] = [m.senderId, m.recipientId].sort();
        return sx === x && sy === y && m.pinned;
      })
      .sort((m1, m2) => m1.createdAt.localeCompare(m2.createdAt));
  }

  return {
    messages,
    convoKey,
    getConversation,
    listConversationsForUser,
    totalCount,
    getById,
    getPinnedInConversation,
    sendMessage,
    sendAttachment,
    editMessage,
    deleteMessage,
    clearConversation,
    toggleReaction,
    togglePin,
  };
});
