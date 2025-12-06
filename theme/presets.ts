// theme/presets.ts
import type { ThemeDefinition } from "vuetify";

export type SystemTheme =
  | "classic" // тёмно-фиолетовая (уютная)
  | "sakura" // светло-фиолетовая (мягкая, пастельная)
  | "ocean" // тёмно-синяя
  | "clouds" // светло-синяя
  | "lime" // светло-зелёная
  | "hacker" // тёмно-зелёная
  | "white" // Белый свет
  | "void"; // Тьма

export type CssVars = {
  "--app-text-color": string;
  "--app-bg-color": string;
  "--app-card-bg": string;
  "--app-border-color": string;
  "--app-bg-image": string;
  "--app-bg-size": string;
  "--app-bg-position": string;
  "--app-bg-repeat": string;
  "--app-bg-overlay-color": string;
  "--app-bg-overlay-opacity": string;
  "--app-hover-color": string;

  "--app-surface": string;
  "--app-surface-backdrop": string;
  "--app-surface-2": string;
  "--app-surface-3": string;
  "--app-surface-variant": string;
  "--app-on-surface": string;
  "--app-on-surface-variant": string;
  "--app-outline": string;
  "--app-outline-variant": string;
  "--app-divider": string;
  "--app-primary": string;
  "--app-on-primary": string;
  "--app-secondary": string;
  "--app-on-secondary": string;
  "--app-selected-color": string;
  "--app-pressed-color": string;
  "--app-focus-ring": string;

  "--btn-primary-bg": string;
  "--btn-primary-color": string;
  "--btn-tonal-bg": string;
  "--btn-tonal-color": string;
  "--btn-outline-border": string;
  "--btn-outline-hover": string;

  // секционные токены
  "--hdr-surface": string;
  "--hdr-on-surface": string;
  "--hdr-border": string;
  "--hdr-hover": string;
  "--hdr-elev-1": string;

  "--lnav-background": string;
  "--lnav-on-surface": string;
  "--lnav-border": string;
  "--lnav-hover": string;
  "--lnav-elev-1": string;
  "--lnav-bg-color": string;

  "--main-background": string;
  "--main-on-surface": string;
  "--main-border": string;
  "--main-hover": string;
  "--main-elev-1": string;
  "--main-bg-color": string;

  "--rnav-surface": string;
  "--rnav-on-surface": string;
  "--rnav-border": string;
  "--rnav-hover": string;
  "--rnav-elev-1": string;

  "--topnav-background": string;
  "--topnav-on-surface": string;
  "--topnav-border": string;
  "--topnav-hover": string;
  "--topnav-elev-1": string;
  "--topnav-bg-color": string;
  "--topnav-gradient": string;

  "--composer-surface": string;
  "--composer-on-surface": string;
  "--composer-border": string;
  "--composer-hover": string;
  "--composer-elev-1": string;

  "--dialog-surface": string;
  "--dialog-on-surface": string;
  "--dialog-border": string;

  "--menu-surface": string;
  "--menu-on-surface": string;
  "--menu-border": string;
  // NEW: Мой мини профиль
  "--mymini-surface": string;
  "--mymini-on-surface": string;
  "--mymini-border": string;
  "--mymini-hover": string;
  "--mymini-elev-1": string;
  "--mymini-bg-color": string;

  "--input-background": string;
  "--input-on-surface": string;
  "--input-border": string;
  "--input-hover": string;
  "--input-elev-1": string;
  "--input-bg-color": string;

  "--gradient-bg-color": string; //градиент цвета
};

