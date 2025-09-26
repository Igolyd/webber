import { defineStore } from "pinia";
import { ref, watch } from "vue";

export type Badge = { id: string; name: string; icon?: string; color?: string };
export type ProfileEffect = { id: string; name: string };
export type Decoration = { id: string; name: string };
export type PresenceStatus = "online" | "idle" | "dnd" | "invisible";

type ProfilesState = {
  name: string;
  pronouns: string;
  avatar: string;
  banner: string;                // может быть цвет/градиент/URL
  badge: Badge | null;
  decoration: Decoration | null;
  effects: ProfileEffect[];
  about: string;
  quote: string;
  groupTag: string;
  availableGroupTags: string[];
  groupPersonalProfile: Record<string, unknown>;
  status: PresenceStatus;        // NEW: статус присутствия
  bannerColor: string;           // NEW: кастомный цвет/градиент для баннера
  bannerOverlayColor: string;    // NEW: цвет оверлея
  bannerOverlayOpacity: number;  // NEW: от 0 до 1
};

const LS_KEY = "app:user:profiles";

function loadFromLS(): Partial<ProfilesState> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useProfilesStore = defineStore("profiles", () => {
  const name = ref<string>("");
  const pronouns = ref<string>("");
  const avatar = ref<string>("");
  const banner = ref<string>(""); // может быть и цвет/градиентом (обратная совместимость)
  const badge = ref<Badge | null>(null);
  const decoration = ref<Decoration | null>(null);
  const effects = ref<ProfileEffect[]>([]);
  const about = ref<string>("");
  const quote = ref<string>("");
  const groupTag = ref<string>("");
  const availableGroupTags = ref<string[]>(["Геймеры", "Музыканты", "Дизайнеры"]);
  const groupPersonalProfile = ref<Record<string, unknown>>({});

  const status = ref<PresenceStatus>("online");     // NEW
  const bannerColor = ref<string>("linear-gradient(180deg, #8ec5e5, #4f9cf9)"); // NEW
  const bannerOverlayColor = ref<string>("#000000"); // NEW
  const bannerOverlayOpacity = ref<number>(0.25);    // NEW

  const initial = loadFromLS();
  if (initial) {
    if (initial.name !== undefined) name.value = initial.name;
    if (initial.pronouns !== undefined) pronouns.value = initial.pronouns;
    if (initial.avatar !== undefined) avatar.value = initial.avatar;
    if (initial.banner !== undefined) banner.value = initial.banner;
    if (initial.badge !== undefined) badge.value = initial.badge as any;
    if (initial.decoration !== undefined) decoration.value = initial.decoration as any;
    if (initial.effects !== undefined) effects.value = initial.effects as any;
    if (initial.about !== undefined) about.value = initial.about;
    if (initial.quote !== undefined) quote.value = initial.quote;
    if (initial.groupTag !== undefined) groupTag.value = initial.groupTag;
    if (initial.groupPersonalProfile !== undefined)
      groupPersonalProfile.value = initial.groupPersonalProfile as any;
    if (initial.availableGroupTags !== undefined && Array.isArray(initial.availableGroupTags)) {
      availableGroupTags.value = initial.availableGroupTags;
    }
    if (initial.status !== undefined) status.value = initial.status as PresenceStatus;
    if (initial.bannerColor !== undefined) bannerColor.value = initial.bannerColor;
    if (initial.bannerOverlayColor !== undefined) bannerOverlayColor.value = initial.bannerOverlayColor;
    if (initial.bannerOverlayOpacity !== undefined) bannerOverlayOpacity.value = initial.bannerOverlayOpacity;
    // Мягкая миграция: если не задан bannerColor, а banner — это не URL, считаем его цветом/градиентом
    if (!initial.bannerColor && initial.banner && !/^(https?:|data:|blob:)/i.test(initial.banner)) {
      bannerColor.value = initial.banner;
    }
  }

  function getSnapshot(): ProfilesState {
    return {
      name: name.value,
      pronouns: pronouns.value,
      avatar: avatar.value,
      banner: banner.value,
      badge: badge.value,
      decoration: decoration.value,
      effects: effects.value,
      about: about.value,
      quote: quote.value,
      groupTag: groupTag.value,
      availableGroupTags: availableGroupTags.value,
      groupPersonalProfile: groupPersonalProfile.value,
      status: status.value,
      bannerColor: bannerColor.value,
      bannerOverlayColor: bannerOverlayColor.value,
      bannerOverlayOpacity: bannerOverlayOpacity.value,
    };
  }

  function persistSnapshot(snapshot: ProfilesState) {
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
  }

  function updateMainProfile(
    payload: Partial<{
      name: string;
      pronouns: string;
      avatar: string;
      banner: string;
      badge: Badge | null;
      decoration: Decoration | null;
      effects: ProfileEffect[];
      about: string;
      quote: string;
      groupTag: string;
      status: PresenceStatus;
      bannerColor: string;
      bannerOverlayColor: string;
      bannerOverlayOpacity: number;
    }>
  ) {
    if (payload.name !== undefined) name.value = payload.name;
    if (payload.pronouns !== undefined) pronouns.value = payload.pronouns;
    if (payload.avatar !== undefined) avatar.value = payload.avatar;
    if (payload.banner !== undefined) banner.value = payload.banner;
    if (payload.badge !== undefined) badge.value = payload.badge;
    if (payload.decoration !== undefined) decoration.value = payload.decoration;
    if (payload.effects !== undefined) effects.value = payload.effects;
    if (payload.about !== undefined) about.value = payload.about;
    if (payload.quote !== undefined) quote.value = payload.quote;
    if (payload.groupTag !== undefined) groupTag.value = payload.groupTag;
    if (payload.status !== undefined) status.value = payload.status;
    if (payload.bannerColor !== undefined) bannerColor.value = payload.bannerColor;
    if (payload.bannerOverlayColor !== undefined) bannerOverlayColor.value = payload.bannerOverlayColor;
    if (payload.bannerOverlayOpacity !== undefined) bannerOverlayOpacity.value = payload.bannerOverlayOpacity;
  }

  function updateStatus(next: PresenceStatus) {
    status.value = next;
  }

  async function saveAndReport() {
    try {
      const snapshot = getSnapshot();
      persistSnapshot(snapshot);
      const check = loadFromLS();
      const ok = !!check;
      return {
        ok,
        message: ok ? "Профиль сохранён" : "Не удалось подтвердить сохранение",
        data: snapshot,
        ts: Date.now(),
      };
    } catch (e: any) {
      return {
        ok: false,
        message: e?.message || "Ошибка при сохранении",
        data: null,
        ts: Date.now(),
      };
    }
  }

  watch(
    [
      name,
      pronouns,
      avatar,
      banner,
      badge,
      decoration,
      effects,
      about,
      quote,
      groupTag,
      availableGroupTags,
      groupPersonalProfile,
      status,
      bannerColor,
      bannerOverlayColor,
      bannerOverlayOpacity,
    ],
    () => {
      const snapshot = getSnapshot();
      persistSnapshot(snapshot);
    },
    { deep: true }
  );

  return {
    name,
    pronouns,
    avatar,
    banner,
    badge,
    decoration,
    effects,
    about,
    quote,
    groupTag,
    availableGroupTags,
    groupPersonalProfile,
    status,
    bannerColor,
    bannerOverlayColor,
    bannerOverlayOpacity,
    updateMainProfile,
    updateStatus,
    saveAndReport,
  };
});