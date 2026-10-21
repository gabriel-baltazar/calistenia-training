// Bips do cronômetro via Web Audio. Um AudioContext compartilhado, criado lazy e retomado dentro de um gesto
// do usuário (exigência do iOS). Frequências/durações do legado; ganho 0.25 com rampa exponencial.
// Qualquer erro de áudio é ignorado (console.debug).

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let muted = false;

export function setAudioMuted(value: boolean): void {
  muted = value;
}

function getContext(): AudioContext | null {
  if (context) return context;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
}

/** Chamar dentro de um gesto do usuário (clique) para destravar o áudio. */
export function unlockAudio(): void {
  try {
    const ctx = getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch((err: unknown) => console.debug('[audio] resume falhou', err));
    }
  } catch (err) {
    console.debug('[audio] indisponível', err);
  }
}

function tone(frequency: number, durationSec: number, delayMs = 0): void {
  if (muted) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch((err: unknown) => console.debug('[audio] resume falhou', err));
    }
    const start = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.25, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + durationSec);
  } catch (err) {
    console.debug('[audio] bip falhou', err);
  }
}

/** Início do timer: 620 Hz / 0.08 s. */
export function beepStart(): void {
  tone(620, 0.08);
}

/** Últimos 3, 2, 1 s: 520 Hz / 0.1 s. */
export function beepTick(): void {
  tone(520, 0.1);
}

/** Fim do countdown (sempre duplo): 940 Hz / 0.35 s + 940 Hz / 0.4 s após 240 ms. */
export function beepEnd(): void {
  tone(940, 0.35);
  tone(940, 0.4, 240);
}

/** Conclusão de dia: 660 Hz / 0.12 s + 880 Hz / 0.22 s após 140 ms. */
export function beepDayDone(): void {
  tone(660, 0.12);
  tone(880, 0.22, 140);
}
