// ==========================================
// CÀ PHÊ CÓC VỈA HÈ - COZY PIXEL ENGINE (TUẦN 1 HOÀN THIỆN)
// ==========================================

// --- 1. PROCEDURAL SOUND ENGINE (Web Audio API) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.rainGain = null;
    this.ambientType = 'rain'; // 'rain', 'birds', 'river'
    this.isAmbientPlaying = false;
    this.isLofiPlaying = false;
    this.lofiInterval = null;
    this.ambientSource = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setAmbientTheme(theme) {
    this.ambientType = theme;
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      this.startAmbient();
    }
  }

  startAmbient() {
    this.init();
    if (this.isAmbientPlaying) return;

    if (this.ambientType === 'morning') {
      this.startBirdsAmbient();
    } else if (this.ambientType === 'hoian') {
      this.startRiverAmbient();
    } else if (this.ambientType === 'counter' || this.ambientType === 'indoor') {
      this.startCafeIndoorAmbient();
    } else {
      this.startRainAmbient();
    }
    this.isAmbientPlaying = true;
  }

  stopAmbient() {
    if (this.ambientSource) {
      try { this.ambientSource.stop(); } catch(e){}
      this.ambientSource.disconnect();
      this.ambientSource = null;
    }
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
    this.isAmbientPlaying = false;
  }

  // Realistic Procedural Rain (Pink Noise)
  startRainAmbient() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    whiteNoise.start();

    this.ambientSource = whiteNoise;
  }

  startBirdsAmbient() {
    // Gentle morning breeze + occasional chirp
    this.startRainAmbient(); // use soft wind base
    this.ambientTimer = setInterval(() => {
      if (!this.isAmbientPlaying) return;
      this.playChirp();
    }, 3500);
  }

  startRiverAmbient() {
    // Soft water lapping
    this.startRainAmbient();
  }

  startCafeIndoorAmbient() {
    // Warm indoor cafe atmosphere: filtered pink noise + occasional gentle cup/spoon tinks
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.05;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    this.ambientSource = noise;

    this.ambientTimer = setInterval(() => {
      if (!this.isAmbientPlaying) return;
      if (Math.random() > 0.4) {
        this.playSpoonTink();
      }
    }, 4500);
  }

  playSpoonTink() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1900 + Math.random() * 500, now);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playChirp() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(2600, now + 0.15);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Gentle Lofi Ambient Chords (Fmaj7 - Em7 - Dm7 - Cmaj7)
  startLofi() {
    this.init();
    if (this.isLofiPlaying) return;
    this.isLofiPlaying = true;

    const chords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [164.81, 196.00, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [130.81, 164.81, 196.00, 246.94]  // Cmaj7
    ];
    let chordIndex = 0;

    const playChord = () => {
      if (!this.isLofiPlaying) return;
      const notes = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 4);
      });
    };

    playChord();
    this.lofiInterval = setInterval(playChord, 4000);
  }

  stopLofi() {
    this.isLofiPlaying = false;
    if (this.lofiInterval) {
      clearInterval(this.lofiInterval);
      this.lofiInterval = null;
    }
  }

  // Phin Drop Sound (tách... tách...)
  playPhinDropSound() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Egg Whisking sound
  playWhiskSound() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playPourSound(type) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(type === 'coffee' ? 240 : 420, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playIceClink() {
    this.init();
    const now = this.ctx.currentTime;
    [1200, 1650].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + Math.random() * 80, now + idx * 0.05);

      gain.gain.setValueAtTime(0.1, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.2);
    });
  }

  playStirSound() {
    this.init();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + (i % 2) * 300, now + i * 0.1);

      gain.gain.setValueAtTime(0.06, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.1);
    }
  }

  playSuccess() {
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.09);

      gain.gain.setValueAtTime(0.1, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.35);
    });
  }

  playDialogueBlip() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650 + Math.random() * 200, now);
    gain.gain.setValueAtTime(0.012, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playMeowSound() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.45);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  playCameraShutter() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(750, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playPurchaseSound() {
    this.init();
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }
}

// --- 2. AGENT SPRITE FORGE: SPRITE ATLAS LOADER & CLIP PLAYER ---

const SPRITE_ATLAS_KEYS = ['vinh', 'hoa', 'lam', 'owner'];
let spriteAtlasIndexCache = null;

async function getAvailableSpriteAtlases() {
  if (spriteAtlasIndexCache !== null) return spriteAtlasIndexCache;
  try {
    const res = await fetch('assets/sprites/index.json');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.available)) {
        spriteAtlasIndexCache = new Set(data.available);
        return spriteAtlasIndexCache;
      }
    }
  } catch (_) {}
  spriteAtlasIndexCache = new Set();
  return spriteAtlasIndexCache;
}

/**
 * Loads an Aseprite JSON atlas & engine export for a given character spriteKey.
 * Structure expected:
 *   assets/sprites/<key>/aseprite/<name>.json
 *   assets/sprites/<key>/aseprite/<name>.png
 *   assets/sprites/<key>/engine-export.json
 * Returns Promise<{clips, image, anchor, frameW, frameH, engineExport}> or null on missing files.
 */
