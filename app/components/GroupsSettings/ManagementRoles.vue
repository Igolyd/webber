<!-- components/GroupsSettings/ManagementRoles.vue -->
<template>
  <div class="management-roles d-flex mt-6">
    <!-- Левый локальный сайдбар со списком ролей -->
    <aside class="mr-4 local-sidebar" style="width: 280px; min-width: 240px;">
      <v-card variant="outlined">
        <v-card-title class="py-3 d-flex align-center justify-space-between">
          <span class="text-subtitle-1">Роли</span>
          <v-btn icon size="small" variant="text" @click="$emit('close')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-list density="comfortable" nav>
          <v-list-item
            v-for="r in roles"
            :key="r.id"
            :active="currentRoleId === r.id"
            @click="selectRole(r.id)"
          >
            <template #prepend>
              <v-avatar size="24" :color="r.color" class="mr-2">
                <v-img v-if="r.icon" :src="r.icon" cover />
                <span v-else class="text-white text-caption">R</span>
              </v-avatar>
            </template>
            <v-list-item-title>
              {{ r.isEveryone ? 'everyone (по умолчанию)' : r.name }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
        <v-divider />
        <div class="pa-3">
          <v-btn block color="primary" variant="tonal" @click="createNew">
            <v-icon start>mdi-plus</v-icon>
            Новая роль
          </v-btn>
        </div>
      </v-card>
    </aside>

    <!-- Контент -->
    <section class="flex-grow-1">
      <v-card variant="outlined">
        <v-card-title class="py-3">
          <div class="d-flex align-center">
            <v-tabs v-model="tab" density="comfortable" color="primary">
              <v-tab value="display">Элементы отображения</v-tab>
              <v-tab value="permissions">Права доступа</v-tab>
            </v-tabs>
          </div>
        </v-card-title>
        <v-divider />

        <v-card-text>
          <v-window v-model="tab">
            <!-- Элементы отображения -->
            <v-window-item value="display">
              <div class="mb-6">
                <FormKit
                  type="form"
                  :actions="false"
                  @submit="saveDisplay"
                >
                  <div class="d-flex flex-column flex-sm-row">
                    <div class="mr-sm-6 mb-4">
                      <div class="text-subtitle-2 mb-2">Значок роли</div>
                      <div class="d-flex align-center">
                        <v-avatar size="64" :color="form.color" class="mr-3">
                          <v-img v-if="iconPreview" :src="iconPreview" cover />
                          <span v-else class="text-white text-h6">R</span>
                        </v-avatar>
                        <div>
                          <v-file-input
                            accept="image/*"
                            prepend-icon="mdi-image"
                            variant="outlined"
                            density="comfortable"
                            label="Загрузить значок"
                            :model-value="null"
                            @update:modelValue="onIconSelected"
                          />
                          <div v-if="form.icon" class="mt-1">
                            <v-btn size="small" variant="text" color="error" @click="removeIcon">
                              Удалить значок
                            </v-btn>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="flex-grow-1">
                      <FormKit
                        type="text"
                        name="name"
                        label="Название роли"
                        validation="required|length:2,64"
                        v-model="form.name"
                        :disabled="isEveryone"
                      />
                      <div class="mt-4">
                        <div class="text-subtitle-2 mb-2">Цвет роли</div>
                        <div class="d-flex flex-wrap gap-2">
                          <v-chip
                            v-for="c in palette"
                            :key="c"
                            :color="c"
                            :variant="form.color === c ? 'elevated' : 'flat'"
                            class="ma-1"
                            @click="form.color = c"
                          >
                            &nbsp;&nbsp;
                          </v-chip>
                          <div class="ml-2 d-flex align-center">
                            <v-text-field
                              v-model="form.color"
                              label="HEX"
                              density="comfortable"
                              variant="outlined"
                              class="ml-2"
                              style="max-width: 140px;"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 d-flex justify-end">
                    <v-btn color="primary" @click="saveDisplay">
                      Сохранить
                    </v-btn>
                  </div>
                </FormKit>
              </div>
            </v-window-item>

            <!-- Права доступа -->
            <v-window-item value="permissions">
              <FormKit type="form" :actions="false" @submit="savePermissions">
                <div v-for="group in descriptors" :key="group.groupTitle" class="mb-6">
                  <div class="text-subtitle-1 mb-2">{{ group.groupTitle }}</div>
                  <v-card variant="tonal" class="px-2 py-2">
                    <v-list lines="two" density="comfortable">
                      <v-list-item
                        v-for="item in group.items"
                        :key="item.key"
                      >
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                        <v-list-item-subtitle class="text-medium-emphasis">
                          {{ item.subtitle }}
                        </v-list-item-subtitle>
                        <template #append>
                          <v-switch
                            color="primary"
                            hide-details
                            inset
                            :model-value="form.permissions[item.key]"
                            @update:modelValue="v => (form.permissions[item.key] = v)"
                          />
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </div>

                <div class="mt-6 d-flex justify-end">
                  <v-btn color="primary" @click="savePermissions">
                    Сохранить
                  </v-btn>
                </div>
              </FormKit>
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-divider />
        <v-card-actions class="d-flex justify-space-between">
          <div class="text-medium-emphasis">
            <span v-if="isEveryone">Системная роль everyone</span>
            <span v-else>Пользователи: {{ currentRole?.assignedUserIds.length || 0 }}</span>
          </div>
          <div>
            <v-btn variant="text" class="mr-2" @click="$emit('close')">Закрыть</v-btn>
            <v-btn
              v-if="!isEveryone"
              variant="text"
              color="error"
              @click="removeRole"
            >
              Удалить роль
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRolesStore, type Role, permissionDescriptors, getDefaultPermissions } from '~/stores/roles'
import { useGroupsStore } from '~/stores/groups'
import { useObjectUrl } from '@vueuse/core'

