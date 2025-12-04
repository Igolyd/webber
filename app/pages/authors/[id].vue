<!-- pages/authors/[id].vue -->
<template>
  <v-container fluid class="h-100 d-flex pa-0">
    <!-- Левый столбец: SmallNavigationTab, но с сообществами авторов -->
    <SmallNavigationTab
      :groups="communitiesList"
      :selectedGroupId="currentAuthorId"
      @updateSelectedGroup="navigateToAuthor"
      @toggleChannels="toggleChannelsDrawer"
    />

    <!-- Левый drawer каналов/директорий: тот же, что для групп -->
    <ChannelsDrawer
      v-model="channelsDrawer"
      :is-sm-and-down="isSmAndDown"
      :selected-group-name="selectedCommunityName"
      :directories-with-channels="directoriesWithChannels"
      :active-text-channel-id="state.activeTextChannelId"
      @open-group-settings="openAuthorSettings"
      @invite-people="invitePeople"
      @open-create-channel="openCreateChannel"
      @open-create-directory="openCreateDirectory"
      @create-event="createEvent"
      @publish-news="publishNews"
      @open-notification-settings="openNotificationSettings"
      @open-privacy-settings="openPrivacySettings"
      @toggle-directory="toggleDirectory"
      @edit-directory="openEditDirectory"
      @delete-directory="deleteDirectory"
      @edit-channel="openEditChannel"
      @delete-channel="deleteChannel"
      @channel-click="handleChannelClick"
    >
      <template #append>
        <MyProfileTabNavigation class="px-1 pb-1" />
      </template>
    </ChannelsDrawer>

    <!-- Правый drawer участников: один и тот же, но с явным group-id = id автора -->
    <UsersDrawer
      v-model="usersDrawer"
      :is-sm-and-down="isSmAndDown"
      :group-id="currentAuthorId"
    />

    <!-- Центральный контент: ContentArea в режиме author -->
    <ContentArea
      class="content-area"
      :active-text-channel-name="activeTextChannelName"
      :active-text-channel-id="state.activeTextChannelId"
      :is-video-room-open="isVideoRoomOpen"
      :is-author-community="true"
      :author-community-id="currentAuthorId"
      @toggle-users="toggleUsersDrawer"
      @toggle-video="toggleVideoRoom"
    />

    <!-- Управление каналами/директориями — то же самое -->
    <ManagementChannel
      v-model="channelDialog"
      :group-id="currentAuthorId"
      :directories="directoryOptions"
      :channel="editingChannel"
      @submit="onSubmitChannel"
    />
    <ManagementDirectories
      v-model="directoryDialog"
      :directory="editingDirectory"
      @submit="onSubmitDirectory"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref, reactive } from "vue";
import { useDisplay } from "vuetify";
import { useRoute, useRouter } from "vue-router";

import SmallNavigationTab from "~/components/SmallNavigationTab.vue";
import MyProfileTabNavigation from "~/components/MiniProfile/MyProfileTabNavigation.vue";
import ContentArea from "~/components/Groups/ContentArea.vue";
import ChannelsDrawer from "~/components/Groups/ChannelsDrawer.vue";
import UsersDrawer from "~/components/Groups/UsersDrawer.vue";

import { useUiStore } from "~/stores/ui";
import { useCallStore } from "~/stores/call";
import { useProfilesStore } from "~/stores/user/profiles";
import { useChannelsStore, type Channel } from "~/stores/channels";
import { useDirectoriesStore } from "~/stores/directories";
import ManagementChannel from "~/components/Groups/ManagmentChannel.vue";
import ManagementDirectories from "~/components/Groups/ManagementDirectories.vue";
import { useUsersStore } from "~/stores/users";
import { useRolesStore } from "~/stores/roles";

import { useAppearanceStore } from "~/stores/app/appearance";
import { useThemeOverrideStore } from "~/stores/app/themeOverride";
import { useGroupThemesStore } from "~/stores/groupThemes"; // можно сделать аналог для авторов позже

import { useAuthorsStore } from "~/stores/authors";

