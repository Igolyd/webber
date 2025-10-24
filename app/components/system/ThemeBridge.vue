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

// Базовая модель кастомной темы
type CustomTheme = {
  textColor: string;
  bgKind: "color" | "gradient" | "image";
  bgColor?: string;
  bgGradient?: string;
  bgImage?: string;
  bgSize?: string;
  bgRepeat?: string;
  bgPosition?: string;
  overlayColor: string;
  overlayOpacity: number;
  cardBg: string;
  borderColor: string;
  hoverColor: string;
  primaryColor: string;
  surfaceVariantColor: string;

  onPrimary?: string;
  secondaryColor?: string;
  onSecondary?: string;
  divider?: string;

  [key: string]: unknown;
};

type ResolvedTheme = CustomTheme & {
  surface: string;
  surface2: string;
  surface3: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  divider: string;
  secondaryColor: string;
  onPrimary: string;
  onSecondary: string;
  selectedColor: string;
  pressedColor: string;
  focusRing: string;

  btnPrimaryBg: string;
  btnPrimaryColor: string;
  btnTonalBg: string;
  btnTonalColor: string;
  btnOutlineBorder: string;
  btnOutlineHover: string;
};

// “легкие” типы для сто́ров, чтобы не использовать any
interface CustomThemeStoreLike {
  getSnapshot?: () => Partial<CustomTheme>;
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

// Пресеты
const PRESETS: Record<"light" | "dark", CustomTheme> = {
  light: {
    textColor: "#281F40",
    bgKind: "color",
    bgColor: "#FBFAFF",
    overlayColor: "#000000",
    overlayOpacity: 0,
    cardBg: "#FFFFFF",
    borderColor: "#E8E3F4",
    hoverColor: "rgba(0,0,0,0.06)",
    primaryColor: "#927FBF",
    surfaceVariantColor: "#F1EEFA",
  },
  dark: {
    textColor: "#E2DCF4",
    bgKind: "color",
    bgColor: "#1A1526",
    overlayColor: "#000000",
    overlayOpacity: 0,
    cardBg: "#201833",
    borderColor: "#3F3556",
    hoverColor: "rgba(255,255,255,0.08)",
    primaryColor: "#A896E6",
    surfaceVariantColor: "#37304F",
  },
};

let isApplying = false;

function applyAll() {
  if (typeof window == "undefined" || typeof document == "undefined") return;
  if (isApplying) return;
  isApplying = true;

  try {
    // Нормализуем старые ключи
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
              "custom",
            ] as const
          ).includes(raw as any)
        ? (raw as any)
        : "classic";

    if (effective !== "custom") {
      // системные цвета и токены Vuetify
      applyCssVarsRaw(systemVars[effective] as Record<string, string>);
      const def = systemVuetify[effective];
      applyVuetifyColors(
        def.dark ? "dark" : "light",
        def.colors as Record<string, string>,
        def.dark ?? false
      );

      // ВАЖНО: поверх системного набора накладываем групповой override (без смены темы Vuetify),
      // чтобы фон/картинка/оверлей/бордеры в превью групп отрабатывали.
      const basePreset = def.dark ? PRESETS.dark : PRESETS.light;
      const data = override.override
        ? clampCustom({ ...basePreset, ...override.override })
        : basePreset;
      applyCssVars(data);

      return;
    }

    // Custom
    const base = clampCustom(custom.getSnapshot?.() ?? {});
    const ov = override.override ?? null;
    const merged = ov ? clampCustom({ ...base, ...ov }) : base;
    // здесь можно вызывать resolveTheme, но для соответствия «рабочей» версии достаточно raw CustomTheme
    applyCssVars(merged);
    applyVuetifyTheme("custom", merged);
  } finally {
    isApplying = false;
  }
}

