// stores/authors.ts
import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

export interface AuthorCommunity {
  id: string;
  name: string;
  quote?: string;
  description?: string;
  avatar?: string;
  topicId?: string | null;
  isPublic: boolean;
  createdAt: string;
}

export const useAuthorsStore = defineStore("authors", () => {
  const communities = useStorage<AuthorCommunity[]>(
    "app.authorCommunities",
    []
  );

  function addCommunity(
    payload: Omit<AuthorCommunity, "id" | "createdAt">
  ): AuthorCommunity {
    const created: AuthorCommunity = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...payload,
    };
    communities.value.unshift(created);
    return created;
  }

  function updateCommunity(id: string, patch: Partial<AuthorCommunity>) {
    const idx = communities.value.findIndex((c) => c.id === id);
    if (idx === -1) return;
    communities.value[idx] = { ...communities.value[idx], ...patch };
  }

  function getById(id: string) {
    return communities.value.find((c) => c.id === id) || null;
  }

  function ensureSeed() {
    if (communities.value.length) return;
    addCommunity({
      name: "Dev Notes",
      quote: "Заметки разработчика",
      description: "Сообщество заметок и статей по разработке.",
      avatar: "",
      topicId: "dev",
      isPublic: true,
    });
  }

  return {
    communities,
    addCommunity,
    updateCommunity,
    getById,
    ensureSeed,
  };
});
