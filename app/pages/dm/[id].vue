<template>
  <v-container fluid class="h-100 d-flex pa-0">
    <!-- Левый Drawer -->
    <AppLeftDrawer
      v-model="leftDrawer"
      :width="360"
    />

    <!-- Центр: чат -->
    <div class="content-area">
      <!-- Хедер -->
      <header class="content-header">
        <v-btn v-if="isSmAndDown" icon variant="text" @click="leftDrawer = true" :title="'Меню'">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <h2 class="text-subtitle-1">{{ peer?.name || 'Диалог' }}</h2>
        <div class="spacer"></div>
        <v-btn icon variant="text" :title="'Профиль'" @click="rightDrawer = true">
          <v-icon>mdi-account</v-icon>
        </v-btn>
      </header>

      <!-- Секция сообщений (растягивается на все) -->
      <v-sheet class="content-scroll d-flex flex-column">
        <v-card flat class="list-card pa-2 d-flex flex-column flex-1-1-auto">
          <div ref="scrollArea" class="flex-1-1-auto overflow-auto pr-1">
            <v-list lines="one">
              <template v-for="m in convo" :key="m.id">
                <v-list-item
                  :class="m.senderId === meId ? 'justify-end' : 'justify-start'"
                  @contextmenu.prevent="openContextMenu($event, m)"
                >
                  <template #prepend v-if="m.senderId !== meId">
                    <v-avatar size="28" class="mr-2">
                      <v-img :src="peer?.avatar || '/avatars/default.jpg'" />
                    </v-avatar>
                  </template>

                  <v-sheet
                    :color="m.senderId === meId ? 'primary' : 'grey-darken-3'"
                    class="pa-2 rounded-lg text-body-2 message-bubble"
                    max-width="70%"
                  >
                    <!-- Контент сообщения -->
                    <div v-if="m.type === 'text'">
                      <div class="pre-wrap">{{ m.content }}</div>
                    </div>

                    <div v-else-if="m.type === 'file'">
                      <div class="mb-2">
                        <!-- Превью для изображений -->
                        <v-img
                          v-if="m.attachment?.type?.startsWith('image/')"
                          :src="m.attachment?.dataUrl"
                          :alt="m.attachment?.name"
                          max-width="320"
                          class="rounded"
                          @click="openLightbox(m)"
                        />
                        <!-- Видео -->
                        <video
                          v-else-if="m.attachment?.type?.startsWith('video/')"
                          :src="m.attachment?.dataUrl"
                          controls
                          style="max-width: 420px; max-height: 280px; border-radius: 8px;"
                        />
                        <!-- Файлы остальных типов -->
                        <div v-else class="d-flex align-center">
                          <v-icon class="mr-2">mdi-file-outline</v-icon>
                          <span>{{ m.attachment?.name }} ({{ formatSize(m.attachment?.size || 0) }})</span>
                        </div>
                      </div>
                      <div v-if="m.content" class="pre-wrap">{{ m.content }}</div>
                    </div>

                    <div class="text-caption text-medium-emphasis mt-1 d-flex align-center justify-end gap-2">
                      <span>{{ new Date(m.createdAt).toLocaleTimeString() }}</span>
                    </div>
                  </v-sheet>

                  <template #append v-if="m.senderId === meId">
                    <v-avatar size="28" class="ml-2">
                      <v-img :src="me?.avatar || '/avatars/default.jpg'" />
                    </v-avatar>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </div>
        </v-card>
      </v-sheet>
    </div>

    <!-- Правая панель: профиль друга -->
    <v-navigation-drawer
      v-model="rightDrawer"
      :permanent="!isSmAndDown"
      :temporary="isSmAndDown"
      width="320"
      location="right"
      app
    >
      <div v-if="peer" class="pa-4">
        <v-avatar size="96" class="mb-3">
          <v-img :src="peer.avatar || '/avatars/default.jpg'" />
        </v-avatar>
        <div class="text-h6">{{ peer.name }}</div>
        <div class="text-caption mb-2">@{{ peer.uniqueName }}</div>
        <div class="text-body-2 mb-2">{{ peer.about }}</div>
        <v-chip v-if="peer.badge" :color="peer.badge.color" size="small" class="mr-1">
          {{ peer.badge.label }}
        </v-chip>
        <div class="text-caption mt-2">Группа: {{ peer.groupTag || '—' }}</div>
        <v-divider class="my-3" />
        <div class="text-caption text-medium-emphasis">Цитата:</div>
        <div class="text-body-2">“{{ peer.quote || '—' }}”</div>

        <v-divider class="my-3" />
        <v-btn color="error" variant="tonal" @click="askRemoveFriend(peer.id)">Удалить из друзей</v-btn>
      </div>
    </v-navigation-drawer>

    <!-- Диалог подтверждения удаления из друзей -->
    <v-dialog v-model="confirmRemoveDialog" max-width="420">
      <v-card>
        <v-card-title>Удалить из друзей?</v-card-title>
        <v-card-text>Вы уверены, что хотите удалить этого пользователя из списка друзей?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmRemoveDialog = false">Отмена</v-btn>
          <v-btn color="error" @click="confirmRemoveConfirm">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог предпросмотра вложения -->
    <v-dialog v-model="attachDialog.open" max-width="720">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-paperclip</v-icon>
          Предпросмотр вложения
          <v-spacer />
          <v-btn icon variant="text" @click="closeAttachDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div v-if="attachDialog.previewUrl" class="mb-3 d-flex justify-center">
            <v-img
              v-if="attachDialog.file?.type?.startsWith('image/')"
              :src="attachDialog.previewUrl"
              :alt="attachDialog.file?.name"
              max-width="560"
              class="rounded"
            />
            <video
              v-else-if="attachDialog.file?.type?.startsWith('video/')"
              :src="attachDialog.previewUrl"
              controls
              style="max-width: 640px; max-height: 360px; border-radius: 8px;"
            />
            <div v-else class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-outline</v-icon>
              <span>{{ attachDialog.file?.name }} ({{ formatSize(attachDialog.file?.size || 0) }})</span>
            </div>
          </div>

          <v-textarea
            v-model="attachDialog.comment"
            label="Комментарий к файлу (необязательно)"
            auto-grow
            rows="2"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeAttachDialog">Отмена</v-btn>
          <v-btn color="primary" @click="confirmSendAttachment">Отправить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Контекстное меню по правому клику -->
    <div ref="ctxActivator" class="ctx-activator"></div>
    <v-menu
      v-model="contextMenu.open"
      :activator="ctxActivator"
      :close-on-content-click="true"
      location="bottom left"
      transition="fade-transition"
    >
      <v-list density="compact">
        <v-list-item
          v-if="contextMenu.message?.type === 'file'"
          @click="downloadAttachment(contextMenu.message!)"
        >
          <template #prepend><v-icon>mdi-download</v-icon></template>
          <v-list-item-title>Скачать</v-list-item-title>
        </v-list-item>
        <v-list-item @click="deleteMessage(contextMenu.message!)">
          <template #prepend><v-icon color="error">mdi-delete-outline</v-icon></template>
          <v-list-item-title class="text-error">Удалить</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- ВАЖНО: панель ввода как нижний drawer -->
    <InputMulti
      v-model="draft"
      @send="send"
      @attach="onAttach"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useUsersStore } from '@/stores/users'
