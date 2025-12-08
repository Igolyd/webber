<!-- pages/index.vue -->
<template>
  <v-container fluid class="h-100 d-flex pa-0">
    <AppLeftDrawer
      ref="leftDrawerRef"
      v-model="leftDrawer"
      v-model:categoryId="activeCategoryId"
      v-model:categoryName="activeCategoryName"
      :width="360"
    />

    <div class="content-area">
      <section class="content-scroll">
        <v-card flat class="list-card scope-main">
          <template v-if="activeCategoryId === 1">
            <GroupList :groups="groupsStore.groups" @opened="onOpenFromList" />
          </template>

          <template v-else-if="activeCategoryId === 2">
            <FriendList :friends="myFriends" />
          </template>

          <template v-else>
            <!-- 3. Авторы -->
            <AuthorsList :communities="authorsStore.communities" />
          </template>
        </v-card>
      </section>
    </div>

    <ActivityUserTab
      v-model="rightDrawer"
      :permanent="!isSmAndDown"
      :temporary="isSmAndDown"
      :width="320"
      :active-category-id="activeCategoryId"
    />

    <ContentHeader
      :title="activeCategoryName"
      :plusTitle="currentTitle"
      :showSearch="true"
      :showPlus="true"
      @open-left="leftDrawer = true"
      @plus="triggerPlus"
      @search="openSearch"
    >
      <template #right-before>
        <v-btn
          v-if="isSmAndDown"
          icon
          variant="text"
          :title="'Друзья в сети'"
          @click="rightDrawer = true"
        >
          <v-icon>mdi-account-multiple</v-icon>
        </v-btn>
      </template>
    </ContentHeader>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useDisplay } from "vuetify";

import AppLeftDrawer from "@/components/navigation/AppLeftDrawer.vue";
import ContentHeader from "@/components/layout/ContentHeader.vue";
import GroupList from "@/components/Groups/GroupList.vue";
import FriendList from "@/components/friends/FriendList.vue";
import ActivityUserTab from "~/components/ActivityUserTab.vue";
import AuthorsList from "@/components/authors/AuthorsList.vue";

import { useGroupsStore } from "~/stores/groups";
import { useUsersStore } from "~/stores/users";
import { useAuthorsStore } from "~/stores/authors";

export default defineComponent({
  name: "IndexPage",
  components: {
    AppLeftDrawer,
    ContentHeader,
    GroupList,
    FriendList,
    ActivityUserTab,
    AuthorsList,
  },
  setup() {
    const groupsStore = useGroupsStore();
    const usersStore = useUsersStore();
    const authorsStore = useAuthorsStore();

    groupsStore.ensureSeed();
    usersStore.ensureSeed();
    authorsStore.ensureSeed();

    const { smAndDown } = useDisplay();
    const isSmAndDown = computed(() => smAndDown.value);

    const leftDrawer = ref(true);
    const rightDrawer = ref(!isSmAndDown.value);
    const activeCategoryId = ref<number>(1);
    const activeCategoryName = ref<string>("Группы");

    const myFriends = computed(() => usersStore.myFriends);

    const currentTitle = computed(() =>
      activeCategoryId.value === 1
        ? "Создать группу"
        : activeCategoryId.value === 2
        ? "Найти друга"
        : "Создать сообщество"
    );

    const leftDrawerRef = ref<InstanceType<typeof AppLeftDrawer> | null>(null);

    const triggerPlus = () => {
      leftDrawerRef.value?.triggerCategoryAction();
    };

    const openSearch = () => {
      // пока поиск для всех категорий делает то же, что и плюс
      leftDrawerRef.value?.triggerCategoryAction();
    };

    const onOpenFromList = () => {
      if (isSmAndDown.value) leftDrawer.value = false;
    };

    return {
      groupsStore,
      usersStore,
      authorsStore,
      isSmAndDown,
      leftDrawer,
      rightDrawer,
      activeCategoryId,
      activeCategoryName,
      myFriends,
      currentTitle,
      leftDrawerRef,
      triggerPlus,
      openSearch,
      onOpenFromList,
    };
  },
});
</script>

<style scoped>
.h-100 {
  height: 100%;
}

/* как у тебя */

.content-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: none !important;
}

.content-scroll {
  flex: 1 1 auto;
  min-height: 0;
  background: transparent !important;
}

.list-card {
  /* фон и цвета берутся из .scope-main (см. sections.css) */
  border: 1px solid var(--main-border);
  border-left: none;
  height: 100%;
  overflow: auto;
  padding: 0;
}

.list-card::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.list-card {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
</style>
