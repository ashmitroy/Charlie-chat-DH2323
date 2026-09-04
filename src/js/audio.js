// Procedural audio: no samples, everything synthesized with raw Web Audio
// API oscillator/gain/panner nodes. Mirrors the shader philosophy: built
// from first principles instead of loaded from a library or asset file.

let audioCtx = null;
let audioReady = false;

let droneGain, dronePanner, droneOscA, droneOscB;

function initAudio() {
  if (audioReady) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  droneGain = audioCtx.createGain();
  droneGain.gain.value = 0.0;

  dronePanner = audioCtx.createStereoPanner();
  dronePanner.pan.value = 0;

  droneOscA = audioCtx.createOscillator();
  droneOscA.type = 'sine';
  droneOscA.frequency.value = 58;

  droneOscB = audioCtx.createOscillator();
  droneOscB.type = 'triangle';
  droneOscB.frequency.value = 61.5; // detuned against A for a slow beat

  droneOscA.connect(droneGain);
  droneOscB.connect(droneGain);
  droneGain.connect(dronePanner);
  dronePanner.connect(audioCtx.destination);

  droneOscA.start();
  droneOscB.start();

  audioReady = true;
}

// intensity: 0 (far from Charlie) .. 1 (right on top of you)
function setDroneIntensity(intensity) {
  if (!audioReady) return;
  const t = audioCtx.currentTime;
  const clamped = Math.max(0, Math.min(1, intensity));
  droneGain.gain.linearRampToValueAtTime(0.015 + clamped * 0.05, t + 0.15);
  droneOscB.frequency.linearRampToValueAtTime(61.5 + clamped * 6, t + 0.15);
}

// pan: -1 (left) .. 1 (right), Charlie's position relative to the player
function setDronePan(pan) {
  if (!audioReady) return;
  const clamped = Math.max(-1, Math.min(1, pan));
  dronePanner.pan.linearRampToValueAtTime(clamped, audioCtx.currentTime + 0.1);
}

function playBlip() {
  if (!audioReady) return;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = 320;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const t = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.04, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.start(t);
  osc.stop(t + 0.05);
}

function playVanishWhoosh() {
  if (!audioReady) return;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  const t = audioCtx.currentTime;
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.5);
  gain.gain.setValueAtTime(0.09, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.6);
}

function playConfrontSting() {
  if (!audioReady) return;
  const t = audioCtx.currentTime;
  [220, 233.08, 246.94].forEach((freq) => {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.9);
  });
}
