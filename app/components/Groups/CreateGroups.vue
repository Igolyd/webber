<!-- components/Groups/CreateGroups.vue -->
<template>
  <v-dialog v-model="model" max-width="720" persistent>
    <v-card>
      <v-toolbar color="primary" density="comfortable" title="Создание группы">
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          :disabled="loading"
          @click="close"
          :aria-label="'Закрыть диалог'"
        />
      </v-toolbar>

      <v-divider />

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mx-4 mt-3"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- Шаги -->
      <v-window v-model="step">
        <!-- Шаг 1: выбор шаблона -->
        <v-window-item value="template">
          <v-card-text>
            <div class="text-subtitle-1 mb-3">Выберите шаблон группы</div>
            <v-row>
              <v-col
                v-for="t in templatesList"
                :key="t.id"
                cols="12" sm="6" md="4"
              >
                <v-card
                  :elevation="selectedTemplate?.id === t.id ? 8 : 2"
                  :class="['pa-2', selectedTemplate?.id === t.id ? 'border-primary' : '']"
                  rounded="lg"
                  @click="selectTemplate(t)"
                >
                  <v-img
                    :src="t.thumb"
                    height="120"
                    cover
                    class="rounded mb-2"
                  />
                  <div class="d-flex align-center justify-space-between">
                    <div class="text-body-1">{{ t.name }}</div>
                    <v-btn
                      v-if="selectedTemplate?.id !== t.id"
                      size="small"
                      variant="text"
                      @click.stop="selectTemplate(t)"
                    >
                      Выбрать
                    </v-btn>
                    <v-icon v-else color="primary">mdi-check-circle</v-icon>
                  </div>
                </v-card>
              </v-col>

              <!-- Пункт "Без шаблона" внизу -->
              <v-col cols="12" sm="6" md="4">
                <v-card
                  :elevation="noTemplateSelected ? 8 : 2"
                  :class="['pa-2', noTemplateSelected ? 'border-primary' : '']"
                  rounded="lg"
                  @click="selectNoTemplate"
                >
                  <div class="d-flex align-center ga-3" style="height:120px;">
                    <v-avatar size="56" color="grey-lighten-3">
                      <v-icon color="grey">mdi-file-outline</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-body-1">Без шаблона</div>
                      <div class="text-caption text-medium-emphasis">Создать пустую группу</div>
                    </div>
                    <v-spacer />
                    <v-btn
                      v-if="!noTemplateSelected"
                      size="small"
                      variant="text"
                      @click.stop="selectNoTemplate"
                    >
                      Выбрать
                    </v-btn>
                    <v-icon v-else color="primary">mdi-check-circle</v-icon>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer />
            <v-btn
              color="primary"
              :disabled="!selectionMade || loading"
              @click="goSettings"
            >
              Далее
            </v-btn>
          </v-card-actions>
        </v-window-item>

        <!-- Шаг 2: параметры -->
        <v-window-item value="settings">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-subtitle-1">Параметры группы</div>
              <v-chip size="small" variant="flat">
                Шаблон:
                <span class="ml-1">
                  {{ selectedTemplate ? selectedTemplate.name : 'Без шаблона' }}
                </span>
              </v-chip>
            </div>

            <v-form ref="formRef" v-model="formValid" @submit.prevent="createGroup">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="groupName"
                    label="Название группы"
                    placeholder="Например: Клуб астрономии"
                    maxlength="48"
                    clearable
                    :rules="nameRules"
                    :disabled="loading"
                    counter="48"
                    required
                  />
                </v-col>

                <v-col cols="12" md="6" class="d-flex align-center">
                  <v-switch
                    v-model="isPrivate"
                    :disabled="loading"
                    color="primary"
                    inset
                    hide-details
                    label="Приватный"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <label class="text-subtitle-2 mb-2 d-block">Аватар группы</label>
                  <div class="d-flex align-center ga-3">
                    <v-avatar size="72">
                      <v-img :src="currentAvatarSrc" />
                    </v-avatar>
                    <div class="d-flex ga-2">
                      <v-btn size="small" :disabled="loading" @click="pickAvatar">Сменить</v-btn>
                      <v-btn
                        size="small"
                        variant="text"
                        :disabled="loading || !previewAvatar"
                        v-if="previewAvatar"
                        @click="removeAvatar"
                      >
                        Удалить
                      </v-btn>
                    </div>
                    <input
                      ref="fileInput"
                      type="file"
                      accept="image/*"
                      class="d-none"
                      @change="handleFileChange"
                    />
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Поддерживаются изображения до {{ maxAvatarSizeMb }} МБ. Рекомендуется квадратное фото.
                  </div>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="groupAbout"
                    label="Описание"
                    rows="3"
                    auto-grow
                    maxlength="300"
                    :disabled="loading"
                    placeholder="Коротко расскажите о группе"
                    counter="300"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions class="px-4 pb-4">
            <v-btn variant="text" :disabled="loading" @click="backToTemplates">Назад</v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!canCreate || loading"
              @click="createGroup"
            >
              Создать
            </v-btn>
          </v-card-actions>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Диалог кадрирования аватара -->
    <v-dialog v-model="cropDialog" max-width="600px">
      <v-card>
        <v-card-title>Кадрирование фотографии</v-card-title>
        <v-card-text>
          <Cropper
            v-if="selectedImage"
            ref="cropperRef"
            :debounce="false"
            :src="selectedImage"
            :stencil-component="CircleStencil"
            @change="onCropChange"
          />
          <Preview
            v-if="cropResult.coordinates && cropResult.image"
            :width="120"
            :height="120"
            :image="cropResult.image"
            :coordinates="cropResult.coordinates"
            :stencil-component="CircleStencil"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="loading" @click="cancelCrop">Отмена</v-btn>
          <v-btn color="primary" :disabled="loading" @click="applyCroppedImage">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar для сообщений -->
    <v-snackbar v-model="snackbar.open" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Cropper, Preview, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { useGroupsStore } from '@/stores/groups'

