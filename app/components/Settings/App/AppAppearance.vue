<!-- components/Settings/App/AppAppearance.vue -->
<template>
  <v-container>
    <v-card>
      <v-card-title>Тема</v-card-title>
      <v-card-text>
        <div v-if="ready">
          <FormKit
            type="radio"
            name="theme"
            v-model="themeLocal"
            :options="[
              { label: 'Светлая', value: 'light' },
              { label: 'Тёмная', value: 'dark' },
              { label: 'Кастомная', value: 'custom' },
            ]"
          />

          <div v-if="themeLocal === 'custom'" class="mt-4">
            <FormKit type="group">
              <div class="d-flex flex-wrap ga-4">
                <div class="w-100 text-overline text-medium-emphasis">
                  Текст
                </div>
                <FormKit
                  type="color"
                  label="Цвет текста"
                  v-model="draft.textColor"
                />

                <div class="w-100 text-overline text-medium-emphasis mt-2">
                  Фон
                </div>
                <FormKit
                  type="select"
                  label="Тип фона"
                  v-model="draft.bgKind"
                  :options="[
                    { label: 'Цвет', value: 'color' },
                    { label: 'Градиент', value: 'gradient' },
                    { label: 'Картинка', value: 'image' },
                  ]"
                />
                <FormKit
                  v-if="draft.bgKind === 'color'"
                  type="color"
                  label="Цвет фона"
                  v-model="draft.bgColor"
                />
                <FormKit
                  v-if="draft.bgKind === 'gradient'"
                  type="text"
                  label="CSS градиент (linear-gradient(...))"
                  v-model="draft.bgGradient"
                  help="Например: linear-gradient(180deg,#202020,#0f0f0f)"
                />
                <div v-if="draft.bgKind === 'image'" class="w-100">
                  <FormKit
                    type="file"
                    label="Картинка фона"
                    accept="image/*"
                    @change="onPickImage"
                  />
                  <div class="d-flex ga-2 mt-2">
                    <FormKit
                      type="select"
                      label="Size"
                      v-model="draft.bgSize"
                      :options="['cover', 'contain', 'auto', '100% 100%']"
                    />
                    <FormKit
                      type="select"
                      label="Repeat"
                      v-model="draft.bgRepeat"
                      :options="['no-repeat', 'repeat', 'repeat-x', 'repeat-y']"
                    />
                    <FormKit
                      type="text"
                      label="Position"
                      v-model="draft.bgPosition"
                    />
                  </div>
                </div>

                <div class="w-100 text-overline text-medium-emphasis mt-2">
                  Overlay
                </div>
                <FormKit
                  type="color"
                  label="Цвет оверлея"
                  v-model="draft.overlayColor"
                />
                <FormKit
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  label="Прозрачность оверлея"
                  v-model="draft.overlayOpacity"
                />

                <div class="w-100 text-overline text-medium-emphasis mt-2">
                  Поверхности
                </div>
                <FormKit
                  type="color"
                  label="Фон карточек"
                  v-model="draft.cardBg"
                />
                <FormKit
                  type="color"
                  label="Цвет бордеров"
                  v-model="draft.borderColor"
                />
                <!-- внутри <div class="d-flex flex-wrap ga-4"> ... -->
                <div class="w-100 text-overline text-medium-emphasis mt-2">
                  Hover
                </div>
                <FormKit
                  type="color"
                  label="Цвет при наведении"
                  v-model="draft.hoverColor"
                  help="Применяется для hover-подсветки списков/сообщений"
                />

                <div class="w-100 text-overline text-medium-emphasis mt-2">
                  Системные кнопки
                </div>
                <FormKit
                  type="color"
                  label="Primary (кнопки, акценты)"
                  v-model="draft.primaryColor"
                />
                <FormKit
                  type="color"
                  label="Surface-variant (тональные кнопки)"
                  v-model="draft.surfaceVariantColor"
                />
                <FormKit
                  type="checkbox"
                  label="Использовать мою тему в группах"
                  :value="appearance.preferPersonalThemeInGroups"
                  @input="appearance.setPreferPersonalThemeInGroups($event)"
                />
              </div>
            </FormKit>
          </div>
        </div>
        <div v-else>Загрузка…</div>
      </v-card-text>
    </v-card>

    <!-- Плавающая панель Сохранить/Сброс -->
    <v-slide-y-transition>
      <div v-if="dirty" class="savebar">
        <v-btn color="primary" @click="saveAll">Сохранить</v-btn>
        <v-btn variant="text" @click="resetAll">Сброс</v-btn>
      </div>
    </v-slide-y-transition>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useAppearanceStore } from "~/stores/app/appearance";
import { useCustomThemeStore } from "~/stores/app/themeCustom";

type Theme = "light" | "dark" | "custom";

const ready = ref(false);
onMounted(() => {
  ready.value = true;
});

const appearance = useAppearanceStore();
const custom = useCustomThemeStore();
const { theme } = storeToRefs(appearance);

// Локальные черновики
const themeLocal = ref<Theme>(theme.value);
const draft = reactive(custom.getSnapshot());

// Флаг «грязных» изменений
const dirty = computed(() => {
  if (themeLocal.value !== theme.value) return true;
  const saved = custom.getSnapshot();
  return JSON.stringify(draft) !== JSON.stringify(saved);
});

// Предпросмотр кастомной: применяем черновик, когда выбрана custom
function applyDraftPreview() {
  if (themeLocal.value !== "custom") return;
  custom.load(draft); // применяем в store
  appearance.setTheme("custom"); // включаем кастом в Vuetify/CSS
}

watch(themeLocal, (v) => {
  appearance.setTheme(v);
  if (v === "custom") applyDraftPreview();
});

watch(
  draft,
  () => {
    applyDraftPreview();
  },
  { deep: true }
);

async function onPickImage(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;
  const url = await toDataUrl(file);
  draft.bgImage = url;
}
function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function saveAll() {
  appearance.setTheme(themeLocal.value);
  custom.load(draft); // уже применён, но сейчас ещё и зафиксируется в localStorage (внутри стора)
}

function resetAll() {
  themeLocal.value = theme.value;
  Object.assign(draft, custom.getSnapshot()); // восстанавливаем saved -> draft
  appearance.setTheme(theme.value); // возвращаем тему
  applyDraftPreview(); // если вернулись на custom — подхватит
}
</script>

<style scoped>
.savebar {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  gap: 12px;
  background: var(--app-card-bg);
  color: var(--app-text-color);
  border: 1px solid var(--app-border-color);
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}
</style>
