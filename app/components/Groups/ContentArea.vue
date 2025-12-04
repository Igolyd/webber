<!-- components/Groups/ContentArea.vue -->
<template>
  <div class="content-area rounded-te-lg">
    <v-navigation-drawer
      location="top"
      :model-value="true"
      :height="headerHeight"
      :width="headerHeight"
      absolute
      floating
      elevation="0"
      color="transparent"
      class="content-header-drawer scope-hdr rounded-te-lg"
    >
      <div class="content-header">
        <h2 class="text-h6">
          <template v-if="isAuthorCommunity">
            {{ activeTextChannelName || "Сообщество автора" }}
          </template>
          <template v-else> # {{ activeTextChannelName }} </template>
        </h2>
        <div class="spacer"></div>
        <v-btn
          icon
          :title="'Участники'"
          aria-label="Участники"
          @click="$emit('toggle-users')"
        >
          <v-icon>mdi-account-multiple-outline</v-icon>
        </v-btn>
        <v-btn
          icon
          :title="'Видео-комната'"
          aria-label="Видео-комната"
          @click="$emit('toggle-video')"
        >
          <v-icon>mdi-video-outline</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>

    <section class="content-scroll scope-main">
      <v-card flat class="messages-theme pa-0" color="transparent">
        <!-- Авторское сообщество -->
        <template v-if="isAuthorCommunity && authorCommunityId">
          <!-- Режим ЛЕНТЫ постов -->
          <ChatWindow
            v-if="!selectedPostId"
            mode="author-main"
            context="channel"
            :channel-id="activeTextChannelId"
            :author-id="authorCommunityId"
            :is-author="isCurrentUserAuthor"
            @open-post-comments="onOpenPostComments"
          />

          <!-- Режим КОММЕНТАРИЕВ К ОДНОМУ ПОСТУ -->
          <AuthorPostWithComments
            v-else
            :post-id="selectedPostId"
            :group-id="authorCommunityId"
            @close="selectedPostId = ''"
          />
        </template>

        <!-- Обычный канал -->
        <ChatWindow
          v-else
          mode="default"
          context="channel"
          :channel-id="activeTextChannelId"
        />
      </v-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
import ChatWindow from "../chat/ChatWindow.vue";
import AuthorPostWithComments from "@/components/authors/AuthorPostWithComments.vue";

const props = defineProps<{
  activeTextChannelName: string;
  activeTextChannelId: string;
  isVideoRoomOpen: boolean;
  isAuthorCommunity?: boolean;
  authorCommunityId?: string;
}>();

defineEmits(["toggle-users", "toggle-video"]);

const { smAndDown } = useDisplay();
const headerHeight = computed(() => (smAndDown.value ? 58 : 66));

const isAuthorCommunity = computed(() => props.isAuthorCommunity === true);
const authorCommunityId = computed(() => props.authorCommunityId || "");

const selectedPostId = ref<string>("");

// const account = useUserAccountStore();
// const authorsStore = useAuthorsStore();
const isCurrentUserAuthor = computed(() => {
  if (!isAuthorCommunity.value || !authorCommunityId.value) return false;
  // TODO: подставить реальную проверку автора
  return true;
});

function onOpenPostComments(postId: string) {
  selectedPostId.value = postId;
}
</script>

<style scoped>
/* твой стиль без изменений */
.scope-hdr {
  --v-theme-surface: var(--topnav-background);
  --v-theme-on-surface: var(--topnav-on-surface);
  --v-theme-outline: var(--topnav-border);
  --v-theme-surface-variant: var(--topnav-elev-1);
}
.content-area {
  border: 0px;
}
.content-header-drawer {
  border-bottom: 1px solid var(--topnav-border, var(--app-outline-variant));
  border-top: 1px solid var(--topnav-border, var(--app-outline-variant));
  background: var(
    --topnav-elev-1,
    var(--topnav-background, var(--app-surface))
  );
}
.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  height: 100%;
}
.content-header .spacer {
  flex: 1;
}
.scope-main {
  --v-theme-surface: var(--main-background);
  --v-theme-on-surface: var(--main-on-surface);
  --v-theme-outline: var(--main-border);
  --v-theme-surface-variant: var(--main-elev-1);
}
.content-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  background: var(--main-background, transparent);
  color: var(--main-on-surface, inherit);
}
.messages-theme {
  background: transparent;
  height: 100%;
  overflow: hidden;
  padding-top: 0;
}
.scroll-y {
  height: 100%;
  overflow: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scroll-y::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.scroll-y {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.scroll-y {
  scrollbar-width: none;
}
@media (max-width: 600px) {
  .content-header {
    padding: 6px 8px;
  }
}
</style>
