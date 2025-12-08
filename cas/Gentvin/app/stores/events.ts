// stores/events.ts
import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import type { OwnerType } from "./news";

export interface EventItem {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  authorId: string;
}

export const useEventsStore = defineStore("events", () => {
  const items = useStorage<EventItem[]>("app.events", []);

  function create(payload: Omit<EventItem, "id" | "createdAt">) {
    const ev: EventItem = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...payload,
    };
    items.value.unshift(ev);
    return ev;
  }

  function update(id: string, patch: Partial<EventItem>) {
    const idx = items.value.findIndex((e) => e.id === id);
    if (idx === -1) return;
    items.value[idx] = { ...items.value[idx], ...patch };
  }

  function remove(id: string) {
    items.value = items.value.filter((e) => e.id !== id);
  }

  function listByOwner(ownerType: OwnerType, ownerId: string) {
    return items.value.filter(
      (e) => e.ownerType === ownerType && e.ownerId === ownerId
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
