// stores/user/account.ts
import { defineStore } from "pinia";
import { ref, watch, onMounted } from "vue";
import { useUsersStore } from "@/stores/users";
import { useProfilesStore } from "@/stores/user/profiles";

type AccountState = {
  userId: string;
  username: string;
  email: string;
  phone: string;
};

const LS_KEY = "app:user:account";

function loadFromLS(): AccountState | null {
  if (!import.meta.client) return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useUserAccountStore = defineStore("userAccount", () => {
  const userId = ref<string>("");
  const username = ref<string>("");
  const email = ref<string>("");
  const phone = ref<string>("");

  const initial = loadFromLS();
  if (initial) {
    userId.value = initial.userId || "";
    username.value = initial.username || "";
    email.value = initial.email || "";
    phone.value = initial.phone || "";
  }

  function updateContacts(payload: { phone?: string; email?: string }) {
    if (payload.phone !== undefined) phone.value = payload.phone;
    if (payload.email !== undefined) email.value = payload.email;
  }

  function updateIdentity(payload: { username?: string }) {
    if (payload.username !== undefined)
      username.value = payload.username.trim();
  }

  async function changePassword(_oldPass: string, _newPass: string) {
    return true;
  }

  async function deleteAccount() {
    userId.value = "";
    username.value = "";
    email.value = "";
    phone.value = "";
    if (import.meta.client) localStorage.removeItem(LS_KEY);
    return true;
  }

  // Обеспечиваем связь с users и синхронизацию профиля
  function ensureLinkedUser() {
    const users = useUsersStore();
    const profiles = useProfilesStore();

    const existing = userId.value ? users.getById(userId.value) : null;
    if (!existing) {
      const created = users.ensureUserByAccount({
        userId: userId.value || undefined,
        name: profiles.name || username.value || "Me",
        avatar: profiles.avatar || "",
      });
      userId.value = created.id;
    }

    // Синхронизируем name/avatar из Profiles в AppUser (наблюдатели)
    watch(
      [() => profiles.name, () => profiles.avatar],
      ([newName, newAvatar]) => {
        if (userId.value) {
          users.patchUser(userId.value, {
            name: newName || "Me",
            avatar: newAvatar || "",
          });
        }
      },
      { immediate: true }
    );
  }

  // persist
  watch(
    [userId, username, email, phone],
    () => {
      if (!import.meta.client) return;
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            userId: userId.value,
            username: username.value,
            email: email.value,
            phone: phone.value,
          })
        );
      } catch {}
    },
    { deep: false }
  );

  // Можно вызвать снаружи в плагине/на старте приложения
  function init() {
    ensureLinkedUser();
  }

  return {
    userId,
    username,
    email,
    phone,
    updateContacts,
    updateIdentity,
    changePassword,
    deleteAccount,
    init,
  };
});
