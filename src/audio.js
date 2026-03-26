const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

export function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, dur = 0.08, type = 'sine', vol = 0.15) {
  try {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch {}
}

export const soundScore = () => playTone(660, 0.08);
export const soundDeuce = () => { playTone(440, 0.15, 'triangle', 0.2); setTimeout(() => playTone(550, 0.15, 'triangle', 0.2), 160); };
export const soundWin = () => { [0, 150, 300, 450].forEach((d, i) => setTimeout(() => playTone([523, 659, 784, 1047][i], 0.2, 'sine', 0.2), d)); };
export const soundUndo = () => playTone(330, 0.06, 'square', 0.08);
export const vib = (ms = 15) => { if (navigator.vibrate) navigator.vibrate(ms); };
