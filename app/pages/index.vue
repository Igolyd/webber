<!-- pages/index.vue -->
<template>
  <v-container fluid class="h-100 d-flex pa-0">
    <!-- Левый Drawer как компонент -->
    <AppLeftDrawer
      ref="leftDrawerRef"
      v-model="leftDrawer"
      v-model:categoryId="activeCategoryId"
      v-model:categoryName="activeCategoryName"
      :width="360"
    />

    <!-- Центральная колонка -->
    <div class="content-area">
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

      <section class="content-scroll">
        <v-card flat class="list-card">
          <!-- Группы -->
          <template v-if="activeCategoryId === 1">
            <GroupList :groups="groupsStore.groups" @opened="onOpenFromList" />
          </template>
          <!-- Личные сообщения -->
          <template v-else>
            <FriendList :friends="myFriends" />
          </template>
        </v-card>
      </section>
    </div>

    <!-- Правая панель -->
    <ActivityUserTab
      v-model="rightDrawer"
      :permanent="!isSmAndDown"
      :temporary="isSmAndDown"
      :width="320"
    />
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import AppLeftDrawer from '@/components/navigation/AppLeftDrawer.vue'
import ContentHeader from '@/components/layout/ContentHeader.vue'
import GroupList from '@/components/Groups/GroupList.vue'
import FriendList from '@/components/friends/FriendList.vue'
import ActivityUserTab from '~/components/ActivityUserTab.vue'
import { useGroupsStore } from '~/stores/groups'
import { useUsersStore } from '~/stores/users'

export default defineComponent({
  name: 'IndexPage',
  components: {
    AppLeftDrawer,
    ContentHeader,
    GroupList,
    FriendList,
    ActivityUserTab,
  },
  setup() {
    const groupsStore = useGroupsStore()
    const usersStore = useUsersStore()
    usersStore.ensureSeed()

    const { smAndDown } = useDisplay()
    const isSmAndDown = computed(() => smAndDown.value)

    const leftDrawer = ref(true)
    const rightDrawer = ref(!isSmAndDown.value)
    const activeCategoryId = ref<number>(1)
    const activeCategoryName = ref<string>('Группы')

    const myFriends = computed(() => usersStore.myFriends)
    const currentTitle = computed(() =>
      activeCategoryId.value === 1 ? 'Создать группу' : 'Найти друга'
    )

    const leftDrawerRef = ref<InstanceType<typeof AppLeftDrawer> | null>(null)

    const triggerPlus = () => {
      leftDrawerRef.value?.triggerCategoryAction()
    }

    const openSearch = () => {
      // чтобы не дублировать состояние, делегируем Drawer-у
      if (activeCategoryId.value === 2) {
        leftDrawerRef.value?.triggerCategoryAction()
      } else {
        // в режиме "Группы" кнопка "лупа" может быть просто заглушкой или
        // открывать доп. поиск — опционально. Сейчас делегируем в Drawer.
        leftDrawerRef.value?.triggerCategoryAction()
      }
    }

    const onOpenFromList = () => {
      if (isSmAndDown.value) leftDrawer.value = false
    }

    return {
      groupsStore,
      usersStore,
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
    }
  },
})
</script>

<style scoped>
.h-100 { height: 100%; }
.content-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1f1f1f;
}
.content-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 8px;
}
.list-card {
  background: #292929;
  height: 100%;
  overflow: auto;
}
</style>