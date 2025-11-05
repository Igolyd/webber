<!-- components/system/ThemeBridge.vue -->
<script setup lang="ts">
import { onMounted, watch, nextTick } from "vue";
import { useTheme, type ThemeInstance } from "vuetify";
import { storeToRefs } from "pinia";
import { useAppearanceStore } from "~/stores/app/appearance";
import { useCustomThemeStore } from "~/stores/app/themeCustom";
import { useThemeOverrideStore } from "~/stores/app/themeOverride";
import {
  systemVuetify,
  systemVars,
  lightAlias,
  darkAlias,
  type SystemTheme,
} from "../../../theme/presets";
import { useRoute } from "vue-router";
import { useGroupThemesStore } from "~/stores/groupThemes";

type CustomTheme = {
  textColor?: string;
  bgKind?: "color" | "gradient" | "image";
  bgColor?: string;
  bgGradient?: string;
  bgImage?: string;
  bgSize?: string;
  bgRepeat?: string;
  bgPosition?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  cardBg?: string;
  borderColor?: string;
  hoverColor?: string;
  primaryColor?: string;
  surfaceVariantColor?: string;
  sections?: Record<
    string,
    Partial<{
      enabled: boolean;
      surface: string;
      onSurface: string;
      border: string;
      hover: string;
      elev1: string;
    }>
  >;
};

interface CustomThemeStoreLike {
  getSnapshot?: () => Partial<CustomTheme>;
  cssVars?: { value: Record<string, string> };
  $subscribe?: (cb: () => void) => unknown;
}
interface ThemeOverrideLike {
  override?: Partial<CustomTheme> | null;
  set?: (payload: Partial<CustomTheme> | null) => void;
  $subscribe?: (cb: () => void) => unknown;
}
interface GroupThemesStoreLike {
  get?: (id: string) => Partial<CustomTheme> | null | undefined;
}

const appearance = useAppearanceStore();
const { theme } = storeToRefs(appearance);

const route = useRoute();
const groupsThemes = useGroupThemesStore() as unknown as GroupThemesStoreLike;

const custom = useCustomThemeStore() as unknown as CustomThemeStoreLike;
const override = useThemeOverrideStore() as unknown as ThemeOverrideLike;
const vuetify: ThemeInstance = useTheme();

const PRESETS: Record<"light" | "dark", Required<CustomTheme>> = {
  light: {
    textColor: "#281F40",
    bgKind: "color",
    bgColor: "#FBFAFF",
    bgGradient: "",
    bgImage: "",
    bgSize: "cover",
    bgRepeat: "no-repeat",
    bgPosition: "center",
    overlayColor: "#000000",
    overlayOpacity: 0,
    cardBg: "#FFFFFF",
    borderColor: "#E8E3F4",
    hoverColor: "rgba(0,0,0,0.06)",
    primaryColor: "#927FBF",
    surfaceVariantColor: "#F1EEFA",
    sections: {},
  },
  dark: {
    textColor: "#E2DCF4",
    bgKind: "color",
    bgColor: "#1A1526",
    bgGradient: "",
    bgImage: "",
    bgSize: "cover",
    bgRepeat: "no-repeat",
    bgPosition: "center",
    overlayColor: "#000000",
    overlayOpacity: 0,
    cardBg: "#201833",
    borderColor: "#3F3556",
    hoverColor: "rgba(255,255,255,0.08)",
    primaryColor: "#A896E6",
    surfaceVariantColor: "#37304F",
    sections: {},
  },
};

let isApplying = false;

