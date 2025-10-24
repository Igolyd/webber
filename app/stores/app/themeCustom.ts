// stores/app/themeCustom.ts
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { CssVars } from "../../../theme/presets";

export type BgKind = "color" | "gradient" | "image";

export interface CustomThemeSnapshot {
  textColor: string;
  bgKind: BgKind;
  bgColor: string;
  bgGradient: string;
  bgImage: string;
  bgSize: string;
  bgPosition: string;
  bgRepeat: string;
  overlayColor: string;
  overlayOpacity: number;
  cardBg: string;
  borderColor: string;
  // NEW
  hoverColor: string;
  primaryColor: string;
  surfaceVariantColor: string;
}

export const useCustomThemeStore = defineStore("customTheme", () => {
  // Основные настройки
  const textColor = ref<string>("#ffffff");
  const bgKind = ref<BgKind>("color");
  const bgColor = ref<string>("#1f1f1f");
  const bgGradient = ref<string>("linear-gradient(180deg, #1f1f1f, #0f0f0f)");
  const bgImage = ref<string>("");
  const bgSize = ref<string>("cover");
  const bgPosition = ref<string>("center center");
  const bgRepeat = ref<string>("no-repeat");
  const overlayColor = ref<string>("#000000");
  const overlayOpacity = ref<number>(0.25);
  const cardBg = ref<string>("#232323");
  const borderColor = ref<string>("#2c2c2c");

  // NEW
  const hoverColor = ref<string>("rgba(255,255,255,0.08)");
  const primaryColor = ref<string>("#4f9cf9");
  const surfaceVariantColor = ref<string>("#3a3a3a");
  // NEW fields (добавить рядом с existing)
  const onSurface = ref<string>("#E2DCF4");
  const onSurfaceVariant = ref<string>("#C4BCD9");
  const surface = ref<string>("#201833");
  const surface2 = ref<string>("#261C3D");
  const surface3 = ref<string>("#2C2147");
  const surfaceVariant = ref<string>("#37304F");
  const outline = ref<string>("#5A4E75");
  const outlineVariant = ref<string>("#3F3556");
  const divider = ref<string>("rgba(255,255,255,0.08)");
  const onPrimary = ref<string>("#1A132E");
  const secondaryColor = ref<string>("#C7B8FF");
  const onSecondary = ref<string>("#201833");
  const selectedColor = ref<string>("rgba(168,150,230,0.16)");
  const pressedColor = ref<string>("rgba(168,150,230,0.24)");
  const focusRing = ref<string>(
    "color-mix(in oklab, #A896E6 60%, transparent)"
  );

  // Buttons
  const btnPrimaryBg = ref<string>("#A896E6");
  const btnPrimaryColor = ref<string>("#1A132E");
  const btnTonalBg = ref<string>("#37304F");
  const btnTonalColor = ref<string>("#E2DCF4");
  const btnOutlineBorder = ref<string>("#5A4E75");
  const btnOutlineHover = ref<string>("rgba(168,150,230,0.10)");
  const persisted = useLocalStorage<CustomThemeSnapshot>(
    "app-theme-custom",
    getSnapshot()
  );

  function getSnapshot(): CustomThemeSnapshot {
    return {
      textColor: textColor.value,
      bgKind: bgKind.value,
      bgColor: bgColor.value,
      bgGradient: bgGradient.value,
      bgImage: bgImage.value,
      bgSize: bgSize.value,
      bgPosition: bgPosition.value,
      bgRepeat: bgRepeat.value,
      overlayColor: overlayColor.value,
      overlayOpacity: overlayOpacity.value,
      cardBg: cardBg.value,
      borderColor: borderColor.value,
      hoverColor: hoverColor.value,
      primaryColor: primaryColor.value,
      surfaceVariantColor: surfaceVariantColor.value,
    };
  }

  function load(snapshot?: Partial<CustomThemeSnapshot>) {
    const s = snapshot || persisted.value;
    if (!s) return;
    if (s.textColor !== undefined) textColor.value = s.textColor;
    if (s.bgKind !== undefined) bgKind.value = s.bgKind;
    if (s.bgColor !== undefined) bgColor.value = s.bgColor;
    if (s.bgGradient !== undefined) bgGradient.value = s.bgGradient;
    if (s.bgImage !== undefined) bgImage.value = s.bgImage;
    if (s.bgSize !== undefined) bgSize.value = s.bgSize;
    if (s.bgPosition !== undefined) bgPosition.value = s.bgPosition;
    if (s.bgRepeat !== undefined) bgRepeat.value = s.bgRepeat;
    if (s.overlayColor !== undefined) overlayColor.value = s.overlayColor;
    if (s.overlayOpacity !== undefined) overlayOpacity.value = s.overlayOpacity;
    if (s.cardBg !== undefined) cardBg.value = s.cardBg;
    if (s.borderColor !== undefined) borderColor.value = s.borderColor;
    if (s.hoverColor !== undefined) hoverColor.value = s.hoverColor;
    if (s.primaryColor !== undefined) primaryColor.value = s.primaryColor;
    if (s.surfaceVariantColor !== undefined)
      surfaceVariantColor.value = s.surfaceVariantColor;
  }

  if (import.meta.client) load();

  watch(
    [
      textColor,
      bgKind,
      bgColor,
      bgGradient,
      bgImage,
      bgSize,
      bgPosition,
      bgRepeat,
      overlayColor,
      overlayOpacity,
      cardBg,
      borderColor,
      hoverColor,
      primaryColor,
      surfaceVariantColor,
    ],
    () => {
      persisted.value = getSnapshot();
    },
    { deep: true }
  );

  const cssVars = computed<CssVars>(() => {
    const image =
      bgKind.value === "image" && bgImage.value
        ? bgImage.value.trim().startsWith("url(")
          ? bgImage.value.trim()
          : `url("${bgImage.value.trim()}")`
        : "none";
    const baseBgColor = bgKind.value === "color" ? bgColor.value : "#0000";

    return {
      "--app-text-color": textColor.value,
      "--app-bg-color": baseBgColor,
      "--app-card-bg": cardBg.value,
      "--app-border-color": borderColor.value,
      "--app-bg-image": bgKind.value === "gradient" ? bgGradient.value : image,
      "--app-bg-size": bgSize.value,
      "--app-bg-position": bgPosition.value,
      "--app-bg-repeat": bgRepeat.value,
      "--app-bg-overlay-color": overlayColor.value,
      "--app-bg-overlay-opacity": String(overlayOpacity.value),
      // NEW
      "--app-hover-color": hoverColor.value,
      "--app-surface": surface.value,
      "--app-surface-2": surface2.value,
      "--app-surface-3": surface3.value,
      "--app-surface-variant": surfaceVariant.value,
      "--app-on-surface": onSurface.value,
      "--app-on-surface-variant": onSurfaceVariant.value,
      "--app-outline": outline.value,
      "--app-outline-variant": outlineVariant.value,
      "--app-divider": divider.value,
      "--app-primary": primaryColor.value,
      "--app-on-primary": onPrimary.value,
      "--app-secondary": secondaryColor.value,
      "--app-on-secondary": onSecondary.value,
      "--app-selected-color": selectedColor.value,
      "--app-pressed-color": pressedColor.value,
      "--app-focus-ring": focusRing.value,

      "--btn-primary-bg": btnPrimaryBg.value,
      "--btn-primary-color": btnPrimaryColor.value,
      "--btn-tonal-bg": btnTonalBg.value,
      "--btn-tonal-color": btnTonalColor.value,
      "--btn-outline-border": btnOutlineBorder.value,
      "--btn-outline-hover": btnOutlineHover.value,
    };
  });

  return {
    // state
    textColor,
    bgKind,
    bgColor,
    bgGradient,
    bgImage,
    bgSize,
    bgPosition,
    bgRepeat,
    overlayColor,
    overlayOpacity,
    cardBg,
    borderColor,
    hoverColor,
    primaryColor,
    surfaceVariantColor,
    // computed
    cssVars,
    // io
    getSnapshot,
    load,
  };
});