async function loadSpriteAtlas(key) {
  if (!key || typeof key !== 'string' || !SPRITE_ATLAS_KEYS.includes(key)) {
    return null;
  }

  // Prevent 404 network console spam: verify atlas availability via manifest
  const available = await getAvailableSpriteAtlases();
  if (!available.has(key)) {
    return null;
  }

  try {
    // 1. Fetch engine-export.json (optional, prioritized for anchor_px)
    let engineExport = null;
    try {
      const eeRes = await fetch(`assets/sprites/${key}/engine-export.json`);
      if (eeRes.ok) {
        engineExport = await eeRes.json();
      }
    } catch (_) {}

    // 2. Fetch Aseprite JSON: try key.json
    let aseData = null;
    let jsonName = key;
    try {
      const res = await fetch(`assets/sprites/${key}/aseprite/${jsonName}.json`);
      if (res.ok) {
        aseData = await res.json();
      }
    } catch (_) {}

    if (!aseData || !aseData.frames) {
      return null; // Missing atlas file, fallback gracefully
    }

    // 3. Load PNG sprite sheet image
    const imageName = (aseData.meta && aseData.meta.image) ? aseData.meta.image : `${jsonName}.png`;
    const imagePath = `assets/sprites/${key}/aseprite/${imageName}`;
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load ${imagePath}`));
      image.src = imagePath;
    });

    // 4. Frames & dimensions parsing
    const framesMap = {};
    if (Array.isArray(aseData.frames)) {
      aseData.frames.forEach((f, idx) => {
        framesMap[String(idx)] = f;
      });
    } else {
      Object.assign(framesMap, aseData.frames);
    }

    const firstKey = Object.keys(framesMap)[0];
    const firstFrame = framesMap[firstKey] ? framesMap[firstKey].frame : { w: 60, h: 108 };
    const frameW = firstFrame.w;
    const frameH = firstFrame.h;

    // Anchor: priority: engine-export.json mapping.anchor_px -> slices anchor -> default bottom-center
    let anchor = null;
    if (engineExport && engineExport.mapping && Array.isArray(engineExport.mapping.anchor_px)) {
      anchor = { x: engineExport.mapping.anchor_px[0], y: engineExport.mapping.anchor_px[1] };
    } else if (aseData.meta && Array.isArray(aseData.meta.slices)) {
      const anchorSlice = aseData.meta.slices.find(s => s.name === 'anchor');
      if (anchorSlice && anchorSlice.keys && anchorSlice.keys[0]) {
        const k0 = anchorSlice.keys[0];
        if (k0.pivot) {
          anchor = { x: k0.pivot.x, y: k0.pivot.y };
        } else if (k0.bounds) {
          anchor = { x: k0.bounds.x, y: k0.bounds.y };
        }
      }
    }
    if (!anchor) {
      anchor = { x: Math.round(frameW / 2), y: frameH };
    }

    // 5. Parse Clips from frameTags or animations
    const clips = {};

    if (aseData.meta && Array.isArray(aseData.meta.frameTags)) {
      aseData.meta.frameTags.forEach(tag => {
        const tagFrames = [];
        let totalDuration = 0;
        const fromIdx = typeof tag.from === 'number' ? tag.from : parseInt(tag.from, 10);
        const toIdx = typeof tag.to === 'number' ? tag.to : parseInt(tag.to, 10);

        for (let i = fromIdx; i <= toIdx; i++) {
          const fData = framesMap[String(i)] || framesMap[i];
          if (fData) {
            const dur = fData.duration || 100;
            tagFrames.push({
              index: i,
              frame: fData.frame,
              duration: dur
            });
            totalDuration += dur;
          }
        }

        clips[tag.name] = {
          name: tag.name,
          frames: tagFrames,
          totalDuration: Math.max(totalDuration, 1),
          repeat: tag.repeat
        };
      });
    }

    if (aseData.animations) {
      Object.keys(aseData.animations).forEach(animName => {
        if (!clips[animName]) {
          const animIndices = aseData.animations[animName];
          const animFrames = [];
          let totalDuration = 0;
          animIndices.forEach(idxStr => {
            const fData = framesMap[String(idxStr)];
            if (fData) {
              const dur = fData.duration || 100;
              animFrames.push({
                index: parseInt(idxStr, 10),
                frame: fData.frame,
                duration: dur
              });
              totalDuration += dur;
            }
          });
          clips[animName] = {
            name: animName,
            frames: animFrames,
            totalDuration: Math.max(totalDuration, 1),
            repeat: null
          };
        }
      });
    }

    return {
      key,
      clips,
      image: img,
      anchor,
      frameW,
      frameH,
      engineExport
    };
  } catch (err) {
    return null;
  }
}

/**
 * Time-based and Distance-based Sprite Clip Animation Player
 */
class SpriteClipPlayer {
  constructor(atlas = null) {
    this.atlas = atlas;
    this.currentClipName = null;
    this.currentClip = null;
    this.mode = 'loop'; // 'loop' | 'once' | 'hold'
    this.elapsedMs = 0;
    this.isDone = false;
    this.currentFrame = null;
    this.onDoneCallback = null;

    if (atlas) this.setAtlas(atlas);
  }

  setAtlas(atlas) {
    this.atlas = atlas;
    if (this.currentClipName && atlas && atlas.clips && atlas.clips[this.currentClipName]) {
      this.currentClip = atlas.clips[this.currentClipName];
    }
  }

  hasClip(clipName) {
    return !!(this.atlas && this.atlas.clips && this.atlas.clips[clipName]);
  }

  play(clipName, options = {}) {
    const mode = options.mode || 'loop';
    const onDone = options.onDone || null;

    if (this.currentClipName === clipName && this.mode === mode && !this.isDone) {
      if (onDone) this.onDoneCallback = onDone;
      return;
    }

    this.currentClipName = clipName;
    this.mode = mode;
    this.elapsedMs = 0;
    this.isDone = false;
    this.onDoneCallback = onDone;

    if (this.atlas && this.atlas.clips && this.atlas.clips[clipName]) {
      this.currentClip = this.atlas.clips[clipName];
      this.currentFrame = (this.currentClip && this.currentClip.frames && this.currentClip.frames.length > 0)
        ? this.currentClip.frames[0]
        : null;
    } else {
      this.currentClip = null;
      this.currentFrame = null;
    }
  }

  update(dtMs, walkPhase = 0) {
    if (!this.currentClip || !this.currentClip.frames || this.currentClip.frames.length === 0) {
      this.currentFrame = null;
      return;
    }

    const frames = this.currentClip.frames;
    const totalDuration = this.currentClip.totalDuration;

    // Distance-locked walking clip: frame depends on walkPhase, not real-time
    if (this.currentClipName === 'walk') {
      const normalizedPhase = ((walkPhase % 1) + 1) % 1;
      const targetTimeMs = normalizedPhase * totalDuration;
      let acc = 0;
      for (let i = 0; i < frames.length; i++) {
        acc += frames[i].duration;
        if (targetTimeMs < acc || i === frames.length - 1) {
          this.currentFrame = frames[i];
          break;
        }
      }
      return;
    }

    // Standard simulation-time animation
    if (!this.isDone) {
      this.elapsedMs += dtMs;
    }

    if (this.mode === 'loop') {
      const timeInLoop = this.elapsedMs % totalDuration;
      let acc = 0;
      for (let i = 0; i < frames.length; i++) {
        acc += frames[i].duration;
        if (timeInLoop < acc || i === frames.length - 1) {
          this.currentFrame = frames[i];
          break;
        }
      }
    } else if (this.mode === 'once' || this.mode === 'hold') {
      if (this.elapsedMs >= totalDuration) {
        this.currentFrame = frames[frames.length - 1];
        if (!this.isDone) {
          this.isDone = true;
          if (this.onDoneCallback) {
            const cb = this.onDoneCallback;
            this.onDoneCallback = null;
            cb();
          }
        }
      } else {
        let acc = 0;
        for (let i = 0; i < frames.length; i++) {
          acc += frames[i].duration;
          if (this.elapsedMs < acc || i === frames.length - 1) {
            this.currentFrame = frames[i];
            break;
          }
        }
      }
    }
  }

  done() {
    return this.isDone;
  }
}

// Expose globally for testing/debugging
if (typeof window !== 'undefined') {
  window.loadSpriteAtlas = loadSpriteAtlas;
  window.SpriteClipPlayer = SpriteClipPlayer;
}

// --- 3. ADVANCED PIXEL SCENE RENDERER (AGENT SPRITE FORGE ENGINE) ---
class PixelSceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.width = canvas.width;
    this.height = canvas.height;
    this.tick = 0;
    this.simTime = 0;

    // Current Theme: 'night', 'counter', 'indoor', 'morning', 'hoian'
    this.theme = 'night';

    // Offscreen 640x360 Background Cache (Pre-scaled once, avoids downscaling 1376x768 each frame)
    this.bgCache = document.createElement('canvas');
    this.bgCache.width = this.width;
    this.bgCache.height = this.height;
    this.bgCacheCtx = this.bgCache.getContext('2d');
    this.bgCacheCtx.imageSmoothingEnabled = false;

    // Preload Background Images
    this.bgImages = {
      night: new Image(),
      counter: new Image(),
      indoor: new Image(),
      morning: new Image(),
      hoian: new Image()
    };
    Object.keys(this.bgImages).forEach((key) => {
      this.bgImages[key].onload = () => {
        if (this.theme === key) {
          this.updateBgCache(key);
        }
      };
    });
    this.bgImages.night.src = 'assets/cafe_night_v2_bg.jpg';
    this.bgImages.counter.src = 'assets/cafe_counter_bg.jpg';
    this.bgImages.indoor.src = 'assets/cafe_indoor_v2_bg.jpg';
    this.bgImages.morning.src = 'assets/cafe_morning_v2_bg.jpg';
    this.bgImages.hoian.src = 'assets/cafe_hoian_v2_bg.jpg';
    this.updateBgCache(this.theme);

    // Preload Character Sprites
    this.sprites = {
      owner: new Image(),
      vinh: new Image(),
      hoa: new Image(),
      lam: new Image()
    };
    this.sprites.owner.src = 'assets/nguyen_owner_idle.png';
    this.sprites.vinh.src = 'assets/vinh_driver_idle.png';
    this.sprites.hoa.src = 'assets/hoa_student_idle.png';
    this.sprites.lam.src = 'assets/lam_dev_idle.png';

    // Rain particles
    this.raindrops = [];
    for (let i = 0; i < 70; i++) {
      this.raindrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        len: 8 + Math.random() * 8,
        speed: 8 + Math.random() * 5
      });
    }

    // Puddle ripples
    this.ripples = [];

    // Debug Mode & Scene Reference
    this.debugMode = false;
    this.mouseDebug = null;
    this.currentSceneCfg = null;

    // Sprite Atlas Cache & Animation Clip Players
    this.atlasCache = {};
    this.atlasLoading = {};
    this.clipPlayers = {};
    this.loggedFallbacks = new Set();

    // Character Locomotion Engine (Agent Sprite Forge State Machine)
    this.locomotion = {
      phase: 'walk_in', // 'walk_in', 'idle', 'seated', 'receive', 'walk_out', 'completed'
      pose: 'stand',    // 'stand', 'sit'
      x: 0,
      y: 0,
      scale: 1.0,
      distance: 0,
      totalDistance: 0,
      path: [],
      segments: [],
      facing: 1, // 1: facing right, -1: left
      walkStep: 0,
      walkPhase: 0,
      hasDrink: false,
      drinkEmoji: '☕',
      receiveTimer: 0,
      onDepartCallback: null
    };
  }

  getClipPlayer(spriteKey) {
    if (!spriteKey) return null;
    if (!this.clipPlayers[spriteKey]) {
      const atlas = this.atlasCache[spriteKey] || null;
      this.clipPlayers[spriteKey] = new SpriteClipPlayer(atlas);
    }
    return this.clipPlayers[spriteKey];
  }

  ensureAtlasLoaded(spriteKey) {
    if (!spriteKey || this.atlasCache[spriteKey] !== undefined) return;
    if (this.atlasLoading[spriteKey]) return;

    this.atlasLoading[spriteKey] = loadSpriteAtlas(spriteKey).then(atlas => {
      this.atlasCache[spriteKey] = atlas;
      delete this.atlasLoading[spriteKey];
      if (this.clipPlayers[spriteKey]) {
        this.clipPlayers[spriteKey].setAtlas(atlas);
      }
    }).catch(_ => {
      this.atlasCache[spriteKey] = null;
      delete this.atlasLoading[spriteKey];
    });
  }

  updateBgCache(theme = this.theme) {
    if (!this.bgCacheCtx) return;
    const bgImg = this.bgImages[theme];
    const bCtx = this.bgCacheCtx;
    bCtx.imageSmoothingEnabled = false;
    bCtx.clearRect(0, 0, this.width, this.height);
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      bCtx.drawImage(bgImg, 0, 0, this.width, this.height);
    } else {
      bCtx.fillStyle = (theme === 'morning') ? '#7dd3fc' : '#0f172a';
      bCtx.fillRect(0, 0, this.width, this.height);
    }
  }

  setTheme(theme, sceneCfgOrTargetX, targetY) {
    this.theme = theme;
    this.updateBgCache(theme);
    const sceneCfg = (typeof sceneCfgOrTargetX === 'object' && sceneCfgOrTargetX !== null)
      ? sceneCfgOrTargetX
      : (SCENE_CONFIGS[theme] || { targetX: sceneCfgOrTargetX || 160, targetY: targetY || 175 });
    this.currentSceneCfg = sceneCfg;
    if (sceneCfg && sceneCfg.customer && sceneCfg.customer.spriteKey) {
      this.ensureAtlasLoaded(sceneCfg.customer.spriteKey);
    }
    this.resetCustomerLocomotion(sceneCfg);
  }

  resetCustomerLocomotion(sceneCfg) {
    const route = (sceneCfg && sceneCfg.route) ? sceneCfg.route : {
      entry: { x: -50, y: sceneCfg ? sceneCfg.targetY || 175 : 175, scale: 1.0 },
      waypoints: [],
      seat: { x: sceneCfg ? sceneCfg.targetX || 160 : 160, y: sceneCfg ? sceneCfg.targetY || 175 : 175, pose: 'stand' },
      scaleNear: 1.0
    };

    const pts = [route.entry, ...(route.waypoints || []), route.seat];
    const segments = [];
    let totalDist = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      segments.push({
        from: p1,
        to: p2,
        length: len,
        startDist: totalDist,
        endDist: totalDist + len
      });
      totalDist += len;
    }

    const loc = this.locomotion;
    const oldDepartCallback = loc.onDepartCallback;
    loc.route = route;
    loc.path = pts;
    loc.segments = segments;
    loc.totalDistance = totalDist;
    loc.distance = 0;
    loc.phase = 'walk_in';
    loc.pose = 'stand';
    loc.facing = (route.seat.x >= route.entry.x) ? 1 : -1;
    loc.x = route.entry.x;
    loc.y = route.entry.y;
    loc.scale = route.entry.scale || 1.0;
    loc.walkStep = 0;
    loc.walkPhase = 0;
    loc.hasDrink = false;
    loc.receiveTimer = 0;
    loc.receiveStage = null;
    loc.hurry = false;
    loc.onDepartCallback = oldDepartCallback;

    this.computeCustomerPositionAlongPath(loc);
  }

  computeCustomerPositionAlongPath(loc) {
    const route = loc.route;
    if (!route || !loc.segments || loc.segments.length === 0) return;

    const d = Math.max(0, Math.min(loc.totalDistance, loc.distance));
    let seg = loc.segments.find(s => d >= s.startDist && d <= s.endDist);
    if (!seg) {
      seg = (d >= loc.totalDistance) ? loc.segments[loc.segments.length - 1] : loc.segments[0];
    }

    const segRatio = seg.length > 0 ? (d - seg.startDist) / seg.length : 0;
    loc.x = seg.from.x + (seg.to.x - seg.from.x) * segRatio;
    loc.y = seg.from.y + (seg.to.y - seg.from.y) * segRatio;

    // Linear scale interpolation along y from entry.scale to scaleNear (perspective depth)
    const entryScale = route.entry.scale || 1.0;
    const nearScale = route.scaleNear || 1.0;
    const dy = route.seat.y - route.entry.y;
    if (Math.abs(dy) > 1) {
      const ty = Math.max(0, Math.min(1, (loc.y - route.entry.y) / dy));
      loc.scale = entryScale + (nearScale - entryScale) * ty;
    } else {
      const td = loc.totalDistance > 0 ? d / loc.totalDistance : 1;
      loc.scale = entryScale + (nearScale - entryScale) * td;
    }

    // Direction facing
    if (loc.phase === 'walk_in') {
      const dx = seg.to.x - seg.from.x;
      if (Math.abs(dx) > 0.5) loc.facing = dx >= 0 ? 1 : -1;
    } else if (loc.phase === 'walk_out') {
      const dx = seg.from.x - seg.to.x;
      if (Math.abs(dx) > 0.5) loc.facing = dx >= 0 ? 1 : -1;
    } else if (route.seat.facing !== undefined) {
      loc.facing = route.seat.facing;
    }
  }

  receiveDrink(emoji) {
    const loc = this.locomotion;
    loc.phase = 'receive';
    loc.hasDrink = true;
    loc.drinkEmoji = emoji || '☕';
    loc.receiveTimer = 0;
    loc.receiveStage = null;

    const spriteKey = (this.currentSceneCfg && this.currentSceneCfg.customer && this.currentSceneCfg.customer.spriteKey) || 'vinh';
    const player = this.getClipPlayer(spriteKey);
    if (player && player.hasClip('jump_cheer')) {
      loc.receiveStage = 'jump_cheer';
      player.play('jump_cheer', {
        mode: 'once',
        onDone: () => {
          if (player.hasClip('emote_love')) {
            loc.receiveStage = 'emote_love';
            player.play('emote_love', {
              mode: 'once',
              onDone: () => {
                loc.receiveStage = 'done';
              }
            });
          } else {
            loc.receiveStage = 'done';
          }
        }
      });
    } else if (player && player.hasClip('emote_love')) {
      loc.receiveStage = 'emote_love';
      player.play('emote_love', {
        mode: 'once',
        onDone: () => {
          loc.receiveStage = 'done';
        }
      });
    }
  }

  render(currentCustomer, catCfg, catState) {
    const ctx = this.ctx;

    // 1. Draw High-Quality Pixel Art Background (from pre-scaled 640x360 offscreen cache)
    ctx.drawImage(this.bgCache, 0, 0);

    // 2. Animate Weather / Lighting Effects
    if (this.theme === 'night') {
      this.renderRain(ctx);
    } else if (this.theme === 'counter') {
      this.renderCounterLighting(ctx);
    } else if (this.theme === 'indoor') {
      this.renderIndoorLighting(ctx);
    } else if (this.theme === 'morning') {
      this.renderMorningSunbeams(ctx);
    } else if (this.theme === 'hoian') {
      this.renderHoiAnLanterns(ctx);
    }

    // 3. Render Miu Miu Cat (Procedural Tabby Cat or Baked Emote)
    if (catCfg) {
      if (!catCfg.baked) {
        this.drawCat(ctx, catCfg, catState);
      } else if (catState === 'happy') {
        this.drawBakedCatHappyHeart(ctx, catCfg);
      }
    }

    // 4. Render Animated Walking / Idle Customer Sprite (Agent Sprite Forge Engine)
    if (currentCustomer) {
      this.updateAndRenderCustomer(ctx, currentCustomer);
    }

    // 5. Ambient Coffee Steam Animation
    this.renderCoffeeSteam(ctx);

    // 6. Debug Mode Overlay (Press 'D' to toggle)
    if (this.debugMode) {
      this.renderDebugOverlay(ctx, this.currentSceneCfg || SCENE_CONFIGS[this.theme]);
    }
  }

  // --- PROCEDURAL PIXEL CAT (MÈO CAM TABBY) ---
  drawCat(ctx, catCfg, state = 'sleep') {
    if (!catCfg) return;
    const x = catCfg.x;
    let y = catCfg.y;
    const bounce = (state === 'happy') ? -6 : 0;
    y += bounce;

    ctx.save();
    // Drop shadow under cat
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 18, catCfg.y + 22, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Breathing / idle motion
    const breath = (state === 'sleep') ? Math.sin(this.tick * 0.05) * 1 : 0;

    // Body (warm ginger orange)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + 4, y + 8 - breath, 24, 14 + breath);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + 6, y + 9 - breath, 20, 11 + breath);

    // Tabby stripes
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(x + 10, y + 8 - breath, 2, 7);
    ctx.fillRect(x + 15, y + 8 - breath, 2, 8);
    ctx.fillRect(x + 20, y + 8 - breath, 2, 7);

    // Cream white belly / chest
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(x + 8, y + 17, 16, 5);

    // Head
    const headY = (state === 'sleep') ? y + 9 : y + 4;
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x + 22, headY, 14, 12);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + 23, headY + 1, 12, 10);

    // Ears
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x + 23, headY - 4, 4, 4);
    ctx.fillRect(x + 31, headY - 4, 4, 4);
    // Inner ear pink
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x + 24, headY - 3, 2, 3);
    ctx.fillRect(x + 32, headY - 3, 2, 3);

    // Face / Eyes
    if (state === 'sleep') {
      // Sleeping eyes (cute curved lines)
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x + 26, headY + 5, 3, 1);
      ctx.fillRect(x + 31, headY + 5, 3, 1);
      // Small Zzz floating periodically
      if (Math.sin(this.tick * 0.04) > 0.35) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '8px "VT323", monospace';
        ctx.fillText('z', x + 35, headY - 2);
      }
    } else {
      // Awake / Happy eyes
      if (state === 'happy') {
        // Happy squinting eye arcs (^ ^)
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(x + 26, headY + 4, 3, 2);
        ctx.fillRect(x + 31, headY + 4, 3, 2);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(x + 26, headY + 5, 3, 1);
        ctx.fillRect(x + 31, headY + 5, 3, 1);
      } else {
        // Wide awake round eyes
        ctx.fillStyle = '#16a34a'; // emerald green
        ctx.fillRect(x + 26, headY + 4, 3, 3);
        ctx.fillRect(x + 31, headY + 4, 3, 3);
        ctx.fillStyle = '#0f172a'; // black pupil
        ctx.fillRect(x + 27, headY + 4, 1, 3);
        ctx.fillRect(x + 32, headY + 4, 1, 3);
      }
    }

    // Nose
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(x + 29, headY + 7, 2, 1);

    // Whiskers
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 23, headY + 7, 2, 1);
    ctx.fillRect(x + 35, headY + 7, 2, 1);

    // Paws (front paws folded)
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(x + 21, y + 19, 4, 3);
    ctx.fillRect(x + 26, y + 19, 4, 3);

    // Tail (animated flicking when awake, curled when sleeping)
    ctx.fillStyle = '#ea580c';
    if (state === 'sleep') {
      ctx.fillRect(x, y + 14, 5, 7);
      ctx.fillRect(x + 3, y + 18, 5, 3);
    } else {
      const tailWiggle = Math.sin(this.tick * 0.12) * 3;
      ctx.fillRect(x - 2 + tailWiggle, y + 7, 4, 12);
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(x - 3 + tailWiggle, y + 5, 4, 4);
    }

    // If happy, draw floating heart 💖 above head
    if (state === 'happy') {
      ctx.font = '12px sans-serif';
      ctx.fillText('💖', x + 16, y - 4);
    }

    ctx.restore();
  }

  drawBakedCatHappyHeart(ctx, catCfg) {
    ctx.save();
    ctx.font = '14px sans-serif';
    ctx.fillText('💖', catCfg.x + 38, catCfg.y - 4);
    ctx.restore();
  }

  updateLogic(dt = 1 / 60) {
    this.simTime += dt;
    this.tick++;

    const loc = this.locomotion;
    const stride = 8.2; // px per walkPhase radian
    const speed = 92; // px / sec

    const spriteKey = (this.currentSceneCfg && this.currentSceneCfg.customer && this.currentSceneCfg.customer.spriteKey) || 'vinh';
    const player = this.getClipPlayer(spriteKey);

    if (loc.phase === 'walk_in') {
      const delta = speed * dt;
      loc.distance += delta;
      loc.walkPhase += delta / (stride * (loc.scale || 1));
      loc.walkStep++;
      if (loc.distance >= loc.totalDistance) {
        loc.distance = loc.totalDistance;
        const isSit = loc.route && loc.route.seat && loc.route.seat.pose === 'sit';
        loc.phase = isSit ? 'seated' : 'idle';
        loc.pose = isSit ? 'sit' : 'stand';
      }
      this.computeCustomerPositionAlongPath(loc);
      if (player) {
        const clipName = loc.hurry ? 'run' : 'walk';
        player.play(clipName, { mode: 'loop' });
        player.update(dt * 1000, loc.walkPhase);
      }
    } else if (loc.phase === 'receive') {
      loc.receiveTimer += dt;
      const atlas = this.atlasCache[spriteKey];
      const hasJumpCheer = player && player.hasClip('jump_cheer');
      const hasEmoteLove = player && player.hasClip('emote_love');

      if (atlas && (hasJumpCheer || hasEmoteLove)) {
        if (!loc.receiveStage) {
          loc.receiveStage = hasJumpCheer ? 'jump_cheer' : 'emote_love';
          player.play(loc.receiveStage, {
            mode: 'once',
            onDone: () => {
              if (loc.receiveStage === 'jump_cheer' && hasEmoteLove) {
                loc.receiveStage = 'emote_love';
                player.play('emote_love', {
                  mode: 'once',
                  onDone: () => {
                    loc.receiveStage = 'done';
                  }
                });
              } else {
                loc.receiveStage = 'done';
              }
            }
          });
        }
        player.update(dt * 1000, loc.walkPhase);

        if (loc.receiveStage === 'done' || loc.receiveTimer >= 2.5) {
          loc.phase = 'walk_out';
          loc.pose = 'stand';
          loc.walkPhase = 0;
          loc.walkStep = 0;
          loc.receiveStage = null;
        }
      } else {
        if (loc.receiveTimer >= 1.33) {
          loc.phase = 'walk_out';
          loc.pose = 'stand';
          loc.walkPhase = 0;
          loc.walkStep = 0;
        }
      }
    } else if (loc.phase === 'walk_out') {
      const delta = speed * dt;
      loc.distance -= delta;
      loc.walkPhase += delta / (stride * (loc.scale || 1));
      loc.walkStep++;
      this.computeCustomerPositionAlongPath(loc);
      if (loc.distance <= 0) {
        loc.distance = 0;
        loc.phase = 'completed';
        if (loc.onDepartCallback) {
          loc.onDepartCallback();
        }
      }
      if (player) {
        const clipName = loc.hurry ? 'run' : 'walk';
        player.play(clipName, { mode: 'loop' });
        player.update(dt * 1000, loc.walkPhase);
      }
    } else if (loc.phase === 'idle' || loc.phase === 'seated') {
      if (player) {
        player.play('idle', { mode: 'loop' });
        player.update(dt * 1000, loc.walkPhase);
      }
    }

    if (this.theme === 'night') {
      this.updateRain(dt);
    }
  }

  updateRain(dt = 1 / 60) {
    const rate = dt * 60;
    this.raindrops.forEach((drop) => {
      drop.y += drop.speed * rate;
      drop.x -= 0.8 * rate;
      if (drop.y > this.height) {
        drop.y = -10;
        drop.x = Math.random() * (this.width + 50);

        if (Math.random() > 0.65) {
          this.ripples.push({
            x: drop.x,
            y: 220 + Math.random() * 120,
            radius: 1,
            maxRadius: 10 + Math.random() * 6,
            alpha: 0.6
          });
        }
      }
    });

    for (let r = this.ripples.length - 1; r >= 0; r--) {
      const rip = this.ripples[r];
      rip.radius += 0.5 * rate;
      rip.alpha -= 0.025 * rate;
      if (rip.alpha <= 0) {
        this.ripples.splice(r, 1);
      }
    }
  }

  drawSprite(ctx, atlas, frame, loc) {
    const scaleFactor = loc.scale || 1.0;
    const frameW = frame.w;
    const frameH = frame.h;

    // Integer scale selection based on display height threshold (avoids fractional resampling)
    let intScale = 1;
    if (frameH > 0) {
      const ratio = (108 * scaleFactor) / frameH;
      if (ratio >= 2.5) intScale = 3;
      else if (ratio >= 1.5) intScale = 2;
      else intScale = 1;
    }

    const ax = (atlas.anchor && typeof atlas.anchor.x === 'number') ? atlas.anchor.x : Math.round(frameW / 2);
    const ay = (atlas.anchor && typeof atlas.anchor.y === 'number') ? atlas.anchor.y : frameH;

    const isSeated = (loc.phase === 'seated' || (loc.phase === 'receive' && loc.pose === 'sit'));
    let groundY = loc.y;
    if (isSeated) {
      groundY += 7 * scaleFactor;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 1. Drop shadow under character feet (or stool)
    if (!isSeated) {
      const shadowScale = (loc.phase === 'walk_in' || loc.phase === 'walk_out')
        ? (1 + Math.sin(loc.walkPhase) * 0.2)
        : 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(loc.x, loc.y - (3 * scaleFactor), 20 * scaleFactor * shadowScale, 5 * scaleFactor, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(loc.x, loc.y - (2 * scaleFactor), 18 * scaleFactor, 5 * scaleFactor, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Position with Anchor and Flip horizontally around Anchor when facing === -1
    ctx.translate(Math.round(loc.x), Math.round(groundY));
    if (loc.facing === -1) {
      ctx.scale(-1, 1);
    }

    const drawW = frameW * intScale;
    const drawH = frameH * intScale;
    const dx = -Math.round(ax * intScale);
    const dy = -Math.round(ay * intScale);

    if (isSeated) {
      ctx.save();
      ctx.beginPath();
      const clipBottomCut = Math.round(18 * scaleFactor);
      ctx.rect(dx - 4, dy - 4, drawW + 8, drawH - clipBottomCut + 4);
      ctx.clip();
      ctx.drawImage(atlas.image, frame.x, frame.y, frameW, frameH, dx, dy, drawW, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(atlas.image, frame.x, frame.y, frameW, frameH, dx, dy, drawW, drawH);
    }

    // 3. Draw Drink in Hand if customer received drink
    if (loc.hasDrink) {
      ctx.font = `${Math.round(20 * scaleFactor)}px serif`;
      ctx.fillText(loc.drinkEmoji, Math.round(drawW / 2 - (8 * scaleFactor)), -5 * scaleFactor);
    }

    // 4. Happy expression hearts when receiving drink
    if (loc.phase === 'receive') {
      ctx.font = '16px serif';
      ctx.fillText('💖', -15 + Math.sin(this.simTime * 6) * 6, dy - 12);
      ctx.fillText('✨', 12, dy - 18);
    }

    ctx.restore();
  }

  drawFallbackCustomer(ctx, customer, loc) {
    const spriteKey = customer.spriteKey || 'vinh';
    const spriteImg = this.sprites[spriteKey];
    if (!spriteImg || !spriteImg.complete || spriteImg.naturalWidth <= 0) return;

    const scale = loc.scale || 1.0;
    const baseW = 60;
    const baseH = 108;
    const cw = baseW * scale;
    const ch = baseH * scale;

    let bob = 0;
    let tilt = 0;
    let seatOffsetY = 0;
    const isSeated = (loc.phase === 'seated' || (loc.phase === 'receive' && loc.pose === 'sit'));

    if (loc.phase === 'walk_in' || loc.phase === 'walk_out') {
      const stepAngle = loc.walkPhase;
      bob = Math.abs(Math.sin(stepAngle)) * (5.5 * scale);
      tilt = Math.sin(stepAngle) * 0.04;
    } else if (loc.phase === 'idle') {
      bob = Math.sin(this.simTime * 3.6) * (1.8 * scale);
      tilt = 0;
    } else if (loc.phase === 'seated') {
      bob = Math.sin(this.simTime * 2.8) * (1.2 * scale);
      tilt = 0;
      seatOffsetY = 7 * scale;
    } else if (loc.phase === 'receive') {
      bob = Math.sin(loc.receiveTimer * 15) * (6 * scale);
      tilt = 0;
      if (loc.pose === 'sit') {
        seatOffsetY = 7 * scale;
      }
    }

    const footX = loc.x;
    const footY = loc.y;
    const spriteCenterX = footX;
    const spriteCenterY = footY - (ch / 2) - bob + seatOffsetY;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Drop shadow
    if (!isSeated) {
      const shadowScale = (loc.phase === 'walk_in' || loc.phase === 'walk_out')
        ? (1 + Math.sin(loc.walkPhase) * 0.2)
        : 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(footX, footY - (3 * scale), 20 * scale * shadowScale, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(footX, footY - (2 * scale), 18 * scale, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(spriteCenterX, spriteCenterY);
    if (loc.facing === -1) {
      ctx.scale(-1, 1);
    }
    ctx.rotate(tilt);

    if (isSeated) {
      ctx.save();
      ctx.beginPath();
      const clipBottomCut = 18 * scale;
      ctx.rect(-cw / 2 - 4, -ch / 2 - 4, cw + 8, ch - clipBottomCut + 4);
      ctx.clip();
      ctx.drawImage(spriteImg, -cw / 2, -ch / 2, cw, ch);
      ctx.restore();
    } else {
      ctx.drawImage(spriteImg, -cw / 2, -ch / 2, cw, ch);
    }

    // Draw Drink in Hand if customer received drink
    if (loc.hasDrink) {
      ctx.font = `${Math.round(20 * scale)}px serif`;
      ctx.fillText(loc.drinkEmoji, cw / 2 - (8 * scale), -5 * scale);
    }

    // Happy expression hearts when receiving drink
    if (loc.phase === 'receive') {
      ctx.font = '16px serif';
      ctx.fillText('💖', -15 + Math.sin(this.simTime * 6) * 6, -ch / 2 - 12);
      ctx.fillText('✨', 12, -ch / 2 - 18);
    }

    ctx.restore();
  }

  updateAndRenderCustomer(ctx, customer) {
    const loc = this.locomotion;
    const spriteKey = customer.spriteKey || 'vinh';
    this.ensureAtlasLoaded(spriteKey);

    const atlas = this.atlasCache[spriteKey];
    const player = this.getClipPlayer(spriteKey);

    let clipName = 'idle';
    if (loc.phase === 'walk_in' || loc.phase === 'walk_out') {
      clipName = loc.hurry ? 'run' : 'walk';
    } else if (loc.phase === 'receive') {
      clipName = loc.receiveStage || 'jump_cheer';
    } else {
      clipName = 'idle';
    }

    if (atlas && player && player.hasClip(clipName)) {
      if (player.currentClipName !== clipName) {
        const mode = (clipName === 'jump_cheer' || clipName === 'emote_love') ? 'once' : 'loop';
        player.play(clipName, { mode });
      }
      if (player.currentFrame) {
        this.drawSprite(ctx, atlas, player.currentFrame.frame, loc);
        return;
      }
    } else if (atlas && (!player || !player.hasClip(clipName))) {
      const logKey = `${spriteKey}:${clipName}`;
      if (!this.loggedFallbacks.has(logKey)) {
        this.loggedFallbacks.add(logKey);
        console.info(`[SpriteAtlas] Missing clip "${clipName}" for "${spriteKey}", falling back to idle PNG.`);
      }
    }

    // Fallback to existing idle PNG
    this.drawFallbackCustomer(ctx, customer, loc);
  }

  renderDebugOverlay(ctx, sceneCfg) {
    if (!sceneCfg || !sceneCfg.route) return;
    const route = sceneCfg.route;
    const loc = this.locomotion;
    const pts = [route.entry, ...(route.waypoints || []), route.seat];

    ctx.save();

    // 1. If Hoi An, draw Water Hazard SafeZone Box (x < 400 && y > 195)
    if (this.theme === 'hoian') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(0, 195, 400, 165);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.10)';
      ctx.fillRect(0, 195, 400, 165);
      ctx.fillStyle = '#f87171';
      ctx.font = '11px "VT323", monospace, sans-serif';
      ctx.fillText('⚠️ VÙNG SÔNG NƯỚC (x < 400 & y > 195) - CẤM ĐI QUA', 12, 212);
    }

    // 2. Waypoint route dashed path
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    pts.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Points
    pts.forEach((p, idx) => {
      let color = '#f59e0b';
      let label = `WP${idx} (${p.x}, ${p.y})`;
      let r = 4;

      if (idx === 0) {
        color = '#22c55e'; // Green for Entry
        label = `ENTRY (${p.x}, ${p.y}) [s=${p.scale || 1}]`;
        r = 5;
      } else if (idx === pts.length - 1) {
        color = '#ec4899'; // Pink for Seat
        label = `SEAT (${p.x}, ${p.y}) [${p.pose || 'stand'}]`;
        r = 5;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(p.x + 6, p.y - 13, label.length * 6 + 8, 15);
      ctx.fillStyle = color;
      ctx.font = '10px "VT323", monospace, sans-serif';
      ctx.fillText(label, p.x + 9, p.y - 2);
    });

    // 4. Current Customer Position & Indicator
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(loc.x, loc.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Top-Left HUD Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1;
    ctx.fillRect(8, 8, 270, 60);
    ctx.strokeRect(8, 8, 270, 60);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px "VT323", monospace, sans-serif';
    ctx.fillText(`🛠️ DEBUG: ${this.theme.toUpperCase()} (Phím D để Tắt/Bật)`, 14, 22);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Phase: ${loc.phase} | Pose: ${loc.pose} | Facing: ${loc.facing > 0 ? 'Phải 👉' : 'Trái 👈'}`, 14, 35);
    ctx.fillText(`Vị trí: (${Math.round(loc.x)}, ${Math.round(loc.y)}) | Scale: ${loc.scale ? loc.scale.toFixed(2) : '1.00'}`, 14, 48);
    ctx.fillText(`Quãng đường: ${Math.round(loc.distance)} / ${Math.round(loc.totalDistance)} px`, 14, 60);

    // 6. Cursor position if hovering on canvas
    if (this.mouseDebug) {
      ctx.fillStyle = '#fde047';
      ctx.font = '10px "VT323", monospace, sans-serif';
      ctx.fillText(`🖱️ (${this.mouseDebug.x}, ${this.mouseDebug.y})`, 180, 22);
    }

    ctx.restore();
  }

  renderRain(ctx) {
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.lineWidth = 1.2;
    this.raindrops.forEach((drop) => {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 2, drop.y + drop.len);
      ctx.stroke();
    });

    for (let r = 0; r < this.ripples.length; r++) {
      const rip = this.ripples[r];
      ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha})`;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderMorningSunbeams(ctx) {
    ctx.save();
    const rayAlpha = 0.12 + Math.sin(this.tick * 0.03) * 0.04;
    ctx.fillStyle = `rgba(254, 240, 138, ${rayAlpha})`;
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(160, 0);
    ctx.lineTo(40, this.height);
    ctx.lineTo(0, this.height);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(280, 0);
    ctx.lineTo(360, 0);
    ctx.lineTo(240, this.height);
    ctx.lineTo(180, this.height);
    ctx.fill();
    ctx.restore();
  }

  renderHoiAnLanterns(ctx) {
    const lanternGlow = 0.25 + Math.sin(this.tick * 0.05) * 0.06;
    ctx.save();
    ctx.fillStyle = `rgba(245, 158, 11, ${lanternGlow})`;
    ctx.beginPath();
    ctx.arc(365, 80, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderCounterLighting(ctx) {
    const lampFlicker = 0.09 + Math.sin(this.tick * 0.04) * 0.02;
    const lamps = [
      { x: 45, y: 35, spread: 85 },
      { x: 210, y: 35, spread: 95 },
      { x: 375, y: 35, spread: 90 }
    ];

    ctx.save();
    lamps.forEach(l => {
      const grad = ctx.createRadialGradient(l.x, l.y + 20, 10, l.x, l.y + 110, l.spread);
      grad.addColorStop(0, `rgba(253, 224, 71, ${lampFlicker * 1.8})`);
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(l.x, l.y + 50, l.spread, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  renderIndoorLighting(ctx) {
    const glow = 0.06 + Math.sin(this.tick * 0.03) * 0.02;
    ctx.save();
    ctx.fillStyle = `rgba(245, 158, 11, ${glow})`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  renderCoffeeSteam(ctx) {
    const steamTick = this.tick % 40;
    const steamYOffset = steamTick * 0.6;
    const steamAlpha = Math.max(0, 1 - steamTick / 40);

    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${steamAlpha * 0.45})`;

    if (this.theme === 'counter') {
      ctx.fillRect(80 + Math.sin(this.tick * 0.08) * 2, 195 - steamYOffset, 3, 5);
      ctx.fillRect(175 + Math.cos(this.tick * 0.07) * 2, 185 - steamYOffset, 3, 6);
      ctx.fillRect(300 + Math.sin(this.tick * 0.09) * 2, 200 - steamYOffset, 3, 5);
    } else if (this.theme === 'indoor') {
      ctx.fillRect(425 + Math.sin(this.tick * 0.08) * 3, 190 - steamYOffset, 3, 5);
    } else {
      ctx.fillRect(366 + Math.sin(this.tick * 0.08) * 3, 240 - steamYOffset, 3, 5);
    }
    ctx.restore();
  }
}

