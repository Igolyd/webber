<!-- components/Settings/App/AppAppearance.vue -->
<template>
  <v-container>
    <v-card>
      <v-card-title>Тема</v-card-title>
      <v-card-text>
        <!-- guard на случай крайних гонок -->
        <div v-if="ready">
          <FormKit
            type="radio"
            name="theme"
            v-model="theme"
            :options="[
              { label: 'Светлая', value: 'light' },
              { label: 'Тёмная', value: 'dark' },
              { label: 'Кастомная', value: 'custom' },
            ]"
          />
          <div v-if="theme === 'custom'" class="mt-3">
            Здесь будет настройка кастомной темы (цвета, типографика и т.д.)
          </div>
        </div>
        <div v-else>Загрузка…</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAppearanceStore } from '~/stores/app/appearance'
import { storeToRefs } from 'pinia'
// Если FormKit не зарегистрирован глобально, раскомментируйте:
// import { FormKit } from '@formkit/vue'

const store = useAppearanceStore()
const { theme } = storeToRefs(store)

// Доп. флаг чтобы явно не рендерить до монтирования (избегает гонок при lazy + ClientOnly)
const ready = ref(false)
onMounted(() => { ready.value = true })
</script>