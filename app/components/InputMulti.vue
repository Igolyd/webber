<!-- InputMulti.vue -->
<template>
  <v-navigation-drawer
    v-model="open"
    app
    location="bottom"
    :height="drawerHeight"
    :scrim="false"
    :permanent="true"
    class="input-drawer compact"
    :width="80"
  >
    <div class="wrap">
      <v-row class="align-center" no-gutters>
        <v-col class="pr-2">
          <v-textarea
            ref="taRef"
            v-model="inner"
            variant="solo"
            density="compact"
            flat
            autofocus
            hide-details
            rows="1"
            :max-rows="maxRows"
            auto-grow
            placeholder="Напишите сообщение..."
            bg-color="#474747"
            color="white"
            class="custom-textarea"
            @keydown.enter.exact.prevent="onSubmit"
          />
        </v-col>

        <v-col cols="auto" class="d-flex align-center gap-1">
          <v-menu
            v-model="showEmojiPicker"
            :close-on-content-click="false"
            location="top"
            transition="slide-y-transition"
          >
            <template #activator="{ props }">
              <v-btn icon="mdi-emoticon-outline" size="small" variant="text" v-bind="props" :title="'Эмодзи'"></v-btn>
            </template>

            <EmojiPicker
              theme="dark"
              :native="true"
              :disable-skin-tones="true"
              :display-recent="true"
              @select="onSelectEmoji"
            />
          </v-menu>

          <input
            ref="fileInput"
            type="file"
            class="d-none"
            @change="onFileChange"
          />

          <v-btn icon variant="text" size="small" :title="'Прикрепить файл'" @click="triggerFile">
            <v-icon size="20">mdi-paperclip</v-icon>
          </v-btn>

          <v-btn color="primary" size="small" :title="'Отправить'" @click="onSubmit">
            <v-icon size="20">mdi-airplane-send</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

type EmojiSelectPayload = {
  i: string
  n?: string[]
  r?: string
  t?: string
  u?: string
}

const props = defineProps<{
  modelValue: string
  minHeight?: number   // минимальная высота drawer
  maxRows?: number     // максимум строк текстового поля
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'send'): void
  (e: 'attach', file: File): void
}>()

const inner = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})

const open = ref(true)
const showEmojiPicker = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const taRef = ref<any>(null)

const maxRows = computed(() => props.maxRows ?? 5)
const minHeight = computed(() => props.minHeight ?? 64) // компактная базовая высота

// Внутренние константы "chrome" — вертикальные отступы + высота кнопок
const VERTICAL_PADDING = 8 + 8 // .wrap padding-y
const EXTRA_CHROME = 0          // запас под бордеры/служебные отступы

const drawerHeight = ref(minHeight.value)

// Авторасчёт высоты drawer по высоте текстовой области
async function recalcDrawerHeight() {
  await nextTick()
  const taEl: HTMLTextAreaElement | null = taRef.value?.$el?.querySelector('textarea') ?? null
  if (!taEl) {
    drawerHeight.value = minHeight.value
    return
  }

  // Фактическая высота текстовой области по контенту
  const textareaHeight = taEl.scrollHeight

  // Верхнюю границу задаём по maxRows: вычислим высоту одной строки
  const lineHeight = parseFloat(getComputedStyle(taEl).lineHeight || '20')
  const maxTextareaHeight = lineHeight * (maxRows.value || 5) + 2 // небольшой запас

  const clampedTextareaHeight = Math.min(textareaHeight, maxTextareaHeight)

  // Итоговая высота drawer — это текст + вертикальные отступы + хром
  const target = Math.max(
    minHeight.value,
    Math.round(clampedTextareaHeight + VERTICAL_PADDING + EXTRA_CHROME)
  )

  drawerHeight.value = target
}

watch(() => inner.value, () => {
  recalcDrawerHeight()
})
onMounted(() => {
  recalcDrawerHeight()
})

function onSelectEmoji(emoji: EmojiSelectPayload) {
  inner.value = (inner.value || '') + (emoji?.i ?? '')
  showEmojiPicker.value = false
  recalcDrawerHeight()
}

function onSubmit() {
  if (!inner.value || !inner.value.trim()) return
  emit('send')
}

function triggerFile() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('attach', file)
  }
  if (input) input.value = ''
}
</script>

<style scoped>
.input-drawer {
  border-top: 1px solid #2c2c2c;
  background: #1f1f1f;
}

/* Компактные отступы контейнера */
.wrap {
  padding: 8px 8px;
}

/* Более компактные интервалы между кнопками */
.gap-1 {
  gap: 6px;
}

/* Плейсхолдер */
.custom-textarea ::placeholder {
  color: #aaa;
}

/* Скрытый input для файлов */
.d-none {
  display: none !important;
}

/* Тюнинг плотности текстовой области */
.custom-textarea :deep(textarea) {
  line-height: 20px;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  min-height: 0 !important;
}

/* Уменьшаем высоту solo-поля визуально */
.custom-textarea :deep(.v-field) {
  --v-input-padding-top: 0px;
  --v-input-padding-bottom: 0px;
}
</style>