// --- 3. SCENE CONFIGS: MỖI BỐI CẢNH 1 KHÁCH HÀNG & 1 MENU MÓN ĂN/UỐNG ĐẶC TRƯNG ---
const SCENE_CONFIGS = {
  night: {
    key: 'night',
    name: '🌧️ Đêm Mưa Vỉa Hè (Phố Khuya)',
    targetX: 185,
    targetY: 283,
    route: {
      entry: { x: -50, y: 283, scale: 0.95 },
      waypoints: [{ x: 60, y: 283 }],
      seat: { x: 185, y: 283, pose: 'stand' },
      scaleNear: 1.0
    },
    cat: { baked: true, x: 500, y: 275, w: 90, h: 45 },
    customer: {
      id: 'vinh-driver',
      spriteKey: 'vinh',
      portrait: 'assets/vinh_driver_portrait.png',
      name: 'Chú Vinh (Xe Ôm Công Nghệ)',
      dialogue: 'Cho chú ly cà phê sữa đá nhiều sữa nghen con. Chạy cuốc cuối đêm mưa ướt sũng cả áo rồi, thêm ổ bánh mì đêm cho ấm bụng còn về với tụi nhỏ...',
      choices: [
        { text: 'Chú ơi uống ly cho ấm người, đêm nay mưa lạnh quá!', reply: 'Cảm ơn con nhiều nghen, gặp được quán ấm áp như vầy chú mừng ghê!', bonusHearts: 2 },
        { text: 'Dạ chú yên tâm, con pha thật đậm đà để chú tỉnh táo chạy xe an toàn!', reply: 'Chú quý tấm lòng con lắm, lát chú gửi thêm chút tiền tip nghen con trai!', bonusHearts: 3 }
      ],
      requiredDrink: 'Cà Phê Sữa Đá',
      foodSnack: '🥖 Bánh Mì Đêm',
      foodIcon: '🥖',
      recipe: { condensedMilk: 1, coffee: 1, eggFroth: 0, saltCream: 0, ice: 1, tea: 0, peach: 0, food: 1, stirred: true },
      thanks: 'Cà phê thơm béo đậm đà, bánh mì giòn tan ấm bụng chú lắm con trai ơi!',
      reward: 25000,
      hearts: 5
    },
    ingredients: [
      { id: 'btn-add-condensed-milk', name: 'Sữa đặc', icon: '🥛', action: 'milk' },
      { id: 'btn-add-coffee', name: 'Cà phê phin', icon: '☕', action: 'coffee' },
      { id: 'btn-add-ice', name: 'Đá viên', icon: '🧊', action: 'ice' },
      { id: 'btn-add-tea', name: 'Trà gừng sả', icon: '🍵', action: 'tea' },
      { id: 'btn-add-food', name: 'Bánh Mì Đêm', icon: '🥖', action: 'food' }
    ],
    menuNotes: [
      { name: 'Cà phê sữa đá:', formula: 'Sữa đặc + Cà phê phin + Đá viên + Khuấy' },
      { name: 'Bạc xỉu ấm:', formula: '2x Sữa đặc + Cà phê + Khuấy' },
      { name: 'Combo Đêm Ấm:', formula: 'Cà phê sữa đá + Bánh mì đêm 🥖' },
      { name: 'Trà gừng sả:', formula: 'Trà gừng sả nóng ấm bụng' }
    ]
  },
  counter: {
    key: 'counter',
    name: '☕ Quầy Bar Gỗ Cổ Điển (Ấm Cúng)',
    targetX: 225,
    targetY: 280,
    route: {
      entry: { x: -50, y: 280, scale: 0.95 },
      waypoints: [{ x: 90, y: 280 }],
      seat: { x: 225, y: 280, pose: 'stand' },
      scaleNear: 1.0
    },
    cat: { baked: false, x: 510, y: 285, w: 38, h: 26 },
    customer: {
      id: 'hoa-student',
      spriteKey: 'hoa',
      portrait: 'assets/hoa_student_portrait.png',
      name: 'Bạn Hoa (Sinh Viên Chạy Đồ Án)',
      dialogue: 'Anh ơi cho em một ly Trà Đào Cam Sả mát lạnh nha! Em cày đồ án từ chiều đến giờ khát cháy cả họng, có bánh sừng bò thơm bơ thì cho em một chiếc luôn nhé...',
      choices: [
        { text: 'Cố lên em gái ơi, đồ án qua môn là xuất sắc luôn!', reply: 'Dạ em cảm ơn anh, nghe anh động viên em có thêm 100% động lực rồi nè!', bonusHearts: 2 },
        { text: 'Để anh cho thêm lát đào giòn ngọt và sả thơm ngát xả stress liền nha!', reply: 'Dạ khoái nhất đào giòn tươi của quán anh luôn á, thơm xỉu!', bonusHearts: 3 }
      ],
      requiredDrink: 'Trà Đào Cam Sả',
      foodSnack: '🥐 Bánh Croissant',
      foodIcon: '🥐',
      recipe: { condensedMilk: 0, coffee: 0, eggFroth: 0, saltCream: 0, ice: 1, tea: 1, peach: 1, food: 1, stirred: false },
      thanks: 'Trà đào thơm nức mũi, lát đào giòn ngọt kèm bánh sừng bò bơ xỉu luôn anh ơi!',
      reward: 35000,
      hearts: 8
    },
    ingredients: [
      { id: 'btn-add-tea', name: 'Trà lài', icon: '🍵', action: 'tea' },
      { id: 'btn-add-peach', name: 'Đào & Sả', icon: '🍑', action: 'peach' },
      { id: 'btn-add-ice', name: 'Đá viên', icon: '🧊', action: 'ice' },
      { id: 'btn-add-coffee', name: 'Cà phê phin', icon: '☕', action: 'coffee' },
      { id: 'btn-add-egg', name: 'Trứng gà ta', icon: '🥚', action: 'egg' },
      { id: 'btn-add-food', name: 'Bánh Croissant', icon: '🥐', action: 'food' }
    ],
    menuNotes: [
      { name: 'Trà đào cam sả:', formula: 'Trà lài + Đào & Sả + Đá viên' },
      { name: 'Cà phê Trứng Hà Nội:', formula: 'Sữa đặc + Cà phê + Đánh bông trứng 100%' },
      { name: 'Combo Đồ Án:', formula: 'Trà đào + Bánh Croissant 🥐' }
    ]
  },
  indoor: {
    key: 'indoor',
    name: '🏬 Quán Phố Hiện Đại (Rộn Ràng)',
    targetX: 321,
    targetY: 272,
    route: {
      entry: { x: 228, y: 188, scale: 0.55 },
      waypoints: [{ x: 250, y: 215 }, { x: 300, y: 255 }],
      seat: { x: 321, y: 272, pose: 'sit', facing: -1 },
      scaleNear: 1.0
    },
    cat: { baked: false, x: 485, y: 290, w: 38, h: 26 },
    customer: {
      id: 'lam-dev',
      spriteKey: 'lam',
      portrait: 'assets/lam_dev_portrait.png',
      name: 'Anh Lâm (Senior Developer)',
      dialogue: 'Làm cho anh ly Cà Phê Muối béo mặn xứ Huế nha em. Kèm lát bánh Tiramisu phô mai nhé, bug server dí từ sáng cần sốc lại tinh thần...',
      choices: [
        { text: 'Server lại 500 hả anh? Uống ly cà phê muối này rồi fix trong 1 nốt nhạc!', reply: 'Haha chuẩn em ơi, caffeine và kem muối béo mặn là thuốc giải duy nhất lúc này!', bonusHearts: 3 },
        { text: 'Kem muối béo thơm chuẩn vị Huế, chúc anh pass PR êm ru!', reply: 'Nghe êm ru là nhẹ cả đầu óc rồi em ơi, cảm ơn quán nha!', bonusHearts: 2 }
      ],
      requiredDrink: 'Cà Phê Muối',
      foodSnack: '🍰 Bánh Tiramisu',
      foodIcon: '🍰',
      recipe: { condensedMilk: 1, coffee: 1, eggFroth: 0, saltCream: 1, ice: 1, tea: 0, peach: 0, food: 1, stirred: false },
      thanks: 'Lớp kem muối béo mặn ngậy ngậy, cà phê thơm nức kết hợp bánh tiramisu đỉnh chóp em ơi!',
      reward: 45000,
      hearts: 10
    },
    ingredients: [
      { id: 'btn-add-coffee', name: 'Cà phê phin', icon: '☕', action: 'coffee' },
      { id: 'btn-add-condensed-milk', name: 'Sữa đặc', icon: '🥛', action: 'milk' },
      { id: 'btn-add-salt-cream', name: 'Kem muối béo', icon: '🧂', action: 'saltCream' },
      { id: 'btn-add-ice', name: 'Đá viên', icon: '🧊', action: 'ice' },
      { id: 'btn-add-food', name: 'Bánh Tiramisu', icon: '🍰', action: 'food' }
    ],
    menuNotes: [
      { name: 'Cà phê Muối xứ Huế:', formula: 'Sữa đặc + Cà phê + Kem muối + Đá viên' },
      { name: 'Cà phê Đen đá:', formula: 'Cà phê phin + Đá viên' },
      { name: 'Combo Văn Phòng:', formula: 'Cà phê muối + Bánh Tiramisu 🍰' }
    ]
  },
  morning: {
    key: 'morning',
    name: '☀️ Sáng Sớm Phố Cổ (Cà Phê Sáng)',
    targetX: 170,
    targetY: 313,
    route: {
      entry: { x: -50, y: 313, scale: 0.95 },
      waypoints: [{ x: 70, y: 313 }],
      seat: { x: 170, y: 313, pose: 'stand' },
      scaleNear: 1.0
    },
    cat: { baked: false, x: 435, y: 285, w: 38, h: 26 },
    customer: {
      id: 'ba-elder',
      spriteKey: 'owner',
      portrait: 'assets/nguyen_owner_portrait.png',
      name: 'Bác Ba (Cán Bộ Hưu Trí Đánh Cờ)',
      dialogue: 'Cho bác ly Cà Phê Đen Đá đậm đà không đường con nhé. Kèm ổ bánh mì pa-tê giòn rụm, sáng ra làm ván cờ với mấy ông bạn già vỉa hè là thú vui tao nhã...',
      choices: [
        { text: 'Dạ bác ngồi bàn gió mát nghen, sáng nay bác đã thắng ván nào chưa ạ?', reply: 'Haha bác vừa chiếu bí ông Tám một ván giòn giã con ạ!', bonusHearts: 3 },
        { text: 'Cà phê Robusta rang mộc thơm nức mũi bác nhé!', reply: 'Đúng gu bác rồi đấy, người sành cà phê như cháu hiếm lắm!', bonusHearts: 2 }
      ],
      requiredDrink: 'Cà Phê Đen Đá',
      foodSnack: '🥖 Bánh Mì Pa-Tê',
      foodIcon: '🥖',
      recipe: { condensedMilk: 0, coffee: 1, eggFroth: 0, saltCream: 0, ice: 1, tea: 0, peach: 0, food: 1, stirred: false },
      thanks: 'Cà phê đậm vị, đắng thanh hậu ngọt, bánh mì nóng giòn pa-tê béo ngậy. Tuyệt vời cháu ơi!',
      reward: 25000,
      hearts: 7
    },
    ingredients: [
      { id: 'btn-add-coffee', name: 'Cà phê phin', icon: '☕', action: 'coffee' },
      { id: 'btn-add-ice', name: 'Đá viên', icon: '🧊', action: 'ice' },
      { id: 'btn-add-tea', name: 'Trà đá vỉa hè', icon: '🍵', action: 'tea' },
      { id: 'btn-add-food', name: 'Bánh Mì Pa-Tê', icon: '🥖', action: 'food' }
    ],
    menuNotes: [
      { name: 'Cà phê Đen đá:', formula: 'Cà phê phin + Đá viên' },
      { name: 'Trà đá vỉa hè:', formula: 'Trà lài + Đá viên' },
      { name: 'Combo Ăn Sáng:', formula: 'Cà phê đen + Bánh mì pa-tê 🥖' }
    ]
  },
  hoian: {
    key: 'hoian',
    name: '🏮 Hoàng Hôn Bờ Sông Hội An (Bờ Sông Hoài)',
    targetX: 433,
    targetY: 270,
    route: {
      entry: { x: 520, y: 150, scale: 0.55 },
      waypoints: [{ x: 480, y: 170 }, { x: 445, y: 240 }],
      seat: { x: 433, y: 270, pose: 'sit', facing: -1 },
      scaleNear: 1.0
    },
    cat: { baked: false, x: 465, y: 280, w: 38, h: 26 },
    customer: {
      id: 'lan-merchant',
      spriteKey: 'hoa',
      portrait: 'assets/hoa_student_portrait.png',
      name: 'Cô Lan (Tiểu Thương Phố Cổ)',
      dialogue: 'Pha cho cô ly Trà Thảo Mộc Sả Chanh Sen (Trà Mót) thanh mát nha con ơi! Gánh hàng cả buổi chiều mệt nhoài, thêm đĩa bánh đập phố cổ giòn rụm chấm mắm nha...',
      choices: [
        { text: 'Hôm nay cô bán buôn đắt hàng không cô ơi?', reply: 'Nhờ trời thương cũng bán được mấy gánh hàng rong con ạ, cảm ơn con hỏi thăm nghen!', bonusHearts: 3 },
        { text: 'Con hái cánh sen tươi và nhánh sả thơm ngát làm ly trà Mót cho cô nha!', reply: 'Đúng điệu Hội An rồi con ơi, thơm thanh tao dễ chịu ghê!', bonusHearts: 2 }
      ],
      requiredDrink: 'Trà Thảo Mộc Sen',
      foodSnack: '🍘 Bánh Đập Phố Cổ',
      foodIcon: '🍘',
      recipe: { condensedMilk: 0, coffee: 0, eggFroth: 0, saltCream: 0, ice: 1, tea: 1, peach: 1, food: 1, stirred: false },
      thanks: 'Trà sen thơm dịu thanh mát, đĩa bánh đập giòn bùi chấm mắm thơm nức mũi con ơi!',
      reward: 35000,
      hearts: 9
    },
    ingredients: [
      { id: 'btn-add-tea', name: 'Trà thảo mộc', icon: '🍵', action: 'tea' },
      { id: 'btn-add-peach', name: 'Cánh sen & Sả', icon: '🌸', action: 'peach' },
      { id: 'btn-add-condensed-milk', name: 'Sữa đặc', icon: '🥛', action: 'milk' },
      { id: 'btn-add-coffee', name: 'Cà phê phin', icon: '☕', action: 'coffee' },
      { id: 'btn-add-ice', name: 'Đá viên', icon: '🧊', action: 'ice' },
      { id: 'btn-add-food', name: 'Bánh Đập', icon: '🍘', action: 'food' }
    ],
    menuNotes: [
      { name: 'Trà Mót Hội An:', formula: 'Trà thảo mộc + Cánh sen & Sả + Đá viên' },
      { name: 'Bạc xỉu ba tầng:', formula: '2x Sữa đặc + Cà phê + Đá viên' },
      { name: 'Combo Phố Cổ:', formula: 'Trà sen + Bánh Đập mắm nêm 🍘' }
    ]
  }
};

