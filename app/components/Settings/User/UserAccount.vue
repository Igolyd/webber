<!-- components/Settings/User/UserAccount.vue -->
<template>
  <v-container class="settings-content-scroll scope-main">
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-4 main-card" title="Профиль (только просмотр)">
          <v-card-text>
            <div class="d-flex align-center ga-4">
              <v-avatar size="72">
                <v-img :src="profileAvatar || dfAvatar" />
              </v-avatar>
              <div>
                <div class="text-h6">{{ profileName || "—" }}</div>
                <div class="text-caption">#{{ username || "user" }}</div>
              </div>
            </div>

            <v-img
              v-if="profileBanner"
              :src="profileBanner"
              class="mt-3"
              height="120"
              cover
            />

            <v-btn variant="text" class="mt-2" @click="goProfiles">
              Редактировать в «Профили»
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card title="Уникальное имя" class="mb-4 main-card">
          <v-card-text>
            <FormKit
              ref="usernameFormRef"
              type="form"
              submit-label="Сохранить"
              :actions="true"
              @submit="saveUsername"
              @input="onFormInput"
            >
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

         <v-card title="Контакты" class="mb-4 main-card">
          <v-card-text>
            <FormKit
              ref="contactsFormRef"
              type="form"
              submit-label="Сохранить"
              :actions="true"
              @submit="saveContacts"
              @input="onFormInput"
            >
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

       <v-card title="Безопасность" class="mb-4 main-card">
          <v-card-text>
            <FormKit
              ref="passwordFormRef"
              type="form"
              submit-label="Изменить пароль"
              @submit="changePass"
              @input="onFormInput"
            >
              <FormKit
                type="password"
                name="oldPass"
                label="Текущий пароль"
                validation="required"
              />
              <FormKit
                type="password"
                name="newPass"
                label="Новый пароль"
                validation="required|length:8"
              />
              <FormKit
                type="password"
                name="confirm"
                label="Подтвердите пароль"
                validation="required|confirm:newPass"
              />
            </FormKit>
          </v-card-text>
        </v-card>

         <v-card title="Опасная зона" class="mb-4 main-card" color="red-lighten-5">
          <v-card-text>
            <v-btn color="red" @click="confirmDelete"
              >Удалить учётную запись</v-btn
            >
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="confirmDialog" max-width="480">
      <v-card title="Подтверждение">
        <v-card-text>
          Вы уверены, что хотите удалить учётную запись? Это действие
          необратимо.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">Отмена</v-btn>
          <v-btn color="red" @click="deleteAccount">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, inject, onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { useUserAccountStore } from "~/stores/user/account";
import { useProfilesStore } from "~/stores/user/profiles";
import dfAvatar from "../../../assets/profile/profile_exp.jpg";

type NavigateFn = (payload: { group: "user" | "app"; section: any }) => void;
type SettingsActions = {
  saving: any;
  setHandlers: (h: {
    onSave?: () => Promise<void> | void;
    onReset?: () => void;
  }) => void;
  clearHandlers: () => void;
  markDirty: () => void;
  clearDirty: () => void;
};

export default defineComponent({
  name: "UserAccount",
  setup() {
    const accountStore = useUserAccountStore();
    const profilesStore = useProfilesStore();

    // Разворачиваем refs из стора
    const { username, email, phone } = storeToRefs(accountStore);
    const {
      name: profileName,
      avatar: profileAvatar,
      banner: profileBanner,
    } = storeToRefs(profilesStore);

    const confirmDialog = ref(false);
    const navigate = inject<NavigateFn>("settingsNavigate", () => {});
    const actions = inject<SettingsActions>("settingsActions");

    // refs на формы FormKit
    const usernameFormRef = ref<any>(null);
    const contactsFormRef = ref<any>(null);
    const passwordFormRef = ref<any>(null);

    function onFormInput() {
      actions?.markDirty();
    }

    function saveContacts(values: { email?: string; phone?: string }) {
      accountStore.updateContacts(values);
    }

    function saveUsername(values: { username: string }) {
      accountStore.updateIdentity({ username: values.username });
    }

    async function changePass(values: { oldPass: string; newPass: string }) {
      await accountStore.changePassword(values.oldPass, values.newPass);
    }

    function confirmDelete() {
      confirmDialog.value = true;
    }

    async function deleteAccount() {
      try {
        await accountStore.deleteAccount();
      } finally {
        confirmDialog.value = false;
      }
    }

    function goProfiles() {
      navigate?.({ group: "user", section: "profiles" });
    }

    // Регистрируем обработчики для ActionsBar
    onMounted(() => {
      accountStore.init(); // линковка users <-> profiles

      actions?.setHandlers({
        onSave: async () => {
          // Три формы: запустим submit на каждой (по очереди)
          usernameFormRef.value?.node?.submit?.();
          contactsFormRef.value?.node?.submit?.();
          // Пароль изменяем отдельно (через отдельную кнопку тоже можно)
          // Но если введены поля — выполним сабмит
          const pwNode = passwordFormRef.value?.node;
          if (
            pwNode?.value?.oldPass ||
            pwNode?.value?.newPass ||
            pwNode?.value?.confirm
          ) {
            await pwNode.submit();
          }
          actions?.clearDirty();
        },
        onReset: () => {
          // Сброс состояний форм к значениям из стора
          usernameFormRef.value?.node?.reset?.();
          contactsFormRef.value?.node?.reset?.();
          passwordFormRef.value?.node?.reset?.();
          actions?.clearDirty();
        },
      });
    });

    onBeforeUnmount(() => {
      actions?.clearHandlers();
    });

    return {
      // Плоские свойства для шаблона
      username,
      email,
      phone,
      profileName,
      profileAvatar,
      profileBanner,
      dfAvatar,

      // UI-состояние и методы
      confirmDialog,
      saveContacts,
      saveUsername,
      changePass,
      confirmDelete,
      deleteAccount,
      goProfiles,

      // формы
      usernameFormRef,
      contactsFormRef,
      passwordFormRef,
      onFormInput,
    };
  },
});
</script>

<style scoped>
/* Скрытый скролл для контента страницы настроек */
.settings-content-scroll {
  height: 100%;
  overflow: auto;
  -ms-overflow-style: none; /* IE/Edge */
  scrollbar-width: none; /* Firefox */
}
.settings-content-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.scope-main {
  --v-theme-surface: var(--main-background);
  --v-theme-on-surface: var(--main-on-surface);
  --v-theme-outline: var(--main-border);
  --v-theme-surface-variant: var(--main-elev-1);
  color: var(--main-on-surface);
}
.main-card {
  background: var(--main-background) !important;
  color: var(--main-on-surface) !important;
  border: 1px solid var(--main-border) !important;
  box-shadow: none;
  border-radius: 12px;
}
.settings-content-scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.settings-content-scroll {
  scrollbar-width: none;
}
</style>
