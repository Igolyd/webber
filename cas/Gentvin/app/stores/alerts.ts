// stores/alerts.ts
import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import { ref } from "vue";
import { useMessagesStore } from "@/stores/messages";
import { useGroupMessagesStore } from "@/stores/groupMessages";
// проверьте путь
import { useProfilesStore } from "./user/profiles";
const positions = ref<Record<string, { x: number; y: number }>>({}); // NEW

export type AlertKind = "video" | "audio";

export type AlertAction = "openTextChat" | "joinVoiceChannel" | "callInDM";

export interface AlertAsset {
  id: string;
  ownerType: "user" | "group";
  ownerId: string;
  kind: AlertKind;
  name: string;
  mime: string;
  size: number;
  dataUrl: string; // в библиотеке может быть пустым (мы храним dataKey)
  poster?: string;
  durationSec?: number;
  createdAt: string;
}

type AlertMetaOnly = Omit<AlertAsset, "dataUrl"> & { dataKey: string };
export type StoredAlertAsset = AlertAsset & Partial<{ dataKey: string }>;

export interface AlertMeta {
  action: AlertAction;
  context: "dm" | "channel";
  groupId?: string;
  channelId?: string;
  peerId?: string;
}

export type PlayMode = "overlay" | "pip" | "popup";

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const MAX_VIDEO_DURATION = 10; // сек

// Настройки пользователя
export const useUserAlertsSettingsStore = defineStore(
  "userAlertsSettings",
  () => {
    const autoplay = useStorage<boolean>("alerts.user.autoplay", true);
    const volume = useStorage<number>("alerts.user.volume", 0.8);
    const playMode = useStorage<PlayMode>("alerts.user.playMode", "overlay");
    const allowFrom = useStorage<"all" | "friends" | "none">(
      "alerts.user.allowFrom",
      "all"
    );

    // NEW: тестовые поля “сообщение” и “от кого”
    const testMessage = useStorage<string>("alerts.user.testMessage", "");
    const testFrom = useStorage<"me" | "custom">("alerts.user.testFrom", "me");
    const testFromName = useStorage<string>("alerts.user.testFromName", "");

    return {
      autoplay,
      volume,
      playMode,
      allowFrom,
      testMessage,
      testFrom,
      testFromName,
    };
  }
);

// Настройки группы
export const useGroupAlertsSettingsStore = defineStore(
  "groupAlertsSettings",
  () => {
    type PerGroup = Record<string, { allowPersonalAlerts: boolean }>;
    const perGroup = useStorage<PerGroup>("alerts.group.settings", {});
    function setAllowPersonalAlerts(groupId: string, allow: boolean) {
      perGroup.value[groupId] = {
        ...(perGroup.value[groupId] || {}),
        allowPersonalAlerts: allow,
      };
    }
    function getAllowPersonalAlerts(groupId: string) {
      return perGroup.value[groupId]?.allowPersonalAlerts ?? true;
    }
    return { perGroup, setAllowPersonalAlerts, getAllowPersonalAlerts };
  }
);

