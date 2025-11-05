<!-- components/navigation/AppLeftDrawer.vue -->
<template>
  <v-navigation-drawer
    v-model="localOpen"
    :permanent="!isSmAndDown"
    :temporary="isSmAndDown"
    :width="width"
    class="theme-drawer-left scope-lnav"
    :class="{ 'lnav-has-image': lnavHasImage }"
    app
  >
    <v-card elevation="0" color="transparent" class="px-4 pt-4 pb-2">
      <div class="toolbar-header">
        <div
          class="nav-item"
          @click="switchCategory(activeCategoryId === 1 ? 2 : 1)"
        >
          <v-icon
            size="24"
            class="mr-2"
            :icon="
              isGroupsActive ? 'mdi-forum-outline' : 'mdi-account-group-outline'
            "
            :title="categorySwitchLabel"
          />
          <span>{{ categorySwitchLabel }}</span>
        </div>

        <div class="nav-item" @click="triggerCategoryAction">
          <v-icon
            size="24"
            class="mr-2"
            :icon="
              isGroupsActive
                ? 'mdi-creation-outline'
                : 'mdi-account-search-outline'
            "
            :title="currentTitle"
          />
          <span>{{ currentTitle }}</span>
        </div>

        <NuxtLink to="/market">
          <div class="nav-item">
            <v-icon size="24" class="mr-2">mdi-store</v-icon>
            <span>Магазин</span>
          </div>
        </NuxtLink>
      </div>

      <v-divider class="my-2">
        <div class="d-flex align-center px-1">
          <h5 class="text-subtitle-1 mb-0">{{ activeCategoryName }}</h5>
          <v-spacer />
        </div>
      </v-divider>
    </v-card>

    <v-list density="comfortable" class="py-0">
      <template v-if="activeCategoryId === 1">
        <NuxtLink
          v-for="group in groupsStore.groups"
          :key="group.id"
          :to="`/groups/${group.id}`"
          @click="closeOnMobile"
        >
          <v-list-item rounded="lg">
            <template #prepend>
              <v-avatar size="32">
                <v-img :src="group.avatar || defaultGroupAvatar" alt="" />
              </v-avatar>
            </template>
            <v-list-item-title>{{ group.name }}</v-list-item-title>
          </v-list-item>
        </NuxtLink>
      </template>

      <template v-else>
        <v-hover
          v-for="friend in myFriends"
          :key="friend.id"
          v-slot="{ isHovering, props: hoverProps }"
        >
          <v-list-item
            v-bind="hoverProps"
            rounded="lg"
            :class="{ 'item-has-banner': !!friend.banner && isHovering }"
            :style="friendItemStyle(friend, isHovering)"
            @click="openChat(friend.id)"
            @contextmenu.prevent.stop="openRemoveFriendByContext(friend.id)"
          >
            <template #prepend>
              <v-avatar size="32">
                <v-img :src="friend.avatar || '/avatars/default.jpg'" alt="" />
              </v-avatar>
            </template>
            <v-list-item-title>{{ friend.name }}</v-list-item-title>
            <template #append>
              <v-icon v-if="friend.online" color="green" size="14"
                >mdi-circle</v-icon
              >
            </template>
          </v-list-item>
        </v-hover>
      </template>
    </v-list>

    <template #append>
      <MyProfileTabNavigation class="px-2 pb-2" />
    </template>

    <CreateGroups
      v-model="createGroupsDialog"
      @created="onGroupCreated"
      @cancel="createGroupsDialog = false"
    />
    <UserSearchDialog v-model="searchDialog" />
    <v-dialog v-model="confirmRemoveDialog" max-width="420">
      <v-card>
        <v-card-title>Удалить из друзей?</v-card-title>
        <v-card-text
          >Вы уверены, что хотите удалить этого пользователя из списка
          друзей?</v-card-text
        >
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmRemoveDialog = false"
            >Отмена</v-btn
          >
          <v-btn color="error" @click="confirmRemoveFriend">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import MyProfileTabNavigation from "~/components/MiniProfile/MyProfileTabNavigation.vue";
import CreateGroups from "~/components/Groups/CreateGroups.vue";
import UserSearchDialog from "~/components/UserSearchDialog.vue";
import { useGroupsStore } from "~/stores/groups";
import { useUsersStore } from "~/stores/users";
import { useUserAccountStore } from "@/stores/user/account";

import CartIcon from "@/assets/ui/Cart.png";
import groupExample from "@/assets/profile/group_example.jpg";

