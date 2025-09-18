<!-- components/GroupsSettings/PeopleRoles.vue -->
<template>
  <div class="pa-4">
    <h2 class="text-h6 mb-2">Роли</h2>
    <p class="text-medium-emphasis mb-4">Управляйте ролями и правами в вашей группе.</p>

    <div v-if="!activeGroupId" class="text-medium-emphasis">
      Сначала выберите активную группу.
    </div>

    <template v-else>
      <v-row class="align-center mb-4" dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="q"
            variant="outlined"
            density="comfortable"
            label="Поиск ролей"
            prepend-inner-icon="mdi-magnify"
            clearable
          />
        </v-col>
        <v-col cols="12" md="6" class="d-flex justify-end">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="onCreateRole">
            Создание ролей
          </v-btn>
        </v-col>
      </v-row>

      <!-- Права по умолчанию (everyone) -->
      <v-card class="mb-6" variant="outlined">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="28" class="mr-3" color="grey-darken-1">
              <v-icon size="18">mdi-account-group</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1">Права по умолчанию</div>
              <div class="text-caption text-medium-emphasis">
                Применяются ко всем участникам (роль everyone)
              </div>
            </div>
          </div>
          <div>
            <v-chip
              size="small"
              variant="flat"
              :color="everyoneRole?.color || 'grey'"
              class="mr-3"
            >
              {{ everyoneRole?.name || 'everyone' }}
            </v-chip>
            <v-btn variant="tonal" color="primary" @click="editRole(everyoneRole?.id)">
              Изменить
            </v-btn>
          </div>
        </v-card-title>
      </v-card>

      <!-- Список ролей -->
      <v-card variant="outlined">
        <v-card-title class="py-3">
          <div class="text-subtitle-1">Список ролей</div>
        </v-card-title>
        <v-divider />
        <v-list lines="two" density="comfortable">
          <template v-if="filteredRoles.length">
            <v-list-item
              v-for="role in filteredRoles"
              :key="role.id"
              @click="editRole(role.id)"
              class="role-item"
            >
              <template #prepend>
                <v-avatar size="28" :color="role.color" class="mr-3">
                  <v-img v-if="role.icon" :src="role.icon" cover />
                  <span v-else class="text-white text-caption">R</span>
                </v-avatar>
              </template>
              <v-list-item-title>{{ role.name }}</v-list-item-title>
              <v-list-item-subtitle>
                Пользователи: {{ role.assignedUserIds.length }}
              </v-list-item-subtitle>
              <template #append>
                <v-btn icon variant="text" @click.stop="editRole(role.id)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </template>
          <template v-else>
            <div class="pa-6 text-medium-emphasis">Ролей не найдено.</div>
          </template>
        </v-list>
      </v-card>

      <!-- Менеджер ролей (не заменяет левую глобальную навигацию) -->
      <ManagementRoles
        v-if="manager.open"
        :group-id="activeGroupId"
        :role-id="manager.roleId"
        @close="manager.open = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useGroupsStore } from '~/stores/groups'
import { useRolesStore } from '~/stores/roles'
import ManagementRoles from './ManagementRoles.vue'

const groups = useGroupsStore()
const rolesStore = useRolesStore()

const activeGroupId = computed(() => groups.activeGroupId)

onMounted(() => {
  if (activeGroupId.value) rolesStore.ensureBaseRolesForGroup(activeGroupId.value)
})

watch(activeGroupId, (gid) => {
  if (gid) rolesStore.ensureBaseRolesForGroup(gid)
})

const q = ref('')

const roles = computed(() =>
  activeGroupId.value ? rolesStore.getRolesByGroup(activeGroupId.value) : []
)

const everyoneRole = computed(() =>
  activeGroupId.value ? rolesStore.getEveryoneRole(activeGroupId.value) : null
)

const filteredRoles = computed(() => {
  const query = q.value.trim().toLowerCase()
  let list = roles.value
  // исключим everyone из общего списка, чтобы не дублировался — он редактируется через карточку "Права по умолчанию"
  list = list.filter(r => !r.isEveryone)
  if (!query) return list
  return list.filter(r => r.name.toLowerCase().includes(query))
})

// Менеджер ролей (мод встроенной панели)
const manager = ref<{ open: boolean; roleId: string | null }>({
  open: false,
  roleId: null,
})

function onCreateRole() {
  manager.value = { open: true, roleId: null }
}

function editRole(id?: string | null) {
  manager.value = { open: true, roleId: id ?? null }
}
</script>

<style scoped>
.role-item {
  cursor: pointer;
}
</style>