// Библиотека алертов
export const useAlertsLibraryStore = defineStore("alertsLibrary", () => {
  const assets = useStorage<AlertMetaOnly[]>("alerts.assets.meta", []);

  const LIMITS = {
    user: { video: 10, audio: 20 },
    group: { video: 10, audio: 20 },
  } as const;

  function listByOwner(
    ownerType: "user" | "group",
    ownerId: string,
    kind?: AlertKind
  ): StoredAlertAsset[] {
    return assets.value
      .filter(
        (a) =>
          a.ownerType === ownerType &&
          a.ownerId === ownerId &&
          (!kind || a.kind === kind)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => a as unknown as StoredAlertAsset);
  }
  async function updateAssetMeta(
    id: string,
    patch: { name?: string; poster?: string }
  ) {
    const idx = assets.value.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const prev = assets.value[idx];
    const next = {
      ...prev,
      ...(patch.name != null ? { name: patch.name } : {}),
      ...(patch.poster != null ? { poster: patch.poster } : {}),
    };
    assets.value = [next, ...assets.value.filter((a) => a.id !== id)];
  }

  async function replaceAssetData(params: {
    id: string;
    dataUrl: string;
    mime: string;
    size: number;
    durationSec?: number;
    poster?: string;
  }) {
    const idx = assets.value.findIndex((a) => a.id === params.id);
    if (idx === -1) throw new Error("Алерт не найден");
    const prev = assets.value[idx];

    // перезаписываем данные по существующему dataKey
    await idbSet(prev.dataKey, params.dataUrl);

    const next: AlertMetaOnly = {
      ...prev,
      mime: params.mime,
      size: params.size,
      durationSec: params.durationSec ?? prev.durationSec,
      poster: params.poster ?? prev.poster,
    };

    assets.value = [next, ...assets.value.filter((a) => a.id !== params.id)];
  }
  function canAdd(
    ownerType: "user" | "group",
    ownerId: string,
    kind: AlertKind
  ) {
    const current = listByOwner(ownerType, ownerId, kind).length;
    const limit = LIMITS[ownerType][kind];
    return current < limit;
  }

  async function addAsset(
    payload: Omit<AlertAsset, "id" | "createdAt"> & {
      file?: File;
      // durationSec здесь можно передать из триммера
    }
  ): Promise<StoredAlertAsset> {
    if (payload.size > MAX_FILE_SIZE) throw new Error("Файл превышает 100 МБ");

    let durationSec: number | undefined = payload.durationSec;
    let poster: string | undefined = payload.poster;

    if (payload.kind === "video" && payload.file && durationSec == null) {
      const res = await probeVideo(payload.file);
      if (res.durationSec > MAX_VIDEO_DURATION) {
        throw new Error(`Видео дольше ${MAX_VIDEO_DURATION} секунд`);
      }
      durationSec = res.durationSec;
      poster = res.poster ?? undefined;
    }

    if (!canAdd(payload.ownerType, payload.ownerId, payload.kind)) {
      const lim = LIMITS[payload.ownerType][payload.kind];
      throw new Error(
        `Достигнут лимит: ${
          payload.ownerType === "user" ? "личных" : "групповых"
        } ${payload.kind} — ${lim}`
      );
    }

    const id = crypto.randomUUID();
    const dataKey = `alert.data.${id}`;

    // Гарантируем, что в IndexedDB попадёт валидный dataURL
    let dataUrl = payload.dataUrl;

    const isValidDataUrl =
      typeof dataUrl === "string" && dataUrl.startsWith("data:");

    if (!isValidDataUrl) {
      if (payload.file) {
        // Перечитываем файл как dataURL, если что-то пошло не так
        dataUrl = await fileToDataUrl(payload.file);
      } else {
        throw new Error("Пустой dataUrl и нет файла для чтения");
      }
    }

    await idbSet(dataKey, dataUrl);

    const item: AlertMetaOnly = {
      id,
      ownerType: payload.ownerType,
      ownerId: payload.ownerId,
      kind: payload.kind,
      name: payload.name,
      mime: payload.mime,
      size: payload.size,
      dataKey,
      poster,
      durationSec,
      createdAt: new Date().toISOString(),
    };

    assets.value = [item, ...assets.value];
    return item as unknown as StoredAlertAsset;
  }

  function removeAsset(id: string) {
    const found = assets.value.find((a) => a.id === id);
    if (found) idbDel(found.dataKey).catch(() => {});
    assets.value = assets.value.filter((a) => a.id !== id);
  }

  async function loadDataUrl(metaId: string): Promise<string> {
    const meta = assets.value.find((a) => a.id === metaId);
    if (!meta) return "";
    const s = await idbGet(meta.dataKey);
    return (s as string) || "";
  }

  function getMeta(id: string) {
    return assets.value.find((a) => a.id === id) || null;
  }

  return {
    assets,
    listByOwner,
    addAsset,
    removeAsset,
    canAdd,
    loadDataUrl,
    getMeta,
    updateAssetMeta,
    replaceAssetData,
  };
});
// Вспомогательная функция: читаем файл как dataURL
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = typeof r.result === "string" ? r.result : "";
      if (!res) {
        reject(new Error("Не удалось прочитать файл как dataURL"));
      } else {
        resolve(res);
      }
    };
    r.onerror = () => reject(new Error("Ошибка чтения файла"));
    r.readAsDataURL(file);
  });
}
// Видеопроба (длительность/постер)
export function probeVideo(
  file: File
): Promise<{ durationSec: number; poster?: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.muted = true;
    video.onloadedmetadata = async () => {
      const durationSec = Math.round(Number(video.duration || 0));
      let poster: string | undefined;
      try {
        video.currentTime = 0.1;
        await new Promise((r) => (video.onseeked = () => r(null)));
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(320, video.videoWidth || 320);
        canvas.height = Math.round(
          canvas.width * (video.videoHeight / (video.videoWidth || 1))
        );
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          poster = canvas.toDataURL("image/jpeg", 0.7);
        }
      } catch {}
      URL.revokeObjectURL(url);
      resolve({ durationSec, poster });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать метаданные видео"));
    };
  });
}
export function probeAudio(file: File): Promise<{ durationSec: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    audio.onloadedmetadata = () => {
      const durationSec = Number(audio.duration || 0);
      URL.revokeObjectURL(url);
      resolve({ durationSec });
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать метаданные аудио"));
    };
  });
}