// Route & Safe Zone Validator
function validateRouteSafeZone(themeKey, route) {
  if (!route) return;
  const pts = [
    { pt: route.entry, name: 'entry' },
    ...(route.waypoints || []).map((wp, idx) => ({ pt: wp, name: `waypoint[${idx}]` })),
    { pt: route.seat, name: 'seat' }
  ];

  pts.forEach(({ pt, name }) => {
    if (!pt) return;
    // Hoi An water hazard: x < 400 && y > 190
    if (themeKey === 'hoian' && pt.x < 400 && pt.y > 190) {
      console.warn(`[SafeZone Hazard] Scene "${themeKey}" point "${name}" (${pt.x}, ${pt.y}) is inside the river area! Must have x >= 400 or y <= 190.`);
    }
  });
}

// Validate all scene routes at load time
Object.keys(SCENE_CONFIGS).forEach(key => {
  validateRouteSafeZone(key, SCENE_CONFIGS[key].route);
});

// --- SHOP ITEMS (TIỆM TẠP HÓA NÂNG CẤP) ---
const SHOP_ITEMS = [
  {
    id: 'pate_cat',
    name: 'Pate Thơm Cho Mèo Miu Miu',
    icon: '🐱',
    cost: 50000,
    desc: 'Cho mèo Miu Miu ăn no nê, mở khóa vuốt ve mèo thả tim liên tục (+1 💖)!',
    purchased: false
  },
  {
    id: 'cassette_radio',
    name: 'Đài Cát-xét Vintage',
    icon: '📻',
    cost: 80000,
    desc: 'Mở khóa bản giao hưởng Lofi Guitar acoustic chill sâu lắng hơn.',
    purchased: false
  },
  {
    id: 'hoian_lantern',
    name: 'Đèn Lồng Phố Cổ Hội An',
    icon: '🏮',
    cost: 100000,
    desc: 'Treo đèn lồng ấm cúng trước quán, tăng +25% tiền tip nhận được từ mọi khách!',
    purchased: false
  },
  {
    id: 'potted_plants',
    name: 'Chậu Hoa Cúc & Trầu Bà',
    icon: '🌸',
    cost: 60000,
    desc: 'Tô điểm sắc xanh tươi tắn, mỗi khách hài lòng thưởng thêm +3 Trái Tim!',
    purchased: false
  },
  {
    id: 'golden_phin',
    name: 'Phin Cà Phê Mạ Vàng Cung Đình',
    icon: '🏆',
    cost: 150000,
    desc: 'Phin mạ vàng hoàng gia giúp ủ cà phê nhỏ giọt nhanh gấp đôi thời gian!',
    purchased: false
  }
];

