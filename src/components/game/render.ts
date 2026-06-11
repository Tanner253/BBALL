/**
 * Beachball Launch — Canvas 2D renderer.
 * Pure draw code: reads GameState, never mutates it (except camera smoothing).
 * Color values mirror the brand tokens in src/app/globals.css (canvas cannot
 * resolve CSS variables, so they are duplicated here intentionally).
 */

import { BALL_R, GameState, waveHeight } from "./engine";

const C = {
  sky1: "#fff4d6",
  sky2: "#ffd6a0",
  sky3: "#ffb1b8",
  sky4: "#93d8ff",
  skyHigh: "#0b2a55",
  waterShallow: "#6fe0d5",
  waterMid: "#1ab8c7",
  waterDeep: "#0a6a87",
  red: "#ff4d4d",
  blue: "#2f7bff",
  yellow: "#ffd93d",
  green: "#2ecc71",
  orange: "#ff8a2b",
  ink: "#0b1e2e",
};

export type Camera = { x: number; top: number; scale: number };

export function createCamera(): Camera {
  return { x: -10, top: 14, scale: 40 };
}

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function rnd(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function updateCamera(cam: Camera, s: GameState, w: number, h: number, dt: number) {
  const b = s.ball;
  const top = Math.max(11, b.y + 6);
  const bottom = -6;
  const scale = Math.min(54, Math.max(4.2, h / (top - bottom)));
  const targetTop = bottom + h / scale;
  const targetX = b.x - (w / scale) * 0.34;
  const k = 1 - Math.exp(-dt * 5.5);
  cam.scale += (scale - cam.scale) * k;
  cam.top += (targetTop - cam.top) * k;
  cam.x += (targetX - cam.x) * k;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  cam: Camera,
  w: number,
  h: number
) {
  const sx = (wx: number) => (wx - cam.x) * cam.scale;
  const sy = (wy: number) => (cam.top - wy) * cam.scale;

  drawSky(ctx, cam, w, h);
  drawSun(ctx, cam, w, h);
  drawClouds(ctx, cam, w, h, sy);
  drawWater(ctx, s, cam, w, h, sy, 0.8);
  drawMarkers(ctx, s, cam, w, sx, sy);
  drawPickups(ctx, s, sx, sy, cam.scale, w);
  drawBall(ctx, s, sx, sy, cam.scale);
  // Underwater tint over everything below the surface (gives submerged depth).
  drawWater(ctx, s, cam, w, h, sy, 0.28);
  drawParticles(ctx, s, sx, sy, cam.scale);
  if (s.phase === "charging") drawAim(ctx, s, sx, sy);
}

// ---------------- Layers ----------------

function drawSky(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number) {
  // Blend toward a dark "edge of space" sky as the camera climbs.
  const high = Math.min(1, Math.max(0, (cam.top - 26) / 110));
  const g = ctx.createLinearGradient(0, 0, 0, h);
  if (high < 0.55) {
    g.addColorStop(0, mix(C.sky4, C.skyHigh, high * 1.6));
    g.addColorStop(0.45, mix(C.sky3, C.sky4, high));
    g.addColorStop(0.75, mix(C.sky2, C.sky3, high));
    g.addColorStop(1, mix(C.sky1, C.sky2, high));
  } else {
    g.addColorStop(0, C.skyHigh);
    g.addColorStop(0.6, mix(C.sky4, C.skyHigh, high));
    g.addColorStop(1, mix(C.sky2, C.sky4, high));
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (high > 0.25) {
    ctx.save();
    ctx.globalAlpha = (high - 0.25) * 1.2;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 70; i++) {
      const px = rnd(i) * w;
      const py = rnd(i + 500) * h * 0.7;
      const r = 0.6 + rnd(i + 900) * 1.3;
      ctx.globalAlpha = Math.min(1, (high - 0.25) * (0.5 + rnd(i + 50)));
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawSun(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number) {
  // Far-field: nearly fixed on screen, drifts subtly with travel + altitude.
  const px = w * 0.78 - (cam.x * 0.02) % (w * 0.2);
  const py = h * 0.16 + (cam.top - 17) * 0.4;
  if (py > h) return;
  const r = Math.min(w, h) * 0.085;
  const glow = ctx.createRadialGradient(px, py, r * 0.2, px, py, r * 3.2);
  glow.addColorStop(0, "rgba(255, 240, 180, 0.85)");
  glow.addColorStop(0.35, "rgba(255, 200, 120, 0.35)");
  glow.addColorStop(1, "rgba(255, 160, 100, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(px - r * 3.2, py - r * 3.2, r * 6.4, r * 6.4);
  const core = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
  core.addColorStop(0, "#fff8c2");
  core.addColorStop(0.6, "#ffd36a");
  core.addColorStop(1, "#ff9a4d");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  w: number,
  h: number,
  sy: (n: number) => number
) {
  for (const layer of [
    { p: 0.35, spacing: 55, size: 1.6, alpha: 0.5, yBase: 16, ySpread: 26 },
    { p: 0.7, spacing: 38, size: 1.0, alpha: 0.8, yBase: 5, ySpread: 12 },
  ]) {
    const camX = cam.x * layer.p;
    const range = w / cam.scale;
    const i0 = Math.floor(camX / layer.spacing) - 1;
    const i1 = Math.ceil((camX + range) / layer.spacing) + 1;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255," + layer.alpha + ")";
    for (let i = i0; i <= i1; i++) {
      const wx = i * layer.spacing + rnd(i * 7 + 1) * layer.spacing * 0.6;
      const wy = layer.yBase + rnd(i * 7 + 2) * layer.ySpread;
      const px = (wx - camX) * cam.scale;
      const py = sy(wy);
      if (py < -80 || py > h + 80) continue;
      const r = (3 + rnd(i * 7 + 3) * 3) * layer.size * cam.scale * 0.45;
      cloudPuff(ctx, px, py, r);
    }
    ctx.restore();
  }
}

function cloudPuff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.6, r * 0.62, 0, 0, Math.PI * 2);
  ctx.ellipse(x - r * 0.9, y + r * 0.18, r * 0.8, r * 0.45, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.95, y + r * 0.2, r * 0.7, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  cam: Camera,
  w: number,
  h: number,
  sy: (n: number) => number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  const stepPx = 14;
  ctx.moveTo(0, sy(waveHeight(cam.x, s.t)));
  for (let px = stepPx; px <= w + stepPx; px += stepPx) {
    const wx = cam.x + px / cam.scale;
    ctx.lineTo(px, sy(waveHeight(wx, s.t)));
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();

  const g = ctx.createLinearGradient(0, sy(0.6), 0, h);
  g.addColorStop(0, C.waterShallow);
  g.addColorStop(0.4, C.waterMid);
  g.addColorStop(1, C.waterDeep);
  ctx.fillStyle = g;
  ctx.fill();

  // Foam line along the surface.
  ctx.globalAlpha = Math.min(1, alpha + 0.15);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = Math.max(1.5, cam.scale * 0.06);
  ctx.beginPath();
  ctx.moveTo(0, sy(waveHeight(cam.x, s.t)));
  for (let px = stepPx; px <= w + stepPx; px += stepPx) {
    const wx = cam.x + px / cam.scale;
    ctx.lineTo(px, sy(waveHeight(wx, s.t)));
  }
  ctx.stroke();
  ctx.restore();
}

function drawMarkers(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  cam: Camera,
  w: number,
  sx: (n: number) => number,
  sy: (n: number) => number
) {
  const range = w / cam.scale;
  const m0 = Math.max(50, Math.floor(cam.x / 50) * 50);
  ctx.save();
  ctx.textAlign = "center";
  for (let m = m0; m < cam.x + range + 50; m += 50) {
    const px = sx(m);
    const surf = sy(waveHeight(m, s.t));
    const poleH = cam.scale * 2.2;
    ctx.strokeStyle = "rgba(11,30,46,0.65)";
    ctx.lineWidth = Math.max(1.5, cam.scale * 0.08);
    ctx.beginPath();
    ctx.moveTo(px, surf + cam.scale * 0.3);
    ctx.lineTo(px, surf - poleH);
    ctx.stroke();
    ctx.fillStyle = m % 500 === 0 ? C.red : C.orange;
    ctx.beginPath();
    ctx.moveTo(px, surf - poleH);
    ctx.lineTo(px + cam.scale * 1.1, surf - poleH + cam.scale * 0.38);
    ctx.lineTo(px, surf - poleH + cam.scale * 0.76);
    ctx.closePath();
    ctx.fill();
    const fs = Math.max(10, cam.scale * 0.5);
    ctx.font = `700 ${fs}px ui-monospace, monospace`;
    ctx.fillStyle = "rgba(11,30,46,0.8)";
    ctx.fillText(`${m}m`, px, surf - poleH - fs * 0.5);
  }
  ctx.restore();
}

function drawPickups(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sx: (n: number) => number,
  sy: (n: number) => number,
  scale: number,
  w: number
) {
  for (const p of s.pickups) {
    if (p.taken) continue;
    const px = sx(p.x);
    if (px < -60 || px > w + 60) continue;
    const bob = Math.sin(s.t * 2 + p.id) * 0.15;
    if (p.type === "coin") {
      const py = sy(p.y + bob);
      const r = scale * 0.55;
      ctx.save();
      ctx.shadowColor = "rgba(255,217,61,0.8)";
      ctx.shadowBlur = r * 0.6;
      ctx.fillStyle = C.yellow;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(180,120,0,0.65)";
      ctx.lineWidth = Math.max(1, r * 0.14);
      ctx.stroke();
      ctx.fillStyle = "#9a6a00";
      ctx.font = `800 ${r * 1.15}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", px, py + r * 0.06);
      ctx.restore();
    } else if (p.type === "ring") {
      const py = sy(p.y + bob);
      const r = scale * 1.5;
      ctx.save();
      ctx.shadowColor = "rgba(255,138,43,0.9)";
      ctx.shadowBlur = r * 0.5;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = Math.max(3, scale * 0.3);
      ctx.beginPath();
      ctx.ellipse(px, py, r * 0.55, r, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // Red candle buoy — the enemy of every chart.
      const py = sy(waveHeight(p.x, s.t) + 0.7);
      const bw = scale * 0.62;
      const bh = scale * 1.5;
      ctx.save();
      ctx.strokeStyle = "#c22222";
      ctx.lineWidth = Math.max(2, scale * 0.1);
      ctx.beginPath();
      ctx.moveTo(px, py - bh * 0.85);
      ctx.lineTo(px, py + bh * 0.85);
      ctx.stroke();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.roundRect(px - bw / 2, py - bh / 2, bw, bh, bw * 0.2);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,10,10,0.7)";
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sx: (n: number) => number,
  sy: (n: number) => number,
  scale: number
) {
  const px = sx(s.ball.x);
  const py = sy(s.ball.y);
  const r = BALL_R * scale;
  const colors = [C.red, C.yellow, C.green, C.blue, C.orange];

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(s.ball.spin);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, (i * 2 * Math.PI) / 5, ((i + 1) * 2 * Math.PI) / 5);
    ctx.closePath();
    ctx.fill();
  }
  // White cap.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  // Shading + specular highlight.
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, "rgba(255,255,255,0.75)");
  g.addColorStop(0.45, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();
  ctx.restore();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sx: (n: number) => number,
  sy: (n: number) => number,
  scale: number
) {
  for (const p of s.particles) {
    const a = Math.max(0, p.life / p.max);
    const px = sx(p.x);
    const py = sy(p.y);
    const r = scale * (p.kind === "splash" ? 0.16 : 0.13) * (0.6 + a);
    ctx.globalAlpha = a;
    if (p.kind === "bubble") {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle =
        p.kind === "spark" ? C.yellow : p.kind === "hit" ? C.red : "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawAim(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  sx: (n: number) => number,
  sy: (n: number) => number
) {
  const ox = sx(0);
  const oy = sy(0.4);
  const rad = (s.aimDeg * Math.PI) / 180;
  const len = 56 + 110 * s.charge;
  const ex = ox + Math.cos(rad) * len;
  const ey = oy - Math.sin(rad) * len;

  ctx.save();
  ctx.strokeStyle = mix(C.yellow, C.red, s.charge);
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 7]);
  ctx.lineDashOffset = -s.t * 40;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.setLineDash([]);
  // Arrowhead.
  ctx.fillStyle = mix(C.yellow, C.red, s.charge);
  ctx.translate(ex, ey);
  ctx.rotate(-rad);
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-6, -8);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------- Color helpers ----------------

function mix(a: string, b: string, t: number): string {
  const ca = hex(a);
  const cb = hex(b);
  const k = Math.min(1, Math.max(0, t));
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * k);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * k);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * k);
  return `rgb(${r},${g},${bl})`;
}

function hex(c: string): [number, number, number] {
  return [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
}