const ui = useUiStore();
const call = useCallStore();
const profiles = useProfilesStore();
const route = useRoute();
const router = useRouter();

const authorsStore = useAuthorsStore();
const channelsStore = useChannelsStore();
const directoriesStore = useDirectoriesStore();
const usersStore = useUsersStore();
const rolesStore = useRolesStore();

const appearance = useAppearanceStore();
const themeOverride = useThemeOverrideStore();
const groupThemes = useGroupThemesStore(); // пока можно использовать те же темы или выключить

authorsStore.ensureSeed();
usersStore.ensureSeed();

const { smAndDown } = useDisplay();
const isSmAndDown = computed(() => smAndDown.value);

const channelsDrawer = ref(true);
const usersDrawer = ref(true);

const state = reactive({
  activeTextChannelId: "" as string,
  isVideoRoomOpen: false,
});

const channelDialog = ref(false);
const directoryDialog = ref(false);

const editingChannel = ref<
  | {
      id: string;
      name: string;
      type: "text" | "voice";
      directoryId: string | null;
    }
  | undefined
>(undefined);

const editingDirectory = ref<{ id: string; name: string } | undefined>(
  undefined
);

// id текущего автора (сообщества) из роута
const currentAuthorId = computed(() => String(route.params.id || ""));

// список сообществ авторов для левой навигации
const communitiesList = computed(() =>
  authorsStore.communities.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar || "",
  }))
);

// имя выбранного сообщества автора
const selectedCommunityName = computed(() => {
  const c = authorsStore.getById(currentAuthorId.value);
  return c?.name ?? "";
});

// каналы/директории автора — точь‑в‑точь как для группы, только id = id автора
const authorChannels = computed(() => {
  if (!currentAuthorId.value) return [];
  return channelsStore.getByGroup(currentAuthorId.value);
});
const authorDirectories = computed(() => {
  if (!currentAuthorId.value) return [];
  return directoriesStore.getByGroup(currentAuthorId.value);
});

const uncategorizedDirectory = computed(() => ({
  id: "__uncategorized__",
  groupId: currentAuthorId.value,
  name: "Без категории",
  position: 0,
  isCollapsed: false,
  createdAt: "",
}));

const directoriesWithChannels = computed(() => {
  if (!currentAuthorId.value) return [];
  const dirs = [...authorDirectories.value];
  const channels = authorChannels.value;
  const channelsWithoutDir = channels.filter((c) => !c.directoryId);
  const hasUncategorized = channelsWithoutDir.length > 0;

  const result = dirs.map((dir) => ({
    dir,
    channels: channels
      .filter((c) => c.directoryId === dir.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }));

  if (hasUncategorized) {
    result.unshift({
      dir: uncategorizedDirectory.value,
      channels: channelsWithoutDir.sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      ),
    });
  }
  return result;
});

const directoryOptions = computed(() =>
  authorDirectories.value.map((d) => ({ id: d.id, name: d.name }))
);

// диалоги
function openCreateChannel() {
  editingChannel.value = undefined;
  channelDialog.value = true;
}
function openCreateDirectory() {
  editingDirectory.value = undefined;
  directoryDialog.value = true;
}
function openEditDirectory(dirId: string) {
  const d = directoriesStore.getById(dirId);
  if (!d) return;
  editingDirectory.value = { id: d.id, name: d.name };
  directoryDialog.value = true;
}

// bootstrap автора
async function bootstrapAuthor() {
  const aid = currentAuthorId.value;
  const community = authorsStore.getById(aid);

  if (!community) {
    const fallback = authorsStore.communities[0]?.id;
    if (fallback) {
      router.replace(`/authors/${fallback}`);
    }
    return;
  }

  // гарантируем базовые роли для "этой группы" (id = id автора)
  rolesStore.ensureBaseRolesForGroup(aid);

  ensureActiveAuthorAndSeed();
}

