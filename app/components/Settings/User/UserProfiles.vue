<!-- components/Settings/User/UserProfiles.vue -->
<template>
  <v-container>
    <v-tabs v-model="tab" grow>
      <v-tab value="main">Основной профиль</v-tab>
      <v-tab value="group-personal">Личный профиль группы</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-4">
      <v-window-item value="main">
        <v-card>
          <v-card-text>
            <FormKit type="form" submit-label="Сохранить" @submit="saveMain">
              <v-row>
                <v-col cols="12" md="6">
                  <FormKit
                    type="text"
                    name="name"
                    label="Отображаемое имя"
                    :value="profiles.name"
                    validation="required|length:2,32"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <FormKit
                    type="text"
                    name="pronouns"
                    label="Местоимение"
                    :value="profiles.pronouns"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <FormKit
                    type="text"
                    name="quote"
                    label="Цитата"
                    :value="profiles.quote"
                    validation="length:0,50"
                    placeholder="Добавьте короткую цитату"
                    maxlength="50"
                    :help="'До 50 символов'"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <label class="text-subtitle-2 mb-2 d-block">Аватар</label>
                  <div class="d-flex align-center ga-3">
                    <v-avatar size="72">
                      <v-img :src="currentAvatarSrc" />
                    </v-avatar>
                    <div class="d-flex ga-2">
                      <v-btn size="small" @click="pickAvatar">Сменить</v-btn>
                      <v-btn size="small" variant="text" @click="removeAvatar" v-if="profiles.avatar">Удалить</v-btn>
                    </div>
                    <input
                      ref="fileInput"
                      type="file"
                      accept="image/*"
                      class="d-none"
                      @change="handleFileChange"
                    />
                  </div>
                </v-col>

                <!-- Баннер (новый блок) -->
                <v-col cols="12" md="6">
                  <label class="text-subtitle-2 mb-2 d-block">Баннер</label>
                  <div class="d-flex flex-column ga-2">
                    <v-sheet
                      height="60"
                      rounded
                      :style="bannerPreviewStyle"
                      class="elevation-1"
                    />
                    <div class="d-flex ga-2">
                      <v-btn size="small" @click="openBannerPicker">Сменить</v-btn>
                      <v-btn size="small" variant="text" v-if="profiles.banner" @click="removeBanner">Удалить</v-btn>
                    </div>
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <FormKit
                    type="select"
                    name="groupTag"
                    label="Тэг группы"
                    :value="profiles.groupTag"
                    :options="profiles.availableGroupTags"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <label class="text-subtitle-2 mb-2 d-block">Бейджик</label>
                  <div class="d-flex ga-2 align-center">
                    <v-chip
                      v-if="profiles.badge"
                      variant="flat"
                      :style="badgeChipStyle"
                    >
                      {{ profiles.badge?.name }}
                    </v-chip>
                    <v-btn size="small" @click="openBadgePicker">Сменить</v-btn>
                    <v-btn size="small" variant="text" v-if="profiles.badge" @click="removeBadge">Удалить</v-btn>
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <label class="text-subtitle-2 mb-2 d-block">Украшение аватара</label>
                  <div class="d-flex ga-2">
                    <v-chip v-if="profiles.decoration" variant="flat">
                      {{ profiles.decoration?.name }}
                    </v-chip>
                    <v-btn size="small">Сменить</v-btn>
                    <v-btn size="small" variant="text" v-if="profiles.decoration">Удалить</v-btn>
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <label class="text-subtitle-2 mb-2 d-block">Эффекты профиля</label>
                  <div class="d-flex ga-2 flex-wrap">
                    <v-chip v-for="e in profiles.effects" :key="e.id" class="ma-1">
                      {{ e.name }}
                    </v-chip>
                    <v-btn size="small">Сменить</v-btn>
                    <v-btn size="small" variant="text" v-if="profiles.effects.length">Удалить</v-btn>
                  </div>
                </v-col>

                <v-col cols="12">
                  <FormKit
                    type="textarea"
                    name="about"
                    label="Обо мне"
                    :value="profiles.about"
                    rows="4"
                  />
                </v-col>
              </v-row>
            </FormKit>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="group-personal">
        <v-card>
          <v-card-text>
            Раздел «Личный профиль группы» — пока пустой.
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

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
          <v-btn color="primary" @click="applyCroppedImage">Применить</v-btn>
          <v-btn variant="text" @click="cropDialog=false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог выбора цвета бейджа -->
    <v-dialog v-model="badgeDialog" width="340">
      <v-card>
        <v-card-title>Цвет бейджа</v-card-title>
        <v-card-text>
          <v-color-picker
            v-model="badgeColor"
            mode="hexa"
            hide-mode-switch
            show-swatches
            swatches-max-height="180"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="badgeDialog=false">Отмена</v-btn>
          <v-btn color="primary" @click="saveBadgeColor">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог выбора цвета баннера -->
    <v-dialog v-model="bannerDialog" width="340">
      <v-card>
        <v-card-title>Цвет баннера</v-card-title>
        <v-card-text>
          <v-color-picker
            v-model="bannerColor"
            mode="hexa"
            hide-mode-switch
            show-swatches
            swatches-max-height="180"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="bannerDialog=false">Отмена</v-btn>
          <v-btn color="primary" @click="saveBannerColor">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { FormKit } from '@formkit/vue'
