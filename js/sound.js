/* ============================================================
   THE GAUNTLET — sound.js
   A small but cohesive WebAudio layer. Everything runs through a
   master bus (gain → gentle limiter → out) so layered cues glue
   together and never clip. Synthesised on the fly — no assets.
   Public API kept stable; new cues: playKick / playSave / playStamp.
   ============================================================ */
window.GA = window.GA || {};
(function (GA) {
  'use strict';
  var ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem('gauntlet_mute') === 'true'; } catch (e) {}

  function init() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    // master bus: gain → soft limiter → destination
    master = ctx.createGain(); master.gain.value = 0.85;
    var comp = ctx.createDynamicsCompressor();
    try { comp.threshold.value = -16; comp.knee.value = 24; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.22; } catch (e) {}
    master.connect(comp); comp.connect(ctx.destination);
  }
  function ready() { if (muted) return false; init(); if (!ctx) return false; if (ctx.state === 'suspended') ctx.resume(); return true; }
  function T() { return ctx.currentTime; }

  // a pitched voice with an ADSR-ish gain envelope (exp ramps never hit 0)
  function voice(freq, type, dur, peak, freqEnd, t0, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd != null) { try { o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur); } catch (e) {} }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + Math.min(0.012, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  // filtered noise burst — band/low-passable; used for crowd, whistle breath, thuds
  function noise(dur, peak, t0, opts) {
    opts = opts || {};
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur)), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = opts.type || 'lowpass';
    f.frequency.setValueAtTime(opts.freq || 1000, t0);
    if (opts.freqEnd != null) { try { f.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + dur); } catch (e) {} }
    if (opts.q != null) f.Q.setValueAtTime(opts.q, t0);
    var g = ctx.createGain();
    var rise = opts.rise != null ? opts.rise : 0.04;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + dur * rise);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0 + dur + 0.02);
  }
  // a swelling crowd — bandpassed noise that surges then settles
  function crowd(dur, peak, centre, t0, rise) { noise(dur, peak, t0, { type: 'bandpass', freq: centre, q: 0.7, rise: rise != null ? rise : 0.3 }); }

  GA.sound = {
    isMuted: function () { return muted; },
    toggleMute: function () { muted = !muted; try { localStorage.setItem('gauntlet_mute', muted); } catch (e) {} return muted; },

    playClick: function () { if (!ready()) return; var t = T(); voice(620, 'triangle', 0.05, 0.06, 300, t); },
    playFlap: function () { if (!ready()) return; var t = T(); voice(150, 'square', 0.035, 0.05, 70, t); noise(0.03, 0.03, t, { freq: 2600, type: 'highpass' }); },
    playSign: function () { if (!ready()) return; var t = T(); voice(130, 'triangle', 0.16, 0.16, 52, t); voice(196, 'sine', 0.14, 0.07, 90, t + 0.06); voice(1320, 'sine', 0.10, 0.04, 1760, t + 0.02); },

    playWhistle: function () { // ref's pea-whistle: a warbling high tone + breath
      if (!ready()) return; var t = T();
      voice(2300, 'sine', 0.16, 0.05, 2520, t); voice(2480, 'sine', 0.16, 0.04, 2300, t + 0.005);
      noise(0.18, 0.02, t, { freq: 3000, type: 'highpass' });
      voice(2350, 'sine', 0.22, 0.05, 2560, t + 0.2);
    },

    playKick: function () { // leather thump on the ball
      if (!ready()) return; var t = T();
      voice(160, 'sine', 0.12, 0.16, 60, t); noise(0.05, 0.10, t, { freq: 1800, type: 'lowpass', rise: 0.02 });
    },
    playGoal: function () { // THE MOMENT — terrace roar + brass stab + toots
      if (!ready()) return; var t = T();
      crowd(1.5, 0.42, 700, t, 0.32); crowd(1.25, 0.20, 2100, t + 0.04, 0.4);
      [392, 494, 587, 784].forEach(function (f, i) { voice(f, 'sawtooth', 0.55, 0.085, f, t + 0.05 + i * 0.012); });
      voice(880, 'square', 0.2, 0.05, 1320, t + 0.16); voice(1175, 'square', 0.22, 0.04, 1480, t + 0.34);
    },
    playSave: function () { // keeper denies it — sharp parry + relief murmur
      if (!ready()) return; var t = T();
      noise(0.08, 0.14, t, { freq: 2400, type: 'bandpass', q: 1.2, rise: 0.02 });
      voice(330, 'square', 0.1, 0.06, 180, t); crowd(0.7, 0.16, 900, t + 0.05, 0.25);
    },
    playConcede: function () { // the deflation
      if (!ready()) return; var t = T();
      voice(300, 'sawtooth', 0.5, 0.09, 90, t); crowd(0.9, 0.14, 360, t + 0.04, 0.45);
    },
    playStamp: function () { // brutalist slam (win/death stamp)
      if (!ready()) return; var t = T();
      voice(90, 'square', 0.14, 0.2, 40, t); noise(0.12, 0.18, t, { freq: 1200, type: 'lowpass', rise: 0.01 });
    },
    playSuccess: function () { // victory fanfare + roar
      if (!ready()) return; var t = T();
      [523.25, 659.25, 784.0, 1046.5].forEach(function (f, i) { voice(f, 'triangle', 0.4, 0.09, f, t + i * 0.09); });
      voice(784, 'sawtooth', 0.6, 0.05, 784, t + 0.27);
      crowd(2.0, 0.3, 800, t + 0.05, 0.2); crowd(1.6, 0.18, 1600, t + 0.1, 0.25);
    },
    playFail: function () { // the run is over
      if (!ready()) return; var t = T();
      voice(160, 'sawtooth', 0.9, 0.11, 42, t); voice(98, 'sawtooth', 1.0, 0.13, 30, t + 0.02);
      crowd(1.4, 0.12, 300, t + 0.05, 0.5);
    }
  };
})(window.GA);