function applyAll() {
  if (typeof window == "undefined" || typeof document == "undefined") return;
  if (isApplying) return;
  isApplying = true;

  try {
    const raw = (theme.value as string) || "classic";
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

    if (effective !== "custom") {
      // 1) Базовые переменные системной темы (включая секции по умолчанию)
      applyCssVarsRaw(systemVars[effective] as Record<string, string>);
      // 2) Vuetify цвета
      const def = systemVuetify[effective];
      applyVuetifyColors(
        def.dark ? "dark" : "light",
        def.colors as Record<string, string>
      );
      // 3) Накатываем group override (фон/оверлей/секционные overrides)
      const basePreset = def.dark ? PRESETS.dark : PRESETS.light;
      const data = override.override
        ? clampCustom({ ...basePreset, ...override.override })
        : basePreset;
      applyBgAndBasicVars(data);
      // 4) Прозрачность секций при bgKind=image/gradient + секционные overrides
      applySectionBackdropAndOverrides(data);
      // 5) Фон документа
      applyBackgroundFromVars();
      return;
    }

    // Custom: применяем ПОЛНЫЙ набор переменных из custom.cssVars (там уже учтены секции)
    const cssVars = custom.cssVars?.value as Record<string, string> | undefined;
    if (cssVars && Object.keys(cssVars).length) {
      applyCssVarsRaw(cssVars);
    } else {
      // fallback: применим хотя бы базовые
      const base = clampCustom(custom.getSnapshot?.() ?? {});
      applyBgAndBasicVars(base);
      applySectionBackdropAndOverrides(base);
    }
    // Цвета Vuetify под custom
    applyVuetifyThemeFromVars();
    applyBackgroundFromVars();
  } finally {
    isApplying = false;
  }
}

function applyCssVarsRaw(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars))
    root.style.setProperty(k, String(v));
}

// Применение только базовых переменных (фон, текст, кнопки) — без секций
function applyBgAndBasicVars(data: Required<CustomTheme>) {
  const root = document.documentElement;
  const isBackdrop = data.bgKind === "image" || data.bgKind === "gradient";
  document.documentElement.classList.toggle("app-has-image", isBackdrop);
  document.documentElement.style.setProperty(
    "--app-has-image",
    isBackdrop ? "1" : "0"
  );
  root.style.setProperty("--app-text-color", data.textColor);
  root.style.setProperty("--app-card-bg", data.cardBg);
  root.style.setProperty("--app-border-color", data.borderColor);
  root.style.setProperty(
    "--app-hover-color",
    data.hoverColor || "rgba(127,127,127,0.08)"
  );

  const kind = data.bgKind;
  const bgColor = data.bgColor ?? "transparent";
  root.style.setProperty(
    "--app-bg-color",
    kind === "color" ? bgColor : "#0000"
  );

  if (kind === "gradient") {
    const grad = (data.bgGradient || "none").trim();
    root.style.setProperty("--app-bg-image", grad);
  } else if (kind === "image") {
    const img = data.bgImage
      ? data.bgImage.trim().startsWith("url(")
        ? data.bgImage.trim()
        : `url("${data.bgImage.trim()}")`
      : "none";
    root.style.setProperty("--app-bg-image", img);
  } else {
    root.style.setProperty("--app-bg-image", "none");
  }

  root.style.setProperty("--app-bg-size", String(data.bgSize || "cover"));
  root.style.setProperty(
    "--app-bg-repeat",
    String(data.bgRepeat || "no-repeat")
  );
  root.style.setProperty(
    "--app-bg-position",
    String(data.bgPosition || "center")
  );

  root.style.setProperty(
    "--app-bg-overlay-color",
    data.overlayColor || "transparent"
  );
  root.style.setProperty(
    "--app-bg-overlay-opacity",
    String(data.overlayOpacity ?? 0)
  );

  // Ключевые акценты для Vuetify переменных
  root.style.setProperty("--v-theme-primary", data.primaryColor);
  root.style.setProperty(
    "--v-theme-surface-variant",
    String(
      getComputedStyle(root).getPropertyValue("--app-surface-variant") ||
        data.surfaceVariantColor
    )
  );
  root.style.setProperty(
    "--v-theme-outline",
    String(
      getComputedStyle(root).getPropertyValue("--app-outline") ||
        data.borderColor
    )
  );
}

