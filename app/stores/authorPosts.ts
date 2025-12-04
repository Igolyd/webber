// stores/authorPosts.ts
import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

export interface AuthorPost {
  id: string;
  communityId: string;
  authorId: string | null; // пока можно null / заглушка
  title?: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  commentsCount: number;
}

export const useAuthorPostsStore = defineStore("authorPosts", () => {
  const posts = useStorage<AuthorPost[]>("app.author_posts", []);

  function addPost(payload: {
    communityId: string;
    authorId?: string | null;
    title?: string;
    text: string;
  }) {
    const p: AuthorPost = {
      id: crypto.randomUUID(),
      communityId: payload.communityId,
      authorId: payload.authorId ?? null,
      title: payload.title?.trim() || undefined,
      text: payload.text.trim(),
      createdAt: new Date().toISOString(),
      commentsCount: 0,
    };
    posts.value.unshift(p);
    return p;
  }

  function updatePost(id: string, patch: Partial<AuthorPost>) {
    const idx = posts.value.findIndex((p) => p.id === id);
    if (idx === -1) return;
    posts.value[idx] = {
      ...posts.value[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  }

  function removePost(id: string) {
    posts.value = posts.value.filter((p) => p.id !== id);
  }

  function getByCommunity(communityId: string) {
    return posts.value.filter((p) => p.communityId === communityId);
  }

  return {
    posts,
    addPost,
    updatePost,
    removePost,
    getByCommunity,
  };
});