// Хелпер секций для системных тем
function sectionDefaults(
  v: Omit<
    CssVars,
    | "--hdr-surface"
    | "--hdr-on-surface"
    | "--hdr-border"
    | "--hdr-hover"
    | "--hdr-elev-1"
    | "--lnav-background"
    | "--lnav-on-surface"
    | "--lnav-border"
    | "--lnav-hover"
    | "--lnav-elev-1"
    | "--main-background"
    | "--main-on-surface"
    | "--main-border"
    | "--main-hover"
    | "--main-elev-1"
    | "--rnav-surface"
    | "--rnav-on-surface"
    | "--rnav-border"
    | "--rnav-hover"
    | "--rnav-elev-1"
    | "--topnav-background"
    | "--topnav-on-surface"
    | "--topnav-border"
    | "--topnav-hover"
    | "--topnav-elev-1"
    | "--composer-surface"
    | "--composer-on-surface"
    | "--composer-border"
    | "--composer-hover"
    | "--composer-elev-1"
    | "--dialog-surface"
    | "--dialog-on-surface"
    | "--dialog-border"
    | "--menu-surface"
    | "--menu-on-surface"
    | "--menu-border"
  >
): CssVars {
  const base = v as any;
  const surface = v["--app-surface"];
  const BgMain = v["--main-bg-color"];
  const onSurface = v["--app-on-surface"];
  const border = v["--app-outline-variant"];
  const hover = v["--app-hover-color"];
  const elev1 = v["--app-surface-2"];
  return {
    ...v,
    "--hdr-surface": surface,
    "--hdr-on-surface": onSurface,
    "--hdr-border": border,
    "--hdr-hover": hover,
    "--hdr-elev-1": elev1,

    "--lnav-background": v["--lnav-bg-color"],
    "--lnav-on-surface": onSurface,
    "--lnav-border": border,
    "--lnav-hover": hover,
    "--lnav-elev-1": elev1, //фон у MyProfile

    "--main-background": BgMain,
    "--main-on-surface": onSurface,
    "--main-border": border,
    "--main-hover": hover,
    "--main-elev-1": elev1,

    "--rnav-surface": surface,
    "--rnav-on-surface": onSurface,
    "--rnav-border": border,
    "--rnav-hover": hover,
    "--rnav-elev-1": elev1,

    "--topnav-background": v["--topnav-bg-color"],
    "--topnav-on-surface": onSurface,
    "--topnav-border": border,
    "--topnav-hover": hover,
    "--topnav-elev-1": elev1,

    "--composer-surface": surface,
    "--composer-on-surface": onSurface,
    "--composer-border": border,
    "--composer-hover": hover,
    "--composer-elev-1": elev1,

    "--dialog-surface": v["--app-surface-3"],
    "--dialog-on-surface": onSurface,
    "--dialog-border": border,

    "--menu-surface": v["--app-surface-2"],
    "--menu-on-surface": onSurface,
    "--menu-border": border,
    // NEW: Мой мини профиль
    "--mymini-surface": surface,
    "--mymini-on-surface": onSurface,
    "--mymini-border": border,
    "--mymini-hover": hover,
    "--mymini-elev-1": v["--mymini-bg-color"],

    // NEW: input
    "--input-background": v["--input-bg-color"] ?? surface,
    "--input-on-surface": onSurface,
    "--input-border": border,
    "--input-hover": hover,
    "--input-elev-1": elev1,

    "--gradient-bg-color": v["--gradient-bg-color"],
  } as CssVars;
}

