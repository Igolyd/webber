import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { get, set } from "idb-keyval";

export type PackKind = "emoji" | "sticker";
export type OwnerType = "user" | "group" | "external";

export type EmojiItem =
  | { id: string; type: "unicode"; emoji: string; keywords?: string[] }
  | {
      id: string;
      type: "image";
      dataUrl: string;
      mime: string;
      keywords?: string[];
    };

export type StickerItem = {
  id: string;
  dataUrl: string;
  mime: string;
  keywords?: string[];
};

export interface BasePackMeta {
  id: string;
  kind: PackKind;
  uniqueName: string;
  title: string;
  avatar?: string;
  ownerType: OwnerType;
  ownerId: string;
  createdAt: string;
  itemsCount: number;
}

export type EmojiPack = BasePackMeta;
export type StickerPack = BasePackMeta;

type GroupPrefs = {
  allowOnlyLinkedEmoji: boolean;
  allowOnlyLinkedSticker: boolean;
  linkedEmoji: string[];
  linkedSticker: string[];
};

type State = {
  emojiPacks: Record<string, EmojiPack>;
  stickerPacks: Record<string, StickerPack>;
  emojiByUnique: Record<string, string>;
  stickerByUnique: Record<string, string>;
  userOwnEmoji: Record<string, string[]>;
  userOwnSticker: Record<string, string[]>;
  userImportedEmoji: Record<string, string[]>;
  userImportedSticker: Record<string, string[]>;
  groupOwnEmoji: Record<string, string[]>;
  groupOwnSticker: Record<string, string[]>;
  groupPrefs: Record<string, GroupPrefs>;
};

const EMOJI_LIMIT_PER_PACK = 50;
const STICKER_LIMIT_PER_PACK = 20;
const USER_OWN_EMOJI_PACKS_LIMIT = 2;
const USER_OWN_STICKER_PACKS_LIMIT = 2;

const LS_KEY = "app.reactions.v2";
const IDB_ITEMS_PREFIX = "reactions:packItems:";

function normKey(s: string): string {
  return (s || "").trim().toLowerCase();
}

async function idbGetItems<T extends EmojiItem | StickerItem>(
  packId: string
): Promise<T[]> {
  const key = `${IDB_ITEMS_PREFIX}${packId}`;
  try {
    const res = (await get(key)) as T[] | undefined;
    return res || [];
  } catch {
    return [];
  }
}
async function idbSetItems<T extends EmojiItem | StickerItem>(
  packId: string,
  items: T[]
): Promise<void> {
  const key = `${IDB_ITEMS_PREFIX}${packId}`;
  await set(key, items);
}

// Type guards for legacy migration
function isWithItemsEmoji(
  meta: unknown
): meta is EmojiPack & { items: EmojiItem[] } {
  return (
    !!meta &&
    typeof meta === "object" &&
    Array.isArray((meta as { items?: unknown }).items)
  );
}
function isWithItemsSticker(
  meta: unknown
): meta is StickerPack & { items: StickerItem[] } {
  return (
    !!meta &&
    typeof meta === "object" &&
    Array.isArray((meta as { items?: unknown }).items)
  );
}