// v-model диалога
const props = defineProps<{
  modelValue: boolean
  templates?: Array<{ id: string; name: string; thumb: string }>
  maxAvatarSizeMb?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [payload: {
    id: string
    name: string
    isPublic: boolean
    avatar?: string
    templateId?: string | null
    createdAt: string
  }]
  cancel: []
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// Состояния
type Step = 'template' | 'settings'
const step = ref<Step>('template')
const loading = ref(false)
const errorMessage = ref('')

// Шаблоны
const defaultTemplates = [
  { id: 'classic', name: 'Классический', thumb: '/images/group-templates/classic.jpg' },
  { id: 'compact',  name: 'Компактный',  thumb: '/images/group-templates/compact.jpg' },
  { id: 'modern',   name: 'Современный', thumb: '/images/group-templates/modern.jpg' },
]
const templatesList = computed(() => props.templates?.length ? props.templates : defaultTemplates)

const selectedTemplate = ref<{ id: string; name: string; thumb?: string } | null>(null)
const noTemplateSelected = ref(false)
const selectionMade = computed(() => !!selectedTemplate.value || noTemplateSelected.value)

function selectTemplate(t: any) {
  selectedTemplate.value = t
  noTemplateSelected.value = false
}
function selectNoTemplate() {
  selectedTemplate.value = null
  noTemplateSelected.value = true
}
function goSettings() {
  if (selectionMade.value) step.value = 'settings'
}
function backToTemplates() {
  step.value = 'template'
}

// Поля настроек
const groupName = ref<string>('')
const groupAbout = ref<string>('')
const isPrivate = ref<boolean>(false) // Приватный = true => isPublic = false

// Валидация формы
const formRef = ref()
const formValid = ref(false)
const nameRules = [
  (v: string) => !!v?.trim() || 'Укажите название',
  (v: string) => (v?.trim().length >= 3) || 'Минимум 3 символа',
  (v: string) => (v?.trim().length <= 48) || 'Не более 48 символов',
]

// Аватар
const maxAvatarSizeMb = computed(() => props.maxAvatarSizeMb ?? 5)
const MAX_AVATAR_SIZE = computed(() => maxAvatarSizeMb.value * 1024 * 1024)

const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<any>(null)
const cropDialog = ref(false)
const selectedImage = ref<string | null>(null)
const cropResult = ref<{ coordinates: any | null; image: any | null }>({
  coordinates: null,
  image: null,
})

const previewAvatar = ref<string>('') // локальный превью аватара
const defaultAvatar = '/app/assets/profile/profile_exp.jpg'
const currentAvatarSrc = computed(() => previewAvatar.value || defaultAvatar)

function pickAvatar() {
  if (loading.value) return
  if (fileInput.value) fileInput.value.value = ''
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Можно загружать только изображения'
    return
  }
  if (file.size > MAX_AVATAR_SIZE.value) {
    errorMessage.value = `Размер файла превышает ${maxAvatarSizeMb.value} МБ`
    return
  }

  const reader = new FileReader()
  reader.onload = (ev) => {
    selectedImage.value = ev.target?.result as string
    cropDialog.value = true
  }
  reader.onerror = () => {
    errorMessage.value = 'Не удалось прочитать файл'
  }
  reader.readAsDataURL(file)
}

