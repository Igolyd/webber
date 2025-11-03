// plugins/theme-cssvars.client.ts
import { watch } from "vue";
import {
  systemVars,
  lightAlias,
  darkAlias,
  type SystemTheme,
} from "../../theme/presets";
import { useAppearanceStore } from "~/stores/app/appearance";
import { useCustomThemeStore } from "~/stores/app/themeCustom";

function applyCssVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export default defineNuxtPlugin(() => {
  const appearance = useAppearanceStore();
  const custom = useCustomThemeStore();

  const apply = () => {
    const raw = appearance.theme.value as string;
    const effective: SystemTheme | "custom" =
      raw == "light"
        ? lightAlias
        : raw == "dark"
        ? darkAlias
        : (
            [
              "classic",
              "sakura",
              "ocean",
              "clouds",
              "lime",
              "hacker",
              "white",
              "void",
              "custom",
            ] as const
          ).includes(raw as any)
        ? (raw as any)
        : "classic";

    if (effective === "custom") applyCssVars(custom.cssVars.value);
    else applyCssVars(systemVars[effective]);
  };

  watch(() => appearance.theme.value, apply, { immediate: true });
  watch(custom.cssVars, () => {
    if (appearance.normalizedTheme.value === "custom")
      applyCssVars(custom.cssVars.value);
  });
});
