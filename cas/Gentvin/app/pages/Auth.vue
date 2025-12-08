<template>
  <v-container class="d-flex align-center justify-center fill-height" fluid>
    <v-card max-width="480" class="pa-6" elevation="6">
      <v-card-title class="text-h5 text-center justify-center">
        {{ isRegistering ? "Регистрация" : "Авторизация" }}
      </v-card-title>

      <v-card-text>
        <!-- Форма ЛОГИНА -->
        <FormKit
          v-if="!isRegistering"
          type="form"
          :actions="false"
          @submit="handleLogin"
        >
          <FormKit
            type="text"
            name="login"
            label="Логин / Email"
            validation="required"
            validation-label="Логин"
            placeholder="Введите логин или email"
          />

          <FormKit
            type="password"
            name="password"
            label="Пароль"
            validation="required"
            validation-label="Пароль"
            placeholder="Введите пароль"
          />

          <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
            {{ error }}
          </v-alert>

          <v-btn type="submit" color="primary" block :loading="loading">
            Войти
          </v-btn>
        </FormKit>

        <!-- Форма РЕГИСТРАЦИИ -->
        <FormKit v-else type="form" :actions="false" @submit="handleRegister">
          <FormKit
            type="text"
            name="Username"
            label="Логин"
            validation="required"
            validation-label="Логин"
            placeholder="Придумайте логин"
          />

          <FormKit
            type="email"
            name="Email"
            label="Email"
            validation="required|email"
            validation-label="Email"
            placeholder="Введите email"
          />

          <FormKit
            type="password"
            name="Password"
            label="Пароль"
            validation="required"
            validation-label="Пароль"
            placeholder="Придумайте пароль"
          />

          <FormKit
            type="text"
            name="FirstName"
            label="Имя"
            validation="required"
            validation-label="Имя"
            placeholder="Введите имя"
          />

          <FormKit
            type="text"
            name="LastName"
            label="Фамилия"
            validation="required"
            validation-label="Фамилия"
            placeholder="Введите фамилию"
          />

          <FormKit
            type="text"
            name="Role"
            label="Роль"
            placeholder="Например: Admin, User"
            help="Если у вас фиксированные роли, можно сделать select."
          />

          <FormKit
            type="tel"
            name="Phone"
            label="Телефон"
            placeholder="Введите телефон"
          />

          <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
            {{ error }}
          </v-alert>

          <v-btn type="submit" color="primary" block :loading="loading">
            Зарегистрироваться
          </v-btn>
        </FormKit>
      </v-card-text>

      <v-card-actions class="justify-center mt-4">
        <v-btn variant="text" @click="toggleForm">
          {{
            isRegistering
              ? "Уже зарегистрированы? Войти"
              : "Еще нет аккаунта? Зарегистрироваться"
          }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
const isRegistering = ref(false);
const loading = ref(false);
const error = ref("");
const config = useRuntimeConfig();
// Переключение между формой логина и регистрации
const toggleForm = () => {
  error.value = "";
  isRegistering.value = !isRegistering.value;
};

/**
 * Авторизация
 * Формат API: http://api.gentvin.shinegold.ru/gateway/auth?login=admin&password=admin
 * values = { login: string, password: string } — приходит из FormKit
 */
const handleLogin = async (values: { login: string; password: string }) => {
  loading.value = true;
  error.value = "";

  try {
    const res = await $fetch(`${config.public.publicApiBase}/gateway/auth`, {
      method: "GET",
      params: {
        login: values.login,
        password: values.password,
      },
    });

    // TODO: обработать ответ (сохранить токен, редирект и т.д.)
    console.log("Login response:", res);
  } catch (err: any) {
    error.value = err?.data?.message || "Ошибка при авторизации";
  } finally {
    loading.value = false;
  }
};

/**
 * Регистрация
 * Формат API:
 * http://api.gentvin.shinegold.ru/Register
 *   ?Username=gavrilov
 *   &Email=gafden719@gmail.com
 *   &Password=gamer404
 *   &FirstName=Гаврилов
 *   &LastName=Данил
 *   &Role=Admin
 *   &Phone=321323213
 *
 * values приходят из FormKit, имена совпадают с параметрами API.
 */
type RegisterValues = {
  Username: string;
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string;
  Role?: string;
  Phone?: string;
};

const handleRegister = async (values: RegisterValues) => {
  loading.value = true;
  error.value = "";

  try {
    const res = await $fetch(
      `${config.public.publicApiBase}/gateway/auth/users/register`,
      {
        method: "POST",
        params: {
          Username: values.Username,
          Email: values.Email,
          Password: values.Password,
          FirstName: values.FirstName,
          LastName: values.LastName,
          Role: values.Role || "User",
          Phone: values.Phone || "",
        },
      }
    );

    // TODO: обработать ответ (уведомление, автоматический логин, редирект и т.п.)
    console.log("Register response:", res);

    // Например, после успешной регистрации сразу переключаемся на форму логина
    isRegistering.value = false;
  } catch (err: any) {
    error.value = err?.data?.message || "Ошибка при регистрации";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
