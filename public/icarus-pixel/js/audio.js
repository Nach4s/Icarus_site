// ─── Audio Engine (Web Audio API) ────────────────────────────
let audioCtx = null;
let bgGain = null;
let bgOscNodes = [];

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    bgGain = audioCtx.createGain();
    bgGain.gain.value = muted ? 0 : 0.18;
    bgGain.connect(audioCtx.destination);
  } catch (e) { /* audio not available */ }
}

function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function startBgMusic() {
  if (!audioCtx || bgOscNodes.length) return;
  const notes = [65.41, 87.31, 98.00, 110.00, 130.81];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.05 - i * 0.008;
    osc.connect(gain);
    gain.connect(bgGain);
    osc.start();
    bgOscNodes.push({ osc, gain });
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.07 + i * 0.03;
    lfoGain.gain.value = freq * 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    bgOscNodes.push({ osc: lfo, gain: lfoGain });
  });
}

function stopBgMusic() {
  bgOscNodes.forEach(({ osc }) => { try { osc.stop(); } catch (e) { } });
  bgOscNodes = [];
}

function playSfxClick() {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(660, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 0.12);
}

// The decaying noise burst is generated once and reused — building 0.5s of
// samples on every explosion caused hitches when several blew up at once
let explosionNoiseBuf = null;

function playSfxExplosion() {
  if (!audioCtx || muted) return;
  if (!explosionNoiseBuf) {
    const bufLen = audioCtx.sampleRate * 0.5;
    explosionNoiseBuf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const data = explosionNoiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2);
  }
  const buf = explosionNoiseBuf;
  const src = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  const filt = audioCtx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(600, audioCtx.currentTime);
  filt.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.9, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  src.buffer = buf;
  src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
  src.start();
}

function playSfxLevelUp() {
  if (!audioCtx || muted) return;
  const freqs = [523, 659, 784, 1047];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const t = audioCtx.currentTime + i * 0.1;
    osc.frequency.value = f;
    osc.type = 'square';
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.2);
  });
}

function playSfxCoin() {
  if (!audioCtx || muted) return;
  try {
    const t = audioCtx.currentTime;
    // Two-tone bright retro coin chime (B5 -> E6)
    [
      { freq: 987.77, delay: 0, dur: 0.12, gain: 0.16 },
      { freq: 1318.51, delay: 0.07, dur: 0.28, gain: 0.18 }
    ].forEach(({ freq, delay, dur, gain }) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const st = t + delay;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      g.gain.setValueAtTime(gain, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + dur);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(st);
      osc.stop(st + dur);
    });
  } catch(e) {}
}

function playSfxAchievement() {
  if (!audioCtx || muted) return;
  const freqs = [784, 988, 1175, 1568];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const t = audioCtx.currentTime + i * 0.08;
    osc.frequency.value = f;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.3);
  });
}

function playSfxWarp() {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const t = audioCtx.currentTime;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.6);
  osc.frequency.exponentialRampToValueAtTime(440, t + 1.2);
  gain.gain.setValueAtTime(0.01, t);
  gain.gain.linearRampToValueAtTime(0.14, t + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(t); osc.stop(t + 1.35);
}

function playSfxEventAlert() {
  if (!audioCtx || muted) return;
  const t = audioCtx.currentTime;
  const freqs = [350, 700, 350, 700];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const st = t + i * 0.12;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, st);
    gain.gain.setValueAtTime(0.01, st);
    gain.gain.linearRampToValueAtTime(0.12, st + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.11);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(st);
    osc.stop(st + 0.12);
  });
}

function playSfxToxicBurst() {
  if (!audioCtx || muted) return;
  try {
    const t = audioCtx.currentTime;
    // Deep chemical burst rumble + toxic gas fizz
    const bufLen = Math.floor(audioCtx.sampleRate * 0.55);
    const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.8);
    }
    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(340, t);
    filt.frequency.exponentialRampToValueAtTime(90, t + 0.55);
    filt.Q.value = 3.2;
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    src.buffer = buf;
    src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
    src.start();

    // High gas hissing sizzle
    const osc = audioCtx.createOscillator();
    const oGain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.35);
    oGain.gain.setValueAtTime(0.16, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(oGain); oGain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.36);
  } catch (e) {}
}

function playSfxPirateAlert() {
  if (!audioCtx || muted) return;
  try {
    const t = audioCtx.currentTime;
    // High alert double radar ping
    [
      { f1: 880, f2: 1200, delay: 0 },
      { f1: 1100, f2: 1450, delay: 0.11 }
    ].forEach(({ f1, f2, delay }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const st = t + delay;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f1, st);
      osc.frequency.exponentialRampToValueAtTime(f2, st + 0.08);
      gain.gain.setValueAtTime(0.01, st);
      gain.gain.linearRampToValueAtTime(0.18, st + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.09);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(st); osc.stop(st + 0.1);
    });
  } catch (e) {}
}

function playSfxMothershipCharge() {
  if (!audioCtx || muted) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(860, t + 1.45);
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 1.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 1.5);
  } catch(e) {}
}

function playSfxMothershipBlast() {
  if (!audioCtx || muted) return;
  try {
    const t = audioCtx.currentTime;
    // Heavy sub-bass super-laser blast
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.54);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.56);
  } catch(e) {}
}

function toggleMute() {
  muted = !muted;
  EL.muteIcon.textContent = muted ? '🔇' : '🔊';
  if (bgGain) bgGain.gain.value = muted ? 0 : 0.18;
  playSfxClick();
}