import { useUserAccountStore } from '@/stores/user/account'
import { useMessagesStore, type DirectMessage } from '@/stores/messages'
import AppLeftDrawer from '@/components/navigation/AppLeftDrawer.vue'
import InputMulti from '@/components/InputMulti.vue'

const route = useRoute()
const router = useRouter()
const { smAndDown } = useDisplay()
const isSmAndDown = computed(() => smAndDown.value)

const users = useUsersStore()
const account = useUserAccountStore()
const messagesStore = useMessagesStore()
users.ensureSeed()

const leftDrawer = ref(true)
const rightDrawer = ref(!isSmAndDown.value)

const meId = computed(() => account.userId || '')
const me = computed(() => (meId.value ? users.getById(meId.value) : null))
const peerId = computed(() => String(route.params.id || ''))
const peer = computed(() => users.getById(peerId.value))

const convo = computed(() => messagesStore.getConversation(meId.value, peerId.value))
const draft = ref('')

watch(peerId, (id) => {
  if (!users.getById(id)) {
    router.replace('/')
  }
})

// Автопрокрутка вниз при новых сообщениях
const scrollArea = ref<HTMLElement | null>(null)
watch(convo, async () => {
  await nextTick()
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }
}, { deep: true })

const send = () => {
  if (!meId.value || !peerId.value || !draft.value.trim()) return
  messagesStore.sendMessage(meId.value, peerId.value, draft.value.trim())
  draft.value = ''
}

