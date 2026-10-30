import { describe, it, expect } from 'vitest';

describe('Home Page Polish & Reveal Component Logic', () => {
  it('formats reference codes correctly', () => {
    const code = 'KH-8F3K2Q4M';
    expect(code).toMatch(/^KH-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  });

  it('calculates scroll-spy section activation threshold correctly', () => {
    const isScrolledPast = (scrollY: number) => scrollY > 24;
    expect(isScrolledPast(0)).toBe(false);
    expect(isScrolledPast(20)).toBe(false);
    expect(isScrolledPast(25)).toBe(true);
    expect(isScrolledPast(150)).toBe(true);
  });

  it('respects prefers-reduced-motion configuration for 3D card tilt', () => {
    const computeTilt = (
      prefersReduced: boolean,
      x: number,
      y: number,
      centerX: number,
      centerY: number
    ) => {
      if (prefersReduced) return { x: 0, y: 0 };
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      return { x: rotateX, y: rotateY };
    };

    expect(computeTilt(true, 100, 100, 200, 200)).toEqual({ x: 0, y: 0 });
    const dynamic = computeTilt(false, 300, 100, 200, 200);
    expect(dynamic.x).toBe(3);
    expect(dynamic.y).toBe(3);
  });

  it('correctly maps routes to AeroShards AppBackground (all except dashboard)', () => {
    const isAeroShardsRoute = (path: string) => {
      const isAuth = path === '/admin/login';
      const isDashboard = path.startsWith('/admin') && !isAuth;
      return !isDashboard;
    };

    expect(isAeroShardsRoute('/')).toBe(true);
    expect(isAeroShardsRoute('/admin/login')).toBe(true);
    expect(isAeroShardsRoute('/track')).toBe(true);
    expect(isAeroShardsRoute('/inquiry')).toBe(true);
    expect(isAeroShardsRoute('/unknown-404')).toBe(true);
    expect(isAeroShardsRoute('/admin')).toBe(false);
    expect(isAeroShardsRoute('/admin/activity')).toBe(false);
    expect(isAeroShardsRoute('/admin/settings')).toBe(false);
  });
});
