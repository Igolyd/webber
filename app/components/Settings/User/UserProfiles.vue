<!-- components/Settings/User/UserProfiles.vue -->
<template>
  <v-container>
    <ActionsBar :saving="saving" @save="submitForm" @reset="resetForm" />

<v-tabs v-model="tab" grow>
  <v-tab value="main">Основной профиль</v-tab>
  <v-tab value="group-personal">Личный профиль группы</v-tab>
</v-tabs>

<v-window v-model="tab" class="mt-4">
  <v-window-item value="main">
    <v-card>
      <v-card-text>
        <FormKit type="form" submit-label="Сохранить" @submit="saveMain" :actions="false" ref="formRef">
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
              <FormKit type="text" name="pronouns" label="Местоимение" :value="profiles.pronouns" />
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
                <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="handleFileChange" />
              </div>
            </v-col>

            <!-- Баннер: цвет/градиент -->
            <v-col cols="12" md="6">
              <label class="text-subtitle-2 mb-2 d-block">Баннер</label>
              <div class="d-flex flex-column ga-2">
                <v-sheet height="60" rounded :style="bannerPreviewStyle" class="elevation-1" />
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

            <!-- Бейджик: цвет/градиент -->
            <v-col cols="12" md="6">
              <label class="text-subtitle-2 mb-2 d-block">Бейджик</label>
              <div class="d-flex ga-2 align-center">
                <v-chip v-if="profiles.badge" variant="flat" :style="badgeChipStyle" class="rounded-pill px-3">
                  {{ profiles.badge?.name }}
                </v-chip>
                <v-btn size="small" @click="openBadgePicker">Сменить</v-btn>
                <v-btn size="small" variant="text" v-if="profiles.badge" @click="removeBadge">Удалить</v-btn>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <label class="text-subtitle-2 mb-2 d-block">Украшение аватара</label>
              <div class="d-flex ga-2">
                <v-chip v-if="profiles.decoration" variant="flat">{{ profiles.decoration?.name }}</v-chip>
                <v-btn size="small">Сменить</v-btn>
                <v-btn size="small" variant="text" v-if="profiles.decoration">Удалить</v-btn>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <label class="text-subtitle-2 mb-2 d-block">Эффекты профиля</label>
              <div class="d-flex ga-2 flex-wrap">
                <v-chip v-for="e in profiles.effects" :key="e.id" class="ma-1">{{ e.name }}</v-chip>
                <v-btn size="small">Сменить</v-btn>
                <v-btn size="small" variant="text" v-if="profiles.effects.length">Удалить</v-btn>
              </div>
            </v-col>

            <v-col cols="12">
              <FormKit type="textarea" name="about" label="Обо мне" :value="profiles.about" rows="4" />
            </v-col>
          </v-row>
        </FormKit>
      </v-card-text>
    </v-card>
  </v-window-item>

  <v-window-item value="group-personal">
    <v-card>
      <v-card-text>Раздел «Личный профиль группы» — пока пустой.</v-card-text>
    </v-card>
  </v-window-item>
</v-window>

<!-- Кадрирование (vue-advanced-cropper) -->
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

<!-- Диалог: Бейдж (Цвет/Градиент) -->
<v-dialog v-model="badgeDialog" width="460">
  <v-card>
    <v-card-title>Бейдж</v-card-title>
    <v-card-text>
      <v-tabs v-model="badgeTab" grow>
        <v-tab value="solid">Цвет</v-tab>
        <v-tab value="gradient">Градиент</v-tab>
      </v-tabs>

      <v-window v-model="badgeTab" class="mt-3">
        <v-window-item value="solid">
          <v-color-picker v-model="badgeSolid" mode="hexa" hide-mode-switch show-swatches swatches-max-height="180" />
        </v-window-item>

        <v-window-item value="gradient">
          <div class="d-flex flex-column ga-3">
            <div class="d-flex ga-3 flex-wrap align-center">
              <div class="flex-1-1">
                <div class="text-caption mb-1">Угол</div>
                <v-slider v-model="badgeAngle" :min="0" :max="360" step="1" thumb-label />
              </div>
              <v-text-field v-model.number="badgeAngle" type="number" label="deg" style="max-width: 120px" />
            </div>

            <div class="d-flex ga-3 flex-wrap">
              <div class="flex-1-1">
                <div class="text-caption mb-1">Цвет 1</div>
                <v-color-picker v-model="badgeC1" mode="hexa" hide-mode-switch />
              </div>
              <div class="flex-1-1">
                <div class="text-caption mb-1">Цвет 2</div>
                <v-color-picker v-model="badgeC2" mode="hexa" hide-mode-switch />
              </div>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="badgeDialog=false">Отмена</v-btn>
      <v-btn color="primary" @click="saveBadge">Применить</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

