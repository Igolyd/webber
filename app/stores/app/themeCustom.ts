// stores/app/themeCustom.ts
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { CssVars } from "../../../theme/presets";

export type BgKind = "color" | "gradient" | "image";

type SectionKey =
  | "hdr"
  | "lnav"
  | "main"
  | "rnav"
  | "topnav"
  | "composer"
  | "dialog"
  | "menu"
  | "mymini"; // NEW
type SectionOverride = Partial<{
  enabled: boolean;
  surface: string;
  onSurface: string;
  border: string;
  hover: string;
  elev1: string;
}>;
type SectionsMap = Partial<Record<SectionKey, SectionOverride>>;

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
  hoverColor: string;
  primaryColor: string;
  surfaceVariantColor: string;
  // NEW: секционные overrides
  sections: SectionsMap;
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

  const hoverColor = ref<string>("rgba(255,255,255,0.08)");
  const primaryColor = ref<string>("#4f9cf9");
  const surfaceVariantColor = ref<string>("#3a3a3a");
  const surfaceAlpha = ref<number>(0.85); // непрозрачность для backdrop при image/gradient

  // секционные overrides
  const sections = ref<SectionsMap>({});

  // Кнопки (оставляем как есть)
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

  const btnPrimaryBg = ref<string>("#A896E6");
  const btnPrimaryColor = ref<string>("#1A132E");
  const btnTonalBg = ref<string>("#37304F");
  const btnTonalColor = ref<string>("#E2DCF4");
  const btnOutlineBorder = ref<string>("#5A4E75");
  const btnOutlineHover = ref<string>("rgba(168,150,230,0.10)");

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
      sections: sections.value || {},
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
    if (s.sections !== undefined) sections.value = { ...s.sections };
  }

  const persisted = useLocalStorage<CustomThemeSnapshot>(
    "app-theme-custom",
    getSnapshot()
  );
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
      sections,
    ],
    () => {
      persisted.value = getSnapshot();
    },
    { deep: true }
  );

  const cssVars = computed<CssVars>(() => {
    // surface backdrop (просвет для image/gradient)
    const a = Math.round((surfaceAlpha.value ?? 0.85) * 100);
    const makeBackdrop = () => {
      if (bgKind.value === "image" || bgKind.value === "gradient") {
        return `color-mix(in oklab, ${surface.value} ${a}%, transparent)`;
      }
      return surface.value;
    };
    const image =
      bgKind.value === "image" && bgImage.value
        ? bgImage.value.trim().startsWith("url(")
          ? bgImage.value.trim()
          : `url("${bgImage.value.trim()}")`
        : bgKind.value === "gradient"
        ? bgGradient.value
        : "none";
    const baseBgColor = bgKind.value === "color" ? bgColor.value : "#0000";

    // Базовые секционные «дефолты»
    const baseSurface = surface.value;
    const baseOnSurface = textColor.value;
    const baseBorder = borderColor.value;
    const baseHover = hoverColor.value;
    const baseElev1 = surface2.value;

    // helper pick
    const pick = (
      sec: SectionOverride | undefined,
      key: keyof SectionOverride,
      def: string
    ): string => {
      const v = sec?.[key];
      return typeof v === "string" && v ? v : def;
    };

    const S = sections.value || {};
    // surface для секций: backdrop если image/gradient (кроме dialog/menu — их делаем непрозрачными)
    const secSurf = (def: string) =>
      bgKind.value === "image" || bgKind.value === "gradient"
        ? `color-mix(in oklab, ${def} ${a}%, transparent)`
        : def;

    // Секции
    const hdr = S.hdr?.enabled ? S.hdr : undefined;
    const lnav = S.lnav?.enabled ? S.lnav : undefined;
    const main = S.main?.enabled ? S.main : undefined;
    const rnav = S.rnav?.enabled ? S.rnav : undefined;
    const topnav = S.topnav?.enabled ? S.topnav : undefined;
    const composer = S.composer?.enabled ? S.composer : undefined;
    const dialog = S.dialog?.enabled ? S.dialog : undefined;
    const menu = S.menu?.enabled ? S.menu : undefined;
    const mymini = S.mymini?.enabled ? S.mymini : undefined;
    const vars: CssVars = {
      "--app-text-color": textColor.value,
      "--app-bg-color": baseBgColor,
      "--app-card-bg": cardBg.value,
      "--app-border-color": borderColor.value,
      "--app-bg-image": image,
      "--app-bg-size": bgSize.value,
      "--app-bg-position": bgPosition.value,
      "--app-bg-repeat": bgRepeat.value,
      "--app-bg-overlay-color": overlayColor.value,
      "--app-bg-overlay-opacity": String(overlayOpacity.value),

      "--app-hover-color": hoverColor.value,

      "--app-surface": surface.value,
      "--app-surface-backdrop": makeBackdrop(),
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

      // Секции (поверхности/тексты/границы/hover/elev-1)
      "--hdr-surface": secSurf(pick(hdr, "surface", baseSurface)),
      "--hdr-on-surface": pick(hdr, "onSurface", baseOnSurface),
      "--hdr-border": pick(hdr, "border", baseBorder),
      "--hdr-hover": pick(hdr, "hover", baseHover),
      "--hdr-elev-1": pick(hdr, "elev1", baseElev1),

      "--lnav-background": secSurf(pick(lnav, "surface", baseSurface)),
      "--lnav-on-surface": pick(lnav, "onSurface", baseOnSurface),
      "--lnav-border": pick(lnav, "border", baseBorder),
      "--lnav-hover": pick(lnav, "hover", baseHover),
      "--lnav-elev-1": pick(lnav, "elev1", baseElev1),

      "--main-background": secSurf(pick(main, "surface", baseSurface)),
      "--main-on-surface": pick(main, "onSurface", baseOnSurface),
      "--main-border": pick(main, "border", baseBorder),
      "--main-hover": pick(main, "hover", baseHover),
      "--main-elev-1": pick(main, "elev1", baseElev1),

      "--rnav-surface": secSurf(pick(rnav, "surface", baseSurface)),
      "--rnav-on-surface": pick(rnav, "onSurface", baseOnSurface),
      "--rnav-border": pick(rnav, "border", baseBorder),
      "--rnav-hover": pick(rnav, "hover", baseHover),
      "--rnav-elev-1": pick(rnav, "elev1", baseElev1),

      "--topnav-background": secSurf(pick(topnav, "surface", surface2.value)),
      "--topnav-on-surface": pick(topnav, "onSurface", baseOnSurface),
      "--topnav-border": pick(topnav, "border", borderColor.value),
      "--topnav-hover": pick(topnav, "hover", baseHover),
      "--topnav-elev-1": pick(topnav, "elev1", baseElev1),

      "--composer-surface": secSurf(pick(composer, "surface", baseSurface)),
      "--composer-on-surface": pick(composer, "onSurface", baseOnSurface),
      "--composer-border": pick(composer, "border", baseBorder),
      "--composer-hover": pick(composer, "hover", baseHover),
      "--composer-elev-1": pick(composer, "elev1", baseElev1),

      // Dialog/Menu — НЕ просвечиваем (читаемость)
      "--dialog-surface": pick(dialog, "surface", surface3.value),
      "--dialog-on-surface": pick(dialog, "onSurface", baseOnSurface),
      "--dialog-border": pick(dialog, "border", baseBorder),

      "--menu-surface": pick(menu, "surface", surface2.value),
      "--menu-on-surface": pick(menu, "onSurface", baseOnSurface),
      "--menu-border": pick(menu, "border", baseBorder),
      // NEW: Мой мини профиль (можно просвечивать при image/gradient)
      "--mymini-surface": secSurf(pick(mymini, "surface", baseSurface)),
      "--mymini-on-surface": pick(mymini, "onSurface", baseOnSurface),
      "--mymini-border": pick(mymini, "border", baseBorder),
      "--mymini-hover": pick(mymini, "hover", baseHover),
      "--mymini-elev-1": pick(mymini, "elev1", baseElev1),
    } as CssVars;

    return vars;
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
    sections,
    // computed
    cssVars,
    // io
    getSnapshot,
    load,
  };
});