export const useReactionsStore = defineStore("reactions", () => {
  const s = useStorage<State>(LS_KEY, {
    emojiPacks: {},
    stickerPacks: {},
    emojiByUnique: {},
    stickerByUnique: {},
    userOwnEmoji: {},
    userOwnSticker: {},
    userImportedEmoji: {},
    userImportedSticker: {},
    groupOwnEmoji: {},
    groupOwnSticker: {},
    groupPrefs: {},
  });

  function hasLegacyItemsInMeta(): boolean {
    const hasEmoji = Object.values(s.value.emojiPacks).some((p) =>
      isWithItemsEmoji(p as unknown)
    );
    const hasSticker = Object.values(s.value.stickerPacks).some((p) =>
      isWithItemsSticker(p as unknown)
    );
    return hasEmoji || hasSticker;
  }

  async function migrateLegacyItemsOutOfMeta(): Promise<void> {
    try {
      const emojiEntries = Object.entries(s.value.emojiPacks);
      for (const [id, meta] of emojiEntries) {
        if (isWithItemsEmoji(meta as unknown)) {
          const items = (meta as unknown as { items: EmojiItem[] }).items;
          await idbSetItems(id, items);
          const { items: _drop, ...clean } = meta as EmojiPack & {
            items: EmojiItem[];
          };
          s.value.emojiPacks = {
            ...s.value.emojiPacks,
            [id]: { ...clean, itemsCount: items.length },
          };
        } else {
          s.value.emojiPacks = {
            ...s.value.emojiPacks,
            [id]: { ...meta, itemsCount: meta.itemsCount ?? 0 },
          };
        }
      }

      const stickerEntries = Object.entries(s.value.stickerPacks);
      for (const [id, meta] of stickerEntries) {
        if (isWithItemsSticker(meta as unknown)) {
          const items = (meta as unknown as { items: StickerItem[] }).items;
          await idbSetItems(id, items);
          const { items: _drop, ...clean } = meta as StickerPack & {
            items: StickerItem[];
          };
          s.value.stickerPacks = {
            ...s.value.stickerPacks,
            [id]: { ...clean, itemsCount: items.length },
          };
        } else {
          s.value.stickerPacks = {
            ...s.value.stickerPacks,
            [id]: { ...meta, itemsCount: meta.itemsCount ?? 0 },
          };
        }
      }
    } catch (e) {
      // best effort

      console.error("[reactions] migration error", e);
    }
  }

  if (hasLegacyItemsInMeta()) {
    void migrateLegacyItemsOutOfMeta();
  }

  function getGroupPrefs(gid: string): GroupPrefs {
    let prefs = s.value.groupPrefs[gid];
    if (!prefs) {
      prefs = {
        allowOnlyLinkedEmoji: false,
        allowOnlyLinkedSticker: false,
        linkedEmoji: [],
        linkedSticker: [],
      };
      s.value.groupPrefs = {
        ...s.value.groupPrefs,
        [gid]: prefs,
      };
    }
    return prefs;
  }

  function isUnique(kind: PackKind, uniqueName: string): boolean {
    const key = normKey(uniqueName);
    return kind === "emoji"
      ? !s.value.emojiByUnique[key]
      : !s.value.stickerByUnique[key];
  }

  function createPack(
    kind: PackKind,
    ownerType: OwnerType,
    ownerId: string,
    params: { uniqueName: string; title: string; avatar?: string }
  ): string {
    const key = normKey(params.uniqueName);
    if (!key) throw new Error("Unique name is required");
    if (!isUnique(kind, key)) throw new Error("Unique name is already taken");

    if (ownerType === "user") {
      if (kind === "emoji") {
        const cnt = (s.value.userOwnEmoji[ownerId] || []).length;
        if (cnt >= USER_OWN_EMOJI_PACKS_LIMIT) {
          throw new Error(
            `User emoji packs limit: ${USER_OWN_EMOJI_PACKS_LIMIT}`
          );
        }
      } else {
        const cnt = (s.value.userOwnSticker[ownerId] || []).length;
        if (cnt >= USER_OWN_STICKER_PACKS_LIMIT) {
          throw new Error(
            `User sticker packs limit: ${USER_OWN_STICKER_PACKS_LIMIT}`
          );
        }
      }
    }

    const id = crypto.randomUUID();
    const baseMeta: BasePackMeta = {
      id,
      kind,
      uniqueName: key,
      title: params.title || key,
      avatar: params.avatar,
      ownerType,
      ownerId,
      createdAt: new Date().toISOString(),
      itemsCount: 0,
    };

    if (kind === "emoji") {
      s.value.emojiPacks = { ...s.value.emojiPacks, [id]: baseMeta };
      s.value.emojiByUnique = { ...s.value.emojiByUnique, [key]: id };
      if (ownerType === "user") {
        s.value.userOwnEmoji = {
          ...s.value.userOwnEmoji,
          [ownerId]: [...(s.value.userOwnEmoji[ownerId] || []), id],
        };
      } else if (ownerType === "group") {
        s.value.groupOwnEmoji = {
          ...s.value.groupOwnEmoji,
          [ownerId]: [...(s.value.groupOwnEmoji[ownerId] || []), id],
        };
      }
    } else {
      s.value.stickerPacks = { ...s.value.stickerPacks, [id]: baseMeta };
      s.value.stickerByUnique = { ...s.value.stickerByUnique, [key]: id };
      if (ownerType === "user") {
        s.value.userOwnSticker = {
          ...s.value.userOwnSticker,
          [ownerId]: [...(s.value.userOwnSticker[ownerId] || []), id],
        };
      } else if (ownerType === "group") {
        s.value.groupOwnSticker = {
          ...s.value.groupOwnSticker,
          [ownerId]: [...(s.value.groupOwnSticker[ownerId] || []), id],
        };
      }
    }

    void idbSetItems(id, []);
    return id;
  }

  function deletePack(kind: PackKind, packId: string): void {
    if (kind === "emoji") {
      const p = s.value.emojiPacks[packId];
      if (!p) return;

      // remove from byUnique
      const { [p.uniqueName]: _drop1, ...restByUnique } = s.value.emojiByUnique;
      s.value.emojiByUnique = restByUnique;
      // remove meta
      const { [packId]: _drop2, ...restMeta } = s.value.emojiPacks;
      s.value.emojiPacks = restMeta;

      if (p.ownerType === "user") {
        const arr = (s.value.userOwnEmoji[p.ownerId] || []).filter(
          (id) => id !== packId
        );
        s.value.userOwnEmoji = { ...s.value.userOwnEmoji, [p.ownerId]: arr };
      } else if (p.ownerType === "group") {
        const arr = (s.value.groupOwnEmoji[p.ownerId] || []).filter(
          (id) => id !== packId
        );
        s.value.groupOwnEmoji = { ...s.value.groupOwnEmoji, [p.ownerId]: arr };
      }
    } else {
      const p = s.value.stickerPacks[packId];
      if (!p) return;

      const { [p.uniqueName]: _drop1, ...restByUnique } =
        s.value.stickerByUnique;
      s.value.stickerByUnique = restByUnique;

      const { [packId]: _drop2, ...restMeta } = s.value.stickerPacks;
      s.value.stickerPacks = restMeta;

      if (p.ownerType === "user") {
        const arr = (s.value.userOwnSticker[p.ownerId] || []).filter(
          (id) => id !== packId
        );
        s.value.userOwnSticker = {
          ...s.value.userOwnSticker,
          [p.ownerId]: arr,
        };
      } else if (p.ownerType === "group") {
        const arr = (s.value.groupOwnSticker[p.ownerId] || []).filter(
          (id) => id !== packId
        );
        s.value.groupOwnSticker = {
          ...s.value.groupOwnSticker,
          [p.ownerId]: arr,
        };
      }
    }
  }

  async function addEmojiItems(
    packId: string,
    items: EmojiItem[]
  ): Promise<void> {
    const p = s.value.emojiPacks[packId];
    if (!p) throw new Error("Pack not found");
    const existing = await idbGetItems<EmojiItem>(packId);
    const can = EMOJI_LIMIT_PER_PACK - existing.length;
    if (can <= 0) throw new Error(`Items limit: ${EMOJI_LIMIT_PER_PACK}`);
    const chunk = items.slice(0, can);
    const next = [...existing, ...chunk];
    await idbSetItems(packId, next);
    s.value.emojiPacks = {
      ...s.value.emojiPacks,
      [packId]: { ...p, itemsCount: next.length },
    };
  }

  async function addStickerItems(
    packId: string,
    items: StickerItem[]
  ): Promise<void> {
    const p = s.value.stickerPacks[packId];
    if (!p) throw new Error("Pack not found");
    const existing = await idbGetItems<StickerItem>(packId);
    const can = STICKER_LIMIT_PER_PACK - existing.length;
    if (can <= 0) throw new Error(`Items limit: ${STICKER_LIMIT_PER_PACK}`);
    const chunk = items.slice(0, can);
    const next = [...existing, ...chunk];
    await idbSetItems(packId, next);
    s.value.stickerPacks = {
      ...s.value.stickerPacks,
      [packId]: { ...p, itemsCount: next.length },
    };
  }

  async function getPackItems(
    kind: PackKind,
    packId: string
  ): Promise<(EmojiItem | StickerItem)[]> {
    return kind === "emoji"
      ? await idbGetItems<EmojiItem>(packId)
      : await idbGetItems<StickerItem>(packId);
  }

  async function removePackItems(
    kind: PackKind,
    packId: string,
    ids: string[]
  ): Promise<void> {
    const meta =
      kind === "emoji"
        ? s.value.emojiPacks[packId]
        : s.value.stickerPacks[packId];
    if (!meta) throw new Error("Pack not found");
    const existing = await getPackItems(kind, packId);
    const toRemove = new Set(ids);
    const next = existing.filter((it) => !toRemove.has(it.id));
    await idbSetItems(packId, next);
    const upd = { ...meta, itemsCount: next.length };
    if (kind === "emoji") {
      s.value.emojiPacks = {
        ...s.value.emojiPacks,
        [packId]: upd as EmojiPack,
      };
    } else {
      s.value.stickerPacks = {
        ...s.value.stickerPacks,
        [packId]: upd as StickerPack,
      };
    }
  }

  async function reorderPackItems(
    kind: PackKind,
    packId: string,
    idsInNewOrder: string[]
  ): Promise<void> {
    const meta =
      kind === "emoji"
        ? s.value.emojiPacks[packId]
        : s.value.stickerPacks[packId];
    if (!meta) throw new Error("Pack not found");
    const existing = await getPackItems(kind, packId);
    const dict = new Map<string, EmojiItem | StickerItem>(
      existing.map((it) => [it.id, it])
    );
    const next: (EmojiItem | StickerItem)[] = [];
    for (const id of idsInNewOrder) {
      const it = dict.get(id);
      if (it) next.push(it);
    }
    for (const it of existing) {
      if (!idsInNewOrder.includes((it as EmojiItem | StickerItem).id))
        next.push(it);
    }
    await idbSetItems(packId, next);
    const upd = { ...meta, itemsCount: next.length };
    if (kind === "emoji") {
      s.value.emojiPacks = {
        ...s.value.emojiPacks,
        [packId]: upd as EmojiPack,
      };
    } else {
      s.value.stickerPacks = {
        ...s.value.stickerPacks,
        [packId]: upd as StickerPack,
      };
    }
  }

  function findPackIdByUnique(
    kind: PackKind,
    uniqueName: string
  ): string | undefined {
    const key = normKey(uniqueName);
    return kind === "emoji"
      ? s.value.emojiByUnique[key]
      : s.value.stickerByUnique[key];
  }

  function getPackById(
    kind: PackKind,
    id: string
  ): EmojiPack | StickerPack | null {
    return (
      (kind === "emoji" ? s.value.emojiPacks[id] : s.value.stickerPacks[id]) ||
      null
    );
  }

  function getPackByUnique(
    kind: PackKind,
    uniqueName: string
  ): EmojiPack | StickerPack | null {
    const id = findPackIdByUnique(kind, uniqueName);
    return id ? getPackById(kind, id) : null;
  }

  function importToUser(
    userId: string,
    kind: PackKind,
    uniqueName: string
  ): void {
    const key = normKey(uniqueName);
    if (!findPackIdByUnique(kind, key)) throw new Error("Pack not found");
    if (kind === "emoji") {
      const arr = s.value.userImportedEmoji[userId] || [];
      if (!arr.includes(key)) {
        s.value.userImportedEmoji = {
          ...s.value.userImportedEmoji,
          [userId]: [key, ...arr],
        };
      }
    } else {
      const arr = s.value.userImportedSticker[userId] || [];
      if (!arr.includes(key)) {
        s.value.userImportedSticker = {
          ...s.value.userImportedSticker,
          [userId]: [key, ...arr],
        };
      }
    }
  }

  function removeImportFromUser(
    userId: string,
    kind: PackKind,
    uniqueName: string
  ): void {
    const key = normKey(uniqueName);
    if (kind === "emoji") {
      const arr = (s.value.userImportedEmoji[userId] || []).filter(
        (x) => x !== key
      );
      s.value.userImportedEmoji = {
        ...s.value.userImportedEmoji,
        [userId]: arr,
      };
    } else {
      const arr = (s.value.userImportedSticker[userId] || []).filter(
        (x) => x !== key
      );
      s.value.userImportedSticker = {
        ...s.value.userImportedSticker,
        [userId]: arr,
      };
    }
  }

  function linkPackToGroup(
    groupId: string,
    kind: PackKind,
    uniqueName: string
  ): void {
    const key = normKey(uniqueName);
    if (!findPackIdByUnique(kind, key)) throw new Error("Pack not found");
    const prefs = getGroupPrefs(groupId);
    if (kind === "emoji") {
      if (!prefs.linkedEmoji.includes(key)) {
        s.value.groupPrefs = {
          ...s.value.groupPrefs,
          [groupId]: { ...prefs, linkedEmoji: [key, ...prefs.linkedEmoji] },
        };
      }
    } else {
      if (!prefs.linkedSticker.includes(key)) {
        s.value.groupPrefs = {
          ...s.value.groupPrefs,
          [groupId]: { ...prefs, linkedSticker: [key, ...prefs.linkedSticker] },
        };
      }
    }
  }

  function unlinkPackFromGroup(
    groupId: string,
    kind: PackKind,
    uniqueName: string
  ): void {
    const key = normKey(uniqueName);
    const prefs = getGroupPrefs(groupId);
    if (kind === "emoji") {
      s.value.groupPrefs = {
        ...s.value.groupPrefs,
        [groupId]: {
          ...prefs,
          linkedEmoji: prefs.linkedEmoji.filter((x) => x !== key),
        },
      };
    } else {
      s.value.groupPrefs = {
        ...s.value.groupPrefs,
        [groupId]: {
          ...prefs,
          linkedSticker: prefs.linkedSticker.filter((x) => x !== key),
        },
      };
    }
  }

  function setGroupAllowOnlyLinked(
    groupId: string,
    kind: PackKind,
    allowOnlyLinked: boolean
  ): void {
    const prefs = getGroupPrefs(groupId);
    if (kind === "emoji") {
      s.value.groupPrefs = {
        ...s.value.groupPrefs,
        [groupId]: { ...prefs, allowOnlyLinkedEmoji: allowOnlyLinked },
      };
    } else {
      s.value.groupPrefs = {
        ...s.value.groupPrefs,
        [groupId]: { ...prefs, allowOnlyLinkedSticker: allowOnlyLinked },
      };
    }
  }

  function getAvailablePacks(params: {
    kind: PackKind;
    userId: string;
    context: "dm" | "channel";
    groupId?: string;
  }): (EmojiPack | StickerPack)[] {
    const { kind, userId, context, groupId } = params;
    const result: (EmojiPack | StickerPack)[] = [];

    const ownIds =
      kind === "emoji"
        ? s.value.userOwnEmoji[userId] || []
        : s.value.userOwnSticker[userId] || [];
    for (const id of ownIds) {
      const p = getPackById(kind, id);
      if (p) result.push(p);
    }

    const importedUnique =
      kind === "emoji"
        ? s.value.userImportedEmoji[userId] || []
        : s.value.userImportedSticker[userId] || [];
    for (const uname of importedUnique) {
      const p = getPackByUnique(kind, uname);
      if (p) result.push(p);
    }

    if (context === "channel" && groupId) {
      const gOwnIds =
        kind === "emoji"
          ? s.value.groupOwnEmoji[groupId] || []
          : s.value.groupOwnSticker[groupId] || [];
      for (const id of gOwnIds) {
        const p = getPackById(kind, id);
        if (p && !result.find((x) => x.id === p.id)) result.push(p);
      }

      const prefs = getGroupPrefs(groupId);
      const allowOnlyLinked =
        kind === "emoji"
          ? prefs.allowOnlyLinkedEmoji
          : prefs.allowOnlyLinkedSticker;
      const linked = kind === "emoji" ? prefs.linkedEmoji : prefs.linkedSticker;

      if (allowOnlyLinked) {
        const linkedPacks = linked
          .map((uname) => getPackByUnique(kind, uname))
          .filter((p): p is EmojiPack | StickerPack => Boolean(p));
        const allowedIds = new Set<string>([
          ...gOwnIds,
          ...linkedPacks.map((p) => p.id),
        ]);
        return result.filter((p) => allowedIds.has(p.id));
      } else {
        for (const uname of linked) {
          const p = getPackByUnique(kind, uname);
          if (p && !result.find((x) => x.id === p.id)) result.push(p);
        }
      }
    }
    return result;
  }

  function userHasPack(
    userId: string,
    kind: PackKind,
    uniqueName: string
  ): boolean {
    const key = normKey(uniqueName);
    const ownIds =
      kind === "emoji"
        ? s.value.userOwnEmoji[userId] || []
        : s.value.userOwnSticker[userId] || [];
    const own = ownIds.some((id) => {
      const p = getPackById(kind, id);
      return !!p && p.uniqueName === key;
    });
    const imported =
      kind === "emoji"
        ? s.value.userImportedEmoji[userId] || []
        : s.value.userImportedSticker[userId] || [];
    return own || imported.includes(key);
  }

  return {
    createPack,
    deletePack,
    isUnique,
    addEmojiItems,
    addStickerItems,
    removePackItems,
    reorderPackItems,
    getPackItems,
    findPackIdByUnique,
    getPackById,
    getPackByUnique,
    importToUser,
    removeImportFromUser,
    linkPackToGroup,
    unlinkPackFromGroup,
    setGroupAllowOnlyLinked,
    getGroupPrefs,
    getAvailablePacks,
    userHasPack,
    state: s,
    EMOJI_LIMIT_PER_PACK,
    STICKER_LIMIT_PER_PACK,
    USER_OWN_EMOJI_PACKS_LIMIT,
    USER_OWN_STICKER_PACKS_LIMIT,
  };
});