// Проставляем CSS vars напрямую из объекта vars (из presets.ts)
function applyCssVarsRaw(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, String(v));
  }
}
function applyCssVars(data: CustomTheme) {
  const root = document.documentElement;

  // Базовые
  root.style.setProperty("--app-text-color", data.textColor);
  root.style.setProperty("--app-card-bg", data.cardBg);
  root.style.setProperty("--app-border-color", data.borderColor);

  // Hover
  root.style.setProperty(
    "--app-hover-color",
    data.hoverColor || "rgba(127,127,127,0.08)"
  );

  // Фон
  const kind = data.bgKind;
  const bgColor = data.bgColor ?? "transparent";
  root.style.setProperty("--app-bg-color", bgColor);

  if (kind === "gradient") {
    const grad = data.bgGradient?.trim() || "none";
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
}
function applyVuetifyTheme(
  name: "light" | "dark" | "custom",
  data: CustomTheme
) {
  const vuetifyTheme = vuetify; // ThemeInstance

  if (name !== "custom") {
    vuetifyTheme.change(name);
    return;
  }

  const baseColor = data.cardBg || data.bgColor || "#121212";
  const isDark = isDarkColor(baseColor);

  vuetifyTheme.themes.value.custom = {
    dark: isDark,
    colors: {
      background: data.bgColor || (isDark ? "#121212" : "#ffffff"),
      surface: data.cardBg,
      "on-surface": data.textColor,
      outline: data.borderColor,

      primary: data.primaryColor,
      "surface-variant": data.surfaceVariantColor,

      secondary: isDark ? "#9aa0a6" : "#6c757d",
      error: "#ef4444",
      info: "#60a5fa",
      success: "#10b981",
      warning: "#f59e0b",
    },
    variables: {},
  };

  vuetifyTheme.change("custom");
}
// Замена applyVuetifyTheme для простых light/dark из presets.ts
function applyVuetifyColors(
  name: "light" | "dark",
  colors: Record<string, string>,
  darkFlag: boolean
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

  // Дублируем основные CSS-переменные Vuetify (опционально)
  const root = document.documentElement;
  root.style.setProperty("--v-theme-primary", colors.primary);
  root.style.setProperty(
    "--v-theme-on-primary",
    colors["on-primary"] ?? "#fff"
  );
  root.style.setProperty(
    "--v-theme-surface-variant",
    colors["surface-variant"]
  );
  root.style.setProperty("--v-theme-on-surface", colors["on-surface"]);
  root.style.setProperty("--v-theme-outline", colors.outline);
}

// Групповые темы
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
  override.set?.({ ...snap }); // Partial<CustomTheme>
}

// Безопасные значения
function clampCustom(raw: Partial<CustomTheme>): CustomTheme {
  const safe = { ...(raw ?? {}) } as CustomTheme;
  if (!safe.textColor) safe.textColor = "#eaeaea";
  if (!safe.cardBg) safe.cardBg = "#1e1e1e";
  if (!safe.borderColor) safe.borderColor = "#2a2a2a";
  if (!safe.bgKind) safe.bgKind = "color";
  if (safe.bgKind === "color" && !safe.bgColor) safe.bgColor = "#121212";
  if (!safe.overlayColor) safe.overlayColor = "#000000";
  if (typeof safe.overlayOpacity !== "number")
    safe.overlayOpacity = Number(safe.overlayOpacity ?? 0) || 0;
  if (!safe.bgSize) safe.bgSize = "cover";
  if (!safe.bgRepeat) safe.bgRepeat = "no-repeat";
  if (!safe.bgPosition) safe.bgPosition = "center";
  if (!safe.hoverColor) safe.hoverColor = "rgba(255,255,255,0.08)";
  if (!safe.primaryColor) safe.primaryColor = "#A896E6";
  if (!safe.surfaceVariantColor) safe.surfaceVariantColor = "#3a3a3a";
  return safe;
}

