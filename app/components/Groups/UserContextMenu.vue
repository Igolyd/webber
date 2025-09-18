<template>
  <v-menu :value="menu" @update:modelValue="menu = $event" :position-x="x" :position-y="y" absolute>
    <v-list>
      <v-list-item v-if="canKick" @click="kickUser">
        <v-list-item-title>Выгнать из комнаты</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="canMove" @click="moveUser">
        <v-list-item-title>Переместить в другую комнату</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="canMute" @click="muteUser">
        <v-list-item-title>Отключить микрофон</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="canTimeout" @click="timeoutUser">
        <v-list-item-title>Отправить в тайм-аут</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="canBan" @click="banUser">
        <v-list-item-title>Забанить в группе</v-list-item-title>
      </v-list-item>
      <!-- Добавьте другие действия по необходимости -->
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRolesStore } from "~/stores/roles";
import { useUserAccountStore } from "~/stores/user/account";

const props = defineProps<{
  user: any;
}>();

const emit = defineEmits([
  "kick",
  "move",
  "mute",
  "timeout",
  "ban",
]);

const menu = ref(false);
const x = ref(0);
const y = ref(0);

const rolesStore = useRolesStore();
const account = useUserAccountStore();

// Предполагается, что текущий пользователь имеет доступ к ролям группы
const currentRole = computed(() => {
  if (!account.userId) return null;
  return rolesStore.getUserRolesInGroup(account.userId, props.user.groupId);
});

// Логика определения прав
const canKick = computed(() => {
  return currentRole.value?.includes("kickMembers") || false;
});

const canMove = computed(() => {
  return currentRole.value?.includes("moveMembers") || false;
});

const canMute = computed(() => {
  return currentRole.value?.includes("muteMembers") || false;
});

const canTimeout = computed(() => {
  return currentRole.value?.includes("timeoutMembers") || false;
});

const canBan = computed(() => {
  return currentRole.value?.includes("banMembers") || false;
});

function kickUser() {
  emit("kick", props.user.id);
  menu.value = false;
}

function moveUser() {
  emit("move", props.user.id);
  menu.value = false;
}

function muteUser() {
  emit("mute", props.user.id);
  menu.value = false;
}

function timeoutUser() {
  emit("timeout", props.user.id);
  menu.value = false;
}

function banUser() {
  emit("ban", props.user.id);
  menu.value = false;
}

watch(
  () => props.user,
  (newVal) => {
    if (newVal) {
      // Открыть меню при получении пользователя
      menu.value = true;
    }
  }
);
</script>

<style scoped>
/* Добавьте нужные стили для меню */
</style>