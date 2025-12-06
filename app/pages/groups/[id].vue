<template>
  <v-container fluid class="h-100 d-flex pa-0">
    <SmallNavigationTab
      :groups="groupsList"
      :selectedGroupId="activeGroupId"
      @updateSelectedGroup="navigateToGroup"
      @toggleChannels="toggleChannelsDrawer"
    />
    <ChannelsDrawer
      v-model="channelsDrawer"
      :is-sm-and-down="isSmAndDown"
      :selected-group-name="selectedGroupName"
      :directories-with-channels="directoriesWithChannels"
      :active-text-channel-id="state.activeTextChannelId"
      :owner-type="'group'"
      :owner-id="currentGroupId"
      @open-group-settings="openGroupSettings"
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
      @open-news-feed="openNewsFeed"
      @open-events-feed="openEventsFeed"
    >
      <template #append>
        <MyProfileTabNavigation class="px-1 pb-1" />
      </template>
    </ChannelsDrawer>
    <UsersDrawer v-model="usersDrawer" :is-sm-and-down="isSmAndDown" />
    <ContentArea
      class="content-area"
      :active-text-channel-name="activeTextChannelName"
      :active-text-channel-id="state.activeTextChannelId"
      :is-video-room-open="isVideoRoomOpen"
      :view-mode="viewMode"
      :owner-type="'group'"
      :owner-id="currentGroupId"
      @toggle-users="toggleUsersDrawer"
      @toggle-video="toggleVideoRoom"
    />
    <ManagementChannel
      v-model="channelDialog"
      :group-id="currentGroupId"
      :directories="directoryOptions"
      :channel="editingChannel"
      @submit="onSubmitChannel"
    />
    <ManagementDirectories
      v-model="directoryDialog"
      :directory="editingDirectory"
      @submit="onSubmitDirectory"
    />
    <CreateNewsDialog
      v-model="newsDialog"
      owner-type="group"
      :owner-id="currentGroupId"
      @created="
        () => {
          viewMode.value = 'news';
        }
      "
    />
    <CreateEventDialog
      v-model="eventDialog"
      owner-type="group"
      :owner-id="currentGroupId"
      @created="
        () => {
          viewMode.value = 'events';
        }
      "
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
import { useGroupsStore } from "~/stores/groups";
import { useChannelsStore, type Channel } from "~/stores/channels";
import { useDirectoriesStore } from "~/stores/directories";
import ManagementChannel from "~/components/Groups/ManagmentChannel.vue";
import ManagementDirectories from "~/components/Groups/ManagementDirectories.vue";
import { useUsersStore } from "~/stores/users";
import { useRolesStore } from "~/stores/roles";
import { useAppearanceStore } from "~/stores/app/appearance";
import { useThemeOverrideStore } from "~/stores/app/themeOverride";
import { useGroupThemesStore } from "~/stores/groupThemes";
import CreateNewsDialog from "~/components/news/CreateNewsDialog.vue";
import CreateEventDialog from "~/components/news/CreateEventDialog.vue";

