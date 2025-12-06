<template>
  <v-navigation-drawer
    v-model="model"
    :permanent="!isSmAndDown"
    :temporary="isSmAndDown"
    location="right"
    width="300"
    color="transparent"
    elevation="0"
    class="theme-drawer-right scope-rnav"
    :scrim="isSmAndDown"
  >
    <h2 class="text-h6 px-4 py-2">Участники</h2>

    <v-list density="comfortable" nav>
      <template v-for="role in sortedRoles" :key="role.id">
        <v-list-subheader class="px-4 d-flex align-center">
          <span class="role-dot" :style="{ backgroundColor: role.color }" />
          <span class="mr-2">{{ role.name }}</span>
          <span class="ms-auto text-caption opacity-70">
            {{ getUsersByRole(role.id).length }}
          </span>
        </v-list-subheader>
        <v-divider />

        <template v-for="user in getUsersByRole(role.id)" :key="user.id">
          <v-hover v-slot="{ isHovering, props: hoverProps }">
            <v-list-item
              v-bind="hoverProps"
              :value="user.id"
              :style="itemStyle(user, isHovering)"
              density="comfortable"
              rounded="md"
              @click="
                (e) => {
                  $emit('view-user', user.id, user.name);
                  openProfileMenu(e, user);
                }
              "
              @contextmenu.prevent.stop="(e) => openContextMenu(e, user)"
            >
              <template #prepend>
                <v-avatar size="32">
                  <v-img
                    :src="user.avatar || '/app/assets/profile/profile_exp.jpg'"
                    cover
                  />
                </v-avatar>
              </template>

              <div class="d-flex flex-column w-100">
                <div class="d-flex align-center">
                  <v-list-item-title class="text-truncate">{{
                    user.name
                  }}</v-list-item-title>

                  <div class="ms-auto d-flex align-center flex-wrap gap-1">
                    <v-chip
                      v-if="user.groupTag"
                      size="x-small"
                      variant="outlined"
                      class="ml-2"
                      prepend-icon="mdi-star"
                    >
                      {{ user.groupTag }}
                    </v-chip>
                  </div>
                </div>

                <v-list-item-subtitle
                  v-if="user.quote"
                  class="text-medium-emphasis text-truncate mt-1"
                >
                  {{ user.quote }}
                </v-list-item-subtitle>
              </div>
            </v-list-item>
          </v-hover>
        </template>
      </template>

      <template v-if="unassignedUsers.length">
        <v-list-subheader class="px-4">Без роли</v-list-subheader>
        <v-divider />
        <template v-for="user in unassignedUsers" :key="user.id">
          <v-hover v-slot="{ isHovering, props: hoverProps }">
            <v-list-item
              v-bind="hoverProps"
              :value="user.id"
              :style="itemStyle(user, isHovering)"
              density="comfortable"
              rounded="md"
              @click="
                (e) => {
                  $emit('view-user', user.id, user.name);
                  openProfileMenu(e, user);
                }
              "
              @contextmenu.prevent.stop="(e) => openContextMenu(e, user)"
            >
              <template #prepend>
                <v-avatar size="32">
                  <v-img
                    :src="user.avatar || '/app/assets/profile/profile_exp.jpg'"
                    cover
                  />
                </v-avatar>
              </template>

              <div class="d-flex flex-column w-100">
                <div class="d-flex align-center">
                  <v-list-item-title class="text-truncate">{{
                    user.name
                  }}</v-list-item-title>
                  <div class="ms-auto d-flex align-center flex-wrap gap-1">
                    <v-chip
                      v-if="user.groupTag"
                      size="x-small"
                      variant="outlined"
                      class="ml-2"
                      prepend-icon="mdi-star"
                    >
                      {{ user.groupTag }}
                    </v-chip>
                  </div>
                </div>
                <v-list-item-subtitle
                  v-if="user.quote"
                  class="text-medium-emphasis text-truncate mt-1"
                >
                  {{ user.quote }}
                </v-list-item-subtitle>
              </div>

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

      <v-list-item
        v-if="!sortedRoles.length && !unassignedUsers.length"
        class="opacity-70"
      >
        <v-list-item-title>Нет участников</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <!-- Меню профиля (ЛКМ) -->
  <v-menu
    v-model="memberMenu"
    :key="selectedUserId"
    :activator="menuActivator"
    attach="body"
    location="end"
    transition="fade-transition"
    :close-on-content-click="false"
  >
    <GroupMemberProfileCard
      v-if="selectedUser && activeGroupId"
      :user-id="selectedUser.id"
      :group-id="activeGroupId!"
      @dm="(uid) => $emit('view-user', uid || selectedUser!.id, selectedUser!.name)"
      @mention="() => {}"
    />
  </v-menu>

  <!-- Контекстное меню (ПКМ) -->
  <v-menu
    v-model="ctxMenu.open"
    :activator="ctxMenu.activator"
    attach="body"
    location="end"
    transition="fade-transition"
  >
    <v-list density="comfortable">
      <v-list-item
        title="Открыть профиль"
        prepend-icon="mdi-account"
        @click="openProfileFromContext"
      />
      <v-divider />
      <v-menu
        v-model="ctxMenu.rolesOpen"
        activator="parent"
        open-on-hover
        location="end"
        transition="fade-transition"
        attach="body"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            title="Роли"
            prepend-icon="mdi-badge-account"
            append-icon="mdi-chevron-right"
          />
        </template>
        <v-list density="comfortable" style="min-width: 260px">
          <template v-if="rolesListForCtx.length">
            <v-list-item
              v-for="r in rolesListForCtx"
              :key="r.id"
              :title="r.name"
              @click="toggleRoleForCtxUser(r.id)"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="
                    ctxMenu.userId ? userHasRole(ctxMenu.userId, r.id) : false
                  "
                  @update:modelValue="() => toggleRoleForCtxUser(r.id)"
                />
              </template>
              <template #append>
                <v-avatar size="18" :color="r.color" />
              </template>
            </v-list-item>
          </template>
          <div v-else class="px-4 py-2 text-medium-emphasis">Ролей нет</div>
        </v-list>
      </v-menu>
      <v-divider />
      <v-list-item title="Бан" prepend-icon="mdi-gavel" @click="actionBan" />
      <v-list-item
        title="Таймаут"
        prepend-icon="mdi-timer-outline"
        @click="actionTimeout"
      />
      <v-list-item
        title="Мут"
        prepend-icon="mdi-microphone-off"
        @click="actionMute"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from "vue";
