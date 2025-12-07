<template>
  <div class="settings-profile-user d-flex">
    <SettingsPanel class="mr-4" @navigate="onNavigate" />
    <div class="settings-main">
      <div class="settings-main-content">
        <ClientOnly>
          <component :is="currentComponent" :key="currentKey" />
          <template #placeholder>
            <div class="skeleton">Загрузка…</div>
          </template>
        </ClientOnly>
      </div>
      <ActionsBar
        v-model="dirty"
        :saving="saving"
        @save="onSaveClick"
        @reset="onResetClick"
      />
    </div>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  h,
  defineAsyncComponent,
  provide,
} from "vue";
import SettingsPanel from "~/components/Settings/SettingsPanel.vue";
import ActionsBar from "~/components/Settings/ActionsBar.vue";
type GroupKey = "app" | "user";
type SectionKey =
  | "notifications"
  | "language"
  | "appearance"
  | "accessibility"
  | "chat"
  | "hotkeys"
  | "streamer"
  | "av"
  | "account"
  | "communication"
  | "devices"
  | "integration"
  | "privacy"
  | "emoji"
  | "stickers"
  | "alerts"
  | "profiles"
  | "privacyAC"
  | "overlay"
  | "SetAC"
  | "soundboard";
export default defineComponent({
  name: "SettingsProfileUser",
  components: { SettingsPanel, ActionsBar },
  setup() {
    const group = ref<GroupKey>("app");
    const section = ref<SectionKey>("notifications");
    const Loading = {
      name: "SettingsAsyncLoading",
      render() {
        return h("div", { class: "skeleton" }, "Загрузка…");
      },
    };
    const ErrorComp = {
      name: "SettingsAsyncError",
      render() {
        return h(
          "div",
          { class: "text-danger" },
          "Не удалось загрузить секцию"
        );
      },
    };
    function makeAsync(loader: () => Promise<any>) {
      return defineAsyncComponent({
        loader,
        suspensible: false,
        loadingComponent: Loading,
        errorComponent: ErrorComp,
        delay: 150,
        timeout: 30000,
        onError(_error, retry, fail, attempts) {
          if (attempts <= 2) retry();
          else fail();
        },
      });
    }
    const map: Record<string, any> = {
      "app:notifications": makeAsync(
        () => import("~/components/Settings/App/AppNotifications.vue")
      ),
      "app:language": makeAsync(
        () => import("~/components/Settings/App/AppLanguage.vue")
      ),
      "app:appearance": makeAsync(
        () => import("~/components/Settings/App/AppAppearance.vue")
      ),
      "app:accessibility": makeAsync(
        () => import("~/components/Settings/App/AppAccessibility.vue")
      ),
      "app:chat": makeAsync(
        () => import("~/components/Settings/App/AppChat.vue")
      ),
      "app:hotkeys": makeAsync(
        () => import("~/components/Settings/App/AppHotkeys.vue")
      ),
      "app:streamer": makeAsync(
        () => import("~/components/Settings/App/AppStreamer.vue")
      ),
      "app:av": makeAsync(() => import("~/components/Settings/App/AppAV.vue")),
      "user:account": makeAsync(
        () => import("~/components/Settings/User/UserAccount.vue")
      ),
      "user:communication": makeAsync(
        () => import("~/components/Settings/User/UserCommunication.vue")
      ),
      "user:devices": makeAsync(
        () => import("~/components/Settings/User/UserDevices.vue")
      ),
      "user:integration": makeAsync(
        () => import("~/components/Settings/User/UserIntegrations.vue")
      ),
      "user:privacy": makeAsync(
        () => import("~/components/Settings/User/UserPrivacy.vue")
      ),
      "user:profiles": makeAsync(
        () => import("~/components/Settings/User/UserProfiles.vue")
      ),
      "user:alerts": makeAsync(
        () => import("~/components/Settings/User/UserAlerts.vue")
      ),
      "user:emoji": makeAsync(
        () => import("~/components/Settings/User/ReactionsEmojis.vue")
      ),
      "user:stickers": makeAsync(
        () => import("~/components/Settings/User/ReactionsStickers.vue")
      ),
      "user:soundboard": makeAsync(
        () => import("~/components/Settings/User/UserSoundboard.vue")
      ),
      "activity:privacyAC": makeAsync(
        () => import("~/components/Settings/Activity/ActivityPrivacy.vue")
      ),
      "activity:overlay": makeAsync(
        () => import("~/components/Settings/Activity/ActivityOverlay.vue")
      ),
      "activity:SetAC": makeAsync(
        () => import("~/components/Settings/Activity/ActivityApps.vue")
      ),
    };
    const currentKey = computed(() => `${group.value}:${section.value}`);
    const currentComponent = computed(
      () =>
        map[currentKey.value] ?? {
          render: () => h("div", "Секция не найдена"),
        }
    );
    function onNavigate(payload: { group: GroupKey; section: SectionKey }) {
      group.value = payload.group;
      section.value = payload.section;
    }
    if (!map[currentKey.value]) {
      group.value = "app";
      section.value = "notifications";
    }
    const saving = ref(false);
    const dirty = ref(false);
    const onSaveHandler = ref<null | (() => Promise<void> | void)>(null);
    const onResetHandler = ref<null | (() => void)>(null);
    function onSaveClick() {
      if (onSaveHandler.value) {
        const r = onSaveHandler.value();
        if (r && typeof (r as any).then === "function") {
          saving.value = true;
          (r as Promise<void>).finally(() => {
            saving.value = false;
            dirty.value = false;
          });
        } else {
          dirty.value = false;
        }
      } else {
        dirty.value = false;
      }
    }
    function onResetClick() {
      onResetHandler.value?.();
      dirty.value = false;
    }
    provide("settingsActions", {
      saving,
      setHandlers(h: {
        onSave?: () => Promise<void> | void;
        onReset?: () => void;
      }) {
        onSaveHandler.value = h.onSave || null;
        onResetHandler.value = h.onReset || null;
      },
      clearHandlers() {
        onSaveHandler.value = null;
        onResetHandler.value = null;
      },
      markDirty() {
        dirty.value = true;
      },
      clearDirty() {
        dirty.value = false;
      },
    });
    return {
      onNavigate,
      currentComponent,
      currentKey,
      dirty,
      saving,
      onSaveClick,
      onResetClick,
    };
  },
});
</script>
<style scoped>
.settings-profile-user {
  gap: 16px;
  height: 100vh;
  overflow: hidden;
}
.settings-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
.settings-main-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
</style>
