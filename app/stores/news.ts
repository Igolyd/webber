// stores/news.ts
import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

export type OwnerType = "group" | "author";

export interface NewsItem {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  title: string;
  text: string;
  createdAt: string;
  authorId: string;
}

export const useNewsStore = defineStore("news", () => {
  const items = useStorage<NewsItem[]>("app.news", []);

  function create(payload: Omit<NewsItem, "id" | "createdAt">) {
    const news: NewsItem = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...payload,
    };
    items.value.unshift(news);
    return news;
  }

  function update(id: string, patch: Partial<NewsItem>) {
    const idx = items.value.findIndex((n) => n.id === id);
    if (idx === -1) return;
    items.value[idx] = { ...items.value[idx], ...patch };
  }

  function remove(id: string) {
    items.value = items.value.filter((n) => n.id !== id);
  }

  function listByOwner(ownerType: OwnerType, ownerId: string) {
    return items.value.filter(
      (n) => n.ownerType === ownerType && n.ownerId === ownerId
    );
  }

  return {
    items,
    create,
    update,
    remove,
    listByOwner,
  };
});
