<!-- components/authors/AuthorPostWithComments.vue -->
<template>
  <div v-if="post" class="author-post-comments-panel">
    <div class="panel-header">
      <span class="title">Пост и комментарии</span>
      <v-spacer />
      <v-btn icon size="small" variant="text" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Сам пост (упрощённый рендер) -->
    <div class="post-block">
      <div class="post-author-row">
        <v-avatar size="32" class="mr-2">
          <v-img :src="senderAvatar" />
        </v-avatar>
        <div class="meta">
          <div class="name">
            {{ senderName }}
            <span class="post-badge">Пост</span>
          </div>
          <div class="time">{{ fmtDateTime(post.createdAt) }}</div>
        </div>
      </div>

      <div class="post-content mt-2">
        <div v-if="post.type === 'text'">
          <div class="pre-wrap">{{ post.content }}</div>
        </div>
        <div v-else-if="post.type === 'file'">
          <div class="mb-2">
            <img
              v-if="attachment && attachment.type?.startsWith('image/')"
              :src="attachment.dataUrl"
              :alt="attachment.name"
              class="post-image"
            />
            <div v-else class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-outline</v-icon>
              <span>
                {{ attachment?.name }} ({{ formatSize(attachment?.size || 0) }})
              </span>
            </div>
          </div>
          <div v-if="post.content" class="pre-wrap">{{ post.content }}</div>
        </div>
      </div>
    </div>

    <!-- Комментарии к этому посту -->
    <AuthorCommentsBlock
      class="comments-block"
      :post-id="post.id"
      :group-id="groupId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  useGroupMessagesStore,
  type ChannelMessage,
} from "@/stores/groupMessages";
import { useUsersStore } from "@/stores/users";
import { useUserAccountStore } from "@/stores/user/account";
import AuthorCommentsBlock from "./AuthorCommentsBlock.vue";
import DfAvatar from "@/assets/profile/profile_exp.jpg";

const props = defineProps<{
  postId: string;
  groupId?: string;
}>();

defineEmits<{
  (e: "close"): void;
}>();

const chStore = useGroupMessagesStore();
const users = useUsersStore();
const account = useUserAccountStore();

const post = computed<ChannelMessage | null>(() =>
  chStore.getById(props.postId)
);

const attachment = computed(() => post.value?.attachment || null);

const sender = computed(() =>
  post.value ? users.getById(post.value.senderId) : null
);

const senderName = computed(
  () =>
    sender.value?.name ||
    (post.value?.senderId === account.userId ? "Me" : "User")
);

const senderAvatar = computed(() => sender.value?.avatar || DfAvatar);

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024,
    sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
</script>

<style scoped>
.author-post-comments-panel {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--app-card-bg);
  border: 1px solid var(--app-border-color);
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.title {
  font-weight: 600;
}
.post-block {
  padding: 6px 0 8px;
  border-bottom: 1px solid var(--app-border-color);
}
.post-author-row {
  display: flex;
  align-items: center;
}
.meta {
  display: flex;
  flex-direction: column;
}
.name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.post-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 215, 0, 0.15);
  color: #f6d365;
}
.time {
  font-size: 12px;
  color: var(--app-text-muted, #9aa0a6);
}
.post-content .pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
.post-image {
  max-width: 100%;
  max-height: 260px;
  border-radius: 8px;
}
.comments-block {
  margin-top: 8px;
}
</style>