// Runtime
export interface IncomingAlert {
  id: string;
  asset: StoredAlertAsset;
  meta: AlertMeta;
  senderId: string;
  recipients: { users: string[]; roles: string[] };
  // NEW:
  text?: string;
  fromName?: string;
}

export const useAlertsRuntimeStore = defineStore("alertsRuntime", () => {
  const MAX_ACTIVE = 3;
  const queue = ref<IncomingAlert[]>([]);
  const actives = ref<IncomingAlert[]>([]);
  const assetUrlCache = useStorage<Record<string, string>>(
    "alerts.assetUrl.cache",
    {}
  );
  // NEW: позиции карточек
  const positions = ref<Record<string, { x: number; y: number }>>({});
  function fillFromQueue() {
    while (actives.value.length < MAX_ACTIVE && queue.value.length > 0) {
      const next = queue.value.shift()!;
      actives.value.push(next);
    }
  }

  function show(alert: IncomingAlert) {
    if (actives.value.length < MAX_ACTIVE) actives.value.push(alert);
    else queue.value.push(alert);
  }

  function dismiss(id: string) {
    actives.value = actives.value.filter((a) => a.id !== id);
    // очистим позицию
    const { [id]: _, ...rest } = positions.value;
    positions.value = rest;
    fillFromQueue();
  }

  function clearAll() {
    actives.value = [];
    queue.value = [];
  }
  // Новый: перестановка порядка активных алертов
  function setOrder(next: IncomingAlert[]) {
    // как у вас есть — можно оставить, хоть сейчас не используем сортировку
    const map = new Map(actives.value.map((a) => [a.id, a] as const));
    const reordered: IncomingAlert[] = [];
    for (const item of next) {
      const found = map.get(item.id);
      if (found) reordered.push(found);
    }
    for (const a of actives.value) {
      if (!reordered.find((x) => x.id === a.id)) reordered.push(a);
    }
    actives.value = reordered;
  }
  // Позиции
  function getPosition(id: string) {
    return positions.value[id];
  }
  function setPosition(id: string, pos: { x: number; y: number }) {
    positions.value = { ...positions.value, [id]: pos };
  }
  // Гарантированная выдача dataUrl строки
  async function ensureDataUrl(asset: StoredAlertAsset): Promise<string> {
    if (asset.dataUrl) return asset.dataUrl;
    const key = asset.id;
    if (assetUrlCache.value[key]) return assetUrlCache.value[key];
    const lib = useAlertsLibraryStore();
    const s = await lib.loadDataUrl(asset.id);
    assetUrlCache.value = { ...assetUrlCache.value, [key]: s || "" };
    return s || "";
  }

  // Для плеера (реактивно)
  function getAssetUrl(asset: StoredAlertAsset | any) {
    if (!asset || typeof asset.mime !== "string") return "";

    // Разрешаем все видео и аудио-форматы
    if (!asset.mime.startsWith("video/") && !asset.mime.startsWith("audio/")) {
      return "";
    }

    if (asset?.dataUrl && typeof asset.dataUrl === "string") {
      return asset.dataUrl;
    }

    const key = asset?.id as string;
    if (!key) return "";

    const hit = assetUrlCache.value[key];
    if (hit) return hit;

    const lib = useAlertsLibraryStore();
    lib
      .loadDataUrl(key)
      .then((s) => {
        if (s && assetUrlCache.value[key] !== s) {
          assetUrlCache.value = { ...assetUrlCache.value, [key]: s };
        }
      })
      .catch(() => {
        if (assetUrlCache.value[key] !== "") {
          assetUrlCache.value = { ...assetUrlCache.value, [key]: "" };
        }
      });

    return "";
  }

  // Отправка
  async function sendAlertDM(params: {
    meId: string;
    peerId: string;
    asset: StoredAlertAsset;
    action: AlertAction;
    text?: string;
    fromName?: string; // NEW
  }) {
    const dm = useMessagesStore();

    // НЕ вкладываем dataUrl! Только ссылка на ассет.
    dm.sendAttachment(
      params.meId,
      params.peerId,
      {
        id: crypto.randomUUID(),
        name: params.asset.name,
        size: params.asset.size,
        type: params.asset.mime,
        duration: params.asset.durationSec,
        alert: {
          action: params.action,
          context: "dm",
          peerId: params.peerId,
        } as AlertMeta,
        alertRef: { assetId: params.asset.id },
      } as any,
      params.text || ""
    );

    // Если отправили "самому себе" — показываем локально
    if (params.peerId === params.meId) {
      const prof = useProfilesStore();
      const fallbackFrom = prof.name || "Я";
      show({
        id: crypto.randomUUID(),
        asset: params.asset,
        meta: { action: params.action, context: "dm", peerId: params.peerId },
        senderId: params.meId,
        recipients: { users: [params.peerId], roles: [] },
        text: params.text, // NEW
        fromName: params.fromName || fallbackFrom, // NEW
      });
    }
  }

  async function sendAlertChannel(params: {
    meId: string;
    groupId: string;
    channelId: string;
    asset: StoredAlertAsset;
    action: AlertAction;
    recipients: { users: string[]; roles: string[] };
    text?: string;
    fromName?: string; // NEW
  }) {
    const ch = useGroupMessagesStore();

    ch.sendAttachment(
      params.meId,
      params.channelId,
      {
        id: crypto.randomUUID(),
        name: params.asset.name,
        size: params.asset.size,
        type: params.asset.mime,
        duration: params.asset.durationSec,
        alert: {
          action: params.action,
          context: "channel",
          groupId: params.groupId,
          channelId: params.channelId,
        } as AlertMeta,
        alertRef: { assetId: params.asset.id },
      } as any,
      params.text || ""
    );

    // Если мы в получателях — показываем локально
    if (params.recipients?.users?.includes(params.meId)) {
      const prof = useProfilesStore();
      const fallbackFrom = prof.name || "Я";
      show({
        id: crypto.randomUUID(),
        asset: params.asset,
        meta: {
          action: params.action,
          context: "channel",
          groupId: params.groupId,
          channelId: params.channelId,
        },
        senderId: params.meId,
        recipients: params.recipients,
        text: params.text, // NEW
        fromName: params.fromName || fallbackFrom, // NEW
      });
    }
  }

  return {
    queue,
    actives,
    show,
    dismiss,
    clearAll,
    setOrder,
    positions,
    getPosition,
    setPosition,
    getAssetUrl,
    ensureDataUrl,
    assetUrlCache,
    sendAlertDM,
    sendAlertChannel,
  };
});
