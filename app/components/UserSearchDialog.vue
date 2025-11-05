<!-- components/UserSearchDialog.vue -->
<template>
  <v-dialog v-model="model" max-width="560">
    <v-card>
      <v-card-title>Поиск пользователей</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="query"
          label="Имя или уникальное имя"
          prepend-inner-icon="mdi-magnify"
          clearable
          @keyup.enter="doSearch"
        />
        <v-btn size="small" @click="doSearch">Найти</v-btn>

        <v-divider class="my-3" />

        <v-list v-if="results.length" color="transparent">
          <v-list-item
            v-for="u in results"
            :key="u.id"
            :title="u.name"
            :subtitle="'@' + u.uniqueName"
          >
            <template #prepend>
              <v-avatar size="36">
                <v-img :src="u.avatar || '/avatars/default.jpg'" />
              </v-avatar>
            </template>
            <template #append>
              <v-btn size="small" color="primary" @click="addFriend(u.id)">
                Добавить
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
        <div v-else-if="searched">Никого не найдено</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Закрыть</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useUserAccountStore } from '@/stores/user/account'

interface Props {
  modelValue: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const users = useUsersStore()
const account = useUserAccountStore()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const query = ref('')
const results = ref(users.users.value)
const searched = ref(false)

watch(model, (open) => {
  if (open) {
    query.value = ''
    results.value = []
    searched.value = false
  }
})

const doSearch = () => {
  const exclude = account.userId
    ? [account.userId, ...users.getFriendsOf(account.userId).map(u => u.id)]
    : []
  results.value = users.searchUsers(query.value, exclude)
  searched.value = true
}

const addFriend = (id: string) => {
  if (!account.userId) return
  users.addFriend(account.userId, id, true)
}

const close = () => { model.value = false }
</script>