// ——— Фиолетовые: sakura (светлая), classic (тёмная, уютная)
const violetLightVuetify: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#F8F7FC",
    surface: "#FFFFFF",
    "surface-variant": "#F3F1FA",
    primary: "#8E7BCF",
    "on-primary": "#FFFFFF",
    secondary: "#A998F2",
    "on-secondary": "#1E1636",
    "on-surface": "#2A2144",
    "on-background": "#23193A",
    info: "#4B94F8",
    success: "#2DAE8B",
    warning: "#F5A941",
    error: "#E75A6A",
    outline: "#DDD4F1",
    "outline-variant": "#EAE4F8",
    divider: "#00000014",
  },
};
const violetLightVars = sectionDefaults({
  "--app-text-color": "#2A2144",
  "--app-bg-color": "#F8F7FC",
  "--app-card-bg": "#FFFFFF",
  "--app-border-color": "#EAE4F8",
  "--app-bg-image": "none",
  "--app-bg-size": "cover",
  "--app-bg-position": "center center",
  "--app-bg-repeat": "no-repeat",
  "--app-bg-overlay-color": "rgba(0,0,0,1)",
  "--app-bg-overlay-opacity": "0",
  "--app-hover-color": "rgba(142,123,207,0.10)",

  "--app-surface": "#fddcfc",
  "--app-surface-backdrop": "#FFFFFF",
  "--app-surface-2": "#f4ddff",
  "--app-surface-3": "#F5F1FE",
  "--app-surface-variant": "#F3F1FA",
  "--app-on-surface": "#2A2144",
  "--app-on-surface-variant": "#5D5376",
  "--app-outline": "#DDD4F1",
  "--app-outline-variant": "#bd7fbe",
  "--app-divider": "rgba(0,0,0,0.08)",
  "--app-primary": "#8E7BCF",
  "--app-on-primary": "#FFFFFF",
  "--app-secondary": "#A998F2",
  "--app-on-secondary": "#1E1636",
  "--app-selected-color": "rgba(142,123,207,0.16)",
  "--app-pressed-color": "rgba(142,123,207,0.24)",
  "--app-focus-ring": "color-mix(in oklab, #8E7BCF 60%, transparent)",

  "--btn-primary-bg": "#8E7BCF",
  "--btn-primary-color": "#FFFFFF",
  "--btn-tonal-bg": "#F3F1FA",
  "--btn-tonal-color": "#2A2144",
  "--btn-outline-border": "#DDD4F1",
  "--btn-outline-hover": "rgba(142,123,207,0.10)",

  "--lnav-bg-color": "#f4ddff", //фон левой навигации
  "--mymini-bg-color": "#F5F1FE",
  "--input-bg-color": "#FFFFFF",
} as any);

// classic (тёмная уютная фиолетовая)
const violetDarkVuetify: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#181426",
    surface: "#332A49", //меняет список в блоке фон
    "surface-variant": "#332A49",
    primary: "#A896E6",
    "on-primary": "#1A132E",
    secondary: "#C7B8FF",
    "on-surface": "#E2DCF4",
    "on-background": "#EAE6F7",
    info: "#7FB7FF",
    success: "#4CC7A1",
    warning: "#FFCC6F",
    error: "#FF6B6B",
    outline: "#4D416B",
    "outline-variant": "#3A3054",
    divider: "#FFFFFF14",
  },
};
const violetDarkVars = sectionDefaults({
  "--app-text-color": "#E2DCF4",
  "--app-bg-color": "#0f0f0f", //задает общий задний цвет, используется пока в основных окнах и шапках.
  "--app-card-bg": "#201833",
  "--app-border-color": "#3A3054",
  "--app-bg-image": "none",
  "--app-bg-size": "cover",
  "--app-bg-position": "center center",
  "--app-bg-repeat": "no-repeat",
  "--app-bg-overlay-color": "rgba(0,0,0,1)",
  "--app-bg-overlay-opacity": "0",
  "--app-hover-color": "rgba(168,150,230,0.10)",

  "--app-surface": "#201833", //меняет левую навигацию
  "--app-surface-backdrop": "#201833",
  "--app-surface-2": "#260f47", //правая навигация и шапка
  "--app-surface-3": "#2C2147", //
  "--app-surface-variant": "#332A49",
  "--app-on-surface": "#E2DCF4",
  "--app-on-surface-variant": "#C4BCD9",
  "--app-outline": "#4D416B",
  "--app-outline-variant": "#3A3054",
  "--app-divider": "rgba(255,255,255,0.08)",
  "--app-primary": "#A896E6",
  "--app-on-primary": "#1A132E",
  "--app-secondary": "#C7B8FF",
  "--app-on-secondary": "#201833",
  "--app-selected-color": "rgba(168,150,230,0.16)",
  "--app-pressed-color": "rgba(168,150,230,0.24)",
  "--app-focus-ring": "color-mix(in oklab, #A896E6 60%, transparent)",

  "--btn-primary-bg": "#A896E6",
  "--btn-primary-color": "#1A132E",
  "--btn-tonal-bg": "#332A49",
  "--btn-tonal-color": "#E2DCF4",
  "--btn-outline-border": "#4D416B",
  "--btn-outline-hover": "rgba(168,150,230,0.10)",

  "--lnav-bg-color": "#3e1768", //фон левой навигации
  "--mymini-bg-color": "#332A49",
  "--input-bg-color": "#332a49", //фон поля ввода
  "--gradient-bg-color": "#ffff00a",
} as any);

