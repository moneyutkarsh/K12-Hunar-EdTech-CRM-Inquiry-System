export type BackgroundSetting = 'auto' | 'on' | 'off';

export interface BackgroundEnv {
  setting: BackgroundSetting;
  prefersReducedMotion: boolean;
  viewportWidth: number;
  hasWebGL2: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
}

/**
 * Pure function to determine whether the WebGL GridScan background should be active.
 *
 * Rules:
 * 1. If setting === 'off' -> false immediately.
 * 2. If WebGL2 is not supported -> false.
 * 3. If setting === 'on' -> true (user override for hardware/motion heuristics).
 * 4. Auto mode heuristics:
 *    - prefers-reduced-motion -> false
 *    - viewport width < 768px (mobile) -> false
 *    - navigator.connection.saveData is true -> false
 *    - deviceMemory < 4 GB -> false
 *    - hardwareConcurrency < 4 cores -> false
 *    - otherwise -> true
 */
export function shouldUseWebGLBackground(env: BackgroundEnv): boolean {
  if (env.setting === 'off') {
    return false;
  }

  if (!env.hasWebGL2) {
    return false;
  }

  if (env.setting === 'on') {
    return true;
  }

  // Auto setting heuristics
  if (env.prefersReducedMotion) {
    return false;
  }

  if (env.viewportWidth < 768) {
    return false;
  }

  if (env.saveData) {
    return false;
  }

  if (typeof env.deviceMemory === 'number' && env.deviceMemory < 4) {
    return false;
  }

  if (typeof env.hardwareConcurrency === 'number' && env.hardwareConcurrency < 4) {
    return false;
  }

  return true;
}

export const STORAGE_KEY_BG_SETTING = 'k12_background_setting';

export function getStoredBackgroundSetting(): BackgroundSetting {
  try {
    const val = localStorage.getItem(STORAGE_KEY_BG_SETTING);
    if (val === 'on' || val === 'off' || val === 'auto') {
      return val;
    }
  } catch {
    // ignore
  }
  return 'auto';
}

export function setStoredBackgroundSetting(val: BackgroundSetting): void {
  try {
    localStorage.setItem(STORAGE_KEY_BG_SETTING, val);
  } catch {
    // ignore
  }
}