// --- 4. GAME CONTROLLER WITH BARISTA HANDS & LOCOMOTION ENGINE ---
class GameController {
  constructor() {
    this.story = new StoryManager();
    this.sound = new SoundEngine();
    this.canvas = document.getElementById('cafe-canvas');
    this.renderer = new PixelSceneRenderer(this.canvas);

    const urlParams = new URLSearchParams(window.location.search);
    const sceneParam = urlParams.get('scene');
    this.currentThemeKey = (sceneParam && SCENE_CONFIGS[sceneParam]) ? sceneParam : 'night';
    if (urlParams.get('debug') === '1' || urlParams.get('debug') === 'true') {
      this.renderer.debugMode = true;
    }
    this.coins = 0;
    this.hearts = 0;
    this.catState = 'sleep';
    this.catHappyTimer = null;

    // Upgrades Inventory
    this.upgrades = {
      pate_cat: false,
      cassette_radio: false,
      hoian_lantern: false,
      potted_plants: false,
      golden_phin: false
    };

    // Cup State
    this.cup = {
      condensedMilk: 0,
      coffee: 0,
      eggFroth: 0,
      saltCream: 0,
      ice: 0,
      tea: 0,
      peach: 0,
      food: 0,
      stirred: false
    };

    // Egg Whisking Minigame state
    this.isWhiskingActive = false;
    this.eggFrothProgress = 0;

    // Typewriter State
    this.typewriterTimer = null;
    this.isTyping = false;
    this.currentSpeechFull = '';

    // Customer Departure callback
    this.renderer.locomotion.onDepartCallback = () => {
      this.advanceToNextSceneCustomer();
    };

    this.initUI();
    this.loadScene(this.currentThemeKey);
    this.startLoop();
  }

