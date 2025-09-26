<template>
  <v-container>
    <v-card>
      <v-card-title>Внешний вид группы</v-card-title>
      <v-card-text>
        <div v-if="ready">
          <FormKit type="group">
            <div class="d-flex flex-wrap ga-4">
              <div class="w-100 text-overline text-medium-emphasis">Текст</div>
              <FormKit type="color" label="Цвет текста" v-model="draft.textColor" />

              <div class="w-100 text-overline text-medium-emphasis mt-2">Фон</div>
              <FormKit type="select" label="Тип фона" v-model="draft.bgKind"
                :options="[{label:'Цвет',value:'color'},{label:'Градиент',value:'gradient'},{label:'Картинка',value:'image'}]" />
              <FormKit v-if="draft.bgKind === 'color'" type="color" label="Цвет фона" v-model="draft.bgColor" />
              <FormKit v-if="draft.bgKind === 'gradient'" type="text" label="CSS градиент" v-model="draft.bgGradient" />
              <div v-if="draft.bgKind === 'image'" class="w-100">
                <FormKit type="file" label="Картинка фона" accept="image/*" @change="onPickImage" />
                <div class="d-flex ga-2 mt-2">
                  <FormKit type="select" label="Size" v-model="draft.bgSize" :options="['cover','contain','auto','100% 100%']" />
                  <FormKit type="select" label="Repeat" v-model="draft.bgRepeat" :options="['no-repeat','repeat','repeat-x','repeat-y']" />
                  <FormKit type="text" label="Position" v-model="draft.bgPosition" />
                </div>
              </div>

              <div class="w-100 text-overline text-medium-emphasis mt-2">Overlay</div>
              <FormKit type="color" label="Цвет оверлея" v-model="draft.overlayColor" />
              <FormKit type="range" min="0" max="0.8" step="0.05" label="Прозрачность оверлея" v-model="draft.overlayOpacity" />

              <div class="w-100 text-overline text-medium-emphasis mt-2">Поверхности</div>
              <FormKit type="color" label="Фон карточек" v-model="draft.cardBg" />
              <FormKit type="color" label="Цвет бордеров" v-model="draft.borderColor" />

              <div class="w-100 text-overline text-medium-emphasis mt-2">Hover</div>
              <FormKit type="color" label="Цвет при наведении" v-model="draft.hoverColor" />

              <div class="w-100 text-overline text-medium-emphasis mt-2">Системные кнопки</div>
              <FormKit type="color" label="Primary" v-model="draft.primaryColor" />
              <FormKit type="color" label="Surface-variant" v-model="draft.surfaceVariantColor" />
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
import { onMounted, ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupThemesStore, type GroupThemeSnapshot } from '~/stores/groupThemes'
import { useThemeOverrideStore } from '~/stores/app/themeOverride'
import { useAppearanceStore } from '~/stores/app/appearance'

const route = useRoute()
const gid = computed(() => String(route.params.id || ''))
const ready = ref(false)

const groupsThemes = useGroupThemesStore()
const override = useThemeOverrideStore()
const appearance = useAppearanceStore()

const draft = reactive<GroupThemeSnapshot>({})

onMounted(() => {
  // загрузка сохранённого в черновик
  Object.assign(draft, groupsThemes.get(gid.value) ?? {})
  ready.value = true
})

// грязность
const dirty = computed(() => {
  const saved = groupsThemes.get(gid.value) ?? {}
  return JSON.stringify(draft) !== JSON.stringify(saved)
})

// При редактировании в этом экране — сразу показываем превью через override (не сохраняем)
watch(draft, () => {
  if (!gid.value) return
  // превью работает только если пользователь НЕ отключил групповые темы
  if (!appearance.preferPersonalThemeInGroups) {
    override.set({ ...draft })
  }
}, { deep: true })

function saveAll() {
  if (!gid.value) return
  groupsThemes.set(gid.value, { ...draft })
}

function resetAll() {
  Object.assign(draft, groupsThemes.get(gid.value) ?? {})
  // обновим превью
  if (!appearance.preferPersonalThemeInGroups) {
    override.set({ ...draft })
  }
}

async function onPickImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return
  const url = await toDataUrl(file)
  draft.bgImage = url
}
function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
  box-shadow: 0 6px 24px rgba(0,0,0,.35);
}
</style>