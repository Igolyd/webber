<template>
  <div class="feed-scroll pa-4">
    <h3 class="text-subtitle-1 mb-3">
      {{ mode === "news" ? "Новости" : "События" }}
    </h3>

    <div v-if="mode === 'news'">
      <div v-for="n in news" :key="n.id" class="feed-item mb-3 pa-3 rounded">
        <div class="d-flex align-center mb-1">
          <strong>{{ n.title }}</strong>
          <v-spacer />
          <span class="text-caption text-medium-emphasis">
            {{ formatDateTime(n.createdAt) }}
          </span>
        </div>
        <div class="text-body-2 mb-1">{{ n.text }}</div>

        <div class="d-flex flex-wrap gap-1 mt-1">
          <v-chip
            v-for="r in reactionEntriesNews(n.id)"
            :key="r.emoji"
            size="x-small"
            :color="r.reactedByMe ? 'primary' : undefined"
            variant="tonal"
            @click="toggleNewsReaction(n.id, r.emoji)"
          >
            <span class="emoji">{{ r.emoji }}</span>
            <span class="ml-1">{{ r.count }}</span>
          </v-chip>

          <v-menu
            v-model="newsMenus[n.id]"
            :close-on-content-click="false"
            location="bottom"
          >
            <template #activator="{ props: actProps }">
              <v-btn
                size="x-small"
                variant="text"
                class="add-reaction"
                v-bind="actProps"
              >
                <v-icon size="14">mdi-plus</v-icon>
              </v-btn>
            </template>

            <div class="pa-2">
              <v-btn
                v-for="emoji in recentEmojis"
                :key="emoji"
                size="small"
                variant="text"
                @click="onQuickNewsReaction(n.id, emoji)"
              >
                {{ emoji }}
              </v-btn>
            </div>
          </v-menu>
        </div>
      </div>
    </div>

    <div v-else>
      <div
        v-for="ev in events"
        :key="ev.id"
        class="feed-item mb-3 pa-3 rounded"
      >
        <div class="d-flex align-center mb-1">
          <strong>{{ ev.title }}</strong>
          <v-spacer />
          <span class="text-caption text-medium-emphasis">
            {{ formatDateTime(ev.startsAt) }} – {{ formatDateTime(ev.endsAt) }}
          </span>
        </div>
        <div class="text-body-2 mb-1">{{ ev.description }}</div>

        <div class="d-flex flex-wrap gap-1 mt-1">
          <v-chip
            v-for="r in reactionEntriesEvent(ev.id)"
            :key="r.emoji"
            size="x-small"
            :color="r.reactedByMe ? 'primary' : undefined"
            variant="tonal"
            @click="toggleEventReaction(ev.id, r.emoji)"
          >
            <span class="emoji">{{ r.emoji }}</span>
            <span class="ml-1">{{ r.count }}</span>
          </v-chip>

          <v-menu
            v-model="eventMenus[ev.id]"
            :close-on-content-click="false"
            location="bottom"
          >
            <template #activator="{ props: actProps }">
              <v-btn
                size="x-small"
                variant="text"
                class="add-reaction"
                v-bind="actProps"
              >
                <v-icon size="14">mdi-plus</v-icon>
              </v-btn>
            </template>
            <div class="pa-2">
              <v-btn
                v-for="emoji in recentEmojis"
                :key="emoji"
                size="small"
                variant="text"
                @click="onQuickEventReaction(ev.id, emoji)"
              >
                {{ emoji }}
              </v-btn>
            </div>
          </v-menu>
        </div>
      </div>
    </div>

    <div v-if="mode === 'news' && !news.length" class="opacity-70">
      Новостей пока нет
    </div>
    <div v-if="mode === 'events' && !events.length" class="opacity-70">
      Событий пока нет
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useNewsStore } from "@/stores/news";
import { useEventsStore } from "@/stores/events";
import { useUserAccountStore } from "@/stores/user/account";
import { useMessagesStore } from "@/stores/messages";
import { useStorage } from "@vueuse/core";

const props = defineProps<{
  mode: "news" | "events";
  ownerType: "group" | "author";
  ownerId: string;
}>();

const newsStore = useNewsStore();
const eventsStore = useEventsStore();
const account = useUserAccountStore();
const messagesStore = useMessagesStore();

const meId = computed(() => account.userId || "");

const recentEmojis = useStorage<string[]>("app.recentEmojis", [
  "👍",
  "🔥",
  "❤️",
  "🎉",
]);

const news = computed(() =>
  newsStore.listByOwner(props.ownerType, props.ownerId)
);
const events = computed(() =>
  eventsStore.listByOwner(props.ownerType, props.ownerId)
);

const newsMenus = reactive<Record<string, boolean>>({});
const eventMenus = reactive<Record<string, boolean>>({});

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildReactionEntries(map: Record<string, string[]>) {
  const entries = Object.entries(map).map(([emoji, users]) => ({
    emoji,
    count: users.length,
    reactedByMe: users.includes(meId.value),
  }));
  return entries.sort((a, b) => b.count - a.count);
}

function reactionEntriesNews(id: string) {
  const map = messagesStore.getEntityReactions("news", id);
  return buildReactionEntries(map);
}
function reactionEntriesEvent(id: string) {
  const map = messagesStore.getEntityReactions("event", id);
  return buildReactionEntries(map);
}

function toggleNewsReaction(id: string, emoji: string) {
  messagesStore.toggleEntityReaction("news", id, emoji, meId.value);
}
function toggleEventReaction(id: string, emoji: string) {
  messagesStore.toggleEntityReaction("event", id, emoji, meId.value);
}

function onQuickNewsReaction(id: string, emoji: string) {
  toggleNewsReaction(id, emoji);
  newsMenus[id] = false;
}
function onQuickEventReaction(id: string, emoji: string) {
  toggleEventReaction(id, emoji);
  eventMenus[id] = false;
}
</script>

<style scoped>
.feed-scroll {
  height: 100%;
  overflow-y: auto;
}
.feed-item {
  background: var(--main-elev-1, rgba(255, 255, 255, 0.04));
}
.opacity-70 {
  opacity: 0.7;
}
</style>