export default defineComponent({
  name: "AppLeftDrawer",
  components: { MyProfileTabNavigation, CreateGroups, UserSearchDialog },
  props: {
    modelValue: { type: Boolean, required: true },
    width: { type: [Number, String], default: 360 },
    categoryId: { type: Number, default: 1 },
    categoryName: { type: String, default: "Группы" },
  },
  emits: ["update:modelValue", "update:categoryId", "update:categoryName"],
  setup(props, { emit, expose }) {
    const router = useRouter();
    const { smAndDown } = useDisplay();
    const isSmAndDown = computed(() => smAndDown.value);

    const groupsStore = useGroupsStore();
    const usersStore = useUsersStore();
    const account = useUserAccountStore();

    usersStore.ensureSeed();

    const localOpen = computed({
      get: () => props.modelValue,
      set: (v: boolean) => emit("update:modelValue", v),
    });

    const activeCategoryId = ref(props.categoryId || 1);
    const activeCategoryName = ref(props.categoryName || "Группы");
    watch(
      () => props.categoryId,
      (v) => {
        if (v && v !== activeCategoryId.value) {
          activeCategoryId.value = v;
          activeCategoryName.value = v === 1 ? "Группы" : "Личные сообщения";
        }
      }
    );
    watch(activeCategoryId, (v) => {
      emit("update:categoryId", v);
      emit("update:categoryName", v === 1 ? "Группы" : "Личные сообщения");
    });

    const isGroupsActive = computed(() => activeCategoryId.value === 1);
    const myFriends = computed(() => usersStore.myFriends);
    const defaultGroupAvatar = groupExample;
    const categorySwitchLabel = computed(() =>
      activeCategoryId.value === 1 ? "Личные сообщения" : "Группы"
    );
    const currentTitle = computed(() =>
      activeCategoryId.value === 1 ? "Создать группу" : "Найти друга"
    );
    const cartIcon = CartIcon;
    const lnavHasImage = computed(() => {
      if (typeof window === "undefined") return false;
      const cs = getComputedStyle(document.documentElement);
      const img = cs.getPropertyValue("--app-bg-image").trim();
      // если есть url(...) или gradient(...), считаем, что фон — картинка/градиент
      return img && img !== "none";
    });
    const createGroupsDialog = ref(false);
    const searchDialog = ref(false);
    const confirmRemoveDialog = ref(false);
    const friendToRemove = ref<string | null>(null);

    const onGroupCreated = () => {
      createGroupsDialog.value = false;
    };
    const switchCategory = (id: number) => {
      activeCategoryId.value = id;
      activeCategoryName.value = id === 1 ? "Группы" : "Личные сообщения";
    };
    const closeOnMobile = () => {
      if (isSmAndDown.value) localOpen.value = false;
    };
    const openChat = (friendId: string) => {
      router.push(`/dm/${friendId}`);
      closeOnMobile();
    };

    function isGradientLike(v?: string) {
      if (!v) return false;
      const s = v.toLowerCase().trim();
      return s.includes("gradient(") || s.startsWith("url(");
    }
    function friendItemStyle(friend: any, isHovering: boolean) {
      const style: Record<string, string> = {
        transition:
          "filter .18s ease, background .18s ease, background-color .18s ease, border-radius .18s ease",
        filter: isHovering
          ? "none"
          : "opacity(0.85) saturate(0.98) brightness(0.98)",
        borderRadius: "12px",
        overflow: "hidden",
      };
      const banner = friend.banner as string | undefined;
      if (isHovering && banner) {
        if (isGradientLike(banner)) style.background = banner;
        else style.backgroundColor = banner;
      }
      return style;
    }

    const openRemoveFriendByContext = (friendId: string) => {
      friendToRemove.value = friendId;
      confirmRemoveDialog.value = true;
    };
    const confirmRemoveFriend = () => {
      if (friendToRemove.value && account.userId) {
        usersStore.removeFriend(account.userId, friendToRemove.value, true);
      }
      confirmRemoveDialog.value = false;
      friendToRemove.value = null;
    };

    const triggerCategoryAction = () => {
      if (activeCategoryId.value === 1) createGroupsDialog.value = true;
      else searchDialog.value = true;
    };

    expose({
      triggerCategoryAction,
      getActiveCategoryId: () => activeCategoryId.value,
      getActiveCategoryName: () => activeCategoryName.value,
      setCategory: (id: number) => switchCategory(id),
    });

    return {
      groupsStore,
      usersStore,
      myFriends,
      isSmAndDown,
      localOpen,
      activeCategoryId,
      activeCategoryName,
      isGroupsActive,
      categorySwitchLabel,
      currentTitle,
      cartIcon,
      defaultGroupAvatar,
      createGroupsDialog,
      searchDialog,
      confirmRemoveDialog,
      friendToRemove,
      triggerCategoryAction,
      switchCategory,
      onGroupCreated,
      openChat,
      openRemoveFriendByContext,
      confirmRemoveFriend,
      closeOnMobile,
      friendItemStyle,
    };
  },
});
</script>

<style scoped>
/* Токены секции (оставляем) */
.scope-lnav {
  --v-theme-surface: var(--lnav-background);
  --v-theme-on-surface: var(--lnav-on-surface);
  --v-theme-outline: var(--lnav-border);
  --v-theme-surface-variant: var(--lnav-elev-1);
}

/* Коробка Drawer — рисуем подложечный слой тут */
.theme-drawer-left {
  position: relative;
  background: transparent !important;
  color: var(
    --lnav-on-surface,
    var(--app-on-surface, var(--v-theme-on-surface))
  );
  border-right: 1px solid var(--lnav-border, var(--app-outline-variant));
  border-top: 1px solid var(--lnav-border, var(--app-outline-variant));
  box-shadow: none !important;
}

/* Слой секции: цвет/тинт из --lnav-background (уже «просвечивает» при image/gradient после фикса ThemeBridge) */
.theme-drawer-left::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--lnav-background);
  pointer-events: none;
  z-index: 0;
}

/* Контент Drawer — прозрачный и выше слоя */
.theme-drawer-left :deep(.v-navigation-drawer__content),
.theme-drawer-left :deep(.v-card),
.theme-drawer-left :deep(.v-navigation-drawer__append),
:deep(.v-list) {
  position: relative;
  z-index: 1;
  background: transparent !important;
  color: var(--lnav-on-surface);
}

/* Hover и прочее — как было */
:deep(.v-list-item:hover) {
  background: color-mix(
    in oklab,
    var(--lnav-on-surface) 10%,
    transparent
  ) !important;
}
.toolbar-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 6px;
  border-radius: 8px;
  user-select: none;
  transition: background-color 0.15s, color 0.15s;
}
.nav-item:hover {
  background-color: var(--lnav-hover);
}
:deep(.v-list-item) {
  color: var(--lnav-on-surface);
}
:deep(.v-list-item--active) {
  background: var(--app-selected-color);
  border-left: 3px solid var(--app-primary);
}
</style>
