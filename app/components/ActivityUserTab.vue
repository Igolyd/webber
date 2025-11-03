<!-- components/ActivityUserTab.vue -->
<template>
  <v-navigation-drawer
    v-model="internalModel"
    location="right"
    :permanent="permanent"
    :temporary="temporary"
    :width="width"
    class="theme-drawer-right"
    app
  >
    <v-card elevation="5" class="py-4 px-4 flex-1">
      <h5 class="card-title">Друзья в сети</h5>

      <v-list class="py-0 mt-2">
        <v-hover
          v-for="f in onlineFriends"
          :key="f.id"
          v-slot="{ isHovering, props: hoverProps }"
        >
          <v-list-item
            v-bind="hoverProps"
            rounded="lg"
            :style="friendItemStyle(f, isHovering)"
            @click="openChat(f.id)"
          >
            <template #prepend>
              <v-avatar size="36">
                <v-img :src="f.avatar || '/avatars/default.jpg'" alt="" />
              </v-avatar>
            </template>
            <v-list-item-title>
              {{ f.name }}
              <span class="text-caption text-medium-emphasis"
                >@{{ f.uniqueName }}</span
              >
            </v-list-item-title>
            <template #append>
              <v-icon color="green" size="14">mdi-circle</v-icon>
            </template>
          </v-list-item>
        </v-hover>

        <v-list-item v-if="!onlineFriends.length" class="opacity-70">
          <v-list-item-title>Никто не в сети</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRouter } from "vue-router";
import { useUsersStore } from "@/stores/users";

export default defineComponent({
  name: "ActivityUserTab",
  props: {
    modelValue: { type: Boolean, default: true },
    permanent: { type: Boolean, default: true },
    temporary: { type: Boolean, default: false },
    width: { type: [Number, String], default: 300 },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const internalModel = computed<boolean>({
      get: () => props.modelValue,
      set: (val) => emit("update:modelValue", val),
    });

    const usersStore = useUsersStore();
    const onlineFriends = computed(() =>
      usersStore.myFriends.filter((u) => u.online)
    );

    const router = useRouter();
    const openChat = (id: string) => router.push(`/dm/${id}`);

    function isGradientLike(v?: string) {
      if (!v) return false;
      const s = v.toLowerCase().trim();
      return s.includes("gradient(") || s.startsWith("url(");
    }
    function friendItemStyle(friend: any, isHovering: boolean) {
      const style: Record<string, string> = {
        transition:
          "filter .18s ease, background .18s ease, background-color .18s ease, border-radius .18s ease",
        filter: isHovering
          ? "none"
          : "opacity(0.85) saturate(0.98) brightness(0.98)",
        borderRadius: "12px",
        overflow: "hidden",
      };
      const banner = friend.banner as string | undefined;
      if (isHovering && banner) {
        if (isGradientLike(banner)) style.background = banner;
        else style.backgroundColor = banner;
      }
      return style;
    }

    return { internalModel, onlineFriends, openChat, friendItemStyle };
  },
});
</script>

<style scoped>
.theme-drawer-right {
  background-color: transparent !important;
  color: var(--rnav-on-surface);
  box-shadow: none !important;
  border: 0px;
}
.theme-drawer-right :deep(.v-navigation-drawer__content) {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--rnav-surface);
  color: var(--rnav-on-surface);
}
:deep(.v-card) {
  background: var(--rnav-elev-1);
  color: var(--rnav-on-surface);
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}
.card-title {
  font-weight: 600;
}
.opacity-70 {
  opacity: 0.7;
}
</style>
