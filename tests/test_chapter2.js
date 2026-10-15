/**
 * tests/test_chapter2.js
 * Test suite xác minh toàn bộ logic cốt truyện Chương 2 và cơ chế tránh 404 của Sprite Atlas Loader.
 * Chạy bằng lệnh: node tests/test_chapter2.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser globals cần thiết
global.window = global;
global.Image = class Image {};

let fetchLog = [];
global.fetch = async function(url) {
  fetchLog.push(url);
  const filePath = path.join(__dirname, '..', url);
  if (fs.existsSync(filePath)) {
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(fs.readFileSync(filePath, 'utf8'))
    };
  }
  return { ok: false, status: 404 };
};

// 1. Nạp story.js
const storyPath = path.join(__dirname, '..', 'story.js');
const storyCode = fs.readFileSync(storyPath, 'utf8');
vm.runInThisContext(storyCode);

// 2. Nạp game.js trong sandbox tối giản
const gamePath = path.join(__dirname, '..', 'game.js');
const gameCode = fs.readFileSync(gamePath, 'utf8');
const fn = new Function('window', 'document', 'fetch', 'Image', gameCode);
try {
  fn(global, { getElementById: () => null, addEventListener: () => {} }, global.fetch, global.Image);
} catch (_) {}

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

async function run() {
  console.log('====================================================');
  console.log('KIỂM TRA CHƯƠNG 2 & CƠ CHẾ SẠCH 404 CỦA SPRITE ATLAS');
  console.log('====================================================\n');

  // --- PHẦN 1: MẶC ĐỊNH (ket_thuc = false) ---
  console.log('1. Kiểm tra trạng thái mặc định (Chương 1 chưa xong):');
  const smDefault = new StoryManager();
  assert(smDefault.flags.ket_thuc === false, 'Cờ ket_thuc mặc định là false');
  assert(smDefault.flags.ba_lan_thu === false, 'Cờ ba_lan_thu mặc định là false');
  assert(smDefault.flags.ba_lan_gap_lai === false, 'Cờ ba_lan_gap_lai mặc định là false');
  assert(smDefault.flags.vinh_wave === false, 'Cờ vinh_wave mặc định là false');
  assert(smDefault.flags.lam_hoa_startup === false, 'Cờ lam_hoa_startup mặc định là false');

  const morningChoicesDefault = smDefault.getChoices('morning');
  assert(!morningChoicesDefault.some(c => c.text.includes('cuốn sổ cờ tướng')), 'Morning: KHÔNG hiện lựa chọn Chương 2 khi ket_thuc = false');

  const indoorChoicesDefault = smDefault.getChoices('indoor');
  assert(!indoorChoicesDefault.some(c => c.text.includes('làm chung app')), 'Indoor: KHÔNG hiện lựa chọn Chương 2 khi ket_thuc = false');

  const nightChoicesDefault = smDefault.getChoices('night');
  assert(!nightChoicesDefault.some(c => c.text.includes('chiếc xe')), 'Night: KHÔNG hiện lựa chọn Chương 2 khi ket_thuc = false');

  // --- PHẦN 2: CHƯƠNG 2 KÍCH HOẠT (ket_thuc = true) ---
  console.log('\n2. Kiểm tra khi Chương 2 mở (ket_thuc = true):');
  const smC2 = new StoryManager();
  smC2.flags.ket_thuc = true;

  // 2a. Cảnh Sáng Sớm (Morning - Bác Ba & Cô Lan)
  console.log('   * Cảnh Sáng Sớm (Morning):');
  const morningArrive = smC2.getArrival('morning', '');
  assert(morningArrive.includes('bác tới sớm hơn mọi hôm'), 'Lời chào Bác Ba khớp Chương 2');

  const morningChoices1 = smC2.getChoices('morning');
  const choiceSoCo = morningChoices1.find(c => c.text.includes('cuốn sổ cờ tướng'));
  assert(!!choiceSoCo, 'Lựa chọn 1 (cuốn sổ cờ tướng) xuất hiện');
  assert(choiceSoCo && choiceSoCo.bonusHearts === 3, 'Lựa chọn 1 cộng đúng +3 tim');

  // Chọn choice 1
  const endingCheck1 = smC2.applyEffects(choiceSoCo.effects);
  assert(endingCheck1 === null, 'applyEffects trả về null (không lặp lại ending Chương 1)');
  assert(smC2.flags.ba_lan_thu === true, 'Cờ ba_lan_thu được bật thành true');

  // Sau khi có ba_lan_thu, choice 2 xuất hiện
  const morningChoices2 = smC2.getChoices('morning');
  const choiceThuHoiAn = morningChoices2.find(c => c.text.includes('đem thư này tới Hội An'));
  assert(!!choiceThuHoiAn, 'Lựa chọn 2 (đem thư tới Hội An) xuất hiện sau khi mở ba_lan_thu');
  assert(choiceThuHoiAn && choiceThuHoiAn.bonusHearts === 2, 'Lựa chọn 2 cộng đúng +2 tim');

  smC2.applyEffects(choiceThuHoiAn.effects);
  assert(smC2.flags.ba_lan_gap_lai === true, 'Cờ ba_lan_gap_lai được bật thành true');

  const morningChoices3 = smC2.getChoices('morning');
  assert(!morningChoices3.some(c => c.text.includes('cuốn sổ cờ tướng') || c.text.includes('đem thư này tới Hội An')), 'Cả 2 lựa chọn Chương 2 đều ẩn đi sau khi đã chọn xong');

  // 2b. Cảnh Quán Phố (Indoor - Hoa & Lâm)
  console.log('   * Cảnh Quán Phố (Indoor):');
  const indoorArrive = smC2.getArrival('indoor', '');
  assert(indoorArrive.includes('Hoa với anh đang bàn chuyện làm app'), 'Lời chào Hoa & Lâm khớp Chương 2');

  const indoorChoices1 = smC2.getChoices('indoor');
  const choiceStartup = indoorChoices1.find(c => c.text.includes('làm chung app'));
  assert(!!choiceStartup, 'Lựa chọn làm app startup xuất hiện');
  assert(choiceStartup && choiceStartup.bonusHearts === 3, 'Lựa chọn startup cộng đúng +3 tim');

  smC2.applyEffects(choiceStartup.effects);
  assert(smC2.flags.lam_hoa_startup === true, 'Cờ lam_hoa_startup được bật thành true');

  const indoorChoices2 = smC2.getChoices('indoor');
  assert(!indoorChoices2.some(c => c.text.includes('làm chung app')), 'Lựa chọn startup ẩn đi sau khi đã chọn');

  // 2c. Cảnh Đêm Mưa (Night - Chú Vinh)
  console.log('   * Cảnh Đêm Mưa (Night):');
  const nightArrive = smC2.getArrival('night', '');
  assert(nightArrive.includes('chiếc Wave này chú chạy'), 'Lời chào Chú Vinh khớp Chương 2');

  const nightChoices1 = smC2.getChoices('night');
  const choiceWave = nightChoices1.find(c => c.text.includes('chiếc xe'));
  assert(!!choiceWave, 'Lựa chọn hỏi về chiếc Wave cũ xuất hiện');
  assert(choiceWave && choiceWave.bonusHearts === 2, 'Lựa chọn xe Wave cộng đúng +2 tim');

  smC2.applyEffects(choiceWave.effects);
  assert(smC2.flags.vinh_wave === true, 'Cờ vinh_wave được bật thành true');

  const nightChoices2 = smC2.getChoices('night');
  assert(!nightChoices2.some(c => c.text.includes('chiếc xe')), 'Lựa chọn xe Wave ẩn đi sau khi đã chọn');

  // --- PHẦN 3: KIỂM TRA SẠCH LỖI 404 KHI THĂM DÒ ATLAS ---
  console.log('\n3. Kiểm tra cơ chế manifest loại bỏ 404 khi chưa có sprite:');
  fetchLog = [];
  const atlasResult = await global.loadSpriteAtlas('vinh');
  assert(atlasResult === null, 'loadSpriteAtlas("vinh") trả về null an toàn');
  assert(fetchLog.length === 1 && fetchLog[0] === 'assets/sprites/index.json', 'Chỉ gửi đúng 1 request nạp index.json (200 OK)');
  assert(!fetchLog.some(url => url.includes('aseprite') || url.includes('engine-export')), 'Hoàn toàn không gửi bất kỳ request thăm dò file sprite nào khi available rỗng (0 lỗi 404)');

  console.log('\n====================================================');
  console.log(`KẾT QUẢ TỔNG CỘNG: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

run();
