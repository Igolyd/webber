<template>
  <v-card elevation="10" class="my-profile-full-container">
    <v-card-title class="pa-0">
      <div class="bg-block">
        <div class="bg-fill"></div>
        <v-avatar class="prof_img" size="96">
          <v-img :src="avatar || defaultAvatar" />
        </v-avatar>
      </div>
    </v-card-title>

    <v-card-text class="text-center pt-8">
      <h3 class="mb-1">{{ displayName || '—' }}</h3>
      <div class="text-medium-emphasis mb-4">#{{ username || 'user' }}</div>
      <div class="text-body-2 text-medium-emphasis">
        {{ about || 'Описание профиля' }}
      </div>
    </v-card-text>

    <v-card-actions class="justify-center ga-2 pb-4">
      <v-btn icon variant="tonal" color="primary" :density="btnDensity">
        <v-icon>mdi-thumb-up</v-icon>
      </v-btn>
      <v-btn icon variant="tonal" :density="btnDensity">
        <v-icon>mdi-share-variant</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'
import { useProfilesStore } from '~/stores/user/profiles'
import { useUserAccountStore } from '~/stores/user/account'
import dfAvatal from "../../assets/profile/profile_exp.jpg";

export default defineComponent({
  setup() {
    const display = useDisplay()
    const btnDensity = computed(() => (display.xs.value ? 'compact' : 'comfortable'))

    const profiles = useProfilesStore()
    const account = useUserAccountStore()

    const { name, avatar, about } = storeToRefs(profiles)
    const { username } = storeToRefs(account)

    const defaultAvatar = dfAvatal
    const displayName = name

    return {
      btnDensity,
      displayName,
      username,
      avatar,
      about,
      defaultAvatar,
    }
  },
})
</script>

<style scoped>
.bg-block {
  position: relative;
  width: 100%;
  height: 140px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  overflow: hidden;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.bg-fill {
  background: linear-gradient(180deg, #bddbeb, #8ec5e5);
  height: 100%;
  width: 100%;
}
.prof_img {
  position: absolute;
  bottom: -48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}
.my-profile-full-container {
  border-radius: 12px;
  max-height: 70vh;
  overflow: auto;
}
</style>