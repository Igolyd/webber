// stores/authorComments.ts
import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

export interface AuthorComment {
  id: string;
  postId: string; // id сообщения-поста из groupMessages
  authorId: string; // id пользователя, кто оставил комментарий
  content: string;
  createdAt: string;
  editedAt?: string;
}

export const useAuthorCommentsStore = defineStore("authorComments", () => {
  const comments = useStorage<AuthorComment[]>("app.authorComments", []);

  function getByPost(postId: string) {
    return comments.value
      .filter((c) => c.postId === postId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  function addComment(payload: {
    postId: string;
    authorId: string;
    content: string;
  }) {
    const text = payload.content.trim();
    if (!text) return;

    const c: AuthorComment = {
      id: crypto.randomUUID(),
      postId: payload.postId,
      authorId: payload.authorId,
      content: text,
      createdAt: new Date().toISOString(),
    };
    comments.value = [...comments.value, c];
    return c;
  }

  function editComment(id: string, content: string) {
    comments.value = comments.value.map((c) =>
      c.id === id
        ? { ...c, content: content.trim(), editedAt: new Date().toISOString() }
        : c
    );
  }

  function deleteComment(id: string) {
    comments.value = comments.value.filter((c) => c.id !== id);
  }

  function deleteByPost(postId: string) {
    comments.value = comments.value.filter((c) => c.postId !== postId);
  }

  return {
    comments,
    getByPost,
    addComment,
    editComment,
    deleteComment,
    deleteByPost,
  };
});