import { useUsersStore, type AppUser } from "@/stores/users";
import { useGroupsStore } from "@/stores/groups";
import { useRolesStore, type Role } from "@/stores/roles";
import GroupMemberProfileCard from "./Profiles/GroupMemberProfileCard.vue";

const props = defineProps<{
  modelValue: boolean;
  isSmAndDown: boolean;
  groupId?: string;
}>();
const emit = defineEmits(["update:modelValue", "view-user", "context-user"]);

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const usersStore = useUsersStore();
const groupsStore = useGroupsStore();
const rolesStore = useRolesStore();

const activeGroupId = computed(
  () => props.groupId ?? groupsStore.activeGroupId
);

const users = computed<AppUser[]>(() =>
  !activeGroupId.value ? [] : usersStore.getUsersByGroup(activeGroupId.value)
);

const memberMenu = ref(false);
const menuActivator = ref<HTMLElement | null>(null);
const selectedUserId = ref<string | null>(null);
const selectedUser = computed(() =>
  selectedUserId.value ? usersStore.getById(selectedUserId.value) : null
);
async function openProfileMenu(e: MouseEvent, user: AppUser) {
  e.stopPropagation();
  selectedUserId.value = user.id;
  menuActivator.value = (e.currentTarget as HTMLElement) || null;
  if (memberMenu.value) {
    memberMenu.value = false;
    await nextTick();
  }
  requestAnimationFrame(() => {
    memberMenu.value = true;
  });
}

const rolesInGroup = computed<Role[]>(() =>
  !activeGroupId.value ? [] : rolesStore.getRolesByGroup(activeGroupId.value)
);
const sortedRoles = computed<Role[]>(() =>
  [...rolesInGroup.value].sort((a, b) => a.name.localeCompare(b.name))
);
const rolesById = computed<Map<string, Role>>(
  () => new Map(sortedRoles.value.map((r) => [r.id, r]))
);

function getUsersByRole(roleId: string) {
  if (!activeGroupId.value) return [];
  return users.value.filter((u) =>
    u.memberships.some(
      (m) => m.groupId == activeGroupId.value && m.roleIds.includes(roleId)
    )
  );
}
function getUserRolesInActiveGroup(user: AppUser): Role[] {
  if (!activeGroupId.value) return [];
  const mem = user.memberships.find((m) => m.groupId == activeGroupId.value);
  if (!mem) return [];
  return mem.roleIds
    .map((rid) => rolesById.value.get(rid))
    .filter(Boolean) as Role[];
}
const unassignedUsers = computed<AppUser[]>(() => {
  if (!activeGroupId.value) return [];
  return users.value.filter((u) => {
    const mem = u.memberships.find((m) => m.groupId == activeGroupId.value);
    return mem ? mem.roleIds.length === 0 : false; // FIX: было = 0
  });
});

