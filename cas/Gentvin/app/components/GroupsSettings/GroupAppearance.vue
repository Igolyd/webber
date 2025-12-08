<template>
  <v-container class="scope-main">
    <v-card class="main-card">
      <v-card-title>Внешний вид группы</v-card-title>
      <v-card-text class="scroll-y">
        <div v-if="ready">
          <FormKit type="group">
            <div class="d-flex flex-wrap ga-4">
              <div class="w-100 text-overline text-medium-emphasis">Текст</div>
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
              <div v-if="draft.bgKind === 'gradient'" class="w-100">
                <div class="d-flex ga-3 flex-wrap align-center">
                  <div class="flex-1-1">
                    <div class="text-caption mb-1">Угол</div>
                    <v-slider
                      v-model="bgAngle"
                      :min="0"
                      :max="360"
                      step="1"
                      thumb-label
                    />
                  </div>
                  <v-text-field
                    v-model.number="bgAngle"
                    type="number"
                    label="deg"
                    style="max-width: 120px"
                  />
                </div>
                <div class="d-flex ga-3 flex-wrap">
                  <div class="flex-1-1">
                    <div class="text-caption mb-1">Цвет 1</div>
                    <v-color-picker
                      v-model="bgC1"
                      mode="hexa"
                      hide-mode-switch
                    />
                  </div>
                  <div class="flex-1-1">
                    <div class="text-caption mb-1">Цвет 2</div>
                    <v-color-picker
                      v-model="bgC2"
                      mode="hexa"
                      hide-mode-switch
                    />
                  </div>
                </div>
                <div class="mt-3">
                  <div class="text-caption mb-1">Предпросмотр</div>
                  <v-sheet
                    height="60"
                    rounded
                    class="elevation-1"
                    :style="{
                      background: buildGradient(bgAngle, bgC1, bgC2),
                      border: '1px solid rgba(0,0,0,0.08)',
                    }"
                  />
                </div>
              </div>
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
              <div class="w-100 text-overline text-medium-emphasis mt-2">
                Hover
              </div>
              <FormKit
                type="color"
                label="Цвет при наведении"
                v-model="draft.hoverColor"
              />
              <div class="w-100 text-overline text-medium-emphasis mt-2">
                Системные кнопки
              </div>
              <FormKit
                type="color"
                label="Primary"
                v-model="draft.primaryColor"
              />
              <FormKit
                type="color"
                label="Surface-variant"
                v-model="draft.surfaceVariantColor"
              />
              <div class="w-100 text-overline text-medium-emphasis mt-6">
                Переопределения по блокам
              </div>
              <v-expansion-panels class="w-100">
                <v-expansion-panel title="Настройки секций (опционально)">
                  <v-expansion-panel-text>
                    <div
                      v-for="sec in sectionsList"
                      :key="sec.key"
                      class="mb-6"
                    >
                      <div class="d-flex align-center mb-2">
                        <v-switch
                          v-model="draft.sections[sec.key].enabled"
                          :label="sec.title"
                          density="compact"
                        />
                        <v-btn
                          size="small"
                          variant="text"
                          class="ml-2"
                          @click="resetSection(sec.key)"
                          >Сброс</v-btn
                        >
                      </div>
                      <v-row v-if="draft.sections[sec.key]?.enabled" dense>
                        <v-col cols="12" sm="6" md="4">
                          <FormKit
                            type="color"
                            label="Фон (surface)"
                            v-model="draft.sections[sec.key].surface"
                          />
                        </v-col>
                        <v-col cols="12" sm="6" md="4">
                          <FormKit
                            type="color"
                            label="Текст/иконки (on-surface)"
                            v-model="draft.sections[sec.key].onSurface"
                          />
                        </v-col>
                        <v-col cols="12" sm="6" md="4">
                          <FormKit
                            type="color"
                            label="Границы (border)"
                            v-model="draft.sections[sec.key].border"
                          />
                        </v-col>
                        <v-col
                          cols="12"
                          sm="6"
                          md="4"
                          v-if="sec.key !== 'dialog'"
                        >
                          <FormKit
                            type="color"
                            label="Hover"
                            v-model="draft.sections[sec.key].hover"
                          />
                        </v-col>
                        <v-col
                          cols="12"
                          sm="6"
                          md="4"
                          v-if="sec.key !== 'dialog'"
                        >
                          <FormKit
                            type="color"
                            label="Вторичная поверхность (elev-1)"
                            v-model="draft.sections[sec.key].elev1"
                          />
                        </v-col>
                      </v-row>
                      <v-divider />
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </FormKit>
        </div>
        <div v-else>Загрузка…</div>
      </v-card-text>
    </v-card>
    <v-slide-y-transition>
      <div v-if="dirty" class="savebar">
        <v-btn color="primary" @click="saveAll">Сохранить</v-btn>
        <v-btn variant="text" @click="resetAll">Сброс</v-btn>
      </div>
    </v-slide-y-transition>
  </v-container>