const ui = useUiStore();
const call = useCallStore();
const profiles = useProfilesStore();
const route = useRoute();
const router = useRouter();
const groupsStore = useGroupsStore();
const channelsStore = useChannelsStore();
const directoriesStore = useDirectoriesStore();
const usersStore = useUsersStore();
const rolesStore = useRolesStore();
const appearance = useAppearanceStore();
const themeOverride = useThemeOverrideStore();
const groupThemes = useGroupThemesStore();
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
const newsDialog = ref(false);
const eventDialog = ref(false);
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
const groupsList = computed(() => groupsStore.groups);
const currentGroupId = computed(() => String(route.params.id || ""));
const activeGroupId = computed(() => groupsStore.activeGroupId);
const selectedGroupName = computed(() => {
  console.log(currentGroupId.value + "dwadwa");
  const g = groupsStore.getById(currentGroupId.value);
  return g?.name ?? "";
});
const groupChannels = computed(() => {
  if (!currentGroupId.value) return [];
  return channelsStore.getByGroup(currentGroupId.value);
});
const groupDirectories = computed(() => {
  if (!currentGroupId.value) return [];
  return directoriesStore.getByGroup(currentGroupId.value);
});
const uncategorizedDirectory = computed(() => ({
  id: "__uncategorized__",
  groupId: currentGroupId.value,
  name: "Без категории",
  position: 0,
  isCollapsed: false,
  createdAt: "",
}));
const directoriesWithChannels = computed(() => {
  if (!currentGroupId.value) return [];
  const dirs = [...groupDirectories.value];
  const channels = groupChannels.value;
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
  groupDirectories.value.map((d) => ({ id: d.id, name: d.name }))
);
function openCreateChannel() {
  editingChannel.value = undefined;
  channelDialog.value = true;
}
async function bootstrapGroup() {
  groupsStore.ensureSeed();
  usersStore.ensureSeed();
  const gid = currentGroupId.value;
  const group = groupsStore.getById(gid);
  if (!group) {
    const fallback = groupsStore.groups[0]?.id;
    if (fallback) {
      router.replace(`/groups/${fallback}`);
    }
    return;
  }
  groupsStore.setActiveGroup(gid);
  rolesStore.ensureBaseRolesForGroup(gid);
  ensureActiveGroupAndSeed();
}
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
function applyGroupThemeIfNeeded() {
  const gid = currentGroupId.value;
  if (!gid) {
    themeOverride.set(null);
    return;
  }
  if (appearance.preferPersonalThemeInGroups) {
    themeOverride.set(null);
    return;
  }
  const snap = groupThemes.get(gid);
  themeOverride.set(snap || null);
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
function onSubmitChannel(payload: {
  id?: string;
  name: string;
  type: "text" | "voice";
  directoryId: string | null;
}) {
  if (!currentGroupId.value) return;
  if (payload.id) {
    const prev = channelsStore.getById(payload.id);
    if (!prev) return;
    if (prev.type === "text" && payload.type === "voice") {
      call
        .createJanusRoom({
          description: `${payload.name} (${currentGroupId.value})`,
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
  const nextPos = channelsStore.getByGroup(currentGroupId.value).length + 1;
  if (payload.type === "voice") {
    call
      .createJanusRoom({
        description: `${payload.name} (${currentGroupId.value})`,
      })
      .then((roomId) => {
        const ch = channelsStore.addChannel({
          groupId: currentGroupId.value,
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
      groupId: currentGroupId.value,
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
  if (!currentGroupId.value) return;
  if (payload.id) {
    directoriesStore.updateDirectory(payload.id, { name: payload.name });
  } else {
    const nextPos =
      directoriesStore.getByGroup(currentGroupId.value).length + 1;
    directoriesStore.addDirectory({
      groupId: currentGroupId.value,
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
      .getByGroup(currentGroupId.value)
      .find((c) => c.type === "text");
    state.activeTextChannelId = firstText?.id || "";
  }
}
function deleteDirectory(id: string) {
  const chs = channelsStore
    .getByGroup(currentGroupId.value)
    .filter((c) => c.directoryId === id);
  chs.forEach((c) => channelsStore.updateChannel(c.id, { directoryId: null }));
  directoriesStore.removeDirectory(id);
}
function toggleDirectory(id: string) {
  const d = directoriesStore.getById(id);
  if (!d) return;
  directoriesStore.updateDirectory(id, { isCollapsed: !d.isCollapsed });
}
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
const viewMode = ref<"channel" | "news" | "events">("channel");
function openNewsFeed() {
  viewMode.value = "news";
  router.replace({ query: { ...route.query, tab: "news" } });
}
function openEventsFeed() {
  viewMode.value = "events";
  router.replace({ query: { ...route.query, tab: "events" } });
}
function selectTextChannel(id: string) {
  state.activeTextChannelId = id;
  viewMode.value = "channel";
  const { tab, ...rest } = route.query;
  router.replace({ query: { ...rest } });
}
function ensureActiveGroupAndSeed() {
  const gid = currentGroupId.value;
  if (!gid) return;
  groupsStore.setActiveGroup(gid);
  const hasAny =
    channelsStore.getByGroup(gid).length > 0 ||
    directoriesStore.getByGroup(gid).length > 0;
  if (!hasAny) {
    const catGeneral = directoriesStore.addDirectory({
      groupId: gid,
      name: "Основное",
      position: 1,
      isCollapsed: false,
    });
    const catTeam = directoriesStore.addDirectory({
      groupId: gid,
      name: "Команда",
      position: 2,
      isCollapsed: false,
    });
    const t1 = channelsStore.addChannel({
      groupId: gid,
      directoryId: catGeneral.id,
      name: "chat",
      type: "text",
      position: 1,
    });
    channelsStore.addChannel({
      groupId: gid,
      directoryId: catGeneral.id,
      name: "random",
      type: "text",
      position: 2,
    });
    channelsStore.addChannel({
      groupId: gid,
      directoryId: catTeam.id,
      name: "standup",
      type: "voice",
      position: 1,
    });
    channelsStore.addChannel({
      groupId: gid,
      directoryId: catTeam.id,
      name: "meeting",
      type: "voice",
      position: 2,
    });
    state.activeTextChannelId = t1.id;
  } else {
    const firstText = channelsStore
      .getByGroup(gid)
      .find((c) => c.type === "text");
    state.activeTextChannelId = firstText?.id || "";
  }
}
const activeTextChannelName = computed(() => {
  const ch = groupChannels.value.find(
    (c) => c.id === state.activeTextChannelId
  );
  return ch?.name ?? "";
});
onMounted(() => {
  bootstrapGroup();
  applyGroupThemeIfNeeded();
});
watch(
  () => route.params.id,
  () => {
    bootstrapGroup();
    applyGroupThemeIfNeeded();
  }
);
watch(
  () => appearance.preferPersonalThemeInGroups,
  () => applyGroupThemeIfNeeded()
);
watch(
  () => route.query.tab,
  (tab) => {
    if (tab === "news") viewMode.value = "news";
    else if (tab === "events") viewMode.value = "events";
    else viewMode.value = "channel";
  },
  { immediate: true }
);
function navigateToGroup(groupId: string) {
  router.push(`/groups/${groupId}`);
}
function openGroupSettings() {
  router.push(`/groups/${currentGroupId.value}-settings`);
}
function invitePeople() {
  console.log("invite people");
}
function createEvent() {
  eventDialog.value = true;
}
function publishNews() {
  newsDialog.value = true;
}
function openNotificationSettings() {
  console.log("open notification settings");
}
function openPrivacySettings() {
  console.log("open privacy settings");
}
const toggleChannelsDrawer = () =>
  (channelsDrawer.value = !channelsDrawer.value);
const toggleUsersDrawer = () => (usersDrawer.value = !usersDrawer.value);
const toggleVideoRoom = () => (state.isVideoRoomOpen = !state.isVideoRoomOpen);
const isVideoRoomOpen = computed({
  get: () => state.isVideoRoomOpen,
  set: (v) => (state.isVideoRoomOpen = v),
});
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
}
</style>
