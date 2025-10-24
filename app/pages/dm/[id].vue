<template>
  <v-container fluid class="h-100 d-flex pa-0">
    <!-- Левый Drawer -->
    <AppLeftDrawer v-model="leftDrawer" :width="360" />

    <!-- Правая панель: профиль друга -->
    <v-navigation-drawer
      v-model="rightDrawer"
      :permanent="!isSmAndDown"
      :temporary="isSmAndDown"
      width="320"
      location="right"
      app
    >
      <div v-if="peer" class="pa-4">
        <v-avatar size="96" class="mb-3">
          <v-img :src="peer.avatar || '/avatars/default.jpg'" />
        </v-avatar>
        <div class="text-h6">{{ peer.name }}</div>
        <div class="text-caption mb-2">@{{ peer.uniqueName }}</div>
        <div class="text-body-2 mb-2">{{ peer.about }}</div>
        <v-chip
          v-if="peer.badge"
          :color="peer.badge.color"
          size="small"
          class="mr-1"
        >
          {{ peer.badge.label }}
        </v-chip>
        <div class="text-caption mt-2">Группа: {{ peer.groupTag || "—" }}</div>
        <v-divider class="my-3" />
        <div class="text-caption text-medium-emphasis">Цитата:</div>
        <div class="text-body-2">“{{ peer.quote || "—" }}”</div>

        <v-divider class="my-3" />
        <v-btn color="error" variant="tonal" @click="askRemoveFriend(peer.id)"
          >Удалить из друзей</v-btn
        >
      </div>
    </v-navigation-drawer>
    <div class="content-area">
      <v-navigation-drawer
        location="top"
        :model-value="true"
        :height="headerHeight"
        :width="headerHeight"
        absolute
        floating
        elevation="0"
        class="content-header-drawer"
      >
        <div class="content-header">
          <div class="spacer"></div>
          <v-btn icon :title="'Участники'" aria-label="Участники" @click="$emit('toggle-users')">
            <v-icon>mdi-account-multiple-outline</v-icon>
          </v-btn>
          <v-btn icon :title="'Видео-комната'" aria-label="Видео-комната" @click="$emit('toggle-video')"
>
            <v-icon>mdi-video-outline</v-icon>
          </v-btn>
        </div>
      </v-navigation-drawer>

      <section class="content-scroll">
        <v-card flat class="messages-theme pa-0">
          <ChatWindow context="dm" :peer-id="peerId" />
        </v-card>
      </section>
    </div>
    <!-- Диалог подтверждения удаления из друзей -->
    <v-dialog v-model="confirmRemoveDialog" max-width="420">
      <v-card>
        <v-card-title>Удалить из друзей?</v-card-title>
        <v-card-text
          >Вы уверены, что хотите удалить этого пользователя из списка
          друзей?</v-card-text
        >
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmRemoveDialog = false"
            >Отмена</v-btn
          >
          <v-btn color="error" @click="confirmRemoveConfirm">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useUsersStore } from "@/stores/users";
import { useUserAccountStore } from "@/stores/user/account";
import { useMessagesStore } from "@/stores/messages";
import AppLeftDrawer from "@/components/navigation/AppLeftDrawer.vue";
import ChatWindow from "~/components/chat/ChatWindow.vue";

const route = useRoute();
const router = useRouter();
const { smAndDown } = useDisplay();
const isSmAndDown = computed(() => smAndDown.value);
const headerHeight = computed(() => (smAndDown.value ? 58 : 66));
defineEmits(["toggle-users", "toggle-video"]);
const users = useUsersStore();
const account = useUserAccountStore();
const messagesStore = useMessagesStore();
users.ensureSeed();

const leftDrawer = ref(true);
const rightDrawer = ref(!isSmAndDown.value);

const meId = computed(() => account.userId || "");
const peerId = computed(() => String(route.params.id || ""));
const peer = computed(() => users.getById(peerId.value));

const convo = computed(() =>
  messagesStore.getConversation(meId.value, peerId.value)
);

watch(peerId, (id) => {
  if (!users.getById(id)) {
    router.replace("/");
  }
});

// Автопрокрутка вниз при новых сообщениях
const scrollArea = ref<HTMLElement | null>(null);
watch(
  convo,
  async () => {
    await nextTick();
    if (scrollArea.value) {
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
    }
  },
  { deep: true }
);

// локальное удаление из друзей (правый профиль)
const confirmRemoveDialog = ref(false);
const removeId = ref<string | null>(null);
const askRemoveFriend = (id: string) => {
  removeId.value = id;
  confirmRemoveDialog.value = true;
};
const confirmRemoveConfirm = () => {
  if (removeId.value && meId.value) {
    users.removeFriend(meId.value, removeId.value, true);
    if (peerId.value === removeId.value) {
      router.replace("/");
    }
  }
  confirmRemoveDialog.value = false;
  removeId.value = null;
};

// utils
</script>

<style scoped>
.content-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
}

.content-header-drawer {
  border-bottom: 1px solid var(--app-border-color);
  border-top: 1px solid var(--app-border-color);
  background: color-mix(in oklab, var(--app-surface) 70%, transparent);
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

.content-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.messages-theme {
  background: transparent;
  height: 100%;
  overflow: hidden;
  padding-top: 0;
}

@media (max-width: 600px) {
  .content-header {
    padding: 6px 8px;
  }
}
</style>
