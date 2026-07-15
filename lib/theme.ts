export type AppTheme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'zrgb-theme'

export function isAppTheme(value: string): value is AppTheme {
  return value === 'dark' || value === 'light'
}

export function applyThemeClass(theme: AppTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root.dataset.theme = theme
}

export function readStoredTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw && isAppTheme(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'dark'
}

/** Inline boot script — applies saved theme before paint to avoid flash. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark')t='dark';var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.classList.toggle('light',t==='light');r.dataset.theme=t;}catch(e){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}})();`