// Props
const props = defineProps<{
  groupId: string
  roleId: string | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const rolesStore = useRolesStore()
const groups = useGroupsStore()

const descriptors = permissionDescriptors

// Таб
const tab = ref<'display' | 'permissions'>('display')

// Список ролей по группе
const roles = computed(() => rolesStore.getRolesByGroup(props.groupId))

// Текущая роль
const currentRoleId = ref<string | null>(props.roleId)
watch(() => props.roleId, val => (currentRoleId.value = val ?? null))

const currentRole = computed<Role | null>(() => {
  if (!currentRoleId.value) return null
  return rolesStore.getRoleById(currentRoleId.value)
})

const isEveryone = computed(() => currentRole.value?.isEveryone === true)

// Палитра цветов
const palette = [
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
  '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047',
  '#7CB342', '#C0CA33', '#FDD835', '#FFB300', '#FB8C00',
  '#F4511E', '#6D4C41', '#546E7A', '#9E9E9E', '#000000',
]

// Форма
const form = reactive({
  id: '' as string,
  name: '' as string,
  color: '#1976D2' as string,
  icon: '' as string,
  permissions: getDefaultPermissions(),
})

// Иконка (значок) — предпросмотр
const iconPreview = ref<string | null>(null)
watch(() => form.icon, (val) => {
  iconPreview.value = val || null
})

// Выбор роли из списка
function selectRole(roleId: string) {
  currentRoleId.value = roleId
  loadFromCurrent()
}

// Создать новую
function createNew() {
  currentRoleId.value = null
  resetFormForCreate()
  tab.value = 'display'
}

// Загрузка данных в форму
function loadFromCurrent() {
  const role = currentRole.value
  if (!role) return resetFormForCreate()
  form.id = role.id
  form.name = role.name
  form.color = role.color
  form.icon = role.icon || ''
  form.permissions = { ...role.permissions }
}

// Сброс формы для создания
function resetFormForCreate() {
  form.id = ''
  form.name = 'Новая роль'
  form.color = '#1976D2'
  form.icon = ''
  form.permissions = getDefaultPermissions()
}

// Сохранение (отображение)
function saveDisplay() {
  if (!props.groupId) return
  if (!form.name || form.name.trim().length < 2) return

  if (!currentRoleId.value) {
    const r = rolesStore.createRole(props.groupId, {
      name: form.name.trim(),
      color: form.color,
      icon: form.icon,
      permissions: form.permissions,
    })
    currentRoleId.value = r.id
  } else {
    rolesStore.updateRole(currentRoleId.value, {
      name: isEveryone.value ? currentRole.value?.name : form.name.trim(), // имя everyone не меняем
      color: form.color,
      icon: form.icon,
    })
  }
}

// Сохранение (права)
function savePermissions() {
  if (!currentRoleId.value) {
    // при создании новой сразу создадим и применим права
    saveDisplay()
  }
  if (currentRoleId.value) {
    rolesStore.updateRole(currentRoleId.value, {
      permissions: { ...form.permissions },
    })
  }
}

// Удаление роли
function removeRole() {
  if (!currentRoleId.value) return
  try {
    rolesStore.deleteRole(currentRoleId.value)
    // После удаления — выбрать либо everyone, либо очистить
    const ev = roles.value.find(r => r.isEveryone)
    currentRoleId.value = ev?.id || null
    loadFromCurrent()
  } catch (e) {
    // можно повесить snackbar
    console.warn(e)
  }
}

// Иконка загрузка/удаление
async function onIconSelected(files: File | File[] | null) {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) return
  const { url } = useObjectUrl(file)
  form.icon = url.value || ''
}
function removeIcon() {
  form.icon = ''
}

// Инициализация
onMounted(() => {
  rolesStore.ensureBaseRolesForGroup(props.groupId)
  if (currentRoleId.value) {
    loadFromCurrent()
  } else {
    // если пришли на создание, выберем everyone для контекста или оставим форму создания
    const ev = roles.value.find(r => r.isEveryone)
    if (ev) {
      currentRoleId.value = ev.id
      loadFromCurrent()
    } else {
      resetFormForCreate()
    }
  }
})
</script>

<style scoped>
.management-roles {
  gap: 16px;
}
.local-sidebar {
  position: sticky;
  top: 16px;
  align-self: flex-start;
}
@media (max-width: 960px) {
  .management-roles {
    flex-direction: column;
  }
  .local-sidebar {
    width: 100% !important;
    position: static;
  }
}
</style>