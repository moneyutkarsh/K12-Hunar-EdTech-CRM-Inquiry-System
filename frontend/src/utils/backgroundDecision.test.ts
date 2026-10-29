import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldUseWebGLBackground,
  getStoredBackgroundSetting,
  setStoredBackgroundSetting,
} from './backgroundDecision';

describe('shouldUseWebGLBackground decision logic', () => {
  it('disables immediately when user setting is "off"', () => {
    const result = shouldUseWebGLBackground({
      setting: 'off',
      hasWebGL2: true,
      prefersReducedMotion: false,
      viewportWidth: 1440,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      saveData: false,
    });
    expect(result).toBe(false);
  });

  it('disables when WebGL2 is not supported', () => {
    const result = shouldUseWebGLBackground({
      setting: 'auto',
      hasWebGL2: false,
      prefersReducedMotion: false,
      viewportWidth: 1440,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      saveData: false,
    });
    expect(result).toBe(false);
  });

  it('enables when setting is explicitly "on" (overriding heuristics if WebGL2 supported)', () => {
    const result = shouldUseWebGLBackground({
      setting: 'on',
      hasWebGL2: true,
      prefersReducedMotion: true,
      viewportWidth: 390,
      deviceMemory: 2,
      hardwareConcurrency: 2,
      saveData: true,
    });
    expect(result).toBe(true);
  });

  it('disables in auto mode when prefers-reduced-motion is true', () => {
    const result = shouldUseWebGLBackground({
      setting: 'auto',
      hasWebGL2: true,
      prefersReducedMotion: true,
      viewportWidth: 1440,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      saveData: false,
    });
    expect(result).toBe(false);
  });

  it('disables in auto mode on mobile screens (viewport < 768px)', () => {
    const result = shouldUseWebGLBackground({
      setting: 'auto',
      hasWebGL2: true,
      prefersReducedMotion: false,
      viewportWidth: 390,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      saveData: false,
    });
    expect(result).toBe(false);
  });

  it('disables in auto mode when saveData (Data Saver) is active', () => {
    const result = shouldUseWebGLBackground({
      setting: 'auto',
      hasWebGL2: true,
      prefersReducedMotion: false,
      viewportWidth: 1440,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      saveData: true,
    });
    expect(result).toBe(false);
  });

  it('disables in auto mode when deviceMemory is under 4GB', () => {
    const result = shouldUseWebGLBackground({
      setting: 'auto',
      hasWebGL2: true,
      prefersReducedMotion: false,
      viewportWidth: 1440,
      deviceMemory: 2,
      hardwareConcurrency: 8,
      saveData: false,
    });
    expect(result).toBe(false);
  });

  it('disables in auto mode when hardwareConcurrency is under 4 cores', () => {
    const result = shouldUseWebGLBackground({
      setting: 'auto',
      hasWebGL2: true,
      prefersReducedMotion: false,
      viewportWidth: 1440,
      deviceMemory: 8,
      hardwareConcurrency: 2,
      saveData: false,
    });
    expect(result).toBe(false);
  });

  it('enables in auto mode on capable desktop hardware', () => {
    const result = shouldUseWebGLBackground({
      setting: 'auto',
      hasWebGL2: true,
      prefersReducedMotion: false,
      viewportWidth: 1440,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      saveData: false,
    });
    expect(result).toBe(true);
  });
});

describe('Background setting localStorage persistence', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      length: store.size,
    };
  });

  it('defaults to "auto" when nothing is stored', () => {
    expect(getStoredBackgroundSetting()).toBe('auto');
  });

  it('persists and retrieves "off"', () => {
    setStoredBackgroundSetting('off');
    expect(getStoredBackgroundSetting()).toBe('off');
  });

  it('persists and retrieves "on"', () => {
    setStoredBackgroundSetting('on');
    expect(getStoredBackgroundSetting()).toBe('on');
  });

  it('persists and retrieves "auto"', () => {
    setStoredBackgroundSetting('auto');
    expect(getStoredBackgroundSetting()).toBe('auto');
  });
});