// Делаем секции полупрозрачными на изображении/градиенте и накатываем секционные overrides
function applySectionBackdropAndOverrides(data: Required<CustomTheme>) {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const mapSurfVar = (key: string) => {
    if (key === "lnav") return "--lnav-background";
    if (key === "main") return "--main-background";
    if (key === "topnav") return "--topnav-background";
    if (key === "input") return "--input-background"; // NEW
    // для остальных секций остаётся surface
    return `--${key}-surface`;
  };
  const isBackdrop = data.bgKind === "image" || data.bgKind === "gradient";

  // Небольшой хелпер: вернуть микс дефолтной поверхности с прозрачностью
  const mix = (color: string, a = 85) =>
    isBackdrop ? `color-mix(in oklab, ${color} ${a}%, transparent)` : color;

  // Читаем текущие дефолтные секции (проставленные systemVars/custom.cssVars ранее)
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name)?.trim() || fallback;

  const sectionKeys = [
    "hdr",
    "lnav",
    "main",
    "rnav",
    "topnav",
    "composer",
    "dialog",
    "menu",
    "mymini",
    "input", // NEW
  ] as const;

  for (const key of sectionKeys) {
    const surfVar = mapSurfVar(key); // было: `--${key}-surface`
    const onVar = `--${key}-on-surface`;
    const borderVar = `--${key}-border`;
    const hoverVar = key === "dialog" || key === "menu" ? "" : `--${key}-hover`;
    const elevVar = key === "dialog" || key === "menu" ? "" : `--${key}-elev-1`;

    const defSurface = read(surfVar, read("--app-surface", "#111"));
    const defOn = read(onVar, read("--app-on-surface", data.textColor));
    const defBorder = read(
      borderVar,
      read("--app-outline-variant", data.borderColor)
    );
    const defHover = hoverVar
      ? read(hoverVar, read("--app-hover-color", data.hoverColor))
      : "";
    const defElev = elevVar
      ? read(elevVar, read("--app-surface-2", "#222"))
      : "";

    // Применяем overrides, если включены
    const ov =
      data.sections?.[key as keyof NonNullable<CustomTheme["sections"]>];
    const use = ov?.enabled ? ov : undefined;

    // Для dialog/menu НЕ просвечиваем (читаемость), остальные — с миксом
    const shouldMix = isBackdrop && key !== "dialog" && key !== "menu";
    const surfaceFinal = use?.surface
      ? shouldMix
        ? mix(use.surface)
        : use.surface
      : shouldMix
      ? mix(defSurface)
      : defSurface;
    const onFinal = use?.onSurface || defOn;
    const borderFinal = use?.border || defBorder;
    const hoverFinal = hoverVar ? use?.hover || defHover : "";
    const elevFinal = elevVar
      ? use?.elev1
        ? shouldMix
          ? mix(use.elev1)
          : use.elev1
        : shouldMix
        ? mix(defElev)
        : defElev
      : "";

    root.style.setProperty(surfVar, surfaceFinal);
    root.style.setProperty(onVar, onFinal);
    root.style.setProperty(borderVar, borderFinal);
    if (hoverVar) root.style.setProperty(hoverVar, hoverFinal);
    if (elevVar) root.style.setProperty(elevVar, elevFinal);
  }
}

function applyVuetifyThemeFromVars() {
  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue("--app-bg-color")?.trim() || "#121212";
  const surface =
    cs.getPropertyValue("--app-surface")?.trim() ||
    cs.getPropertyValue("--app-card-bg")?.trim() ||
    bg;
  const text =
    cs.getPropertyValue("--app-on-surface")?.trim() ||
    cs.getPropertyValue("--app-text-color")?.trim() ||
    "#fff";
  const primary = cs.getPropertyValue("--app-primary")?.trim() || "#7C8CF8";
  const outline = cs.getPropertyValue("--app-outline")?.trim() || "#2a2a2a";

  const isDark = isDarkColor(surface || bg);

  vuetify.themes.value.custom = {
    dark: isDark,
    colors: {
      background: bg || (isDark ? "#121212" : "#ffffff"),
      surface: surface || (isDark ? "#1e1e1e" : "#ffffff"),
      "on-surface": text,
      outline,
      primary,
      secondary: isDark ? "#9aa0a6" : "#6c757d",
      error: "#ef4444",
      info: "#60a5fa",
      success: "#10b981",
      warning: "#f59e0b",
      "surface-variant":
        cs.getPropertyValue("--app-surface-variant")?.trim() || surface,
    },
    variables: {},
  };
  vuetify.change("custom");
}

function applyVuetifyColors(
  name: "light" | "dark",
  colors: Record<string, string>
) {
  const themes = vuetify.themes.value;
  if (name === "light") {
    themes.light = {
      dark: false,
      colors: { ...colors },
      variables: themes.light?.variables ?? {},
    };
  } else {
    themes.dark = {
      dark: true,
      colors: { ...colors },
      variables: themes.dark?.variables ?? {},
    };
  }
  vuetify.change(name);
}