// ——— Синие
const blueLightVuetify: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#F2F7FF",
    surface: "#FFFFFF",
    "surface-variant": "#EAF2FF",
    primary: "#6FA9FF",
    "on-primary": "#FFFFFF",
    secondary: "#95C9FF",
    "on-secondary": "#0F1B33",
    "on-surface": "#142038",
    "on-background": "#111A2C",
    info: "#3A8BFF",
    success: "#24B38B",
    warning: "#F3B14F",
    error: "#E55B6A",
    outline: "#D3E3FF",
    "outline-variant": "#E2EEFF",
    divider: "#00000012",
  },
};
const blueLightVars = sectionDefaults({
  "--app-text-color": "#142038",
  "--app-bg-color": "#F2F7FF",
  "--app-card-bg": "#FFFFFF",
  "--app-border-color": "#E2EEFF",
  "--app-bg-image": "none",
  "--app-bg-size": "cover",
  "--app-bg-position": "center center",
  "--app-bg-repeat": "no-repeat",
  "--app-bg-overlay-color": "rgba(0,0,0,1)",
  "--app-bg-overlay-opacity": "0",
  "--app-hover-color": "rgba(111,169,255,0.10)",

  "--app-surface": "#FFFFFF",
  "--app-surface-backdrop": "#FFFFFF",
  "--app-surface-2": "#F7FAFF",
  "--app-surface-3": "#F0F6FF",
  "--app-surface-variant": "#EAF2FF",
  "--app-on-surface": "#142038",
  "--app-on-surface-variant": "#4A5975",

  "--app-outline": "#D3E3FF",
  "--app-outline-variant": "#E2EEFF",
  "--app-divider": "rgba(0,0,0,0.07)",

  "--app-primary": "#6FA9FF",
  "--app-on-primary": "#FFFFFF",
  "--app-secondary": "#95C9FF",
  "--app-on-secondary": "#0F1B33",

  "--app-selected-color": "rgba(111,169,255,0.16)",
  "--app-pressed-color": "rgba(111,169,255,0.24)",
  "--app-focus-ring": "color-mix(in oklab, #6FA9FF 60%, transparent)",

  "--btn-primary-bg": "#6FA9FF",
  "--btn-primary-color": "#FFFFFF",
  "--btn-tonal-bg": "#EAF2FF",
  "--btn-tonal-color": "#142038",
  "--btn-outline-border": "#D3E3FF",
  "--btn-outline-hover": "rgba(111,169,255,0.10)",

  "--input-bg-color": "#FFFFFF",
  // "--lnav-bg-color": "#3e1768",
  // "--mymini-bg-color": "#332A49",
  // "--gradient-bg-color": "#fdf900",
} as any);

const blueDarkVuetify: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#0F1626",
    surface: "#131C2E",
    "surface-variant": "#1C2A42",
    primary: "#4B94F8",
    "on-primary": "#0D1526",
    secondary: "#74C7FF",
    "on-surface": "#DDE6F7",
    "on-background": "#E3ECFF",
    info: "#7FB7FF",
    success: "#39C7A1",
    warning: "#FCCE6F",
    error: "#FF6B6B",
    outline: "#2B3D5F",
    "outline-variant": "#203251",
    divider: "#FFFFFF10",
  },
};
const blueDarkVars = sectionDefaults({
  "--app-text-color": "#DDE6F7",
  "--app-bg-color": "#0F1626",
  "--app-card-bg": "#131C2E",
  "--app-border-color": "#203251",
  "--app-bg-image": "none",
  "--app-bg-size": "cover",
  "--app-bg-position": "center center",
  "--app-bg-repeat": "no-repeat",
  "--app-bg-overlay-color": "rgba(0,0,0,1)",
  "--app-bg-overlay-opacity": "0",
  "--app-hover-color": "rgba(75,148,248,0.12)",

  "--app-surface": "#131C2E",
  "--app-surface-backdrop": "#131C2E",
  "--app-surface-2": "#162136",
  "--app-surface-3": "#1A2741",
  "--app-surface-variant": "#1C2A42",
  "--app-on-surface": "#DDE6F7",
  "--app-on-surface-variant": "#BFD2F4",
  "--app-outline": "#2B3D5F",
  "--app-outline-variant": "#203251",
  "--app-divider": "rgba(255,255,255,0.08)",
  "--app-primary": "#4B94F8",
  "--app-on-primary": "#0D1526",
  "--app-secondary": "#74C7FF",
  "--app-on-secondary": "#0D1526",
  "--app-selected-color": "rgba(75,148,248,0.16)",
  "--app-pressed-color": "rgba(75,148,248,0.24)",
  "--app-focus-ring": "color-mix(in oklab, #4B94F8 60%, transparent)",

  "--btn-primary-bg": "#4B94F8",
  "--btn-primary-color": "#0D1526",
  "--btn-tonal-bg": "#1C2A42",
  "--btn-tonal-color": "#DDE6F7",
  "--btn-outline-border": "#2B3D5F",
  "--btn-outline-hover": "rgba(75,148,248,0.12)",

  "--input-bg-color": "#1A2741",
  // "--lnav-bg-color": "#3e1768",
  // "--mymini-bg-color": "#332A49",
  // "--gradient-bg-color": "#fdf900",
} as any);