  initUI() {
    // Theme Switcher Buttons
    const themeBtnMap = [
      { id: 'theme-night', key: 'night' },
      { id: 'theme-counter', key: 'counter' },
      { id: 'theme-indoor', key: 'indoor' },
      { id: 'theme-morning', key: 'morning' },
      { id: 'theme-sunset', key: 'hoian' }
    ];

    themeBtnMap.forEach(t => {
      const btn = document.getElementById(t.id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-theme').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadScene(t.key);
      });
    });

    // Audio toggles
    const btnAmbient = document.getElementById('btn-toggle-ambient');
    btnAmbient.addEventListener('click', () => {
      if (this.sound.isAmbientPlaying) {
        this.sound.stopAmbient();
        btnAmbient.classList.remove('active');
        btnAmbient.querySelector('.btn-text').textContent = 'Âm Thanh: TẮT';
      } else {
        this.sound.startAmbient();
        btnAmbient.classList.add('active');
        btnAmbient.querySelector('.btn-text').textContent = 'Âm Thanh: BẬT';
      }
    });

    const btnLofi = document.getElementById('btn-toggle-lofi');
    btnLofi.addEventListener('click', () => {
      if (this.sound.isLofiPlaying) {
        this.sound.stopLofi();
        btnLofi.classList.remove('active');
        btnLofi.querySelector('.btn-text').textContent = 'Lofi: TẮT';
      } else {
        this.sound.startLofi();
        btnLofi.classList.add('active');
        btnLofi.querySelector('.btn-text').textContent = 'Lofi: BẬT';
      }
    });

    // Auto-start audio on first user gesture
    document.body.addEventListener('click', () => {
      if (!this.sound.ctx) {
        this.sound.startAmbient();
      }
    }, { once: true });

    // Shop Modal triggers
    document.getElementById('btn-open-shop').addEventListener('click', () => this.openShopModal());
    document.getElementById('btn-close-shop').addEventListener('click', () => this.closeShopModal());
    document.getElementById('shop-modal').addEventListener('click', (e) => {
      if (e.target.id === 'shop-modal') this.closeShopModal();
    });

    // Polaroid Modal triggers
    document.getElementById('btn-open-polaroid').addEventListener('click', () => this.openPolaroidModal());
    document.getElementById('btn-close-polaroid').addEventListener('click', () => this.closePolaroidModal());
    document.getElementById('btn-close-polaroid-btn').addEventListener('click', () => this.closePolaroidModal());
    document.getElementById('btn-download-polaroid').addEventListener('click', () => this.downloadPolaroid());
    document.getElementById('polaroid-modal').addEventListener('click', (e) => {
      if (e.target.id === 'polaroid-modal') this.closePolaroidModal();
    });

    // Pet Cat button
    document.getElementById('btn-quick-pet-cat').addEventListener('click', (e) => this.petCat(e));

    // Next Customer button
    document.getElementById('btn-next-customer').addEventListener('click', () => {
      this.advanceToNextSceneCustomer();
      this.showToast('👋 Khách tiếp theo đang bước vào quán!');
    });

    // Fast-forward typewriter text on dialogue click
    document.getElementById('dialogue-box').addEventListener('click', (e) => {
      if (e.target.closest('.dialogue-choice-btn') || e.target.closest('.btn-skip-customer')) return;
      if (this.isTyping) {
        this.fastForwardTypewriter();
      }
    });

