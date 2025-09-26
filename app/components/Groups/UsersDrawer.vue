<template>
  <v-navigation-drawer
    v-model="model"
    :permanent="!isSmAndDown"
    :temporary="isSmAndDown"
    location="right"
    width="300"
    class="theme-drawer-right"
    :scrim="isSmAndDown"
  >
    <h2 class="text-h6 px-4 py-2">Участники</h2>

    <v-list density="comfortable" nav>
      <!-- Группы по ролям -->
      <template v-for="role in sortedRoles" :key="role.id">
        <v-divider>
          <v-list-subheader class="px-4 d-flex align-center">
            <span class="role-dot" :style="{ backgroundColor: role.color }" />
            <span class="mr-2">{{ role.name }}</span>
            <span class="ms-auto text-caption opacity-70">
              {{ getUsersByRole(role.id).length }}
            </span>
          </v-list-subheader></v-divider
        >

        <template v-for="user in getUsersByRole(role.id)" :key="user.id">
          <v-hover v-slot="{ isHovering, props: hoverProps }">
            <v-list-item
              v-bind="hoverProps"
              :value="user.id"
              :style="itemStyle(user, isHovering)"
              density="comfortable"
              rounded="md"
              @click="$emit('view-user', user.id, user.name)"
              @contextmenu.prevent="openContextMenu($event, user)"
            >
              <template #prepend>
                <v-avatar
                  size="32"
                  :style="{ backgroundColor: resolveBannerColor(user.banner) }"
                >
                  <v-img
                    :src="user.avatar || '/app/assets/profile/profile_exp.jpg'"
                    cover
                  />
                </v-avatar>
              </template>

              <v-list-item-title class="text-truncate">
                {{ user.name }}
              </v-list-item-title>

              <!-- Чипы ролей пользователя в текущей группе -->
              <template #append>
                <div class="d-flex align-center flex-wrap gap-1">
                  <v-chip
                    v-for="r in getUserRolesInActiveGroup(user)"
                    :key="r.id"
                    size="x-small"
                    variant="flat"
                    :style="{ backgroundColor: r.color, color: '#000' }"
                  >
                    {{ r.name }}
                  </v-chip>
                </div>
              </template>
            </v-list-item>
          </v-hover>
        </template>
      </template>

      <!-- Пользователи без ролей -->
      <template v-if="unassignedUsers.length">
        <v-divider>
          <v-list-subheader class="px-4">Без роли</v-list-subheader>
        </v-divider>

        <template v-for="user in unassignedUsers" :key="user.id">
          <v-hover v-slot="{ isHovering, props: hoverProps }">
            <v-list-item
              v-bind="hoverProps"
              :value="user.id"
              :style="itemStyle(user, isHovering)"
              density="comfortable"
              rounded="md"
              @click="$emit('view-user', user.id, user.name)"
              @contextmenu.prevent="openContextMenu($event, user)"
            >
              <template #prepend>
                <v-avatar
                  size="32"
                  :style="{ backgroundColor: resolveBannerColor(user.banner) }"
                >
                  <v-img
                    :src="user.avatar || '/app/assets/profile/profile_exp.jpg'"
                    cover
                  />
                </v-avatar>
              </template>

              <v-list-item-title class="text-truncate">
                {{ user.name }}
              </v-list-item-title>
            </v-list-item>
          </v-hover>
        </template>
      </template>

      <!-- Пусто -->
      <v-list-item
        v-if="!sortedRoles.length && !unassignedUsers.length"
        class="opacity-70"
      >
        <v-list-item-title>Нет участников</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUsersStore, type AppUser } from "@/stores/users";
import { useGroupsStore } from "@/stores/groups";
import { useRolesStore, type Role } from "@/stores/roles";

const props = defineProps<{
  modelValue: boolean;
  isSmAndDown: boolean;
}>();

const emit = defineEmits(["update:modelValue", "view-user", "context-user"]);

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const usersStore = useUsersStore();
const groupsStore = useGroupsStore();
const rolesStore = useRolesStore();

const activeGroupId = computed(() => groupsStore.activeGroupId);

// пользователи активной группы
const users = computed<AppUser[]>(() => {
  if (!activeGroupId.value) return [];
  return usersStore.getUsersByGroup(activeGroupId.value);
});

// роли активной группы
const rolesInGroup = computed<Role[]>(() => {
  if (!activeGroupId.value) return [];
  return rolesStore.getRolesByGroup(activeGroupId.value);
});

// сортируем роли по имени
const sortedRoles = computed<Role[]>(() => {
  return [...rolesInGroup.value].sort((a, b) => a.name.localeCompare(b.name));
});

// мапа ролей для быстрого lookup
const rolesById = computed<Map<string, Role>>(() => {
  return new Map(sortedRoles.value.map((r) => [r.id, r]));
});

// пользователи конкретной роли (по memberships.roleIds)
function getUsersByRole(roleId: string) {
  if (!activeGroupId.value) return [];
  return users.value.filter((u) =>
    u.memberships.some(
      (m) => m.groupId === activeGroupId.value && m.roleIds.includes(roleId)
    )
  );
}

// роли пользователя в активной группе (объекты Role)
function getUserRolesInActiveGroup(user: AppUser): Role[] {
  if (!activeGroupId.value) return [];
  const mem = user.memberships.find((m) => m.groupId === activeGroupId.value);
  if (!mem) return [];
  return mem.roleIds
    .map((rid) => rolesById.value.get(rid))
    .filter(Boolean) as Role[];
}

// пользователи без ролей
const unassignedUsers = computed<AppUser[]>(() => {
  if (!activeGroupId.value) return [];
  return users.value.filter((u) => {
    const mem = u.memberships.find((m) => m.groupId === activeGroupId.value);
    return mem ? mem.roleIds.length === 0 : false;
  });
});

// hover: валидный ли CSS-цвет
function isCssColor(input?: string) {
  if (!input) return false;
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
    return CSS.supports("color", input);
  }
  return (
    /^#([0-9a-f]{3}|([0-9a-f]{2}){3,4})$/i.test(input) ||
    /^rgb(a?)\(/i.test(input) ||
    /^hsl(a?)\(/i.test(input) ||
    /^[a-z]+$/i.test(input)
  );
}

// цвет подсветки из баннера пользователя
function resolveBannerColor(banner?: string) {
  return isCssColor(banner) ? banner! : "var(--v-theme-surface-variant)";
}

// стиль элемента списка при наведении
function itemStyle(user: AppUser, isHovering: boolean) {
  const color = resolveBannerColor(user.banner);
  return {
    transition: "background-color .18s ease",
    backgroundColor: isHovering ? color : "transparent",
    cursor: "pointer",
  } as Record<string, string>;
}

// контекстное меню — отдаём наружу координаты и пользователя (если нужно)
function openContextMenu(e: MouseEvent, user: AppUser) {
  emit("context-user", { x: e.clientX, y: e.clientY, user });
}
</script>

<style scoped>
.theme-drawer-right {
  background-color: transparent !important;
  color: var(--app-text-color);
  border-left: 1px solid var(--app-border-color);
  box-shadow: none !important;
}
.role-dot { width: 10px; height: 10px; border-radius: 999px; margin-right: 8px; opacity: .9; display: inline-block; }
.opacity-70 { opacity: .7; }
.gap-1 { gap: 4px; }
</style>