// ——— Зелёные
const greenLightVuetify: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#F3FFF7",
    surface: "#FFFFFF",
    "surface-variant": "#E9F8EE",
    primary: "#47C78E",
    "on-primary": "#0F2A1F",
    secondary: "#78E3B2",
    "on-secondary": "#0F2A1F",
    "on-surface": "#14281E",
    "on-background": "#112219",
    info: "#2FB6A1",
    success: "#28B77E",
    warning: "#F5BE49",
    error: "#E9656A",
    outline: "#CDEEDC",
    "outline-variant": "#E0F6E9",
    divider: "#00000012",
  },
};
const greenLightVars = sectionDefaults({
  "--app-text-color": "#14281E",
  "--app-bg-color": "#F3FFF7",
  "--app-card-bg": "#FFFFFF",
  "--app-border-color": "#E0F6E9",
  "--app-bg-image": "none",
  "--app-bg-size": "cover",
  "--app-bg-position": "center center",
  "--app-bg-repeat": "no-repeat",
  "--app-bg-overlay-color": "rgba(0,0,0,1)",
  "--app-bg-overlay-opacity": "0",
  "--app-hover-color": "rgba(71,199,142,0.10)",

  "--app-surface": "#FFFFFF",
  "--app-surface-backdrop": "#FFFFFF",
  "--app-surface-2": "#F7FFFA",
  "--app-surface-3": "#EFFBF4",
  "--app-surface-variant": "#E9F8EE",
  "--app-on-surface": "#14281E",
  "--app-on-surface-variant": "#3C5C4D",

  "--app-outline": "#CDEEDC",
  "--app-outline-variant": "#E0F6E9",
  "--app-divider": "rgba(0,0,0,0.07)",

  "--app-primary": "#47C78E",
  "--app-on-primary": "#0F2A1F",
  "--app-secondary": "#78E3B2",
  "--app-on-secondary": "#0F2A1F",

  "--app-selected-color": "rgba(71,199,142,0.16)",
  "--app-pressed-color": "rgba(71,199,142,0.24)",
  "--app-focus-ring": "color-mix(in oklab, #47C78E 60%, transparent)",

  "--btn-primary-bg": "#47C78E",
  "--btn-primary-color": "#0F2A1F",
  "--btn-tonal-bg": "#E9F8EE",
  "--btn-tonal-color": "#14281E",
  "--btn-outline-border": "#CDEEDC",
  "--btn-outline-hover": "rgba(71,199,142,0.10)",

  "--input-bg-color": "#FFFFFF",
  // "--lnav-bg-color": "#3e1768",
  // "--mymini-bg-color": "#332A49",
  // "--gradient-bg-color": "#fdf900",
} as any);

