<!-- components/Settings/User/UserAccount.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-4" title="Профиль (только просмотр)">
          <v-card-text>
            <div class="d-flex align-center ga-4">
              <v-avatar size="72">
                <v-img :src="profileAvatar || defaultAvatar" />
              </v-avatar>
              <div>
                <div class="text-h6">{{ profileName || '—' }}</div>
                <div class="text-caption">#{{ username || 'user' }}</div>
              </div>
            </div>

            <v-img
              v-if="profileBanner"
              :src="profileBanner"
              class="mt-3"
              height="120"
              cover
            />

            <v-btn variant="text" class="mt-2" @click="goProfiles">Редактировать в «Профили»</v-btn>
          </v-card-text>
        </v-card>

        <v-card title="Уникальное имя" class="mb-4">
          <v-card-text>
            <FormKit type="form" submit-label="Сохранить" @submit="saveUsername" :actions="true">
              <FormKit
                type="text"
                name="username"
                label="Уникальное имя (без #)"
                :value="username"
                validation="required|matches:/^[a-z0-9_\\.]{3,20}$/i"
                help="Допускаются буквы/цифры/._ длиной 3–20 символов"
              />
            </FormKit>
          </v-card-text>
        </v-card>

        <v-card title="Контакты" class="mb-4">
          <v-card-text>
            <FormKit type="form" submit-label="Сохранить" @submit="saveContacts" :actions="true">
              <FormKit
                type="text"
                name="email"
                label="Электронная почта"
                validation="email"
                :value="email || ''"
              />
              <FormKit
                type="text"
                name="phone"
                label="Номер телефона"
                validation="matches:/^\\+?[0-9\\s()-]{7,}$/"
                :value="phone || ''"
              />
            </FormKit>
          </v-card-text>
        </v-card>

        <v-card title="Безопасность" class="mb-4">
          <v-card-text>
            <FormKit type="form" submit-label="Изменить пароль" @submit="changePass">
              <FormKit type="password" name="oldPass" label="Текущий пароль" validation="required" />
              <FormKit type="password" name="newPass" label="Новый пароль" validation="required|length:8" />
              <FormKit type="password" name="confirm" label="Подтвердите пароль" validation="required|confirm:newPass" />
            </FormKit>
          </v-card-text>
        </v-card>

        <v-card title="Опасная зона" color="red-lighten-5" class="mb-4">
          <v-card-text>
            <v-btn color="red" @click="confirmDelete">Удалить учётную запись</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="confirmDialog" max-width="480">
      <v-card title="Подтверждение">
        <v-card-text>Вы уверены, что хотите удалить учётную запись? Это действие необратимо.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog=false">Отмена</v-btn>
          <v-btn color="red" @click="deleteAccount">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserAccountStore } from '~/stores/user/account'
import { useProfilesStore } from '~/stores/user/profiles'

type NavigateFn = (payload: { group: 'user' | 'app'; section: any }) => void

export default defineComponent({
  name: 'UserAccount',
  setup() {
    const accountStore = useUserAccountStore()
    const profilesStore = useProfilesStore()

    // Разворачиваем refs из стора
    const { username, email, phone } = storeToRefs(accountStore)
    const { name: profileName, avatar: profileAvatar, banner: profileBanner } = storeToRefs(profilesStore)

    const confirmDialog = ref(false)
    const defaultAvatar = '/app/assets/profile/profile_exp.jpg'
    const navigate = inject<NavigateFn>('settingsNavigate')

    function saveContacts(values: { email?: string; phone?: string }) {
      accountStore.updateContacts(values)
    }

    function saveUsername(values: { username: string }) {
      accountStore.updateIdentity({ username: values.username })
    }

    async function changePass(values: { oldPass: string; newPass: string }) {
      await accountStore.changePassword(values.oldPass, values.newPass)
    }

    function confirmDelete() {
      confirmDialog.value = true
    }

    async function deleteAccount() {
      try {
        await accountStore.deleteAccount()
      } finally {
        confirmDialog.value = false
      }
    }

    function goProfiles() {
      navigate?.({ group: 'user', section: 'profiles' })
    }

    return {
      // Плоские свойства для шаблона
      username,
      email,
      phone,
      profileName,
      profileAvatar,
      profileBanner,

      // UI-состояние и методы
      confirmDialog,
      defaultAvatar,
      saveContacts,
      saveUsername,
      changePass,
      confirmDelete,
      deleteAccount,
      goProfiles,
    }
  },
})
</script>