function resolveTheme(c: CustomTheme): ResolvedTheme {
  const dark = isDarkColor(c.cardBg || c.bgColor || "#121212");

  const surface = c.cardBg;
  const surfaceVariant = c.surfaceVariantColor || c.cardBg;

  const surface2 = mixColors(
    surface,
    dark ? "#FFFFFF" : "#000000",
    dark ? 0.04 : 0.02
  );
  const surface3 = mixColors(
    surface,
    dark ? "#FFFFFF" : "#000000",
    dark ? 0.08 : 0.04
  );

  const onSurface = c.textColor;
  const onSurfaceVariant = mixColors(
    onSurface,
    dark ? "#000000" : "#FFFFFF",
    0.2
  );

  const outline = c.borderColor;
  const outlineVariant = c.borderColor;
  const divider =
    c.divider || (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)");

  const secondaryColor = c.secondaryColor || (dark ? "#C7B8FF" : "#6FA9FF");

  const onPrimary =
    c.onPrimary ||
    (isDarkColor(c.primaryColor) ? "#FFFFFF" : dark ? "#1A132E" : "#FFFFFF");
  const onSecondary =
    c.onSecondary ||
    (isDarkColor(secondaryColor) ? "#FFFFFF" : dark ? "#201833" : "#0F1B33");

  const selectedColor = dark
    ? "rgba(168,150,230,0.16)"
    : "rgba(146,127,191,0.16)";
  const pressedColor = dark
    ? "rgba(168,150,230,0.24)"
    : "rgba(146,127,191,0.24)";
  const focusRing = `color-mix(in oklab, ${c.primaryColor} 60%, transparent)`;

  const btnPrimaryBg = c.primaryColor;
  const btnPrimaryColor = onPrimary;
  const btnTonalBg = surfaceVariant;
  const btnTonalColor = onSurface;
  const btnOutlineBorder = outline;
  const btnOutlineHover = c.hoverColor;

  return {
    ...c,
    surface,
    surface2,
    surface3,
    surfaceVariant,
    onSurface,
    onSurfaceVariant,
    outline,
    outlineVariant,
    divider,
    secondaryColor,
    onPrimary,
    onSecondary,
    selectedColor,
    pressedColor,
    focusRing,
    btnPrimaryBg,
    btnPrimaryColor,
    btnTonalBg,
    btnTonalColor,
    btnOutlineBorder,
    btnOutlineHover,
  };
}

// Утилиты

function toLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function isDarkColor(color: string): boolean {
  const { r, g, b } = parseColor(color);
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  return luminance < 0.5;
}

function parseColor(input: string): { r: number; g: number; b: number } {
  if (!input) return { r: 18, g: 18, b: 18 };
  const s = String(input).trim().toLowerCase();

  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  if (s.startsWith("rgb")) {
    const m = s.match(/rgba?$([^)]+)$/);
    if (m) {
      const parts = m[1].split(",").map((p) => p.trim());
      return {
        r: clamp255(Number(parts[0])),
        g: clamp255(Number(parts[1])),
        b: clamp255(Number(parts[2])),
      };
    }
  }
  return { r: 18, g: 18, b: 18 };
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function mixColors(aColor: string, bColor: string, amount = 0.5): string {
  const a = parseColor(aColor);
  const b = parseColor(bColor);
  const r = clamp255(a.r * (1 - amount) + b.r * amount);
  const g = clamp255(a.g * (1 - amount) + b.g * amount);
  const b2 = clamp255(a.b * (1 - amount) + b.b * amount);
  return `rgb(${r}, ${g}, ${b2})`;
}

function trySubscribe(
  obj?: { $subscribe?: (cb: () => void) => unknown },
  cb?: () => void
) {
  if (obj?.$subscribe && cb) obj.$subscribe(cb);
}

onMounted(async () => {
  // Сначала синхронизируем group override
  syncGroupThemeOverride();
  await nextTick();

  // Применяем тему
  applyAll();

  // Реакция на смену общей темы (light/dark/custom)
  watch(theme, () => applyAll(), { flush: "post" });

  // Подписки без any
  trySubscribe(custom, applyAll);
  trySubscribe(override, applyAll);

  // Роут и флаг персональной темы в группах
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
