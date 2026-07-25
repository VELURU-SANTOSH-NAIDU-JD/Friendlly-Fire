let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playTickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Create a short, clicky sound
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
  
  // Trigger haptic feedback if supported
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10); // subtle tap
  }
}

export function playTadaSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  // A nice chord for the reveal
  osc1.type = 'sine';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start();
  osc2.start();
  osc1.stop(ctx.currentTime + 1.5);
  osc2.stop(ctx.currentTime + 1.5);
  
  // Stronger haptic for reveal
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}