<!-- Диалог: Баннер (Цвет/Градиент) -->
<v-dialog v-model="bannerDialog" width="460">
  <v-card>
    <v-card-title>Баннер</v-card-title>
    <v-card-text>
      <v-tabs v-model="bannerTab" grow>
        <v-tab value="solid">Цвет</v-tab>
        <v-tab value="gradient">Градиент</v-tab>
      </v-tabs>

      <v-window v-model="bannerTab" class="mt-3">
        <v-window-item value="solid">
          <v-color-picker v-model="bannerSolid" mode="hexa" hide-mode-switch show-swatches swatches-max-height="180" />
        </v-window-item>

        <v-window-item value="gradient">
          <div class="d-flex flex-column ga-3">
            <div class="d-flex ga-3 flex-wrap align-center">
              <div class="flex-1-1">
                <div class="text-caption mb-1">Угол</div>
                <v-slider v-model="bannerAngle" :min="0" :max="360" step="1" thumb-label />
              </div>
              <v-text-field v-model.number="bannerAngle" type="number" label="deg" style="max-width: 120px" />
            </div>

            <div class="d-flex ga-3 flex-wrap">
              <div class="flex-1-1">
                <div class="text-caption mb-1">Цвет 1</div>
                <v-color-picker v-model="bannerC1" mode="hexa" hide-mode-switch />
              </div>
              <div class="flex-1-1">
                <div class="text-caption mb-1">Цвет 2</div>
                <v-color-picker v-model="bannerC2" mode="hexa" hide-mode-switch />
              </div>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="bannerDialog=false">Отмена</v-btn>
      <v-btn color="primary" @click="saveBanner">Применить</v-btn>
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
import dfAvatar from '~/assets/profile/profile_exp.jpg'
import ActionsBar from '@/components/Settings/ActionsBar.vue'

const profiles = useProfilesStore()

const snackbar = ref({ show: false, text: '', color: 'success' })
const saving = ref(false)
const tab = ref<'main' | 'group-personal'>('main')
const formRef = ref()

const fileInput = ref<HTMLInputElement | null>(null)

const cropperRef = ref<any>(null)
const cropDialog = ref(false)
const selectedImage = ref<string | null>(null)
const cropResult = ref<{ coordinates: any | null; image: any | null }>({ coordinates: null, image: null })
const previewImage = ref<string>('')

const currentAvatarSrc = computed(() => previewImage.value || profiles.avatar || dfAvatar)

watch(
  () => profiles.avatar,
  (val) => {
    if (!previewImage.value && val) previewImage.value = val
    if (!val) previewImage.value = ''
  },
  { immediate: true }
)

function pickAvatar() { fileInput.value?.click() }
function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { selectedImage.value = ev.target?.result as string; cropDialog.value = true }
  reader.readAsDataURL(file)
}
function onCropChange({ coordinates, image }: any) { cropResult.value = { coordinates, image } }
function applyCroppedImage() {
  const result = cropperRef.value?.getResult()
  if (result?.canvas) {
    previewImage.value = result.canvas.toDataURL()
    profiles.updateMainProfile({ avatar: previewImage.value })
  }
  cropDialog.value = false
}
function removeAvatar() { profiles.updateMainProfile({ avatar: '' }); previewImage.value = '' }

//  Утилиты 
function isGradientLike(v?: string) { return !!v && v.toLowerCase().includes('gradient(') }
function isUrlLike(v?: string) { return !!v && /^(https?:|data:|blob:)/i.test(v) }
function buildGradient(angle: number, c1: string, c2: string) {
  const a = Math.max(0, Math.min(360, Math.round(angle || 0)))
    return 'linear-gradient(' + a + 'deg, ' + c1 + ' 0%, ' + c2 + ' 100%)'
}

