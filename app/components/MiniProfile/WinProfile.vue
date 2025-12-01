<template>
  <v-dialog
    v-model="model"
    max-width="980"
    :scrim="true"
    scrollable
  >
    <v-card class="win-profile-card">
      <!-- Заголовок окна -->
      <v-card-title class="d-flex align-center justify-space-between py-3 px-4">
        <div class="d-flex align-center ga-2">
          <v-icon size="20">mdi-account-circle-outline</v-icon>
          <span class="text-subtitle-1 font-weight-medium">
            Профиль
          </span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          density="comfortable"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <!-- Две колонки -->
      <v-card-text class="pa-0">
        <v-row no-gutters class="win-profile-body">
          <!-- Левая колонка: FullProfileTabNavigation -->
          <v-col
            cols="12"
            md="4"
            class="win-profile-left pa-4"
          >
            <FullProfileTabNavigation />
          </v-col>

          <!-- Правая колонка: разделы -->
          <v-col
            cols="12"
            md="8"
            class="win-profile-right"
          >
            <!-- Табы разделов -->
            <div class="px-4 pt-4">
              <v-tabs
                v-model="tab"
                bg-color="transparent"
                color="primary"
                density="comfortable"
                grow
              >
                <v-tab value="board">Доска</v-tab>
                <v-tab value="activity">Активность</v-tab>
                <v-tab value="creations">Творения</v-tab>
                <v-tab value="wishlist">Вишлист</v-tab>
              </v-tabs>
            </div>

            <v-divider class="mt-2" />

            <!-- Контент табов -->
            <v-window v-model="tab" class="win-profile-window">
              <!-- Доска -->
              <v-window-item value="board">
                <div class="pa-4">
                  <div class="text-subtitle-2 mb-2">
                    Общая сводка
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-2">
                    Здесь будет общая доска профиля: любимые игры, фильмы,
                    цитаты, мировоззрение, политические взгляды и т.п.
                  </p>
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                  >
                    Пока раздел пуст. Позже сюда можно добавить карточки с интересами,
                    подборки, теги и т.п.
                  </v-alert>
                </div>
              </v-window-item>

              <!-- Активность -->
              <v-window-item value="activity">
                <div class="pa-4">
                  <div class="text-subtitle-2 mb-2">
                    Активность
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-2">
                    Здесь будет отображаться недавняя активность: посещённые каналы,
                    участие в голосовых, мероприятия, достижения и т.д.
                  </p>
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                  >
                    История активности пока не реализована.
                  </v-alert>
                </div>
              </v-window-item>

              <!-- Творения -->
              <v-window-item value="creations">
                <div class="pa-4">
                  <div class="text-subtitle-2 mb-2">
                    Творения
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-2">
                    Раздел для работ пользователя: арты, музыка, тексты, проекты,
                    моды, плагины — всё, что хочется показать.
                  </p>
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                  >
                    Позже здесь можно сделать сетку карточек с работами,
                    ссылками и описанием.
                  </v-alert>
                </div>
              </v-window-item>

              <!-- Вишлист -->
              <v-window-item value="wishlist">
                <div class="pa-4">
                  <div class="text-subtitle-2 mb-2">
                    Вишлист
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-2">
                    Список желаний: игры, книги, оборудование, курсы и т.п., которые
                    пользователь хочет получить или попробовать.
                  </p>
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                  >
                    Пока тут заглушка. В будущем можно подключить сюда Steam,
                    магазины или собственные списки.
                  </v-alert>
                </div>
              </v-window-item>
            </v-window>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import FullProfileTabNavigation from "./FullProfileTabNavigation.vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

// активный раздел справа
const tab = ref<"board" | "activity" | "creations" | "wishlist">("board");

function close() {
  model.value = false;
}
</script>

<style scoped>
.win-profile-card {
  border-radius: 18px;
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.win-profile-body {
  min-height: 420px;
}

/* левая колонка */
.win-profile-left {
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

/* правая колонка */
.win-profile-right {
  display: flex;
  flex-direction: column;
}

/* окно с табами */
.win-profile-window {
  flex: 1 1 auto;
  min-height: 260px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

@media (max-width: 959px) {
  .win-profile-left {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}
</style>