function isGradientLike(v?: string) {
  if (!v) return false;
  const s = v.toLowerCase().trim();
  return s.includes("gradient(") || s.startsWith("url(");
}

function itemStyle(user: AppUser, isHovering: boolean) {
  const style: Record<string, string> = {
    transition:
      "filter .18s ease, background .18s ease, background-color .18s ease, border-radius .18s ease",
    filter: isHovering
      ? "none"
      : "opacity(0.85) saturate(0.98) brightness(0.98)",
    cursor: "pointer",
    borderRadius: "12px",
    overflow: "hidden",
  };
  const banner = user.banner;
  if (isHovering && banner) {
    if (isGradientLike(banner)) style.background = banner;
    else style.backgroundColor = banner;
  }
  return style;
}

const ctxMenu = ref<{
  open: boolean;
  activator: HTMLElement | null;
  userId: string | null;
  rolesOpen: boolean;
}>({
  open: false,
  activator: null,
  userId: null,
  rolesOpen: false,
});
function openContextMenu(e: MouseEvent, user: AppUser) {
  e.stopPropagation();
  ctxMenu.value.userId = user.id;
  ctxMenu.value.activator = (e.currentTarget as HTMLElement) || null;
  if (ctxMenu.value.open) ctxMenu.value.open = false;
  requestAnimationFrame(() => (ctxMenu.value.open = true));
  emit("context-user", { x: e.clientX, y: e.clientY, user });
}
const rolesListForCtx = computed(() =>
  rolesInGroup.value.filter((r) => !r.isEveryone)
);
function userHasRole(userId: string, roleId: string) {
  if (!activeGroupId.value) return false;
  const u = usersStore.getById(userId);
  if (!u) return false;
  return u.memberships.some(
    (m) => m.groupId === activeGroupId.value && m.roleIds.includes(roleId)
  );
}
function toggleRoleForCtxUser(roleId: string) {
  if (!ctxMenu.value.userId || !activeGroupId.value) return;
  const uid = ctxMenu.value.userId;
  if (userHasRole(uid, roleId)) {
    usersStore.removeRole(uid, activeGroupId.value, roleId);
    rolesStore.removeUserFromRole(roleId, uid);
  } else {
    usersStore.assignRole(uid, activeGroupId.value, roleId);
    rolesStore.assignUserToRole(roleId, uid);
  }
}
function openProfileFromContext() {
  if (!ctxMenu.value.userId) return;
  const u = usersStore.getById(ctxMenu.value.userId);
  if (!u) return;
  ctxMenu.value.open = false;
  if (ctxMenu.value.activator) {
    const fakeEvent = {
      currentTarget: ctxMenu.value.activator,
    } as unknown as MouseEvent;
    openProfileMenu(fakeEvent, u);
  }
}
function actionBan() {
  console.log("ban", ctxMenu.value.userId);
}
function actionTimeout() {
  console.log("timeout", ctxMenu.value.userId);
}
function actionMute() {
  console.log("mute", ctxMenu.value.userId);
}

watch(model, (v) => {
  if (!v) {
    memberMenu.value = false;
    ctxMenu.value.open = false;
  }
});
</script>

<style scoped>
.scope-rnav {
  --v-theme-surface: var(--rnav-surface);
  --v-theme-on-surface: var(--rnav-on-surface);
  --v-theme-outline: var(--rnav-border);
  --v-theme-surface-variant: var(--rnav-elev-1);
}
.theme-drawer-right {
  background: linear-gradient(
    to top,
    /* низ — почти белый, но с тоном темы */
      color-mix(
        in srgb,
        var(--lnav-background) 70%,
        var(--gradient-bg-color) 30%
      )
      0%,
    /* дальше — нормальный цвет темы */ var(--rnav-elev-1) 60%,
    var(--rnav-elev-1) 100%
  ) !important;
  color: var(
    --rnav-on-surface,
    var(--app-on-surface, var(--v-theme-on-surface))
  );
  box-shadow: none !important;
}
.role-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-right: 8px;
  opacity: 0.9;
  display: inline-block;
}
.opacity-70 {
  opacity: 0.7;
}
.gap-1 {
  gap: 4px;
}
.w-100 {
  width: 100%;
}
</style>