    // Debug Mode Toggle: Press 'D'
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'd' || e.key === 'D') {
        this.renderer.debugMode = !this.renderer.debugMode;
        this.showToast(this.renderer.debugMode ? '🛠️ DEBUG MODE: BẬT (Đường đi & Tọa độ)' : '🛠️ DEBUG MODE: TẮT');
      }
    });

    // Canvas click: check if clicked on cat in current scene with 4px padding
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      const sceneCfg = SCENE_CONFIGS[this.currentThemeKey];
      const cat = sceneCfg && sceneCfg.cat;
      if (cat && x >= cat.x - 4 && x <= cat.x + cat.w + 4 && y >= cat.y - 4 && y <= cat.y + cat.h + 4) {
        this.petCat(e);
      }
    });

    // Canvas hover: wake up cat when cursor approaches & update debug coords
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) * (this.canvas.width / rect.width));
      const y = Math.round((e.clientY - rect.top) * (this.canvas.height / rect.height));
      this.renderer.mouseDebug = { x, y };

      const sceneCfg = SCENE_CONFIGS[this.currentThemeKey];
      const cat = sceneCfg && sceneCfg.cat;
      if (cat && x >= cat.x - 6 && x <= cat.x + cat.w + 6 && y >= cat.y - 6 && y <= cat.y + cat.h + 6) {
        if (this.catState === 'sleep') {
          this.catState = 'awake';
          clearTimeout(this.catAwakeTimer);
          this.catAwakeTimer = setTimeout(() => {
            if (this.catState === 'awake') {
              this.catState = 'sleep';
            }
          }, 3500);
        }
      }
    });

    // Whisking Action button
    document.getElementById('btn-whisk-action').addEventListener('click', () => this.whiskEggStep());

    // Action buttons
    document.getElementById('btn-stir').addEventListener('click', () => this.stirCupWithHands());
    document.getElementById('btn-reset').addEventListener('click', () => this.resetCup());
    document.getElementById('btn-serve').addEventListener('click', () => this.serveCustomerWithHands());
  }

  loadScene(themeKey) {
    this.currentThemeKey = themeKey;
    const sceneCfg = SCENE_CONFIGS[themeKey] || SCENE_CONFIGS.night;

    // Reset cat state & timers when switching scenes
    clearTimeout(this.catHappyTimer);
    clearTimeout(this.catAwakeTimer);
    this.catState = 'sleep';

    // 1. Update Renderer & Audio
    this.renderer.setTheme(themeKey, sceneCfg);
    this.sound.setAmbientTheme(themeKey);
    document.getElementById('weather-status').textContent = sceneCfg.name;

    // 2. Load Scene-Specific Customer
    const customer = sceneCfg.customer;
    document.getElementById('customer-avatar-img').src = customer.portrait;
    document.getElementById('speaker-name').textContent = customer.name;
    document.getElementById('order-badge').innerHTML = `Yêu cầu: <strong>${customer.requiredDrink}</strong> + ${customer.foodSnack}`;
    document.getElementById('customer-emotion').textContent = 'Trạng thái: ⏳ Đang đợi nước & đồ ăn...';

    // Show/hide Pet Cat button based on cat availability in scene
    const btnCat = document.getElementById('btn-quick-pet-cat');
    if (btnCat) {
      btnCat.style.display = sceneCfg.cat ? 'inline-flex' : 'none';
    }

    // Typewriter dialogue (cốt truyện theo cờ)
    const arrival = this.story.getArrival(themeKey, customer.dialogue);
    this.typewriterText(`"${arrival}"`);

    // Dialogue choices (đã lọc theo cờ)
    this.renderDialogueChoices(this.story.getChoices(themeKey));

    // Tip potential
    const tipAmount = this.upgrades.hoian_lantern ? Math.round(customer.reward * 1.25) : customer.reward;
    document.getElementById('tip-potential').textContent = `Thưởng tiềm năng: +${tipAmount.toLocaleString('vi-VN')}đ`;

    // 3. Update Plate Dish Display for accompanying food
    const dishIcon = document.getElementById('dish-icon');
    const dishLabel = document.getElementById('dish-label');
    dishIcon.textContent = customer.foodIcon || '🥖';
    dishLabel.textContent = customer.foodSnack || 'Bánh Mì';

    // 4. Render Dynamic Ingredients Grid for this Scene
    this.renderSceneIngredients(sceneCfg.ingredients);

    // 5. Update Menu Reference Book
    this.renderSceneMenuNotes(sceneCfg.name, sceneCfg.menuNotes);

    // Reset cup
    this.resetCup();
    this.showToast(`✨ Bối cảnh: ${sceneCfg.name}`);
  }

  advanceToNextSceneCustomer() {
    const keys = Object.keys(SCENE_CONFIGS);
    const currIdx = keys.indexOf(this.currentThemeKey);
    const nextKey = keys[(currIdx + 1) % keys.length];

    // Update active theme button
    document.querySelectorAll('.btn-theme').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === nextKey);
    });

    this.loadScene(nextKey);
  }

  // --- DYNAMIC SCENE INGREDIENTS GRID ---
  renderSceneIngredients(ingredients) {
    const grid = document.getElementById('ingredient-grid');
    grid.innerHTML = '';

    ingredients.forEach(ing => {
      const btn = document.createElement('button');
      btn.className = 'btn-ingredient';
      btn.id = ing.id;
      btn.innerHTML = `<span class="ing-icon">${ing.icon}</span><span class="ing-name">${ing.name}</span>`;

      btn.addEventListener('click', () => {
        if (ing.action === 'milk') this.addCondensedMilkWithHands();
        else if (ing.action === 'coffee') this.addCoffeePhinWithHands();
        else if (ing.action === 'ice') this.addIceWithHands();
        else if (ing.action === 'tea') this.addTeaWithHands();
        else if (ing.action === 'peach') this.addPeachWithHands();
        else if (ing.action === 'egg') this.triggerEggWhiskingMinigame();
        else if (ing.action === 'saltCream') this.addSaltCreamWithHands();
        else if (ing.action === 'food') this.prepareFoodSnack();
      });

      grid.appendChild(btn);
    });
  }

  renderSceneMenuNotes(sceneTitle, menuNotes) {
    const titleElem = document.getElementById('recipe-menu-title');
    const listElem = document.getElementById('recipe-list');
    titleElem.textContent = `📖 Sổ Tay Menu: ${sceneTitle.split('•')[0]}`;
    listElem.innerHTML = '';

    menuNotes.forEach(m => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${m.name}</strong> ${m.formula}`;
      listElem.appendChild(li);
    });
  }

  // --- ANIMATED BARISTA HANDS TRIGGER ENGINE ---
  playBaristaHand(handId, duration = 1800, callback) {
    const overlay = document.getElementById('barista-hands-overlay');
    overlay.querySelectorAll('.hand-anim').forEach(h => h.classList.remove('active'));

    const target = document.getElementById(handId);
    if (target) {
      target.classList.add('active');
      setTimeout(() => {
        target.classList.remove('active');
        if (callback) callback();
      }, duration);
    } else if (callback) {
      callback();
    }
  }

  // 1. Sữa đặc với bàn tay lon Ông Thọ
  addCondensedMilkWithHands() {
    if (this.cup.condensedMilk >= 2) {
      this.showToast('⚠️ Quá nhiều sữa đặc rồi, sẽ bị ngọt gắt!');
      return;
    }
    this.sound.playPourSound('milk');
    this.showToast('🥛 Bàn tay Barista đang rót dòng sữa Ông Thọ óng ả...');

    this.playBaristaHand('hand-pour-milk', 2000, () => {
      this.cup.condensedMilk++;
      this.updateCupVisuals();
      this.showToast('✨ Đã rót sữa đặc béo ngậy vào đáy ly!');
    });
  }

  // 2. Cà phê phin với bàn tay ấm rót bốc khói
  addCoffeePhinWithHands() {
    if (this.cup.coffee >= 2) {
      this.showToast('⚠️ Ly đã đầy cà phê rồi!');
      return;
    }
    const phin = document.getElementById('phin-station');
    phin.classList.add('active');
    const isFastPhin = this.upgrades.golden_phin;
    this.sound.playPourSound('coffee');
    this.showToast(isFastPhin ? '🏆 Phin Mạ Vàng đang ủ cà phê siêu nhanh...' : '☕ Bàn tay Barista đang ủ & rót cà phê phin thơm lừng...');

    this.playBaristaHand('hand-pour-coffee', 2000, () => {
      phin.classList.remove('active');
      this.cup.coffee++;
      this.updateCupVisuals();
      this.showToast('✨ Cà phê phin đậm đà đã rót đầy ly!');
    });
  }

  // 3. Kẹp gắp đá viên với bàn tay kẹp inox
  addIceWithHands() {
    if (this.cup.ice >= 1) {
      this.showToast('⚠️ Đã gắp đủ đá viên mát lạnh rồi!');
      return;
    }
    this.sound.playIceClink();
    this.showToast('🧊 Bàn tay Barista dùng kẹp gắp đá viên mát lạnh...');

    this.playBaristaHand('hand-add-ice', 1600, () => {
      this.cup.ice = 1;
      this.updateCupVisuals();
      this.showToast('✨ Đã thả đá viên lách cách vào ly!');
    });
  }

  // 4. Rót trà lài / trà thảo mộc
  addTeaWithHands() {
    if (this.cup.tea >= 1) {
      this.showToast('⚠️ Ly đã đầy trà rồi!');
      return;
    }
    this.sound.playPourSound('tea');
    this.showToast('🍵 Bàn tay Barista đang rót trà thơm ngát...');

    this.playBaristaHand('hand-pour-coffee', 1800, () => {
      this.cup.tea = 1;
      this.updateCupVisuals();
      this.showToast('✨ Đã rót trà thơm thanh mát!');
    });
  }

  // 5. Gắp lát đào & cành sả tươi
  addPeachWithHands() {
    if (this.cup.peach >= 1) {
      this.showToast('⚠️ Đã trang trí đủ đào và sả rồi!');
      return;
    }
    this.sound.playIceClink();
    this.showToast('🍑 Bàn tay Barista cẩn thận đặt lát đào giòn & nhánh sả thơm...');

    this.playBaristaHand('hand-garnish-anim', 1600, () => {
      this.cup.peach = 1;
      this.updateCupVisuals();
      this.showToast('✨ Đã hoàn tất trang trí topping!');
    });
  }

  // 6. Kem muối béo ngậy
  addSaltCreamWithHands() {
    if (this.cup.saltCream >= 1) {
      this.showToast('⚠️ Đã phủ lớp kem muối béo mặn rồi!');
      return;
    }
    this.sound.playPourSound('milk');
    this.showToast('🧂 Bàn tay Barista đang rót lớp kem muối béo ngậy...');

    this.playBaristaHand('hand-pour-milk', 1800, () => {
      this.cup.saltCream = 1;
      this.updateCupVisuals();
      this.showToast('✨ Lớp kem muối béo mặn đã phủ lên trên!');
    });
  }

  // 7. Chuẩn bị món ăn kèm (Bánh mì giòn, Croissant, Tiramisu...)
  prepareFoodSnack() {
    this.cup.food = 1;
    this.sound.playIceClink();
    const plate = document.getElementById('plate-dish');
    plate.style.transform = 'scale(1.25) rotate(12deg)';
    setTimeout(() => { plate.style.transform = 'scale(1)'; }, 350);

    const sceneCfg = SCENE_CONFIGS[this.currentThemeKey];
    this.showToast(`✨ Đã chuẩn bị xong đĩa ${sceneCfg.customer.foodSnack} thơm ngon nóng hổi!`);
    this.updateCupVisuals();
  }

  // 8. Bàn tay khuấy muỗng xoay tròn 360 độ
  stirCupWithHands() {
    if (this.cup.stirred) return;
    const spoon = document.getElementById('spoon');
    const vortex = document.getElementById('liquid-vortex');
    spoon.classList.add('stirring');
    vortex.classList.add('active');
    this.sound.playStirSound();
    this.showToast('🥄 Bàn tay Barista đang cầm muỗng dài khuấy đều hòa quyện...');

    this.playBaristaHand('hand-stir-anim', 2400, () => {
      spoon.classList.remove('stirring');
      vortex.classList.remove('active');
      this.cup.stirred = true;
      this.updateCupVisuals();
      this.showToast('✨ Ly nước đã được khuấy đều thơm sánh mịn!');
    });
  }

  // 9. Giao cho khách với bàn tay phục vụ
  serveCustomerWithHands() {
    const sceneCfg = SCENE_CONFIGS[this.currentThemeKey];
    const customer = sceneCfg.customer;
    const target = customer.recipe;

    const isMilkOk = this.cup.condensedMilk === target.condensedMilk;
    const isCoffeeOk = this.cup.coffee === target.coffee;
    const isEggOk = (target.eggFroth === 0 && this.cup.eggFroth === 0) || (target.eggFroth > 0 && this.cup.eggFroth >= 100);
    const isSaltOk = this.cup.saltCream === target.saltCream;
    const isIceOk = this.cup.ice === target.ice;
    const isTeaOk = this.cup.tea === target.tea;
    const isPeachOk = this.cup.peach === target.peach;
    const isFoodOk = target.food === 0 || this.cup.food === target.food;
    const isStirOk = !target.stirred || this.cup.stirred;

    if (isMilkOk && isCoffeeOk && isEggOk && isSaltOk && isIceOk && isTeaOk && isPeachOk && isFoodOk && isStirOk) {
      // Perfect brew!
      this.sound.playSuccess();
      this.playBaristaHand('hand-serve-anim', 1600);

      let earnedTip = customer.reward;
      if (this.upgrades.hoian_lantern) {
        earnedTip = Math.round(earnedTip * 1.25);
      }
      let earnedHearts = customer.hearts;
      if (this.upgrades.potted_plants) {
        earnedHearts += 3;
      }

      this.coins += earnedTip;
      this.hearts += earnedHearts;

      document.getElementById('coin-count').textContent = this.coins.toLocaleString('vi-VN');
      document.getElementById('heart-count').textContent = this.hearts;

      this.typewriterText(`"${this.story.getServe(this.currentThemeKey, customer.thanks)}"`);
      document.getElementById('customer-emotion').textContent = 'Trạng thái: 😄 Vô cùng hài lòng! Đang nhận nước...';

      // Customer receives drink & walks away
      this.renderer.receiveDrink('☕');

      this.spawnFloatingHeart(window.innerWidth / 2 - 40, window.innerHeight / 2 - 20);
      setTimeout(() => this.spawnFloatingHeart(window.innerWidth / 2 + 40, window.innerHeight / 2 - 40), 200);

      this.showToast(`🎉 Phục vụ xuất sắc! Nhận được ${earnedTip.toLocaleString('vi-VN')}đ (+${earnedHearts} 💖)! Khách đang cầm nước rời quán...`);
    } else {
      this.showToast('❌ Món chưa đúng yêu cầu, hãy kiểm tra lại sổ tay công thức!');
      this.typewriterText(`"Hình như ly này hoặc món ăn chưa đúng món mình gọi rồi, bạn thử làm lại giùm nha..."`);
      document.getElementById('customer-emotion').textContent = 'Trạng thái: 😕 Chưa đúng món gọi';
    }
  }

  // --- TYPEWRITER EFFECT & AUDIO BLIP ---
  typewriterText(fullText) {
    if (this.typewriterRafId) {
      cancelAnimationFrame(this.typewriterRafId);
      this.typewriterRafId = null;
    }
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    const textElem = document.getElementById('speech-text');
    textElem.textContent = '';
    this.currentSpeechFull = fullText;
    this.isTyping = true;

    const charInterval = 28; // 28ms per character
    const minBlipInterval = 84; // max blip sound every 84ms
    const startTime = performance.now();
    let lastBlipTime = 0;
    let lastRenderedChars = 0;

    const step = (currentTime) => {
      if (!this.isTyping) return;
      const elapsed = currentTime - startTime;
      const charCount = Math.min(fullText.length, Math.floor(elapsed / charInterval));

      if (charCount !== lastRenderedChars) {
        textElem.textContent = fullText.slice(0, charCount);
        lastRenderedChars = charCount;

        if (this.isTyping && currentTime - lastBlipTime >= minBlipInterval) {
          this.sound.playDialogueBlip();
          lastBlipTime = currentTime;
        }
      }

      if (charCount < fullText.length) {
        this.typewriterRafId = requestAnimationFrame(step);
      } else {
        this.typewriterRafId = null;
        this.isTyping = false;
      }
    };

    this.typewriterRafId = requestAnimationFrame(step);
  }

  fastForwardTypewriter() {
    if (this.typewriterRafId) {
      cancelAnimationFrame(this.typewriterRafId);
      this.typewriterRafId = null;
    }
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
    document.getElementById('speech-text').textContent = this.currentSpeechFull;
    this.isTyping = false;
  }

  // --- BRANCHING DIALOGUE CHOICES ---
  renderDialogueChoices(choices) {
    const container = document.getElementById('dialogue-choices');
    container.innerHTML = '';
    if (!choices || choices.length === 0) return;

    choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice-btn';
      btn.innerHTML = `<span class="choice-num">💬 ${idx + 1}.</span> <span>${choice.text}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectDialogueChoice(choice, btn);
      });
      container.appendChild(btn);
    });
  }

  selectDialogueChoice(choice, btnElement) {
    const container = document.getElementById('dialogue-choices');
    const buttons = container.querySelectorAll('.dialogue-choice-btn');
    buttons.forEach(b => {
      b.disabled = true;
      b.style.pointerEvents = 'none';
      if (b !== btnElement) b.style.opacity = '0.5';
    });
    btnElement.classList.add('selected');

    this.typewriterText(`"${choice.reply}"`);
    document.getElementById('customer-emotion').textContent = 'Trạng thái: 😊 Rất cảm kích trò chuyện!';

    const bonus = choice.bonusHearts || 2;
    this.hearts += bonus;
    document.getElementById('heart-count').textContent = this.hearts;
    this.sound.playIceClink();
    this.spawnFloatingHeart(window.innerWidth / 2, window.innerHeight / 2);
    this.showToast(`💖 Nhận được +${bonus} Trái Tim thân thiết từ khách!`);

    // Chương 2 Milestone Toast Hooks
    if (choice.effects) {
      if (choice.effects.ba_lan_thu && !this.story.flags.ba_lan_thu) {
        setTimeout(() => this.showToast('📖 Chương 2: Bức thư cũ trong cuốn sổ cờ tướng!'), 650);
      } else if (choice.effects.ba_lan_gap_lai && !this.story.flags.ba_lan_gap_lai) {
        setTimeout(() => this.showToast('📖 Chương 2: Nhận lời gửi gắm tới cô Lan Hội An!'), 650);
      } else if (choice.effects.lam_hoa_startup && !this.story.flags.lam_hoa_startup) {
        setTimeout(() => this.showToast('📖 Chương 2: Hoa & Lâm bắt đầu dự án khởi nghiệp!'), 650);
      } else if (choice.effects.vinh_wave && !this.story.flags.vinh_wave) {
        setTimeout(() => this.showToast('📖 Chương 2: Chuyện chiếc Wave cũ của chú Vinh!'), 650);
      }
    }

    const event = this.story.applyEffects(choice.effects);
    if (event === 'ending') {
      this.triggerEnding();
    }
  }

  triggerEnding() {
    this.sound.playSuccess();
    this.showToast('🏁 Chương 1 hoàn thành: Chiếc ô vàng đã về tay chủ!');
    this.spawnFloatingHeart(window.innerWidth / 2, window.innerHeight / 2);
    setTimeout(() => {
      this.spawnFloatingHeart(window.innerWidth / 2 - 30, window.innerHeight / 2 - 30);
      this.spawnFloatingHeart(window.innerWidth / 2 + 30, window.innerHeight / 2 - 30);
    }, 250);
  }

  // --- PET CAT FEATURE ---
  petCat(e) {
    this.catState = 'happy';
    clearTimeout(this.catHappyTimer);
    clearTimeout(this.catAwakeTimer);
    this.catHappyTimer = setTimeout(() => {
      this.catState = 'awake';
      this.catAwakeTimer = setTimeout(() => {
        if (this.catState === 'awake') {
          this.catState = 'sleep';
        }
      }, 3500);
    }, 800);

    this.sound.playMeowSound();
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;

    if (this.upgrades.pate_cat) {
      this.hearts += 1;
      document.getElementById('heart-count').textContent = this.hearts;
      this.spawnFloatingHeart(x, y);
      this.showToast('🐾 Miu Miu kêu "Meo meo~" cuộn tròn sung sướng! (+1 💖)');
    } else {
      this.showToast('🐾 Miu Miu kêu "Meo meo~" dụi đầu vào tay bạn! (💡 Mua "Pate Thơm" trong Tiệm Nâng Cấp để mèo no nê và thưởng tim liên tục!)');
    }
  }

  spawnFloatingHeart(x, y) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = '💖';
    heart.style.left = `${x || window.innerWidth / 2}px`;
    heart.style.top = `${y || window.innerHeight / 2}px`;
    document.body.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1400);
  }

  // --- SHOP MODAL & UPGRADES ---
  openShopModal() {
    this.renderShopItems();
    document.getElementById('shop-modal').classList.remove('hidden');
  }

  closeShopModal() {
    document.getElementById('shop-modal').classList.add('hidden');
  }

  renderShopItems() {
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
      const isPurchased = this.upgrades[item.id];
      const card = document.createElement('div');
      card.className = `shop-item-card ${isPurchased ? 'purchased' : ''}`;

      card.innerHTML = `
        <div class="shop-item-head">
          <span class="shop-item-icon">${item.icon}</span>
          <span class="shop-item-name">${item.name}</span>
        </div>
        <p class="shop-item-desc">${item.desc}</p>
        <div class="shop-item-foot">
          <span class="shop-item-price">${isPurchased ? '✅ Đã Sở Hữu' : item.cost.toLocaleString('vi-VN') + 'đ'}</span>
          <button class="btn-buy-item" ${isPurchased || this.coins < item.cost ? 'disabled' : ''} data-id="${item.id}">
            ${isPurchased ? 'Đã Mua' : 'Mua Ngay'}
          </button>
        </div>
      `;

      const buyBtn = card.querySelector('.btn-buy-item');
      if (!isPurchased) {
        buyBtn.addEventListener('click', () => this.buyShopItem(item));
      }

      grid.appendChild(card);
    });
  }

  buyShopItem(item) {
    if (this.coins < item.cost) {
      this.showToast('⚠️ Không đủ tiền tip để mua vật phẩm này!');
      return;
    }

    this.coins -= item.cost;
    this.upgrades[item.id] = true;
    document.getElementById('coin-count').textContent = this.coins.toLocaleString('vi-VN');

    this.sound.playPurchaseSound();
    this.renderShopItems();
    this.showToast(`🎉 Đã mua thành công: ${item.name}!`);

    if (item.id === 'cassette_radio') {
      this.sound.startLofi();
      document.getElementById('btn-toggle-lofi').classList.add('active');
      document.getElementById('btn-toggle-lofi').querySelector('.btn-text').textContent = 'Lofi: BẬT';
    }
  }

  // --- POLAROID PHOTO STUDIO ---
  openPolaroidModal() {
    this.sound.playCameraShutter();
    const modal = document.getElementById('polaroid-modal');
    const img = document.getElementById('polaroid-img');
    const captionText = document.getElementById('polaroid-caption').querySelector('.polaroid-text');
    const dateText = document.getElementById('polaroid-date');

    const dataUrl = this.canvas.toDataURL('image/png');
    img.src = dataUrl;

    const sceneCfg = SCENE_CONFIGS[this.currentThemeKey];
    captionText.textContent = `Cà Phê Cóc Vỉa Hè • Cùng ${sceneCfg.customer.name}`;
    const now = new Date();
    dateText.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} - Phố Thị Việt Nam`;

    modal.classList.remove('hidden');
  }

  closePolaroidModal() {
    document.getElementById('polaroid-modal').classList.add('hidden');
  }

  downloadPolaroid() {
    this.sound.playSuccess();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 680;
    exportCanvas.height = 540;
    const ectx = exportCanvas.getContext('2d');

    ectx.fillStyle = '#f8fafc';
    ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ectx.drawImage(this.canvas, 20, 20, 640, 360);

    ectx.strokeStyle = '#cbd5e1';
    ectx.lineWidth = 2;
    ectx.strokeRect(20, 20, 640, 360);

    const sceneCfg = SCENE_CONFIGS[this.currentThemeKey];
    ectx.fillStyle = '#0f172a';
    ectx.font = 'bold 20px "Courier New", monospace';
    ectx.fillText(`CÀ PHÊ CÓC VỈA HÈ • ${sceneCfg.customer.name}`, 30, 430);

    ectx.fillStyle = '#64748b';
    ectx.font = 'italic 16px "Courier New", monospace';
    const now = new Date();
    ectx.fillText(`Phố Thị Việt Nam • ${now.toLocaleDateString('vi-VN')} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`, 30, 465);

    const link = document.createElement('a');
    link.download = `ca-phe-coc-polaroid-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    this.showToast('💾 Đã lưu ảnh kỷ niệm Polaroid về máy thành công!');
  }

  // --- MINIGAME ĐÁNH TRỨNG ---
  triggerEggWhiskingMinigame() {
    const card = document.getElementById('minigame-card');
    card.classList.add('active');
    this.eggFrothProgress = 0;
    this.updateMinigameUI();
    this.showToast('🥣 Hãy bấm nhanh vào nút bên dưới để đánh bông kem trứng!');
  }

  whiskEggStep() {
    this.eggFrothProgress = Math.min(100, this.eggFrothProgress + 15);
    this.sound.playWhiskSound();
    this.updateMinigameUI();

    if (this.eggFrothProgress >= 100) {
      setTimeout(() => {
        document.getElementById('minigame-card').classList.remove('active');
        this.cup.eggFroth = 100;
        this.updateCupVisuals();
        this.showToast('🎉 Kem trứng đã đánh bông mịn béo ngậy!');
      }, 300);
    }
  }

  updateMinigameUI() {
    document.getElementById('minigame-progress-txt').textContent = `Độ bông: ${this.eggFrothProgress}%`;
    document.getElementById('minigame-bar').style.width = `${this.eggFrothProgress}%`;
  }

  resetCup() {
    this.cup = {
      condensedMilk: 0,
      coffee: 0,
      eggFroth: 0,
      saltCream: 0,
      ice: 0,
      tea: 0,
      peach: 0,
      food: 0,
      stirred: false
    };
    document.getElementById('minigame-card').classList.remove('active');
    document.getElementById('phin-station').classList.remove('active');
    document.getElementById('liquid-vortex').classList.remove('active');
    this.updateCupVisuals();
  }

  updateCupVisuals() {
    const layerCoffee = document.getElementById('layer-coffee');
    const layerTea = document.getElementById('layer-tea');
    const layerEgg = document.getElementById('layer-egg-foam');
    const layerSalt = document.getElementById('layer-salt-cream');
    const layerGarnish = document.getElementById('layer-garnish');
    const condensedBottom = document.getElementById('condensed-milk');
    const iceCubes = document.getElementById('ice-cubes');
    const cupStatus = document.getElementById('cup-status');
    const btnStir = document.getElementById('btn-stir');
    const btnServe = document.getElementById('btn-serve');

    // Condensed milk
    condensedBottom.style.height = (this.cup.condensedMilk * 18) + '%';

    // Coffee layer
    layerCoffee.style.height = (this.cup.coffee * 35) + '%';

    // Tea layer
    layerTea.style.height = (this.cup.tea * 55) + '%';

    // Egg foam layer
    layerEgg.style.height = (this.cup.eggFroth > 0 ? 30 : 0) + '%';

    // Salt cream layer
    if (layerSalt) {
      layerSalt.style.height = (this.cup.saltCream > 0 ? 25 : 0) + '%';
    }

    // Stirred color transition
    if (this.cup.stirred) {
      if (this.cup.condensedMilk > 0 && this.cup.coffee > 0) {
        layerCoffee.classList.add('liquid-mixed');
        condensedBottom.style.height = '0%';
      }
    } else {
      layerCoffee.classList.remove('liquid-mixed');
    }

    // Ice cubes
    if (this.cup.ice > 0) {
      iceCubes.innerHTML = `
        <div class="ice-cube"></div>
        <div class="ice-cube" style="transform: rotate(-20deg);"></div>
        <div class="ice-cube" style="transform: rotate(35deg);"></div>
      `;
      iceCubes.style.opacity = '1';
    } else {
      iceCubes.innerHTML = '';
      iceCubes.style.opacity = '0';
    }

    // Peach Garnish
    if (this.cup.peach > 0) {
      layerGarnish.innerHTML = `
        <div class="peach-slice"></div>
        <div class="lemongrass-stick"></div>
      `;
      layerGarnish.style.opacity = '1';
    } else {
      layerGarnish.innerHTML = '';
      layerGarnish.style.opacity = '0';
    }

    // Name status
    let currentDrinkName = this.identifyDrinkName();
    cupStatus.textContent = currentDrinkName;

    // Hint text
    const hasIngredients = this.cup.condensedMilk > 0 || this.cup.coffee > 0 || this.cup.tea > 0 || this.cup.eggFroth > 0 || this.cup.saltCream > 0 || this.cup.food > 0;
    btnStir.disabled = !hasIngredients || this.cup.stirred;
    btnServe.disabled = !hasIngredients;

    const hint = document.getElementById('brewing-step-hint');
    if (!hasIngredients) {
      hint.textContent = 'Bước 1: Chọn nguyên liệu pha chế & đồ ăn kèm';
    } else if (!this.cup.stirred && this.cup.condensedMilk > 0 && this.cup.eggFroth === 0 && this.cup.saltCream === 0) {
      hint.textContent = 'Bước 2: Bấm Khuấy Đều';
    } else {
      hint.textContent = 'Bước 3: Giao Cho Khách';
    }
  }

  identifyDrinkName() {
    let name = 'Ly Trống...';
    if (this.cup.saltCream > 0 && this.cup.coffee > 0) {
      name = 'Cà Phê Muối Xứ Huế';
    } else if (this.cup.eggFroth > 0 && this.cup.coffee > 0) {
      name = 'Cà Phê Trứng Hà Nội';
    } else if (this.cup.peach > 0 && this.cup.tea > 0) {
      name = this.currentThemeKey === 'hoian' ? 'Trà Mót Hội An (Sen & Sả)' : 'Trà Đào Cam Sả';
    } else if (this.cup.tea > 0 && this.cup.coffee === 0) {
      name = this.cup.ice > 0 ? 'Trà Đá Vỉa Hè' : 'Trà Nóng';
    } else if (this.cup.coffee > 0) {
      if (this.cup.condensedMilk === 0) {
        name = this.cup.ice > 0 ? 'Cà Phê Đen Đá' : 'Cà Phê Đen Nóng';
      } else if (this.cup.condensedMilk === 1) {
        name = this.cup.stirred ? 'Cà Phê Sữa Đá (Đã khuấy)' : 'Cà Phê Sữa (Chưa khuấy)';
      } else if (this.cup.condensedMilk >= 2) {
        name = this.cup.stirred ? 'Bạc Xỉu Sài Gòn' : 'Bạc Xỉu Ba Tầng';
      }
    } else if (this.cup.condensedMilk > 0) {
      name = 'Sữa Đặc Pha Nóng';
    } else if (this.cup.ice > 0) {
      name = 'Ly Đá Không';
    }

    if (this.cup.food > 0) {
      const sceneCfg = SCENE_CONFIGS[this.currentThemeKey];
      name += ` + ${sceneCfg.customer.foodSnack}`;
    }
    return name;
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  startLoop() {
    let lastTime = performance.now();
    let accumulator = 0;
    const fixedDt = 1000 / 60; // 16.6667ms fixed logic step

    const loop = (currentTime) => {
      if (typeof currentTime !== 'number') currentTime = performance.now();
      let frameTime = currentTime - lastTime;
      lastTime = currentTime;
      if (frameTime > 250) frameTime = 250; // Clamp lag spikes

      accumulator += frameTime;
      while (accumulator >= fixedDt) {
        this.renderer.updateLogic(fixedDt / 1000);
        accumulator -= fixedDt;
      }

      const sceneCfg = SCENE_CONFIGS[this.currentThemeKey];
      this.renderer.render(sceneCfg.customer, sceneCfg.cat, this.catState);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Start game
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameController();
});
