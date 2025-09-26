import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { computed, reactive, watchEffect } from "vue";
export interface GroupTemplate {
  id: string;
  name: string;
  icon?: string;
}
export interface Group {
  id: string;
  name: string;
  isPublic: boolean;
  avatar?: string;
  templateId?: string | null;
  createdAt: string;
}
export interface GroupBadge {
  id: string;
  name: string;
  icon?: string;
  color: string;
}
export interface GroupDecoration {
  id: string;
  name: string;
}
export interface GroupEffect {
  id: string;
  name: string;
}
export interface GroupProfileFields {
  name: string;
  pronouns?: string;
  quote?: string;
  about?: string;
  avatar?: string;
  banner?: string;
  badge: GroupBadge | null;
  decoration: GroupDecoration | null;
  effects: GroupEffect[];
  groupTag?: string;
}
type ProfilesDict = Record<string, GroupProfileFields>;

function getDefaultProfile(name = "Новая группа"): GroupProfileFields {
  return {
    name,
    pronouns: "",
    quote: "",
    about: "",
    avatar: "",
    banner: "",
    badge: null,
    decoration: null,
    effects: [],
    groupTag: "general",
  };
}

export const useGroupsStore = defineStore("groups", () => {
  const groups = useStorage<Group[]>("app.groups", []);
  const profilesDict = useStorage<ProfilesDict>("app.groupProfiles", {});
  const activeGroupId = useStorage<string | null>("app.activeGroupId", null);

  const availableGroupTags = reactive([
    { value: "general", label: "Общая" },
    { value: "study", label: "Учёба" },
    { value: "work", label: "Работа" },
    { value: "hobby", label: "Хобби" },
    { value: "family", label: "Семья" },
  ]);

  function ensureProfile(groupId: string) {
    if (!profilesDict.value[groupId]) {
      const group = groups.value.find((g) => g.id === groupId);
      profilesDict.value[groupId] = getDefaultProfile(group?.name || "Группа");
      if (group) {
        profilesDict.value[groupId].name = group.name;
        if (group.avatar) profilesDict.value[groupId].avatar = group.avatar;
      }
    }
    return profilesDict.value[groupId];
  }

  watchEffect(() => {
    if (!activeGroupId.value) {
      if (groups.value.length > 0) {
        activeGroupId.value = groups.value[0].id;
      }
    } else {
      ensureProfile(activeGroupId.value);
    }
  });

  function setActiveGroup(id: string | null) {
    if (id && groups.value.some((g) => g.id === id)) {
      activeGroupId.value = id;
      ensureProfile(id);
    } else {
      activeGroupId.value = null;
    }
  }

  function addGroup(payload: Omit<Group, "id" | "createdAt">) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const newGroup: Group = { id, createdAt, ...payload };
    groups.value.unshift(newGroup);
    profilesDict.value[id] = getDefaultProfile(newGroup.name);
    if (newGroup.avatar) profilesDict.value[id].avatar = newGroup.avatar;
    activeGroupId.value = id;
    return newGroup;
  }

  function removeGroup(id: string) {
    groups.value = groups.value.filter((g) => g.id !== id);
    if (profilesDict.value[id]) {
      const dict = { ...profilesDict.value };
      delete dict[id];
      profilesDict.value = dict;
    }
    if (activeGroupId.value === id) {
      activeGroupId.value = groups.value[0]?.id ?? null;
      if (activeGroupId.value) ensureProfile(activeGroupId.value);
    }
  }

  function getById(id: string) {
    return groups.value.find((g) => g.id === id) || null;
  }

  const currentProfile = computed<GroupProfileFields | null>(() => {
    if (!activeGroupId.value) return null;
    return ensureProfile(activeGroupId.value);
  });

  const name = computed(() => currentProfile.value?.name ?? "");
  const pronouns = computed(() => currentProfile.value?.pronouns ?? "");
  const quote = computed(() => currentProfile.value?.quote ?? "");
  const about = computed(() => currentProfile.value?.about ?? "");
  const avatar = computed(() => currentProfile.value?.avatar ?? "");
  const banner = computed(() => currentProfile.value?.banner ?? "");
  const badge = computed(() => currentProfile.value?.badge ?? null);
  const decoration = computed(() => currentProfile.value?.decoration ?? null);
  const effects = computed(() => currentProfile.value?.effects ?? []);
  const groupTag = computed(() => currentProfile.value?.groupTag ?? "general");

  function updateMainProfile(payload: Partial<GroupProfileFields>) {
    if (!activeGroupId.value) return;
    const prof = ensureProfile(activeGroupId.value);
    Object.assign(prof, payload);
    const idx = groups.value.findIndex((g) => g.id === activeGroupId.value);
    if (idx !== -1) {
      const g = { ...groups.value[idx] };
      if (typeof payload.name === "string") g.name = payload.name;
      if (typeof payload.avatar === "string") g.avatar = payload.avatar;
      const copy = [...groups.value];
      copy[idx] = g;
      groups.value = copy;
    }
  }

  async function saveAndReport(): Promise<{ ok: boolean; message: string }> {
    try {
      await new Promise((r) => setTimeout(r, 150));
      return { ok: true, message: "Профиль успешно сохранён" };
    } catch (e) {
      return { ok: false, message: "Не удалось сохранить профиль" };
    }
  }

  // NEW: инициализация 2-х групп по умолчанию
  function ensureSeed(): [Group, Group] {
    if (groups.value.length >= 2) {
      return [groups.value[0], groups.value[1]];
    }
    if (groups.value.length === 0) {
      addGroup({
        name: "Frontend Guild",
        isPublic: true,
        avatar: "/groups/frontend.png",
        templateId: null,
      });
    }
    if (groups.value.length === 1) {
      addGroup({
        name: "Backend Hub",
        isPublic: true,
        avatar: "/groups/backend.png",
        templateId: null,
      });
    }
    return [groups.value[0], groups.value[1]];
  }

  return {
    groups,
    addGroup,
    removeGroup,
    getById,
    activeGroupId,
    setActiveGroup,
    name,
    pronouns,
    quote,
    about,
    avatar,
    banner,
    badge,
    decoration,
    effects,
    groupTag,
    availableGroupTags,
    updateMainProfile,
    saveAndReport,
    // NEW:
    ensureSeed,
  };
});