// Диалог прикрепления
const attachDialog = ref<{
  open: boolean
  file: File | null
  previewUrl: string | null
  comment: string
  dataUrl?: string | null
}>({
  open: false,
  file: null,
  previewUrl: null,
  comment: '',
  dataUrl: null,
})

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function onAttach(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    // Можно заменить на ваш глобальный toast/snackbar
    alert('Файл превышает 50 МБ')
    return
  }
  // Подготовим превью (dataURL)
  const reader = new FileReader()
  reader.onload = () => {
    attachDialog.value.previewUrl = String(reader.result)
    attachDialog.value.dataUrl = String(reader.result)
    attachDialog.value.open = true
  }
  reader.onerror = () => {
    alert('Не удалось прочитать файл')
  }
  attachDialog.value.file = file
  attachDialog.value.comment = ''
  reader.readAsDataURL(file)
}

function closeAttachDialog() {
  attachDialog.value.open = false
  attachDialog.value.file = null
  attachDialog.value.previewUrl = null
  attachDialog.value.dataUrl = null
  attachDialog.value.comment = ''
}

function confirmSendAttachment() {
  if (!meId.value || !peerId.value || !attachDialog.value.file || !attachDialog.value.dataUrl) return
  const file = attachDialog.value.file
  const dataUrl = attachDialog.value.dataUrl
  const attachment = {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    dataUrl,
  }
  // ВОТ ТАК: используем штатный метод стора
  messagesStore.sendAttachment(
    meId.value,
    peerId.value,
    attachment,
    attachDialog.value.comment.trim()
  )
  closeAttachDialog()
}

// Контекстное меню
const contextMenu = ref<{ open: boolean; x: number; y: number; message: DirectMessage | null }>({
  open: false,
  x: 0,
  y: 0,
  message: null,
})
const ctxActivator = ref<HTMLElement | null>(null)

function openContextMenu(e: MouseEvent, m: DirectMessage) {
  contextMenu.value.message = m
  contextMenu.value.x = e.clientX
  contextMenu.value.y = e.clientY
  if (ctxActivator.value) {
    ctxActivator.value.style.position = 'fixed'
    ctxActivator.value.style.left = `${contextMenu.value.x}px`
    ctxActivator.value.style.top = `${contextMenu.value.y}px`
    ctxActivator.value.style.width = '1px'
    ctxActivator.value.style.height = '1px'
  }
  contextMenu.value.open = true
}

function deleteMessage(m: DirectMessage) {
  messagesStore.deleteMessage(m.id)
  contextMenu.value.open = false
}

function downloadAttachment(m: DirectMessage) {
  if (!m.attachment?.dataUrl) return
  const a = document.createElement('a')
  a.href = m.attachment.dataUrl
  a.download = m.attachment.name || 'file'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  contextMenu.value.open = false
}

function openLightbox(m: DirectMessage) {
  if (m.attachment?.dataUrl) {
    window.open(m.attachment.dataUrl, '_blank')
  }
}

// локальное удаление из друзей (правый профиль)
const confirmRemoveDialog = ref(false)
const removeId = ref<string | null>(null)
const askRemoveFriend = (id: string) => {
  removeId.value = id
  confirmRemoveDialog.value = true
}
const confirmRemoveConfirm = () => {
  if (removeId.value && meId.value) {
    users.removeFriend(meId.value, removeId.value, true)
    if (peerId.value === removeId.value) {
      router.replace('/')
    }
  }
  confirmRemoveDialog.value = false
  removeId.value = null
}

// utils
function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}
</script>

<style scoped>
.h-100 { height: 100%; }

/* Центр + скролл */
.content-area { flex: 1 1 auto; display: flex; flex-direction: column; background: #1f1f1f; }
.content-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #2c2c2c; }
.content-header .spacer { flex: 1; }
.content-scroll { flex: 1 1 auto; overflow: hidden; padding: 8px; }
.list-card { background: #292929; /* без fixed-height, растягивается через flex */ overflow: hidden; }
.list-card > .flex-1-1-auto.overflow-auto { min-height: 0; } /* важно, чтобы overflow работал в flex-контейнере */

.justify-end { justify-content: flex-end; }
.justify-start { justify-content: flex-start; }
.message-bubble .pre-wrap { white-space: pre-wrap; word-break: break-word; }
.rounded { border-radius: 8px; }
.ctx-activator { position: fixed; width: 1px; height: 1px; pointer-events: none; }
.gap-2 { gap: 8px; }
</style>