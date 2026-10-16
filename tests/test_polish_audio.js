/**
 * tests/test_polish_audio.js
 * Bộ test xác minh hoàn thiện âm thanh:
 * 1. computeMasterGain: muted trả 0, volume hợp lệ, volume ngoài [0,1] bị kẹp
 * 2. computeFadeGain: trước startTime trả from, sau startTime+duration trả to, giữa chừng nội suy tuyến tính
 * 3. AUDIO_GAINS: các hằng số nhóm âm thanh và quan hệ âm lượng
 * 4. SoundEngine & Teardown: masterGain, mute toggle, stopAmbient và stopLofi an toàn khi gọi lặp lại (idempotent)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Tạo mock môi trường Web Audio API
class MockAudioParam {
  constructor(initial = 1) {
    this.value = initial;
    this.calls = [];
  }
  setValueAtTime(val, time) {
    this.value = val;
    this.calls.push({ type: 'setValueAtTime', val, time });
  }
  linearRampToValueAtTime(val, time) {
    this.value = val;
    this.calls.push({ type: 'linearRampToValueAtTime', val, time });
  }
  exponentialRampToValueAtTime(val, time) {
    this.value = val;
    this.calls.push({ type: 'exponentialRampToValueAtTime', val, time });
  }
  cancelScheduledValues(time) {
    this.calls.push({ type: 'cancelScheduledValues', time });
  }
}

class MockAudioNode {
  constructor(type = 'node') {
    this.nodeType = type;
    this.connectedTo = [];
    this.stopped = false;
    this.disconnected = false;
  }
  connect(dest) {
    this.connectedTo.push(dest);
    return dest;
  }
  disconnect() {
    this.disconnected = true;
  }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super('gain');
    this.gain = new MockAudioParam(1);
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super('oscillator');
    this.frequency = new MockAudioParam(440);
    this.type = 'sine';
    this.started = false;
    this.stopCalls = 0;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.stopCalls++;
    if (this.stopCalls > 1) {
      // Giả lập Web Audio API thật: ném lỗi nếu gọi stop() lần 2
      throw new Error('InvalidStateError: Oscillator has already been stopped');
    }
    this.stopped = true;
  }
}

class MockBufferSourceNode extends MockAudioNode {
  constructor() {
    super('bufferSource');
    this.buffer = null;
    this.loop = false;
    this.started = false;
    this.stopCalls = 0;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.stopCalls++;
    if (this.stopCalls > 1) {
      throw new Error('InvalidStateError: BufferSource has already been stopped');
    }
    this.stopped = true;
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super('biquad');
    this.frequency = new MockAudioParam(1000);
    this.type = 'lowpass';
  }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 10.0;
    this.sampleRate = 44100;
    this.state = 'running';
    this.destination = new MockAudioNode('destination');
    this.resumed = false;
  }
  createGain() {
    return new MockGainNode();
  }
  createOscillator() {
    return new MockOscillatorNode();
  }
  createBufferSource() {
    return new MockBufferSourceNode();
  }
  createBiquadFilter() {
    return new MockBiquadFilterNode();
  }
  createBuffer(channels, length, sampleRate) {
    return {
      numberOfChannels: channels,
      length: length,
      sampleRate: sampleRate,
      getChannelData: () => new Float32Array(length)
    };
  }
  async resume() {
    this.resumed = true;
    this.state = 'running';
  }
}

// 2. Thiết lập sandbox nạp game.js
const mockGlobal = {
  window: {},
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: { addEventListener: () => {} }
  },
  addEventListener: () => {},
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  Image: class Image {},
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  setInterval: (fn) => setTimeout(fn, 1),
  clearInterval: () => {},
  setTimeout: (fn) => setTimeout(fn, 1),
  clearTimeout: () => {},
  Math: Math,
  Float32Array: Float32Array,
  console: console
};
mockGlobal.window = mockGlobal;
mockGlobal.global = mockGlobal;

const gameCode = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
vm.runInNewContext(gameCode, mockGlobal);

const {
  computeMasterGain,
  computeFadeGain,
  AUDIO_GAINS,
  AMBIENT_GAIN,
  DIALOGUE_GAIN,
  EVENT_GAIN,
  INTERACT_GAIN,
  SoundEngine
} = mockGlobal;

async function runTests() {
  console.log('====================================================');
  console.log('KIỂM TRA HOÀN THIỆN ÂM THANH (AUDIO POLISH SUITE)');
  console.log('====================================================\n');

  // --- PHẦN 1: computeMasterGain ---
  console.log('1. Kiểm tra hàm thuần computeMasterGain(muted, volume):');
  assert(typeof computeMasterGain === 'function', 'computeMasterGain được định nghĩa và export');
  assert(computeMasterGain(true, 1) === 0, 'Khi muted = true, âm lượng trả về 0');
  assert(computeMasterGain(true, 0.75) === 0, 'Khi muted = true với volume bất kỳ, trả về 0');
  assert(computeMasterGain(false, 0.8) === 0.8, 'Khi không muted, giữ nguyên volume 0.8');
  assert(computeMasterGain(false, 1.0) === 1.0, 'Khi không muted, giữ nguyên volume 1.0');
  assert(computeMasterGain(false, 1.5) === 1.0, 'Volume lớn hơn 1.0 bị kẹp xuống 1.0');
  assert(computeMasterGain(false, -0.4) === 0.0, 'Volume nhỏ hơn 0.0 bị kẹp lên 0.0');
  assert(computeMasterGain(false, undefined) === 1.0, 'Volume không truyền trả về mặc định 1.0');
  assert(computeMasterGain(false, NaN) === 0.0, 'Volume NaN trả về 0.0 an toàn');

  // --- PHẦN 2: computeFadeGain ---
  console.log('\n2. Kiểm tra hàm thuần computeFadeGain(startTime, now, duration, from, to):');
  assert(typeof computeFadeGain === 'function', 'computeFadeGain được định nghĩa và export');
  assert(computeFadeGain(10, 8, 2, 0, 1) === 0, 'Trước startTime: trả về đúng giá trị from (0)');
  assert(computeFadeGain(10, 10, 2, 0, 1) === 0, 'Đúng tại startTime: trả về giá trị from (0)');
  assert(computeFadeGain(10, 12, 2, 0, 1) === 1, 'Đúng tại startTime + duration: trả về giá trị to (1)');
  assert(computeFadeGain(10, 15, 2, 0, 1) === 1, 'Sau startTime + duration: trả về đúng giá trị to (1)');
  assert(computeFadeGain(10, 11, 2, 0, 1) === 0.5, 'Tại 50% thời gian (now = 11, duration = 2): nội suy chính xác 0.5');
  assert(computeFadeGain(10, 11, 2, 1, 0) === 0.5, 'Fade out: tại 50% thời gian (from 1 to 0): nội suy chính xác 0.5');
  assert(Math.abs(computeFadeGain(10, 10.5, 2, 0.2, 0.8) - 0.35) < 1e-6, 'Nội suy tuyến tính bất kỳ (from 0.2, to 0.8, now 10.5): trả về 0.35');
  assert(computeFadeGain(10, 11, 0, 0.2, 0.8) === 0.8, 'Duration <= 0: trả về ngay to');

  // --- PHẦN 3: Cân bằng âm lượng (AUDIO_GAINS) ---
  console.log('\n3. Kiểm tra hằng số cân bằng âm lượng (AUDIO_GAINS):');
  assert(typeof AUDIO_GAINS === 'object' && AUDIO_GAINS !== null, 'AUDIO_GAINS được định nghĩa');
  assert(AMBIENT_GAIN > 0, 'AMBIENT_GAIN hợp lệ (> 0)');
  assert(INTERACT_GAIN > 0, 'INTERACT_GAIN hợp lệ (> 0)');
  assert(EVENT_GAIN > 0, 'EVENT_GAIN hợp lệ (> 0)');
  assert(DIALOGUE_GAIN > 0, 'DIALOGUE_GAIN hợp lệ (> 0)');
  assert(AMBIENT_GAIN < INTERACT_GAIN, 'Âm lượng Ambient thấp hơn âm tương tác (INTERACT_GAIN)');
  assert(INTERACT_GAIN <= EVENT_GAIN, 'Âm lượng tương tác không lớn hơn âm sự kiện nổi bật (EVENT_GAIN)');
  assert(DIALOGUE_GAIN <= INTERACT_GAIN, 'Âm lượng thoại nhẹ nhàng, không lấn át tương tác');

  // --- PHẦN 4: Master Gain & SoundEngine Output Routing ---
  console.log('\n4. Kiểm tra Master Gain và kết nối trong SoundEngine:');
  const sound = new SoundEngine();
  sound.init();
  assert(sound.ctx !== null, 'SoundEngine.init() khởi tạo AudioContext');
  assert(sound.masterGain !== null, 'SoundEngine.init() tạo masterGain node');
  assert(sound.masterGain.connectedTo.includes(sound.ctx.destination), 'masterGain kết nối trực tiếp vào ctx.destination');

  const initialMasterVal = sound.masterGain.gain.value;
  assert(initialMasterVal === 1, 'masterGain khởi tạo ở mức âm lượng 1.0');

  sound.setMuted(true);
  assert(sound.isMuted === true, 'Cờ isMuted được bật thành true');
  assert(sound.masterGain.gain.value === 0, 'Khi mute: masterGain.gain giảm về 0');

  sound.toggleMute();
  assert(sound.isMuted === false, 'toggleMute đảo trạng thái isMuted thành false');
  assert(sound.masterGain.gain.value === 1, 'Sau khi unmute: masterGain.gain trở lại 1');

  // --- PHẦN 5: Crossfade khi đổi bối cảnh ---
  console.log('\n5. Kiểm tra Crossfade khi đổi bối cảnh:');
  sound.startAmbient();
  assert(sound.isAmbientPlaying === true, 'Ambient đang phát');
  assert(sound.ambientGainNode !== null, 'ambientGainNode được lưu trữ reference');

  const oldAmbientGainNode = sound.ambientGainNode;
  sound.setAmbientTheme('counter');
  assert(sound.ambientType === 'counter', 'ambientType cập nhật sang counter');
  assert(sound.ambientGainNode !== oldAmbientGainNode, 'Khi đổi bối cảnh: tạo ambientGainNode mới cho bối cảnh mới');
  assert(oldAmbientGainNode.gain.calls.some(c => c.type === 'linearRampToValueAtTime' && c.val === 0), 'Gain cũ được gọi linearRampToValueAtTime về 0 để fade out');

  // --- PHẦN 6: Dọn dẹp node an toàn (Idempotent Teardown) ---
  console.log('\n6. Kiểm tra dọn node (Teardown an toàn không ném lỗi khi gọi lặp lại):');
  let stopAmbientError = null;
  try {
    sound.stopAmbient();
  } catch (err) {
    stopAmbientError = err;
  }
  assert(stopAmbientError === null, 'stopAmbient() lần 1 thực thi không lỗi');
  assert(sound.isAmbientPlaying === false, 'isAmbientPlaying trở thành false sau khi stopAmbient');

  let stopAmbientSecondError = null;
  try {
    sound.stopAmbient(); // Gọi lần 2
  } catch (err) {
    stopAmbientSecondError = err;
  }
  assert(stopAmbientSecondError === null, 'stopAmbient() gọi lần 2 KHÔNG ném lỗi (an toàn)');

  sound.startLofi();
  assert(sound.isLofiPlaying === true, 'startLofi() khởi động phát nhạc lofi');
  assert(sound.lofiNodes.length > 0, 'lofiNodes lưu trữ danh sách các node đang phát');

  let stopLofiError = null;
  try {
    sound.stopLofi();
  } catch (err) {
    stopLofiError = err;
  }
  assert(stopLofiError === null, 'stopLofi() lần 1 thực thi không lỗi');
  assert(sound.isLofiPlaying === false, 'isLofiPlaying trở thành false sau khi stopLofi');

  let stopLofiSecondError = null;
  try {
    sound.stopLofi(); // Gọi lần 2
  } catch (err) {
    stopLofiSecondError = err;
  }
  assert(stopLofiSecondError === null, 'stopLofi() gọi lần 2 KHÔNG ném lỗi (an toàn)');

  // --- PHẦN 7: Kiểm tra các hiệu ứng âm thanh tương tác và sự kiện ---
  console.log('\n7. Kiểm tra phát âm thanh tương tác & sự kiện (kết nối masterOutput):');
  const sfxMethods = [
    'playSpoonTink',
    'playChirp',
    'playPhinDropSound',
    'playWhiskSound',
    'playPourSound',
    'playIceClink',
    'playStirSound',
    'playSuccess',
    'playDialogueBlip',
    'playMeowSound',
    'playCameraShutter',
    'playPurchaseSound'
  ];

  sfxMethods.forEach(method => {
    let err = null;
    try {
      sound[method]();
    } catch (e) {
      err = e;
    }
    assert(err === null, `${method}() phát thành công không lỗi`);
  });

  console.log('\n====================================================');
  console.log(`KẾT QUẢ TỔNG CỘNG: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Lỗi thực thi test:', err);
  process.exit(1);
});
