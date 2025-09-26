// theme/presets.ts
import type { ThemeDefinition } from 'vuetify'

export const lightVuetify: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#f5f6f8',
    surface: '#ffffff',
    primary: '#4f9cf9',
    secondary: '#6c757d',
    error: '#ef4444',
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    onBackground: '#111111',
    onSurface: '#111111',
  },
}

export const darkVuetify: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#1b1b1b',
    surface: '#232323',
    primary: '#4f9cf9',
    secondary: '#9aa0a6',
    error: '#ef4444',
    info: '#60a5fa',
    success: '#10b981',
    warning: '#f59e0b',
    onBackground: '#ffffff',
    onSurface: '#ffffff',
  },
}

export type CssVars = {
  '--app-text-color': string
  '--app-bg-color': string
  '--app-card-bg': string
  '--app-border-color': string
  '--app-bg-image': string
  '--app-bg-size': string
  '--app-bg-position': string
  '--app-bg-repeat': string
  '--app-bg-overlay-color': string
  '--app-bg-overlay-opacity': string
  // NEW
  '--app-hover-color': string
}

export const lightVars: CssVars = {
  '--app-text-color': '#111111',
  '--app-bg-color': '#f5f6f8',
  '--app-card-bg': '#ffffff',
  '--app-border-color': '#e5e7eb',
  '--app-bg-image': 'none',
  '--app-bg-size': 'cover',
  '--app-bg-position': 'center center',
  '--app-bg-repeat': 'no-repeat',
  '--app-bg-overlay-color': 'rgba(0,0,0,1)',
  '--app-bg-overlay-opacity': '0',
  '--app-hover-color': 'rgba(0,0,0,0.06)',
}

export const darkVars: CssVars = {
  '--app-text-color': '#ffffff',
  '--app-bg-color': '#1f1f1f',
  '--app-card-bg': '#292929',
  '--app-border-color': '#2c2c2c',
  '--app-bg-image': 'none',
  '--app-bg-size': 'cover',
  '--app-bg-position': 'center center',
  '--app-bg-repeat': 'no-repeat',
  '--app-bg-overlay-color': 'rgba(0,0,0,1)',
  '--app-bg-overlay-opacity': '0',
  '--app-hover-color': 'rgba(255,255,255,0.08)',
}