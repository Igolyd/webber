import { defineStore } from "pinia";
import { ref, watch } from "vue";
export type Badge = { id: string; name: string; icon?: string; color?: string };
export type ProfileEffect = { id: string; name: string };
export type Decoration = { id: string; name: string };
type ProfilesState = {
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
  availableGroupTags: string[];
  groupPersonalProfile: Record<string, unknown>;
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
  const banner = ref<string>("");
  const badge = ref<Badge | null>(null);
  const decoration = ref<Decoration | null>(null);
  const effects = ref<ProfileEffect[]>([]);
  const about = ref<string>("");
  const quote = ref<string>("");
  const groupTag = ref<string>("");
  const availableGroupTags = ref<string[]>([
    "Геймеры",
    "Музыканты",
    "Дизайнеры",
  ]);
  const groupPersonalProfile = ref<Record<string, unknown>>({});
  const initial = loadFromLS();
  if (initial) {
    if (initial.name !== undefined) name.value = initial.name;
    if (initial.pronouns !== undefined) pronouns.value = initial.pronouns;
    if (initial.avatar !== undefined) avatar.value = initial.avatar;
    if (initial.banner !== undefined) banner.value = initial.banner;
    if (initial.badge !== undefined) badge.value = initial.badge as any;
    if (initial.decoration !== undefined)
      decoration.value = initial.decoration as any;
    if (initial.effects !== undefined) effects.value = initial.effects as any;
    if (initial.about !== undefined) about.value = initial.about;
    if (initial.quote !== undefined) quote.value = initial.quote;
    if (initial.groupTag !== undefined) groupTag.value = initial.groupTag;
    if (initial.groupPersonalProfile !== undefined)
      groupPersonalProfile.value = initial.groupPersonalProfile as any;
    if (
      initial.availableGroupTags !== undefined &&
      Array.isArray(initial.availableGroupTags)
    ) {
      availableGroupTags.value = initial.availableGroupTags;
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
    updateMainProfile,
    saveAndReport,
  };
});
