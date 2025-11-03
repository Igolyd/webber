<!-- components/Settings/App/AppAppearance.vue -->
<template>
<v-container>
<v-card>
<v-card-title>Тема</v-card-title>
<v-card-text class="scroll-y">
<div v-if="ready">
<FormKit
type="radio"
name="theme"
v-model="themeLocal"
:options="[
{ label: 'Классика (тёмно‑фиолетовая)', value: 'classic' },
{ label: 'Сакура (светло‑фиолетовая)', value: 'sakura' },
{ label: 'Океан (тёмно‑синяя)', value: 'ocean' },
{ label: 'Облака (светло‑синяя)', value: 'clouds' },
{ label: 'Лайм (светло‑зелёная)', value: 'lime' },
{ label: 'Хакер (тёмно‑зелёная)', value: 'hacker' },
{ label: 'Белый свет (белый + серый)', value: 'white' },
{ label: 'Тьма (чёрный + белый)', value: 'void' },
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

<!-- Переопределения по блокам -->
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
>
Сброс
</v-btn>
</div>

<v-row
v-if="draft.sections[sec.key]?.enabled"
class="mb-1"
dense
>
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
</div>
<div v-else>Загрузка…</div>
</v-card-text>
</v-card>
</v-container>
</template>

<script setup lang="ts">
import {
onMounted,
onBeforeUnmount,
ref,
reactive,
watch,
computed,
inject,
} from "vue";
import { storeToRefs } from "pinia";
import { useAppearanceStore } from "~/stores/app/appearance";
import { useCustomThemeStore } from "~/stores/app/themeCustom";

type Theme =
| "classic"
| "sakura"
| "ocean"
| "clouds"
| "lime"
| "hacker"
| "white"
| "void"
| "custom";

// ActionsBar контекст
type ActionsCtx = {
setHandlers: (h: {
onSave?: () => Promise<void> | void;
onReset?: () => void;
}) => void;
clearHandlers: () => void;
saving: { value: boolean };
markDirty?: () => void;
clearDirty?: () => void;
};
const actions = inject<ActionsCtx | null>("settingsActions", null);

const ready = ref(false);
onMounted(() => {
ready.value = true;
});

const appearance = useAppearanceStore();
const custom = useCustomThemeStore();
const { theme } = storeToRefs(appearance);

// Локальные черновики
const themeLocal = ref<Theme>(theme.value as Theme);
const draft = reactive<any>(custom.getSnapshot());

// Секции для UI
const sectionsList = [
{ key: "hdr", title: "Шапка" },
{ key: "lnav", title: "Левая навигация" },
{ key: "topnav", title: "Верхняя навигация" },
{ key: "main", title: "Основное окно" },
{ key: "composer", title: "Окно ввода (Composer)" },
{ key: "rnav", title: "Правая навигация" },
{ key: "dialog", title: "Диалоги" },
{ key: "menu", title: "Меню" },
{ key: "mymini", title: "Мой мини профиль" }, // NEW
];

function ensureSectionsDraft() {
draft.sections ||= {};
for (const s of sectionsList) {
draft.sections[s.key] ||= {};
draft.sections[s.key].enabled ||= false;
}
}
ensureSectionsDraft();

// Грязность
const dirty = computed(() => {
if (themeLocal.value !== theme.value) return true;
const saved = custom.getSnapshot();
return JSON.stringify(draft) !== JSON.stringify(saved);
});

// Предпросмотр кастомной
function applyDraftPreview() {
if (themeLocal.value !== "custom") return;
custom.load(draft);
appearance.setTheme("custom");
}

watch(themeLocal, (v) => {
appearance.setTheme(v);
if (v === "custom") applyDraftPreview();
actions?.markDirty?.();
});

watch(
draft,
() => {
applyDraftPreview();
actions?.markDirty?.();
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

function resetSection(key: string) {
draft.sections ||= {};
draft.sections[key] = { enabled: false };
applyDraftPreview();
}

// ActionsBar
onMounted(() => {
actions?.setHandlers({
onSave: () => {
appearance.setTheme(themeLocal.value);
custom.load(draft);
actions?.clearDirty?.();
},
onReset: () => {
themeLocal.value = theme.value as Theme;
Object.assign(draft, custom.getSnapshot());
ensureSectionsDraft();
appearance.setTheme(theme.value as any);
applyDraftPreview();
actions?.clearDirty?.();
},
});
});
onBeforeUnmount(() => {
actions?.clearHandlers();
});
</script>

<style scoped>
.scroll-y {
max-height: calc(100vh - 220px);
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
</style>