// создаём дефолтные директории/каналы, если у автора их нет
function ensureActiveAuthorAndSeed() {
  const aid = currentAuthorId.value;
  if (!aid) return;

  const hasAny =
    channelsStore.getByGroup(aid).length > 0 ||
    directoriesStore.getByGroup(aid).length > 0;

  if (!hasAny) {
    const catGeneral = directoriesStore.addDirectory({
      groupId: aid,
      name: "Основное",
      position: 1,
      isCollapsed: false,
    });
    const catExtra = directoriesStore.addDirectory({
      groupId: aid,
      name: "Дополнительно",
      position: 2,
      isCollapsed: false,
    });
    const t1 = channelsStore.addChannel({
      groupId: aid,
      directoryId: catGeneral.id,
      name: "публикации",
      type: "text",
      position: 1,
      janusRoomId: null,
    });
    channelsStore.addChannel({
      groupId: aid,
      directoryId: catGeneral.id,
      name: "общение",
      type: "text",
      position: 2,
      janusRoomId: null,
    });
    channelsStore.addChannel({
      groupId: aid,
      directoryId: catExtra.id,
      name: "голосовой",
      type: "voice",
      position: 1,
    });
    state.activeTextChannelId = t1.id;
  } else {
    const firstText = channelsStore
      .getByGroup(aid)
      .find((c) => c.type === "text");
    state.activeTextChannelId = firstText?.id || "";
  }
}

// каналы
function openEditChannel(chId: string) {
  const ch = channelsStore.getById(chId);
  if (!ch) return;
  editingChannel.value = {
    id: ch.id,
    name: ch.name,
    type: ch.type,
    directoryId: ch.directoryId ?? null,
  };
  channelDialog.value = true;
}

function onSubmitChannel(payload: {
  id?: string;
  name: string;
  type: "text" | "voice";
  directoryId: string | null;
}) {
  if (!currentAuthorId.value) return;

  const aid = currentAuthorId.value;

  if (payload.id) {
    const prev = channelsStore.getById(payload.id);
    if (!prev) return;

    if (prev.type === "text" && payload.type === "voice") {
      call
        .createJanusRoom({
          description: `${payload.name} (${aid})`,
        })
        .then((roomId) => {
          channelsStore.updateChannel(payload.id!, {
            name: payload.name,
            type: "voice",
            directoryId: payload.directoryId ?? null,
            janusRoomId: roomId,
          });
        })
        .catch((e) => {
          console.error("Failed to create Janus room for updated channel", e);
        });
      return;
    }

    if (prev.type === "voice" && payload.type === "text") {
      const rid = prev.janusRoomId;
      channelsStore.updateChannel(payload.id, {
        name: payload.name,
        type: "text",
        directoryId: payload.directoryId ?? null,
        janusRoomId: null,
      });
      if (typeof rid === "number") {
        call.destroyJanusRoom(rid).catch((e) => {
          console.warn("Janus destroy on type change failed", e);
        });
      }
      return;
    }

    channelsStore.updateChannel(payload.id, {
      name: payload.name,
      type: payload.type,
      directoryId: payload.directoryId ?? null,
    });
    return;
  }

  const nextPos = channelsStore.getByGroup(aid).length + 1;

  if (payload.type === "voice") {
    call
      .createJanusRoom({
        description: `${payload.name} (${aid})`,
      })
      .then((roomId) => {
        channelsStore.addChannel({
          groupId: aid,
          name: payload.name,
          type: "voice",
          directoryId: payload.directoryId ?? null,
          position: nextPos,
          janusRoomId: roomId,
        });
      })
      .catch((e) => {
        console.error("Failed to create Janus room", e);
      });
  } else {
    const ch = channelsStore.addChannel({
      groupId: aid,
      name: payload.name,
      type: "text",
      directoryId: payload.directoryId ?? null,
      position: nextPos,
      janusRoomId: null,
    });
    state.activeTextChannelId = ch.id;
  }
}

