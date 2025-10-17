<template>
  <div class="banner-wrap" :style="{ height: bannerHeight + 'px' }">
    <div class="banner-box" :style="bannerBoxStyle"></div>
    <div class="banner-overlay" :style="overlayStyle"></div>

    <!-- Центрируем круглую аватарку, полностью внутри баннера -->
    <div class="avatar-holder" :style="{ bottom: avatarBottom + 'px' }">
      <v-avatar :size="size" class="avatar" :rounded="99999">
        <v-img :src="src || fallback" cover />
      </v-avatar>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
const props = defineProps<{
  src?: string
  fallback?: string
  banner?: string
  bannerColor?: string
  overlayColor?: string
  overlayOpacity?: number
  size?: number
  showStatus?: boolean
  status?: 'online' | 'idle' | 'dnd' | 'invisible'
  bannerHeightPx?: number
}>()

const size = computed(() => props.size ?? 96)
const bannerHeight = computed(() => props.bannerHeightPx ?? (size.value + 20))
const avatarBottom = 12

function isUrlLike(v: string) {
  return /^(https?:|data:|blob:)/i.test(v) || /.(png|jpe?g|gif|webp|svg)$/i.test(v)
}

const bannerBoxStyle = computed(() => {
  const raw = (props.banner || '').trim()
  if (raw && (raw.startsWith('url(') || isUrlLike(raw))) {
    const url = raw.startsWith('url(') ? raw : url("${raw}")
    return {
      backgroundImage: url,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    } as Record<string, string>
  }
  const base = raw || props.bannerColor || 'linear-gradient(180deg, #8ec5e5, #4f9cf9)'
  return { background: base } as Record<string, string>
})

const overlayStyle = computed(() => ({
  background: props.overlayColor ?? '#000',
  opacity: String(props.overlayOpacity ?? 0.25),
}))
</script>

<style scoped>
.banner-wrap { position: relative; width: 100%; overflow: hidden; }
.banner-box {
  position: absolute; inset: 0 auto auto 0; width: 100%; height: 100%;
  border-bottom-left-radius: 18px; border-bottom-right-radius: 18px;
  box-shadow: inset 0 4px 16px rgba(0,0,0,.18);
}
.banner-overlay {
  position: absolute; inset: 0 auto auto 0; width: 100%; height: 100%;
  border-bottom-left-radius: 18px; border-bottom-right-radius: 18px; pointer-events: none;
}
.avatar-holder { position: absolute; left: 50%; transform: translateX(-50%); }
.avatar { position: relative; z-index: 1; background: #111; box-shadow: 0 6px 20px rgba(0,0,0,.35); border: 3px solid rgba(0,0,0,.2); }
.status-dot {
  position: absolute; right: -2px; bottom: -2px; width: 16px; height: 16px;
  border: 3px solid #1f1f1f; border-radius: 50%; box-shadow: 0 0 0 2px rgba(0,0,0,.18);
  transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.st-online { background: #3fb950; } .st-idle { background: #f2c94c; } .st-dnd { background: #f44336; } .st-invisible { background: #9aa0a6; }
</style>
