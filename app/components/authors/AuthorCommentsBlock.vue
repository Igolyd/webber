<!-- components/authors/AuthorCommentsBlock.vue -->
<template>
  <div class="author-comments">
    <div v-if="commentList.length" class="comments-list">
      <div v-for="c in commentList" :key="c.id" class="comment-row">
        <div class="comment-author">
          {{ authorName(c.authorId) }}
          <span class="comment-time">{{ fmtTime(c.createdAt) }}</span>
        </div>
        <div class="comment-text">
          {{ c.content }}
        </div>
      </div>
    </div>

    <!-- Инпут комментариев – используется InputMulti -->
    <div class="comment-composer">
      <InputMulti
        v-model="draft"
        :context="'channel'"
        :me-id="meId"
        :group-id="groupId"
        @send="onSend"
        @gif="onGifDisabled"
        @attach="onAttachDisabled"
        @alert="onAlertDisabled"
        @sticker="onStickerDisabled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import InputMulti from "@/components/InputMulti.vue";
import { useAuthorCommentsStore } from "@/stores/authorComments";
import { useUsersStore } from "@/stores/users";
import { useUserAccountStore } from "@/stores/user/account";

const props = defineProps<{
  postId: string; // id сообщения-поста
  groupId?: string; // id "группы"/комьюнити, для паков emoji/стикеров
}>();

const commentsStore = useAuthorCommentsStore();
const usersStore = useUsersStore();
const account = useUserAccountStore();

const meId = computed(() => account.userId || "");
const draft = ref("");

const commentList = computed(() => commentsStore.getByPost(props.postId));

function authorName(userId: string) {
  return usersStore.getById(userId)?.name || "User";
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function onSend() {
  const text = draft.value.trim();
  if (!text || !meId.value) return;
  commentsStore.addComment({
    postId: props.postId,
    authorId: meId.value,
    content: text,
  });
  draft.value = "";
}

// В комментариях можно по желанию выключить гифки/файлы/стикеры:
function onGifDisabled() {
  /* ничего */
}
function onAttachDisabled() {
  /* ничего */
}
function onAlertDisabled() {
  /* ничего */
}
function onStickerDisabled() {
  /* ничего */
}
</script>

<style scoped>
.author-comments {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--app-card-bg) 70%, transparent);
}
.comments-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 6px;
}
.comment-row {
  padding: 4px 0;
}
.comment-author {
  font-size: 12px;
  color: var(--app-text-muted, #9aa0a6);
}
.comment-time {
  margin-left: 4px;
}
.comment-text {
  font-size: 13px;
}
.comment-composer {
  margin-top: 4px;
}
</style>