const greenDarkVuetify: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#0D1C16",
    surface: "#0F221B",
    "surface-variant": "#163127",
    primary: "#2DAE8B",
    "on-primary": "#0A1B15",
    secondary: "#55D3A8",
    "on-surface": "#D3F1E4",
    "on-background": "#E6FFF3",
    info: "#39C7A1",
    success: "#28C077",
    warning: "#EEC067",
    error: "#FF6B6B",
    outline: "#1C3F30",
    "outline-variant": "#123328",
    divider: "#FFFFFF10",
  },
};
const greenDarkVars = sectionDefaults({
  "--app-text-color": "#D3F1E4",
  "--app-bg-color": "#0D1C16",
  "--app-card-bg": "#0F221B",
  "--app-border-color": "#123328",
  "--app-bg-image": "none",
  "--app-bg-size": "cover",
  "--app-bg-position": "center center",
  "--app-bg-repeat": "no-repeat",
  "--app-bg-overlay-color": "rgba(0,0,0,1)",
  "--app-bg-overlay-opacity": "0",
  "--app-hover-color": "rgba(45,174,139,0.12)",

  "--app-surface": "#0F221B",
  "--app-surface-backdrop": "#0F221B",
  "--app-surface-2": "#11281F",
  "--app-surface-3": "#153024",
  "--app-surface-variant": "#163127",
  "--app-on-surface": "#D3F1E4",
  "--app-on-surface-variant": "#B9E6D5",
  "--app-outline": "#1C3F30",
  "--app-outline-variant": "#123328",
  "--app-divider": "rgba(255,255,255,0.08)",
  "--app-primary": "#2DAE8B",
  "--app-on-primary": "#0A1B15",
  "--app-secondary": "#55D3A8",
  "--app-on-secondary": "#0A1B15",
  "--app-selected-color": "rgba(45,174,139,0.16)",
  "--app-pressed-color": "rgba(45,174,139,0.24)",
  "--app-focus-ring": "color-mix(in oklab, #2DAE8B 60%, transparent)",

  "--btn-primary-bg": "#2DAE8B",
  "--btn-primary-color": "#0A1B15",
  "--btn-tonal-bg": "#163127",
  "--btn-tonal-color": "#D3F1E4",
  "--btn-outline-border": "#1C3F30",
  "--btn-outline-hover": "rgba(45,174,139,0.12)",

  "--input-bg-color": "#153024",
} as any);

// ——— White light (индиго акцент, нейтральные поверхности)
const whiteLightVuetify: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    "surface-variant": "#F6F7FB",
    primary: "#7C8CF8",
    "on-primary": "#FFFFFF",
    secondary: "#A6B4FF",
    "on-secondary": "#0F1B33",
    "on-surface": "#1B2333",
    "on-background": "#111827",
    info: "#4B94F8",
    success: "#35B68D",
    warning: "#F5B64A",
    error: "#E76A78",
    outline: "#E5E7EF",
    "outline-variant": "#EEF0F7",
    divider: "#00000012",
  },
};
const whiteLightVars = sectionDefaults({
  "--app-text-color": "#1B2333",
  "--app-bg-color": "#FFFFFF",
  "--app-card-bg": "#FFFFFF",
  "--app-border-color": "#EEF0F7",
  "--app-bg-image": "none",
  "--app-bg-size": "cover",
  "--app-bg-position": "center center",
  "--app-bg-repeat": "no-repeat",
  "--app-bg-overlay-color": "rgba(0,0,0,1)",
  "--app-bg-overlay-opacity": "0",
  "--app-hover-color": "rgba(17,23,39,0.06)",

  "--app-surface": "#FFFFFF",
  "--app-surface-backdrop": "#FFFFFF",
  "--app-surface-2": "#FAFBFF",
  "--app-surface-3": "#F6F7FB",
  "--app-surface-variant": "#F6F7FB",
  "--app-on-surface": "#1B2333",
  "--app-on-surface-variant": "#495678",
  "--app-outline": "#E5E7EF",
  "--app-outline-variant": "#EEF0F7",
  "--app-divider": "rgba(0,0,0,0.07)",
  "--app-primary": "#7C8CF8",
  "--app-on-primary": "#FFFFFF",
  "--app-secondary": "#A6B4FF",
  "--app-on-secondary": "#0F1B33",
  "--app-selected-color": "rgba(124,140,248,0.14)",
  "--app-pressed-color": "rgba(124,140,248,0.22)",
  "--app-focus-ring": "color-mix(in oklab, #7C8CF8 60%, transparent)",

  "--btn-primary-bg": "#7C8CF8",
  "--btn-primary-color": "#FFFFFF",
  "--btn-tonal-bg": "#F0F2FD",
  "--btn-tonal-color": "#1B2333",
  "--btn-outline-border": "#E5E7EF",
  "--btn-outline-hover": "rgba(17,23,39,0.06)",

  "--input-bg-color": "#FFFFFF",
  // "--lnav-bg-color": "#3e1768",
  // "--mymini-bg-color": "#332A49",
  // "--gradient-bg-color": "#fdf900",
} as any);