import { Cropper, Preview, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { useProfilesStore } from '~/stores/user/profiles'

const profiles = useProfilesStore()

const snackbar = ref({ show: false, text: '', color: 'success' })
const tab = ref<'main' | 'group-personal'>('main')

const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<any>(null)
const cropDialog = ref(false)
const selectedImage = ref<string | null>(null)
const cropResult = ref<{ coordinates: any | null; image: any | null }>({
  coordinates: null,
  image: null,
})
const previewImage = ref<string>('')

const defaultAvatar = '/app/assets/profile/profile_exp.jpg'

// Источник аватара для превью (приоритет: локальный превью -> из стора -> дефолт)
const currentAvatarSrc = computed(() => previewImage.value || profiles.avatar || defaultAvatar)

// Если аватар в сторе изменился (например, после загрузки из LS), обновим локальный превью
watch(
  () => profiles.avatar,
  (val) => {
    if (!previewImage.value && val) previewImage.value = val
    if (!val) previewImage.value = ''
  },
  { immediate: true }
)

function pickAvatar() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    selectedImage.value = ev.target?.result as string
    cropDialog.value = true
  }
  reader.readAsDataURL(file)
}

function onCropChange({ coordinates, image }: any) {
  cropResult.value = { coordinates, image }
}

function applyCroppedImage() {
  const result = cropperRef.value?.getResult()
  if (result?.canvas) {
    previewImage.value = result.canvas.toDataURL()
    profiles.updateMainProfile({ avatar: previewImage.value })
  }
  cropDialog.value = false
}

function removeAvatar() {
  profiles.updateMainProfile({ avatar: '' })
  previewImage.value = ''
}

// ========= Бейджик (цвет) =========
const badgeDialog = ref(false)
const badgeColor = ref<string>('#1976D2') // дефолтный синий

function openBadgePicker() {
  badgeColor.value = profiles.badge?.color || '#1976D2'
  badgeDialog.value = true
}

function saveBadgeColor() {
  const prev = profiles.badge
  // Если бейджа ещё нет — создаём "пользовательский"
  const nextBadge = {
    id: prev?.id || 'custom',
    name: prev?.name || 'Пользовательский бейдж',
    icon: prev?.icon,
    color: badgeColor.value,
  }
  profiles.updateMainProfile({ badge: nextBadge })
  badgeDialog.value = false
}

function removeBadge() {
  profiles.updateMainProfile({ badge: null })
}

// Контрастный цвет текста для чипа
function getContrastColor(hex?: string) {
  if (!hex) return '#FFFFFF'
  const value = hex.replace('#', '')
  const r = parseInt(value.substring(0, 2), 16)
  const g = parseInt(value.substring(2, 4), 16)
  const b = parseInt(value.substring(4, 6), 16)
  // относительная яркость
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b)
  return luminance > 186 ? '#000000' : '#FFFFFF'
}

const badgeChipStyle = computed(() => {
  const bg = profiles.badge?.color || '#1976D2'
  return {
    backgroundColor: bg,
    color: getContrastColor(bg),
  }
})

// ========= Баннер (цвет) =========
const bannerDialog = ref(false)
const bannerColor = ref<string>('#37474F')

function openBannerPicker() {
  bannerColor.value = profiles.banner || '#37474F'
  bannerDialog.value = true
}

function saveBannerColor() {
  profiles.updateMainProfile({ banner: bannerColor.value })
  bannerDialog.value = false
}

function removeBanner() {
  profiles.updateMainProfile({ banner: '' })
}

const bannerPreviewStyle = computed(() => ({
  backgroundColor: profiles.banner || '#ECEFF1',
  border: '1px solid rgba(0,0,0,0.08)',
}))

async function saveMain(values: any) {
  profiles.updateMainProfile({
    name: values.name,
    pronouns: values.pronouns,
    groupTag: values.groupTag,
    about: values.about,
    quote: values.quote,
  })

  const res = await profiles.saveAndReport()

  snackbar.value = {
    show: true,
    text: res.message,
    color: res.ok ? 'success' : 'error',
  }

  return res
}
</script>