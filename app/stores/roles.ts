import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
export type PermissionKey =
  | "viewChannels"
  | "manageChannels"
  | "manageRoles"
  | "createExpressions"
  | "manageExpressions"
  | "manageGroup"
  | "createInvites"
  | "changeNickname"
  | "manageNicknames"
  | "kickApproveMembers"
  | "banMembers"
  | "timeoutMembers"
  | "sendMessagesAndPosts"
  | "embedLinks"
  | "attachFiles"
  | "addReactions"
  | "useExternalEmojis"
  | "useExternalStickers"
  | "mentionEveryoneHereRoles"
  | "manageMessages"
  | "pinMessages"
  | "sendVoiceMessages"
  | "createPolls"
  | "connect"
  | "speak"
  | "video"
  | "useSoundboard"
  | "useExternalSounds"
  | "voiceActivity"
  | "muteMembers"
  | "deafenMembers"
  | "moveMembers"
  | "createEvents"
  | "manageEvents"
  | "administrator";
export type Permissions = Record<PermissionKey, boolean>;
export interface Role {
  id: string;
  groupId: string;
  name: string;
  color: string;
  icon?: string;
  isEveryone?: boolean;
  permissions: Permissions;
  assignedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}
export interface PermissionDescriptor {
  groupTitle: string;
  items: {
    key: PermissionKey;
    title: string;
    subtitle: string;
  }[];
}
export const permissionDescriptors: PermissionDescriptor[] = [
  {
    groupTitle: "Основные права группы",
    items: [
      {
        key: "viewChannels",
        title: "Просматривать каналы",
        subtitle:
          "Позволяет участникам просматривать каналы (кроме приватных) по умолчанию.",
      },
      {
        key: "manageChannels",
        title: "Управлять каналами",
        subtitle:
          "Позволяет участникам создавать, редактировать и удалять каналы.",
      },
      {
        key: "manageRoles",
        title: "Управлять ролями",
        subtitle:
          "Создание, редактирование и удаление ролей ниже своей роли; изменение прав каналов.",
      },
      {
        key: "createExpressions",
        title: "Создавать средства выражения эмоций",
        subtitle:
          "Добавлять пользовательские эмодзи, стикеры и звуки в группе.",
      },
      {
        key: "manageExpressions",
        title: "Управлять выражениями",
        subtitle:
          "Редактировать и удалять пользовательские эмодзи, стикеры и звуки.",
      },
      {
        key: "manageGroup",
        title: "Управлять группой",
        subtitle: "Переименование группы, регионы, приглашения, правила.",
      },
    ],
  },
  {
    groupTitle: "Права участников",
    items: [
      {
        key: "createInvites",
        title: "Создание приглашения",
        subtitle: "Приглашать новых участников.",
      },
      {
        key: "changeNickname",
        title: "Изменить никнейм",
        subtitle: "Менять собственный никнейм для этой группы.",
      },
      {
        key: "manageNicknames",
        title: "Управлять никнеймами",
        subtitle: "Менять никнеймы других участников.",
      },
      {
        key: "kickApproveMembers",
        title: "Выгоняйте, одобряйте или отклоняйте участников",
        subtitle:
          "Удалять участников, одобрять/отклонять запросы на присоединение.",
      },
      {
        key: "banMembers",
        title: "Банить участников",
        subtitle: "Навсегда банить участников и удалять историю сообщений.",
      },
      {
        key: "timeoutMembers",
        title: "Отправить участников подумать о своём поведении",
        subtitle: "Запрет на отправку сообщений, реакций и голосовое общение.",
      },
    ],
  },
  {
    groupTitle: "Права текстового канала",
    items: [
      {
        key: "sendMessagesAndPosts",
        title: "Отправка сообщений и создание публикаций",
        subtitle: "Сообщения в текстовых каналах и публикации в Форуме.",
      },
      {
        key: "embedLinks",
        title: "Встраивать ссылки",
        subtitle: "Показывать предпросмотр контента по ссылкам.",
      },
      {
        key: "attachFiles",
        title: "Прикреплять файлы",
        subtitle: "Загрузка файлов и медиаконтента.",
      },
      {
        key: "addReactions",
        title: "Добавлять реакции",
        subtitle: "Добавлять новые реакции-эмодзи к сообщениям.",
      },
      {
        key: "useExternalEmojis",
        title: "Использовать внешние эмодзи",
        subtitle: "Использовать эмодзи с других групп (требуется подписка).",
      },
      {
        key: "useExternalStickers",
        title: "Использовать внешние стикеры",
        subtitle: "Использовать стикеры с других групп (требуется подписка).",
      },
      {
        key: "mentionEveryoneHereRoles",
        title: "Упоминание @everyone, @here и всех ролей",
        subtitle: "Использование @everyone, @here и упоминание всех ролей.",
      },
      {
        key: "manageMessages",
        title: "Управлять сообщениями",
        subtitle: "Удалять сообщения других и закреплять любые сообщения.",
      },
      {
        key: "pinMessages",
        title: "Закреплять сообщения",
        subtitle: "Закреплять и откреплять любые сообщения.",
      },
      {
        key: "sendVoiceMessages",
        title: "Отправлять голосовые сообщения",
        subtitle: "Разрешение на отправку голосовых.",
      },
      {
        key: "createPolls",
        title: "Создание опросов",
        subtitle: "Создавать опросы.",
      },
    ],
  },
  {
    groupTitle: "Права голосового канала",
    items: [
      {
        key: "connect",
        title: "Подключаться",
        subtitle: "Присоединение к голосовым каналам и прослушивание.",
      },
      {
        key: "speak",
        title: "Говорить",
        subtitle:
          "Голосовое общение; при отключении нужен модератор для включения.",
      },
      {
        key: "video",
        title: "Видео",
        subtitle: "Делиться видео, показывать экран, стримить.",
      },
      {
        key: "useSoundboard",
        title: "Использовать звуковую панель",
        subtitle: "Отправлять звуки со звуковой панели группы.",
      },
      {
        key: "useExternalSounds",
        title: "Использовать внешние звуки",
        subtitle: "Использовать звуки из других групп (подписка).",
      },
      {
        key: "voiceActivity",
        title: "Использовать режим активации по голосу",
        subtitle: "Говорить без рации, управление фоновым шумом.",
      },
      {
        key: "muteMembers",
        title: "Отключать участникам микрофон",
        subtitle: "Отключать микрофон другим участникам.",
      },
      {
        key: "deafenMembers",
        title: "Отключать участникам звук",
        subtitle: "Лишать возможности общаться или слышать других.",
      },
      {
        key: "moveMembers",
        title: "Перемещать участников",
        subtitle:
          "Отключать и перемещать участников между голосовыми каналами.",
      },
    ],
  },
  {
    groupTitle: "Права доступа к событиям",
    items: [
      {
        key: "createEvents",
        title: "Создавать события",
        subtitle: "Создание событий.",
      },
      {
        key: "manageEvents",
        title: "Управление событиями",
        subtitle: "Редактирование и отмена событий.",
      },
    ],
  },
  {
    groupTitle: "Расширенные права",
    items: [
      {
        key: "administrator",
        title: "Администратор",
        subtitle: "Имеет все права и обходит ограничения. Опасное право.",
      },
    ],
  },
];
export function getDefaultPermissions(): Permissions {
  const perms = {} as Record<PermissionKey, boolean>;
  const allKeys = permissionDescriptors.flatMap((g) =>
    g.items.map((i) => i.key)
  );
  for (const key of allKeys) perms[key] = false;
  perms.viewChannels = true;
  return perms as Permissions;
}
export const useRolesStore = defineStore("roles", {
  state: () => ({
    roles: useStorage<Role[]>("app.roles", []),
  }),
  getters: {
    getRolesByGroup: (state) => (groupId: string) =>
      state.roles.filter((r) => r.groupId === groupId),
    getRoleById: (state) => (id: string) =>
      state.roles.find((r) => r.id === id) || null,
    getEveryoneRole: (state) => (groupId: string) =>
      state.roles.find((r) => r.groupId === groupId && r.isEveryone) || null,
  },
  actions: {
    ensureBaseRolesForGroup(groupId: string) {
      const exists = this.roles.some(
        (r) => r.groupId === groupId && r.isEveryone
      );
      if (!exists) {
        const now = new Date().toISOString();
        this.roles = [
          ...this.roles,
          {
            id: crypto.randomUUID(),
            groupId,
            name: "everyone",
            color: "#9E9E9E",
            icon: "",
            isEveryone: true,
            permissions: getDefaultPermissions(),
            assignedUserIds: [],
            createdAt: now,
            updatedAt: now,
          },
        ];
      }
    },
    createRole(groupId: string, payload: Partial<Role>) {
      const now = new Date().toISOString();
      const role: Role = {
        id: crypto.randomUUID(),
        groupId,
        name: payload.name || "Новая роль",
        color: payload.color || "#1976D2",
        icon: payload.icon || "",
        isEveryone: false,
        permissions: payload.permissions || getDefaultPermissions(),
        assignedUserIds: payload.assignedUserIds || [],
        createdAt: now,
        updatedAt: now,
      };
      this.roles = [role, ...this.roles];
      return role;
    },
    updateRole(id: string, patch: Partial<Role>) {
      const idx = this.roles.findIndex((r) => r.id === id);
      if (idx === -1) return;
      const prev = this.roles[idx];
      const updated: Role = {
        ...prev,
        ...patch,
        isEveryone: prev.isEveryone,
        updatedAt: new Date().toISOString(),
      };
      const copy = [...this.roles];
      copy[idx] = updated;
      this.roles = copy;
      return updated;
    },
    deleteRole(id: string) {
      const role = this.getRoleById(id);
      if (!role) return;
      if (role.isEveryone) throw new Error("Невозможно удалить роль everyone");
      this.roles = this.roles.filter((r) => r.id !== id);
    },
    assignUserToRole(roleId: string, userId: string) {
      const role = this.getRoleById(roleId);
      if (!role) return;
      if (!role.assignedUserIds.includes(userId)) {
        const updated: Role = {
          ...role,
          assignedUserIds: [...role.assignedUserIds, userId],
          updatedAt: new Date().toISOString(),
        };
        this.roles = this.roles.map((r) => (r.id === roleId ? updated : r));
      }
    },
    removeUserFromRole(roleId: string, userId: string) {
      const role = this.getRoleById(roleId);
      if (!role) return;
      const updated: Role = {
        ...role,
        assignedUserIds: role.assignedUserIds.filter((id) => id !== userId),
        updatedAt: new Date().toISOString(),
      };
      this.roles = this.roles.map((r) => (r.id === roleId ? updated : r));
    },
  },
});
