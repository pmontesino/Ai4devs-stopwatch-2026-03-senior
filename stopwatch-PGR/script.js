// ============================================================
//  MATRIX TIMER — script.js
// ============================================================

// ── Matrix Rain ──────────────────────────────────────────────
(function initMatrixRain() {
  const canvas = document.getElementById('matrix-rain');
  const ctx = canvas.getContext('2d');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()アイウエオカキクケコサシスセソタチツテト';
  const fontSize = 14;
  let columns, drops;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
  }

  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00FF41';
    ctx.font = fontSize + 'px Share Tech Mono, monospace';
    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  resize();
  window.addEventListener('resize', resize);
  setInterval(draw, 50);
})();

// ── Navigation ────────────────────────────────────────────────
function navigateTo(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');
  if (screen === 'menu') {
    swStop();
    cdStop();
  }
}

// ── Helpers ───────────────────────────────────────────────────
function pad2(n) { return String(Math.floor(n)).padStart(2, '0'); }
function pad3(n) { return String(Math.floor(n)).padStart(3, '0'); }

function msToDisplay(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mil = ms % 1000;
  return { h, m, s, mil };
}

// ── STOPWATCH ─────────────────────────────────────────────────
let swElapsed = 0;
let swStartTime = null;
let swInterval = null;
let swRunning = false;

function swRender(ms) {
  const { h, m, s, mil } = msToDisplay(ms);
  document.getElementById('sw-display').textContent = pad2(h) + ':' + pad2(m) + ':' + pad2(s);
  document.getElementById('sw-ms').textContent = pad3(mil);
}

function swStartStop() {
  if (swRunning) {
    swStop();
  } else {
    swStart();
  }
}

function swStart() {
  swRunning = true;
  swStartTime = Date.now() - swElapsed;
  swInterval = setInterval(() => {
    swElapsed = Date.now() - swStartTime;
    swRender(swElapsed);
  }, 10);
  const btn = document.getElementById('sw-btn-start');
  btn.textContent = 'PAUSE';
  btn.classList.add('running');
}

function swStop() {
  if (!swRunning) return;
  swRunning = false;
  clearInterval(swInterval);
  swInterval = null;
  const btn = document.getElementById('sw-btn-start');
  btn.textContent = 'START';
  btn.classList.remove('running');
}

function swClear() {
  swStop();
  swElapsed = 0;
  swRender(0);
}

// ── COUNTDOWN ─────────────────────────────────────────────────
let cdRemaining = 0;       // ms remaining
let cdTotal = 0;           // ms total set
let cdStartTime = null;
let cdInterval = null;
let cdRunning = false;
let cdAlarmActive = false;
let cdInputBuffer = '';    // raw digit string e.g. "00830" → 00:08:30

function cdRender(ms) {
  const display = document.getElementById('cd-display');
  const { h, m, s, mil } = msToDisplay(ms);
  display.textContent = pad2(h) + ':' + pad2(m) + ':' + pad2(s);
  document.getElementById('cd-ms').textContent = pad3(mil);

  // Color states
  display.classList.remove('warning', 'alarm');
  if (ms === 0 && cdAlarmActive) {
    display.classList.add('alarm');
  } else if (ms > 0 && ms <= 10000) {
    display.classList.add('warning');
  }
}

function cdDigit(d) {
  if (cdRunning) return;
  if (cdInputBuffer.length >= 6) cdInputBuffer = cdInputBuffer.slice(1);
  cdInputBuffer += String(d);

  // Update hint display
  const padded = cdInputBuffer.padStart(6, '0');
  document.getElementById('cd-input-hint').textContent =
    padded.slice(0,2) + 'h ' + padded.slice(2,4) + 'm ' + padded.slice(4,6) + 's';
}

function cdClearInput() {
  cdInputBuffer = '';
  document.getElementById('cd-input-hint').textContent = 'ENTER TIME WITH KEYPAD';
}

function cdSet() {
  if (cdRunning) return;
  if (!cdInputBuffer || cdInputBuffer === '000000') return;

  const padded = cdInputBuffer.padStart(6, '0');
  const h = parseInt(padded.slice(0, 2));
  const m = parseInt(padded.slice(2, 4));
  const s = parseInt(padded.slice(4, 6));
  cdTotal = ((h * 3600) + (m * 60) + s) * 1000;
  cdRemaining = cdTotal;
  cdAlarmActive = false;
  stopAlarm();
  cdRender(cdRemaining);
  document.getElementById('cd-input-hint').textContent = 'TIME SET — PRESS START';
}

function cdStartStop() {
  if (cdAlarmActive) {
    stopAlarm();
    cdReset();
    return;
  }
  if (cdRemaining <= 0) return;
  if (cdRunning) {
    cdStop();
  } else {
    cdStart();
  }
}

function cdStart() {
  cdRunning = true;
  cdStartTime = Date.now();
  const snapshot = cdRemaining;
  cdInterval = setInterval(() => {
    const elapsed = Date.now() - cdStartTime;
    cdRemaining = Math.max(0, snapshot - elapsed);
    cdRender(cdRemaining);
    if (cdRemaining <= 0) {
      cdStop();
      triggerAlarm();
    }
  }, 10);
  const btn = document.getElementById('cd-btn-start');
  btn.textContent = 'PAUSE';
  btn.classList.add('running');
}

function cdStop() {
  if (!cdRunning) return;
  cdRunning = false;
  clearInterval(cdInterval);
  cdInterval = null;
  const btn = document.getElementById('cd-btn-start');
  btn.textContent = cdAlarmActive ? 'DISMISS' : 'START';
  btn.classList.remove('running');
}

function cdReset() {
  cdStop();
  stopAlarm();
  cdRemaining = cdTotal;
  cdAlarmActive = false;
  cdInputBuffer = '';
  document.getElementById('cd-input-hint').textContent = 'ENTER TIME WITH KEYPAD';
  document.getElementById('cd-btn-start').textContent = 'START';
  cdRender(cdRemaining);
}

function triggerAlarm() {
  cdAlarmActive = true;
  document.getElementById('alarm-overlay').style.display = 'block';
  document.getElementById('cd-btn-start').textContent = 'DISMISS';
  document.getElementById('cd-btn-start').classList.add('running');
  cdRender(0);

  // Beep using Web Audio
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    function beep(freq, start, duration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    }
    beep(880, 0,    0.12);
    beep(880, 0.15, 0.12);
    beep(1320, 0.30, 0.25);
    beep(880, 0.65, 0.12);
    beep(880, 0.80, 0.12);
    beep(1320, 0.95, 0.35);
  } catch(e) {}
}

function stopAlarm() {
  document.getElementById('alarm-overlay').style.display = 'none';
}

// ── Keyboard support ──────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  const swActive = document.getElementById('screen-stopwatch').classList.contains('active');
  const cdActive = document.getElementById('screen-countdown').classList.contains('active');

  if (swActive) {
    if (e.code === 'Space') { e.preventDefault(); swStartStop(); }
    if (e.code === 'KeyR' || e.code === 'Delete') swClear();
  }

  if (cdActive) {
    if (e.code === 'Space') { e.preventDefault(); cdStartStop(); }
    if (e.key >= '0' && e.key <= '9') cdDigit(parseInt(e.key));
    if (e.code === 'Enter') cdSet();
    if (e.code === 'Backspace') cdClearInput();
    if (e.code === 'KeyR' || e.code === 'Delete') cdReset();
  }

  if (e.code === 'Escape') navigateTo('menu');
});
