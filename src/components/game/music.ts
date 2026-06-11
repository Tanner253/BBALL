/**
 * Procedural background music — a chill beach loop synthesized live with
 * Web Audio (no audio assets). A lookahead scheduler keeps timing tight even
 * when the tab hiccups. Shares the AudioContext with sfx.ts.
 */

import { ensureAudio, getAudioContext } from "./sfx";

const MUSIC_KEY = "bball:game:music";
const TEMPO = 92;
const STEP = 60 / TEMPO / 2; // 8th notes
const BAR = 8; // steps per bar
const LOOKAHEAD_S = 0.6;
const TICK_MS = 200;

// C major pentatonic, friendly anywhere in the progression.
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
// I–vi–IV–V in C, one chord per bar.
const BASS = [65.41, 55.0, 43.65, 49.0]; // C2 A1 F1 G1
const CHORDS: number[][] = [
  [261.63, 329.63, 392.0], // C
  [220.0, 261.63, 329.63], // Am
  [174.61, 220.0, 261.63], // F
  [196.0, 246.94, 293.66], // G
];

let musicOn = false;
let loaded = false;
let timer: ReturnType<typeof setInterval> | null = null;
let master: GainNode | null = null;
let nextTime = 0;
let stepIdx = 0;

const listeners = new Set<() => void>();

// useSyncExternalStore-compatible music state ------------------------------

export function subscribeMusic(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getMusicSnapshot(): boolean {
  if (!loaded) {
    loaded = true;
    try {
      // Music defaults ON for new players.
      musicOn = window.localStorage.getItem(MUSIC_KEY) !== "0";
    } catch {
      musicOn = true;
    }
  }
  return musicOn;
}

export function getMusicServerSnapshot(): boolean {
  return false;
}

export function setMusicOn(on: boolean) {
  musicOn = on;
  loaded = true;
  try {
    window.localStorage.setItem(MUSIC_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
  if (on) {
    ensureAudio();
    startMusic();
  } else {
    stopMusic();
  }
  listeners.forEach((l) => l());
}

/** Call from a user gesture; starts the loop if music is enabled. */
export function maybeStartMusic() {
  if (getMusicSnapshot()) startMusic();
}

// Scheduler ----------------------------------------------------------------

function startMusic() {
  const ctx = getAudioContext();
  if (!ctx || timer) return;
  if (!master) {
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  }
  nextTime = ctx.currentTime + 0.1;
  stepIdx = 0;
  timer = setInterval(() => {
    const c = getAudioContext();
    if (!c || !master) return;
    while (nextTime < c.currentTime + LOOKAHEAD_S) {
      scheduleStep(c, master, stepIdx, nextTime);
      stepIdx = (stepIdx + 1) % (BAR * 4);
      nextTime += STEP;
    }
  }, TICK_MS);
}

function stopMusic() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function scheduleStep(ctx: AudioContext, out: GainNode, step: number, t: number) {
  const bar = Math.floor(step / BAR) % 4;
  const inBar = step % BAR;

  // Bass: root on beats 1 and 3, an octave hop on 3.
  if (inBar === 0 || inBar === 4) {
    note(ctx, out, BASS[bar] * (inBar === 4 ? 2 : 1), t, STEP * 3.4, "triangle", 0.55, 0.02);
  }

  // Pad: soft chord swell at the top of each bar.
  if (inBar === 0) {
    for (const f of CHORDS[bar]) {
      note(ctx, out, f, t, STEP * BAR * 0.95, "sine", 0.1, 0.4);
    }
  }

  // Melody: sparse pentatonic plucks on off-beats, gently randomized.
  if (inBar % 2 === 1 && Math.random() < 0.62) {
    const f = PENTA[Math.floor(Math.random() * PENTA.length)];
    note(ctx, out, f, t, STEP * 1.6, "triangle", 0.22, 0.01);
  }

  // Percussion: shaker tick on every off 8th.
  if (inBar % 2 === 0) {
    tick(ctx, out, t, inBar === 0 ? 0.1 : 0.05);
  }
}

function note(
  ctx: AudioContext,
  out: GainNode,
  freq: number,
  t: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  attack: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function tick(ctx: AudioContext, out: GainNode, t: number, vol: number) {
  const len = Math.ceil(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 6000;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(out);
  src.start(t);
}