// ——— Void (чёрный+белый, фиолетовый только для акцентов)
const voidDarkVuetify: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#0B0B0F",
    surface: "#111116",
    "surface-variant": "#17171C",
    primary: "#9D7BFF",
    "on-primary": "#0E0E12",
    secondary: "#A6B4FF",
    "on-surface": "#E6E6F0",
    "on-background": "#F0F0FA",
    info: "#7FB7FF",
    success: "#34D399",
    warning: "#F59E0B",
    error: "#F87171",
    outline: "#232329",
    "outline-variant": "#1A1A20",
    divider: "#FFFFFF10",
  },
};
const voidDarkVars = sectionDefaults({
  "--app-text-color": "#E6E6F0",
  "--app-bg-color": "#0B0B0F",
  "--app-card-bg": "#111116",
  "--app-border-color": "#1A1A20",
  "--app-bg-image": "none",
  "--app-bg-size": "cover",
  "--app-bg-position": "center center",
  "--app-bg-repeat": "no-repeat",
  "--app-bg-overlay-color": "rgba(0,0,0,1)",
  "--app-bg-overlay-opacity": "0",
  "--app-hover-color": "rgba(255,255,255,0.06)",

  "--app-surface": "#111116",
  "--app-surface-backdrop": "#111116",
  "--app-surface-2": "#14141A",
  "--app-surface-3": "#17171C",
  "--app-surface-variant": "#17171C",
  "--app-on-surface": "#E6E6F0",
  "--app-on-surface-variant": "#B8B8CC",
  "--app-outline": "#232329",
  "--app-outline-variant": "#1A1A20",
  "--app-divider": "rgba(255,255,255,0.07)",
  "--app-primary": "#9D7BFF",
  "--app-on-primary": "#0E0E12",
  "--app-secondary": "#A6B4FF",
  "--app-on-secondary": "#0E0E12",
  "--app-selected-color": "rgba(255,255,255,0.09)",
  "--app-pressed-color": "rgba(255,255,255,0.14)",
  "--app-focus-ring": "color-mix(in oklab, #9D7BFF 60%, transparent)",

  "--btn-primary-bg": "#9D7BFF",
  "--btn-primary-color": "#0E0E12",
  "--btn-tonal-bg": "#17171C",
  "--btn-tonal-color": "#E6E6F0",
  "--btn-outline-border": "#232329",
  "--btn-outline-hover": "rgba(255,255,255,0.06)",

  "--input-bg-color": "#17171C",
  // "--lnav-bg-color": "#3e1768",
  // "--mymini-bg-color": "#332A49",
  // "--gradient-bg-color": "#fdf900",
} as any);

// РЕЕСТР
export const systemVuetify: Record<SystemTheme, ThemeDefinition> = {
  classic: violetDarkVuetify,
  sakura: violetLightVuetify,
  ocean: blueDarkVuetify,
  clouds: blueLightVuetify,
  lime: greenLightVuetify,
  hacker: greenDarkVuetify,
  white: whiteLightVuetify,
  void: voidDarkVuetify,
};

export const systemVars: Record<SystemTheme, CssVars> = {
  classic: violetDarkVars,
  sakura: violetLightVars,
  ocean: blueDarkVars,
  clouds: blueLightVars,
  lime: greenLightVars,
  hacker: greenDarkVars,
  white: whiteLightVars,
  void: voidDarkVars,
};

// Для обратной совместимости:
export const lightAlias: SystemTheme = "sakura";
export const darkAlias: SystemTheme = "classic";
