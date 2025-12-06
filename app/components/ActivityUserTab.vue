<template>
  <v-navigation-drawer
    v-model="internalModel"
    location="right"
    :permanent="permanent"
    :temporary="temporary"
    :width="width"
    class="theme-drawer-right"
    app
  >
    <v-card elevation="5" class="py-4 px-4 flex-1">
      <h5 class="card-title">{{ headerTitle }}</h5>

      <v-list class="py-0 mt-2">
        <v-hover
          v-for="item in feedItems"
          :key="item.id"
          v-slot="{ isHovering, props: hoverProps }"
        >
          <v-list-item
            v-bind="hoverProps"
            rounded="lg"
            :style="friendItemStyle(item, isHovering)"
            @click="openItem(item)"
          >
            <template #prepend>
              <v-avatar size="36">
                <v-img :src="item.avatar || '/avatars/default.jpg'" alt="" />
              </v-avatar>
            </template>
            <v-list-item-title>
              {{ item.title }}
              <span
                v-if="item.subtitle"
                class="text-caption text-medium-emphasis"
              >
                {{ item.subtitle }}
              </span>
            </v-list-item-title>
            <template #append>
              <v-icon v-if="item.kind === 'friend'" color="green" size="14"
                >mdi-circle</v-icon
              >
            </template>
          </v-list-item>
        </v-hover>

        <v-list-item v-if="!feedItems.length" class="opacity-70">
          <v-list-item-title>
            <template v-if="activeCategoryId === 2"> Никто не в сети </template>
            <template v-else-if="activeCategoryId === 1">
              Событий и новостей пока нет
            </template>
            <template v-else> Событий и новостей пока нет </template>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRouter } from "vue-router";
import { useUsersStore } from "@/stores/users";
import { useGroupsStore } from "@/stores/groups";
import { useAuthorsStore } from "@/stores/authors";
import { useNewsStore } from "@/stores/news";
import { useEventsStore } from "@/stores/events";

export default defineComponent({
  name: "ActivityUserTab",
  props: {
    modelValue: { type: Boolean, default: true },
    permanent: { type: Boolean, default: true },
    temporary: { type: Boolean, default: false },
    width: { type: [Number, String], default: 300 },
    // 1: группы, 2: ЛС, 3: авторы
    activeCategoryId: { type: Number, default: 2 },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const internalModel = computed<boolean>({
      get: () => props.modelValue,
      set: (val) => emit("update:modelValue", val),
    });

    const usersStore = useUsersStore();
    const groupsStore = useGroupsStore();
    const authorsStore = useAuthorsStore();
    const newsStore = useNewsStore();
    const eventsStore = useEventsStore();
    const router = useRouter();

    const headerTitle = computed(() => {
      if (props.activeCategoryId === 1) return "Новости и события групп";
      if (props.activeCategoryId === 3) return "Новости и события авторов";
      return "Друзья в сети";
    });

    const onlineFriends = computed(() =>
      usersStore.myFriends.filter((u) => u.online)
    );

    type FeedItem = {
      id: string;
      kind: "friend" | "news" | "event";
      title: string;
      subtitle?: string;
      avatar?: string;
      route?: { name?: string; path: string; query?: Record<string, any> };
    };

    const feedItems = computed<FeedItem[]>(() => {
      // 2 = Личные сообщения: друзья в сети
      if (props.activeCategoryId === 2) {
        return onlineFriends.value.map((u) => ({
          id: u.id,
          kind: "friend",
          title: u.name,
          subtitle: `@${u.uniqueName}`,
          avatar: u.avatar || "/avatars/default.jpg",
          route: { path: `/dm/${u.id}` },
        }));
      }

      // Для категорий 1 (группы) и 3 (авторы) фильтруем по ownerType
      const ownerTypeFilter = props.activeCategoryId === 1 ? "group" : "author";

      const filteredNews = newsStore.items.filter(
        (n) => n.ownerType === ownerTypeFilter
      );
      const filteredEvents = eventsStore.items.filter(
        (e) => e.ownerType === ownerTypeFilter
      );

      const news = filteredNews.map((n) => {
        const isGroup = n.ownerType === "group";
        const owner = isGroup
          ? groupsStore.getById(n.ownerId)
          : authorsStore.getById(n.ownerId);
        const ownerName = owner?.name || (isGroup ? "Группа" : "Автор");
        const basePath = isGroup
          ? `/groups/${n.ownerId}`
          : `/authors/${n.ownerId}`;
        return {
          id: `news-${n.id}`,
          kind: "news" as const,
          title: n.title,
          subtitle: `${ownerName} • новость`,
          avatar: owner?.avatar || "/avatars/default.jpg",
          createdAt: n.createdAt,
          route: { path: basePath, query: { tab: "news" } },
        };
      });

      const events = filteredEvents.map((e) => {
        const isGroup = e.ownerType === "group";
        const owner = isGroup
          ? groupsStore.getById(e.ownerId)
          : authorsStore.getById(e.ownerId);
        const ownerName = owner?.name || (isGroup ? "Группа" : "Автор");
        const basePath = isGroup
          ? `/groups/${e.ownerId}`
          : `/authors/${e.ownerId}`;
        return {
          id: `event-${e.id}`,
          kind: "event" as const,
          title: e.title,
          subtitle: `${ownerName} • событие`,
          avatar: owner?.avatar || "/avatars/default.jpg",
          createdAt: e.createdAt,
          route: { path: basePath, query: { tab: "events" } },
        };
      });

      // Объединяем и сортируем по createdAt
      return [...news, ...events]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ createdAt, ...rest }) => rest);
    });

    const openItem = (item: FeedItem) => {
      if (item.route) {
        router.push(item.route);
      }
    };

    // стили как были
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

    return {
      internalModel,
      headerTitle,
      feedItems,
      openItem,
      friendItemStyle,
    };
  },
});
</script>

<style scoped>
.theme-drawer-right {
  background-color: transparent !important;
  color: var(--rnav-on-surface);
  box-shadow: none !important;
  border: 0px;
}
.theme-drawer-right :deep(.v-navigation-drawer__content) {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--rnav-surface);
  color: var(--rnav-on-surface);
}
:deep(.v-card) {
  background: linear-gradient(
    to top,

    color-mix(in srgb, var(--lnav-background) 70%, var(--gradient-bg-color) 30%)
      0%,
    var(--rnav-elev-1) 60%,
    var(--rnav-elev-1) 100%
  );
  color: var(--rnav-on-surface);
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}
.card-title {
  font-weight: 600;
}
.opacity-70 {
  opacity: 0.7;
}
</style>