</template>
<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch } from "vue";
import { useRoute } from "vue-router";
import {
  useGroupThemesStore,
  type GroupThemeSnapshot,
} from "~/stores/groupThemes";
import { useThemeOverrideStore } from "~/stores/app/themeOverride";
import { useAppearanceStore } from "~/stores/app/appearance";
const route = useRoute();
const gid = computed(() => String(route.params.id || ""));
const ready = ref(false);
const groupsThemes = useGroupThemesStore();
const override = useThemeOverrideStore();
const appearance = useAppearanceStore();
const draft = reactive<GroupThemeSnapshot>({});
const bgAngle = ref<number>(135);
const bgC1 = ref<string>("#8ec5e5");
const bgC2 = ref<string>("#4f9cf9");

watch(
  () => draft.bgKind,
  (k) => {
    if (k === "gradient") {
      const parsed = parseLinearGradient(draft.bgGradient);
      if (parsed) {
        bgAngle.value = parsed.angle;
        bgC1.value = parsed.c1;
        bgC2.value = parsed.c2;
      }
    }
  },
  { immediate: true }
);

watch([bgAngle, bgC1, bgC2], () => {
  if (draft.bgKind === "gradient") {
    draft.bgGradient = buildGradient(bgAngle.value, bgC1.value, bgC2.value);
  }
});

const sectionsList = [
  { key: "hdr", title: "Шапка" },
  { key: "lnav", title: "Левая навигация" },
  { key: "topnav", title: "Верхняя навигация" },
  { key: "main", title: "Основное окно" },
  { key: "composer", title: "Окно ввода (Composer)" },
  { key: "rnav", title: "Правая навигация" },
  { key: "dialog", title: "Диалоги" },
  { key: "menu", title: "Меню" },
  { key: "mymini", title: "Мой мини профиль" },
];
onMounted(() => {
  Object.assign(draft, groupsThemes.get(gid.value) ?? {});
  draft.sections ||= {};
  for (const s of sectionsList) {
    draft.sections[s.key] ||= {};
    draft.sections[s.key].enabled ||= false;
  }
  ready.value = true;
});
const dirty = computed(() => {
  const saved = groupsThemes.get(gid.value) ?? {};
  return JSON.stringify(draft) !== JSON.stringify(saved);
});
watch(
  draft,
  () => {
    if (!gid.value) return;
    if (!appearance.preferPersonalThemeInGroups) {
      override.set({ ...draft });
    }
  },
  { deep: true }
);
function saveAll() {
  if (!gid.value) return;
  groupsThemes.set(gid.value, { ...draft });
}
function resetAll() {
  Object.assign(draft, groupsThemes.get(gid.value) ?? {});
  draft.sections ||= {};
  for (const s of sectionsList) {
    draft.sections[s.key] ||= {};
    draft.sections[s.key].enabled ||= false;
  }
  if (!appearance.preferPersonalThemeInGroups) {
    override.set({ ...draft });
  }
}
function buildGradient(angle: number, c1: string, c2: string) {
  const a = Math.max(0, Math.min(360, Math.round(angle || 0)));
  return `linear-gradient(${a}deg, ${c1} 0%, ${c2} 100%)`;
}
function isGradientLike(v?: string) {
  return !!v && v.toLowerCase().includes("gradient(");
}
// Базовый парсер, чтобы подхватывать существующее значение
function parseLinearGradient(
  s?: string
): { angle: number; c1: string; c2: string } | null {
  if (!s || !isGradientLike(s)) return null;
  const m = s.match(
    /linear-gradient$\s*([0-9.]+)deg\s*,\s*(#[0-9a-fA-F]{3,8}|rgba?$[^)]*$|[a-z]+)\s+\d{1,3}%\s*,\s*(#[0-9a-fA-F]{3,8}|rgba?$[^)]*$|[a-z]+)\s+\d{1,3}%\s*$/i
  );
  if (!m) return null;
  return { angle: Number(m[1]) || 135, c1: m[2], c2: m[3] };
}
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
function resetSection(key: string) {
  draft.sections ||= {};
  draft.sections[key] = { enabled: false };
}
</script>
<style scoped>
.scroll-y {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.scroll-y::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.scroll-y {
  scrollbar-width: none;
}
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
/* Маппинг секции main */
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
</style>