// Подхватываем override темы группы на роутинге
function syncGroupThemeOverride() {
  const gid = String(
    (route.params as Record<string, string | number | undefined>)?.id ?? ""
  );
  const preferPersonal = appearance.preferPersonalThemeInGroups;
  if (!gid) {
    override.set?.(null);
    return;
  }
  const snap = groupsThemes.get?.(gid);
  if (!snap) {
    override.set?.(null);
    return;
  }
  if (preferPersonal) {
    override.set?.(null);
    return;
  }
  override.set?.({ ...snap });
}

function clampCustom(raw: Partial<CustomTheme>): Required<CustomTheme> {
  const safe: Required<CustomTheme> = {
    textColor: raw.textColor || "#eaeaea",
    bgKind: raw.bgKind || "color",
    bgColor: raw.bgColor || "#121212",
    bgGradient: raw.bgGradient || "",
    bgImage: raw.bgImage || "",
    bgSize: raw.bgSize || "cover",
    bgRepeat: raw.bgRepeat || "no-repeat",
    bgPosition: raw.bgPosition || "center",
    overlayColor: raw.overlayColor || "#000000",
    overlayOpacity:
      typeof raw.overlayOpacity === "number" ? raw.overlayOpacity : 0,
    cardBg: raw.cardBg || "#1e1e1e",
    borderColor: raw.borderColor || "#2a2a2a",
    hoverColor: raw.hoverColor || "rgba(255,255,255,0.08)",
    primaryColor: raw.primaryColor || "#A896E6",
    surfaceVariantColor: raw.surfaceVariantColor || "#3a3a3a",
    sections: raw.sections || {},
  };
  return safe;
}

// ——— Утилиты
function toLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function isDarkColor(color: string): boolean {
  const { r, g, b } = parseColor(color);
  const R = toLinear(r),
    G = toLinear(g),
    B = toLinear(b);
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  return luminance < 0.5;
}
function parseColor(input: string): { r: number; g: number; b: number } {
  if (!input) return { r: 18, g: 18, b: 18 };
  const s = String(input).trim().toLowerCase();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3)
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    if (hex.length >= 6)
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
  }
  if (s.startsWith("rgb")) {
    const m = s.match(`/rgba?$([^)]+)$/`);
    if (m) {
      const parts = m[1].split(",").map((p) => p.trim());
      return {
        r: Math.max(0, Math.min(255, Math.round(Number(parts[0])))),
        g: Math.max(0, Math.min(255, Math.round(Number(parts[1])))),
        b: Math.max(0, Math.min(255, Math.round(Number(parts[2])))),
      };
    }
  }
  return { r: 18, g: 18, b: 18 };
}

// Жёстко задаём фон документу из наших vars — чтобы картинка точно была видна
function applyBackgroundFromVars() {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const bgColor = cs.getPropertyValue("--app-bg-color") || "";
  const bgImage = cs.getPropertyValue("--app-bg-image") || "none";
  const bgPos = cs.getPropertyValue("--app-bg-position") || "center center";
  const bgSize = cs.getPropertyValue("--app-bg-size") || "cover";
  const bgRepeat = cs.getPropertyValue("--app-bg-repeat") || "no-repeat";
  root.style.backgroundColor = bgColor.trim() || "transparent";
  root.style.backgroundImage = bgImage.trim() || "none";
  root.style.backgroundPosition = bgPos.trim();
  root.style.backgroundSize = bgSize.trim();
  root.style.backgroundRepeat = bgRepeat.trim();
}

function trySubscribe(
  obj?: { $subscribe?: (cb: () => void) => unknown },
  cb?: () => void
) {
  if (obj?.$subscribe && cb) obj.$subscribe(cb);
}

onMounted(async () => {
  syncGroupThemeOverride();
  await nextTick();
  applyAll();

  // Тема
  watch(theme, () => applyAll(), { flush: "post" });
  // Изменения кастомной/override
  trySubscribe(custom, applyAll);
  trySubscribe(override, applyAll);
  // Роут и флаг "предпочитать личную тему в группах"
  watch(
    () => [route.fullPath, appearance.preferPersonalThemeInGroups],
    () => {
      syncGroupThemeOverride();
      applyAll();
    },
    { immediate: false }
  );
});
</script>

<template>
  <span style="display: none" />
</template>
