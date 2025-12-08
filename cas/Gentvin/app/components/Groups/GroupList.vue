<template>
  <v-card class="scope-main" color="transparent" flat elevation="0">
    <v-list class="py-0" color="transparent" elevation="0">
      <v-hover
        v-for="group in groups"
        :key="group.id"
        v-slot="{ isHovering, props: hoverProps }"
      >
        <NuxtLink :to="`/groups/${group.id}`">
          <v-list-item
            v-bind="hoverProps"
            rounded="lg"
            :style="groupItemStyle(group.id, isHovering)"
          >
            <template #prepend>
              <v-avatar size="40">
                <v-img :src="group.avatar || defaultGroupAvatar" alt="" />
              </v-avatar>
            </template>
            <v-list-item-title>{{ group.name }}</v-list-item-title>
          </v-list-item>
        </NuxtLink>
      </v-hover>
    </v-list>
  </v-card>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import groupExample from "@/assets/profile/group_example.jpg";
import { useGroupsStore } from "@/stores/groups";

export default defineComponent({
  name: "GroupList",
  props: { groups: { type: Array, required: true } },
  setup() {
    const router = useRouter();
    const defaultGroupAvatar = groupExample;
    const groupsStore = useGroupsStore();
    const open = (_id: string) => {
      router.push("/GroupsView");
    };

    function isGradientLike(v?: string) {
      if (!v) return false;
      const s = v.toLowerCase().trim();
      return s.includes("gradient(") || s.startsWith("url(");
    }
    function groupItemStyle(groupId: string, isHovering: boolean) {
      const prof = groupsStore.getProfile(groupId);
      const c = prof?.badge?.color as string | undefined;
      const shape = ((prof as any)?.badgeShape || "rounded") as
        | "pill"
        | "rounded"
        | "square";
      const style: Record<string, string> = {
        transition:
          "filter .18s, background .18s, background-color .18s, border-radius .18s",
        filter: isHovering
          ? "none"
          : "opacity(0.75) saturate(0.92) brightness(0.98)",
        borderRadius:
          shape === "pill" ? "9999px" : shape === "square" ? "8px" : "12px",
      };
      if (c) {
        if (isGradientLike(c)) style.background = c;
        else style.backgroundColor = c;
      }
      return style;
    }
    return { defaultGroupAvatar, open, groupItemStyle };
  },
});
</script>
<!-- Многие стили задаются в app\assets\styles\sections.css -->
<style scoped>
/* Список — прозрачный и наследует цвет от .scope-main (который теперь глобально задан) */
:deep(.v-list) {
  background: transparent !important;
  color: inherit !important;
}

/* Hover — лёгкая подсветка */
:deep(.v-list-item:hover) {
  background: color-mix(in oklab, currentColor 8%, transparent) !important;
}
</style>