function onSubmitDirectory(payload: { id?: string; name: string }) {
  if (!currentAuthorId.value) return;
  const aid = currentAuthorId.value;
  if (payload.id) {
    directoriesStore.updateDirectory(payload.id, { name: payload.name });
  } else {
    const nextPos = directoriesStore.getByGroup(aid).length + 1;
    directoriesStore.addDirectory({
      groupId: aid,
      name: payload.name,
      position: nextPos,
      isCollapsed: false,
    });
  }
}

function deleteChannel(id: string) {
  const ch = channelsStore.getById(id);
  if (!ch) return;

  if (call.activeVoiceChannelId === id) {
    call.leaveCall().catch(() => {});
  }

  if (ch.type === "voice" && typeof ch.janusRoomId === "number") {
    call.destroyJanusRoom(ch.janusRoomId).catch((e) => {
      console.warn("Failed to destroy Janus room", e);
    });
  }

  channelsStore.removeChannel(id);

  if (state.activeTextChannelId === id) {
    const firstText = channelsStore
      .getByGroup(currentAuthorId.value)
      .find((c) => c.type === "text");
    state.activeTextChannelId = firstText?.id || "";
  }
}

function deleteDirectory(id: string) {
  const chs = channelsStore
    .getByGroup(currentAuthorId.value)
    .filter((c) => c.directoryId === id);
  chs.forEach((c) => channelsStore.updateChannel(c.id, { directoryId: null }));
  directoriesStore.removeDirectory(id);
}

function toggleDirectory(id: string) {
  const d = directoriesStore.getById(id);
  if (!d) return;
  directoriesStore.updateDirectory(id, { isCollapsed: !d.isCollapsed });
}

// клик по каналу
function handleChannelClick(ch: Channel) {
  if (ch.type === "voice") {
    if (call.isJoining) return;

    if (!call.callEnabled || call.activeVoiceChannelId !== ch.id) {
      call.joinVoiceChannel(ch.id, profiles.name || "User");
    } else if (call.activeVoiceChannelId === ch.id) {
      ui.callWindowOpen = true;
    } else {
      call.leaveCall().then(() => {
        const name = profiles.name || "User";
        call.joinVoiceChannel(ch.id, name);
      });
    }
  } else {
    selectTextChannel(ch.id);
  }
}

function selectTextChannel(id: string) {
  state.activeTextChannelId = id;
}

const activeTextChannelName = computed(() => {
  const ch = authorChannels.value.find(
    (c) => c.id === state.activeTextChannelId
  );
  return ch?.name ?? "";
});

// темы можно пока просто сбрасывать / не использовать
function applyAuthorThemeIfNeeded() {
  // по аналогии с группами, если решишь хранить тему для автора
  themeOverride.set(null);
}

// навигация между авторами
function navigateToAuthor(authorId: string) {
  router.push(`/authors/${authorId}`);
}

// заглушки/экшены
function openAuthorSettings() {
  router.push(`/authors/${currentAuthorId.value}-settings`);
}
function invitePeople() {
  console.log("invite people to author community");
}
function createEvent() {
  console.log("create event in author community");
}
function publishNews() {
  console.log("publish news in author community");
}
function openNotificationSettings() {
  console.log("open notifications for author community");
}
function openPrivacySettings() {
  console.log("open privacy for author community");
}

// toggles
const toggleChannelsDrawer = () =>
  (channelsDrawer.value = !channelsDrawer.value);
const toggleUsersDrawer = () => (usersDrawer.value = !usersDrawer.value);
const toggleVideoRoom = () => (state.isVideoRoomOpen = !state.isVideoRoomOpen);
const isVideoRoomOpen = computed({
  get: () => state.isVideoRoomOpen,
  set: (v) => (state.isVideoRoomOpen = v),
});

onMounted(() => {
  bootstrapAuthor();
  applyAuthorThemeIfNeeded();
});

watch(
  () => route.params.id,
  () => {
    bootstrapAuthor();
    applyAuthorThemeIfNeeded();
  }
);

watch(
  () => appearance.preferPersonalThemeInGroups,
  () => applyAuthorThemeIfNeeded()
);
</script>

<style scoped>
.h-100 {
  height: 100%;
}
.content-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1f1f1f;
}
</style>