function onCropChange({ coordinates, image }: any) {
  cropResult.value = { coordinates, image }
}

function applyCroppedImage() {
  try {
    const result = cropperRef.value?.getResult()
    if (result?.canvas) {
      previewAvatar.value = result.canvas.toDataURL('image/png')
      snackbar.value = { open: true, text: 'Аватар обновлён' }
    }
  } catch (e) {
    errorMessage.value = 'Не удалось применить кадрирование'
  } finally {
    cropDialog.value = false
    selectedImage.value = null
    cropResult.value = { coordinates: null, image: null }
  }
}

function cancelCrop() {
  cropDialog.value = false
  selectedImage.value = null
  cropResult.value = { coordinates: null, image: null }
}

function removeAvatar() {
  previewAvatar.value = ''
  snackbar.value = { open: true, text: 'Аватар удалён' }
}

// Создание группы
const canCreate = computed(() => !!groupName.value?.trim() && selectionMade.value)

const groupsStore = useGroupsStore()

async function createGroup() {
  errorMessage.value = ''
  const form = formRef.value as any
  if (form?.validate) {
    const res = await form.validate()
    if (!res.valid) return
  } else if (!canCreate.value) {
    return
  }

  loading.value = true
  try {
    const payload = {
      name: groupName.value.trim(),
      isPublic: !isPrivate.value,
      avatar: previewAvatar.value || undefined,
      templateId: selectedTemplate.value?.id ?? null,
      // about не хранится в примере Group — при необходимости можно расширить интерфейс стора
    }
    const created = groupsStore.addGroup(payload)

    emit('created', created)
    snackbar.value = { open: true, text: 'Группа создана' }
    resetAndClose()
  } catch (e: any) {
    errorMessage.value = e?.message || 'Не удалось создать группу. Попробуйте позже.'
  } finally {
    loading.value = false
  }
}

// Закрытие/сброс
function reset() {
  step.value = 'template'
  selectedTemplate.value = null
  noTemplateSelected.value = false
  groupName.value = ''
  groupAbout.value = ''
  isPrivate.value = false
  previewAvatar.value = ''
  cropDialog.value = false
  selectedImage.value = null
  cropResult.value = { coordinates: null, image: null }
  errorMessage.value = ''
}

function close() {
  if (loading.value) return
  emit('cancel')
  resetAndClose()
}

function resetAndClose() {
  reset()
  model.value = false
}

// Когда диалог открывается заново — обнуляем состояние
watch(() => props.modelValue, (v) => {
  if (v) reset()
})

// Snackbar
const snackbar = ref<{ open: boolean; text: string }>({ open: false, text: '' })
</script>

<style scoped>
:root {
  --v-theme-primary: var(--app-primary);
  --v-theme-on-primary: var(--app-on-primary);
  --v-theme-surface-variant: var(--app-surface-variant);
  --v-theme-on-surface: var(--app-on-surface);
  --v-theme-outline: var(--app-outline);
}
.border-primary { border: 2px solid var(--app-primary); }
</style>