// = Бейдж =
const badgeDialog = ref(false)
const badgeTab = ref<'solid' | 'gradient'>('solid')
const badgeSolid = ref<string>('#1976D2')
const badgeAngle = ref<number>(135)
const badgeC1 = ref<string>('#8ec5e5')
const badgeC2 = ref<string>('#4f9cf9')

function openBadgePicker() {
  const current = profiles.badge?.color || '#1976D2'
  if (isGradientLike(current)) {
    badgeTab.value = 'gradient'
    // грубая попытка вытащить цвета и угол
    const m = current.match(/linear-gradient(\d+)deg,\s*([']+),\s*([)])/i)
    if (m) {
      badgeAngle.value = parseInt(m[1], 10) || 135
      badgeC1.value = m[2].trim()
      badgeC2.value = m[3].trim()
    } else {
      badgeAngle.value = 135
      badgeC1.value = '#8ec5e5'
      badgeC2.value = '#4f9cf9'
    }
  } else {
    badgeTab.value = 'solid'
    badgeSolid.value = current
  }
  badgeDialog.value = true
}

function saveBadge() {
  const prev = profiles.badge
  const nextColor = badgeTab.value === 'solid' ? badgeSolid.value : buildGradient(badgeAngle.value, badgeC1.value, badgeC2.value)
  const nextBadge = {
    id: prev?.id || 'custom',
    name: prev?.name || 'Пользовательский бейдж',
    icon: prev?.icon,
    color: nextColor,
  }
  profiles.updateMainProfile({ badge: nextBadge })
  badgeDialog.value = false
}

function removeBadge() { profiles.updateMainProfile({ badge: null }) }

const badgeChipStyle = computed(() => {
  const bg = profiles.badge?.color || '#1976D2'
  const base: Record<string, string> = { borderRadius: '9999px', padding: '4px 10px' }
  if (isGradientLike(bg) || isUrlLike(bg)) return { ...base, background: bg, color: '#fff' }
  return { ...base, backgroundColor: bg, color: '#fff' }
})

// = Баннер =
const bannerDialog = ref(false)
const bannerTab = ref<'solid' | 'gradient'>('solid')
const bannerSolid = ref<string>('#37474F')
const bannerAngle = ref<number>(135)
const bannerC1 = ref<string>('#8ec5e5')
const bannerC2 = ref<string>('#4f9cf9')

function openBannerPicker() {
  const current = profiles.banner || profiles.bannerColor || '#37474F'
  if (isGradientLike(current)) {
    bannerTab.value = 'gradient'
    const m = current.match(/linear-gradient(\d+)deg,\s*([']+),\s*([)])/i)
    if (m) {
      bannerAngle.value = parseInt(m[1], 10) || 135
      bannerC1.value = m[2].trim()
      bannerC2.value = m[3].trim()
    } else {
      bannerAngle.value = 135
      bannerC1.value = '#8ec5e5'
      bannerC2.value = '#4f9cf9'
    }
  } else {
    bannerTab.value = 'solid'
    bannerSolid.value = current
  }
  bannerDialog.value = true
}

function saveBanner() {
  const value = bannerTab.value === 'solid' ? bannerSolid.value : buildGradient(bannerAngle.value, bannerC1.value, bannerC2.value)
  profiles.updateMainProfile({ banner: value, bannerColor: value })
  bannerDialog.value = false
}

function removeBanner() { profiles.updateMainProfile({ banner: '' }) }

const bannerPreviewStyle = computed(() => {
  const bg = profiles.banner || profiles.bannerColor || '#ECEFF1'
  const base: Record<string, string> = {
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '12px',
  }
  if (isGradientLike(bg) || isUrlLike(bg)) return { ...base, background: bg }
  return { ...base, backgroundColor: bg }
})

// = Сохранение/Сброс =
async function saveMain(values: any) {
  profiles.updateMainProfile({
    name: values.name,
    pronouns: values.pronouns,
    groupTag: values.groupTag,
    about: values.about,
    quote: values.quote,
  })
  saving.value = true
  const res = await profiles.saveAndReport()
  saving.value = false
  snackbar.value = { show: true, text: res.message, color: res.ok ? 'success' : 'error' }
  return res
}
function submitForm() {
  (formRef.value as any)?.node?.submit?.()
}
function resetForm() {
  const ok = profiles.resetFromStorage()
  snackbar.value = { show: true, text: ok ? 'Изменения сброшены' : 'Нет сохранённых данных', color: ok ? 'success' : 'warning' }
}
</script>
