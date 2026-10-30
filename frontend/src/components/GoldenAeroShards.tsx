import React, { useEffect, useRef } from 'react';

interface Shard {
  // Wave path parameters
  lane: number; // 0, 1, or 2 (which wave ribbon)
  t: number; // progress along ribbon (0 to 1)
  speed: number;
  offsetY: number;
  offsetZ: number;

  // Geometry
  vertices: Array<[number, number]>; // local 2D polygon vertices
  size: number;

  // 3D Rotation
  yaw: number;
  pitch: number;
  roll: number;
  yawSpeed: number;
  pitchSpeed: number;
  rollSpeed: number;

  // Visual
  opacity: number;
  brightness: number;
  highlightAngle: number;
}

interface PlusMarker {
  x: number;
  y: number;
  alpha: number;
  isBracket?: boolean;
}

interface PulseRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export const GoldenAeroShards: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    // Pulse shockwaves
    const rings: PulseRing[] = [];

    // Helper: generate irregular polygonal shard vertices
    const createShardPolygon = (sides: number, radius: number): Array<[number, number]> => {
      const pts: Array<[number, number]> = [];
      const angleStep = (Math.PI * 2) / sides;
      for (let i = 0; i < sides; i++) {
        const a = i * angleStep + (Math.random() - 0.5) * 0.4;
        const r = radius * (0.6 + Math.random() * 0.7);
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return pts;
    };

    // Generate ~220 shards across 3 flowing diagonal waves
    const SHARD_COUNT = Math.min(240, Math.max(120, Math.floor(width / 7)));
    const shards: Shard[] = [];

    for (let i = 0; i < SHARD_COUNT; i++) {
      const lane = i % 3; // 3 distinct flowing ribbons
      const sides = 3 + Math.floor(Math.random() * 3); // triangles, quads, pentagons
      const baseRadius = 8 + Math.random() * 18;

      shards.push({
        lane,
        t: Math.random(),
        speed: 0.00035 + Math.random() * 0.00045,
        offsetY: (Math.random() - 0.5) * 110,
        offsetZ: (Math.random() - 0.5) * 80,
        vertices: createShardPolygon(sides, baseRadius),
        size: baseRadius,
        yaw: Math.random() * Math.PI * 2,
        pitch: Math.random() * Math.PI * 2,
        roll: Math.random() * Math.PI * 2,
        yawSpeed: (Math.random() - 0.5) * 0.015,
        pitchSpeed: (Math.random() - 0.5) * 0.012,
        rollSpeed: (Math.random() - 0.5) * 0.018,
        opacity: 0.4 + Math.random() * 0.5,
        brightness: 0.7 + Math.random() * 0.5,
        highlightAngle: Math.random() * Math.PI * 2,
      });
    }

    // Static HUD plus markers and targeting brackets
    const markers: PlusMarker[] = [
      { x: 0.06, y: 0.12, alpha: 0.45, isBracket: true },
      { x: 0.18, y: 0.16, alpha: 0.3 },
      { x: 0.32, y: 0.14, alpha: 0.35 },
      { x: 0.48, y: 0.15, alpha: 0.25 },
      { x: 0.65, y: 0.18, alpha: 0.3 },
      { x: 0.82, y: 0.12, alpha: 0.4, isBracket: true },
      { x: 0.94, y: 0.19, alpha: 0.25 },
      { x: 0.12, y: 0.38, alpha: 0.35 },
      { x: 0.25, y: 0.42, alpha: 0.4 },
      { x: 0.42, y: 0.39, alpha: 0.3 },
      { x: 0.58, y: 0.45, alpha: 0.35 },
      { x: 0.76, y: 0.36, alpha: 0.5, isBracket: true },
      { x: 0.91, y: 0.44, alpha: 0.3 },
      { x: 0.08, y: 0.68, alpha: 0.35 },
      { x: 0.28, y: 0.74, alpha: 0.4, isBracket: true },
      { x: 0.45, y: 0.65, alpha: 0.3 },
      { x: 0.68, y: 0.72, alpha: 0.35 },
      { x: 0.86, y: 0.68, alpha: 0.4 },
      { x: 0.35, y: 0.88, alpha: 0.3 },
      { x: 0.62, y: 0.92, alpha: 0.35 },
      { x: 0.88, y: 0.86, alpha: 0.45, isBracket: true },
    ];

    // Ribbon wave path calculators (diagonal waves across screen)
    const getRibbonPoint = (lane: number, t: number): { x: number; y: number; z: number } => {
      // Diagonal progression across viewport
      const startX = -120;
      const endX = width + 140;
      const x = startX + t * (endX - startX);

      // Lane base heights & diagonal tilt
      let baseY = height * 0.45;
      let amplitude = height * 0.18;
      let phase = lane * 1.8;
      let zBase = 1.0;

      if (lane === 0) {
        // Upper wave ribbon
        baseY = height * 0.28 + (t - 0.5) * height * 0.2;
        amplitude = height * 0.14;
        zBase = 0.85;
      } else if (lane === 1) {
        // Main central focal ribbon (dense, prominent)
        baseY = height * 0.52 + (t - 0.5) * height * 0.28;
        amplitude = height * 0.22;
        zBase = 1.15;
      } else {
        // Lower wave ribbon
        baseY = height * 0.76 + (t - 0.5) * height * 0.22;
        amplitude = height * 0.16;
        zBase = 0.95;
      }

      // Compound sinusoidal wave
      const y =
        baseY +
        Math.sin(t * Math.PI * 3.5 + phase) * amplitude +
        Math.cos(t * Math.PI * 2.2 + phase * 0.8) * (amplitude * 0.4);

      const z = zBase + Math.sin(t * Math.PI * 2.5 + phase) * 0.25;

      return { x, y, z };
    };

    // Resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleClick = (e: MouseEvent) => {
      rings.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: Math.min(width, height) * 0.45,
        alpha: 0.85,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Render loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // 1. Clear background to dark obsidian #050505
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient radial golden glow behind waves
      const ambientGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7
      );
      ambientGrad.addColorStop(0, 'rgba(255, 214, 10, 0.09)');
      ambientGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.035)');
      ambientGrad.addColorStop(1, 'rgba(5, 5, 5, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Render HUD Plus Markers & Brackets
      ctx.font = '10px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const m of markers) {
        const mx = m.x * width;
        const my = m.y * height;

        ctx.fillStyle = `rgba(255, 214, 10, ${m.alpha * 0.85})`;
        ctx.fillText('+', mx, my);

        if (m.isBracket) {
          // Draw targeting corner brackets [  ]
          const bs = 10;
          ctx.strokeStyle = `rgba(255, 214, 10, ${m.alpha * 0.75})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(mx - bs, my - bs + 4);
          ctx.lineTo(mx - bs, my - bs);
          ctx.lineTo(mx - bs + 4, my - bs);
          // Top-right
          ctx.moveTo(mx + bs - 4, my - bs);
          ctx.lineTo(mx + bs, my - bs);
          ctx.lineTo(mx + bs, my - bs + 4);
          // Bottom-left
          ctx.moveTo(mx - bs, my + bs - 4);
          ctx.lineTo(mx - bs, my + bs);
          ctx.lineTo(mx - bs + 4, my + bs);
          // Bottom-right
          ctx.moveTo(mx + bs - 4, my + bs);
          ctx.lineTo(mx + bs, my + bs);
          ctx.lineTo(mx + bs, my + bs - 4);
          ctx.stroke();
        }
      }

      // 4. Update and render click pulse shockwaves
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += 5.5;
        ring.alpha *= 0.96;

        if (ring.alpha < 0.02 || ring.radius > ring.maxRadius) {
          rings.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 214, 10, ${ring.alpha * 0.6})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // 5. Update and sort shards by depth (Z)
      const renderList: Array<{
        shard: Shard;
        screenX: number;
        screenY: number;
        scale: number;
        z: number;
        alpha: number;
      }> = [];

      for (const shard of shards) {
        // Advance progress along ribbon
        shard.t = (shard.t + shard.speed * (dt / 16)) % 1;

        // 3D Rotations
        shard.yaw += shard.yawSpeed;
        shard.pitch += shard.pitchSpeed;
        shard.roll += shard.rollSpeed;

        const pathPt = getRibbonPoint(shard.lane, shard.t);

        let curX = pathPt.x;
        let curY = pathPt.y + shard.offsetY;
        const curZ = pathPt.z + shard.offsetZ / 200;

        // Mouse deflection repulsion
        const dx = curX - mouseX;
        const dy = curY - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 1) {
          const force = (1 - dist / 180) * 28;
          curX += (dx / dist) * force;
          curY += (dy / dist) * force;
        }

        // Pulse wave deflection
        for (const ring of rings) {
          const rdx = curX - ring.x;
          const rdy = curY - ring.y;
          const rdist = Math.hypot(rdx, rdy);
          const diff = Math.abs(rdist - ring.radius);
          if (diff < 40 && rdist > 1) {
            const rforce = (1 - diff / 40) * 16 * ring.alpha;
            curX += (rdx / rdist) * rforce;
            curY += (rdy / rdist) * rforce;
          }
        }

        // Fade in/out at viewport boundaries
        const edgeFade = Math.sin(shard.t * Math.PI);
        const finalAlpha = shard.opacity * Math.min(1, edgeFade * 1.8);

        renderList.push({
          shard,
          screenX: curX,
          screenY: curY,
          scale: Math.max(0.4, curZ),
          z: curZ,
          alpha: finalAlpha,
        });
      }

      // Sort by depth (farthest first)
      renderList.sort((a, b) => a.z - b.z);

      // 6. Draw each shard
      for (const item of renderList) {
        const { shard, screenX, screenY, scale, alpha } = item;
        if (alpha <= 0.01) continue;

        ctx.save();
        ctx.translate(screenX, screenY);

        // 3D rotation transform approximation
        ctx.rotate(shard.roll);
        ctx.scale(scale * Math.cos(shard.yaw), scale * Math.cos(shard.pitch));

        // Draw shard polygon
        ctx.beginPath();
        const pts = shard.vertices;
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let j = 1; j < pts.length; j++) {
          ctx.lineTo(pts[j][0], pts[j][1]);
        }
        ctx.closePath();

        // Glass facet fill: gradient with amber/gold shimmer
        const fillGrad = ctx.createLinearGradient(
          -shard.size,
          -shard.size,
          shard.size,
          shard.size
        );
        fillGrad.addColorStop(0, `rgba(255, 232, 133, ${0.16 * alpha})`);
        fillGrad.addColorStop(0.5, `rgba(255, 214, 10, ${0.08 * alpha})`);
        fillGrad.addColorStop(1, `rgba(217, 119, 6, ${0.18 * alpha})`);

        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Sharp golden glowing wireframe edge
        ctx.lineWidth = Math.max(1, 1.4 * scale);
        ctx.strokeStyle = `rgba(255, 214, 10, ${0.85 * alpha})`;
        ctx.stroke();

        // Specular reflection line across shard face (glass sheen)
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * 0.8, pts[0][1] * 0.8);
        ctx.lineTo(pts[Math.floor(pts.length / 2)][0] * 0.8, pts[Math.floor(pts.length / 2)][1] * 0.8);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 * alpha})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden bg-[#050505] pointer-events-none select-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Gentle center contrast mask so cards & typography remain crisp and readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, rgba(5,5,5,0.68) 0%, rgba(5,5,5,0.18) 65%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050505]/80 via-transparent to-[#050505]/50" />
    </div>
  );
};

export default GoldenAeroShards;
