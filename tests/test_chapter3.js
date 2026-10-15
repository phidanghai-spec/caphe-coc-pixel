/**
 * tests/test_chapter3.js
 * Test suite xác minh toàn bộ logic cốt truyện Chương 3: "Những lá thư"
 * Chạy bằng lệnh: node tests/test_chapter3.js
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
  console.log('KIỂM TRA CHƯƠNG 3: NHỮNG LÁ THƯ');
  console.log('====================================================\n');

  // --- PHẦN 1: CỜ MỚI MẶC ĐỊNH ĐỀU LÀ FALSE ---
  console.log('1. Kiểm tra trạng thái cờ mặc định của Chương 3:');
  const smDefault = new StoryManager();
  assert(smDefault.flags.lan_hoi_am === false, 'Cờ lan_hoi_am mặc định là false');
  assert(smDefault.flags.ba_nhan_thu === false, 'Cờ ba_nhan_thu mặc định là false');
  assert(smDefault.flags.app_ra_mat === false, 'Cờ app_ra_mat mặc định là false');
  assert(smDefault.flags.vinh_chup_anh === false, 'Cờ vinh_chup_anh mặc định là false');
  assert(smDefault.flags.chuong3_xong === false, 'Cờ chuong3_xong mặc định là false');

  // --- PHẦN 2: CẢNH HOIAN ---
  console.log('\n2. Kiểm tra cảnh hoian (Cô Lan):');
  const smHoianBefore = new StoryManager();
  smHoianBefore.flags.ba_lan_gap_lai = false;
  const hoianChoicesBefore = smHoianBefore.getChoices('hoian');
  assert(!hoianChoicesBefore.some(c => c.text.includes('lời nhắn nào gửi lại bác Ba')),
    'hoian: Khi chưa có ba_lan_gap_lai, KHÔNG hiện lựa chọn Chương 3');

  const smHoian = new StoryManager();
  smHoian.flags.ba_lan_gap_lai = true;
  smHoian.flags.lan_hoi_am = false;

  const hoianArrive = smHoian.getArrival('hoian', '');
  assert(hoianArrive.includes('đọc thư ông ấy mấy lần rồi'), 'hoian: Lời chào cô Lan khớp Chương 3');

  const hoianChoices = smHoian.getChoices('hoian');
  const choiceLanHoiAm = hoianChoices.find(c => c.text.includes('lời nhắn nào gửi lại bác Ba'));
  assert(!!choiceLanHoiAm, 'hoian: HIỆN lựa chọn lan_hoi_am khi ba_lan_gap_lai = true');
  assert(choiceLanHoiAm && choiceLanHoiAm.bonusHearts === 3, 'hoian: Lựa chọn lan_hoi_am cộng đúng +3 tim');

  smHoian.applyEffects(choiceLanHoiAm.effects);
  assert(smHoian.flags.lan_hoi_am === true, 'hoian: Chọn xong bật cờ lan_hoi_am = true');

  const hoianServe = smHoian.getServe('hoian', '');
  assert(hoianServe.includes('Thư hồi âm cô gửi con rồi'), 'hoian: Lời phục vụ cô Lan khớp khi lan_hoi_am = true');

  const hoianChoicesAfter = smHoian.getChoices('hoian');
  assert(!hoianChoicesAfter.some(c => c.text.includes('lời nhắn nào gửi lại bác Ba')),
    'hoian: Lựa chọn lan_hoi_am ẩn đi sau khi đã chọn');

  // --- PHẦN 3: CẢNH MORNING ---
  console.log('\n3. Kiểm tra cảnh morning (Bác Ba nhận thư):');
  const smMorningBefore = new StoryManager();
  smMorningBefore.flags.lan_hoi_am = false;
  const morningChoicesBefore = smMorningBefore.getChoices('morning');
  assert(!morningChoicesBefore.some(c => c.text.includes('cô Lan gửi thư hồi âm')),
    'morning: Khi chưa có lan_hoi_am, KHÔNG hiện lựa chọn ba_nhan_thu');

  const smMorning = new StoryManager();
  smMorning.flags.lan_hoi_am = true;
  smMorning.flags.ba_nhan_thu = false;

  const morningArrive = smMorning.getArrival('morning', '');
  assert(morningArrive.includes('Có tin gì của cô Lan không con'), 'morning: Lời chào Bác Ba khớp Chương 3');

  const morningChoices = smMorning.getChoices('morning');
  const choiceBaNhanThu = morningChoices.find(c => c.text.includes('cô Lan gửi thư hồi âm'));
  assert(!!choiceBaNhanThu, 'morning: Với lan_hoi_am = true, HIỆN lựa chọn ba_nhan_thu');
  assert(choiceBaNhanThu && choiceBaNhanThu.bonusHearts === 4, 'morning: Lựa chọn ba_nhan_thu cộng đúng +4 tim');

  smMorning.applyEffects(choiceBaNhanThu.effects);
  assert(smMorning.flags.ba_nhan_thu === true, 'morning: Chọn xong bật cờ ba_nhan_thu = true');

  const morningServe = smMorning.getServe('morning', '');
  assert(morningServe.includes('đắng hơn mọi hôm mà ngọt trong lòng quá'), 'morning: Lời phục vụ Bác Ba khớp khi ba_nhan_thu = true');

  const morningChoicesAfter = smMorning.getChoices('morning');
  assert(!morningChoicesAfter.some(c => c.text.includes('cô Lan gửi thư hồi âm')),
    'morning: Lựa chọn ba_nhan_thu ẩn đi sau khi đã chọn');

  // --- PHẦN 4: CẢNH INDOOR ---
  console.log('\n4. Kiểm tra cảnh indoor (App ra mắt):');
  const smIndoorBefore = new StoryManager();
  smIndoorBefore.flags.lam_hoa_startup = false;
  const indoorChoicesBefore = smIndoorBefore.getChoices('indoor');
  assert(!indoorChoicesBefore.some(c => c.text.includes('Ra mắt thôi em')),
    'indoor: Khi chưa có lam_hoa_startup, KHÔNG hiện lựa chọn app_ra_mat');

  const smIndoor = new StoryManager();
  smIndoor.flags.lam_hoa_startup = true;
  smIndoor.flags.app_ra_mat = false;

  const indoorArrive = smIndoor.getArrival('indoor', '');
  assert(indoorArrive.includes('bản prototype chạy được rồi'), 'indoor: Lời chào Hoa & Lâm khớp Chương 3');

  const indoorChoices = smIndoor.getChoices('indoor');
  const choiceAppRaMat = indoorChoices.find(c => c.text.includes('Ra mắt thôi em'));
  assert(!!choiceAppRaMat, 'indoor: Với lam_hoa_startup = true, HIỆN lựa chọn app_ra_mat');
  assert(choiceAppRaMat && choiceAppRaMat.bonusHearts === 3, 'indoor: Lựa chọn app_ra_mat cộng đúng +3 tim');

  smIndoor.applyEffects(choiceAppRaMat.effects);
  assert(smIndoor.flags.app_ra_mat === true, 'indoor: Chọn xong bật cờ app_ra_mat = true');

  const indoorServe = smIndoor.getServe('indoor', '');
  assert(indoorServe.includes('Ly cà phê muối mừng app ra mắt đây'), 'indoor: Lời phục vụ khớp khi app_ra_mat = true');

  const indoorChoicesAfter = smIndoor.getChoices('indoor');
  assert(!indoorChoicesAfter.some(c => c.text.includes('Ra mắt thôi em')),
    'indoor: Lựa chọn app_ra_mat ẩn đi sau khi đã chọn');

  // --- PHẦN 5: CẢNH NIGHT ---
  console.log('\n5. Kiểm tra cảnh night (Ảnh với Wave):');
  const smNightBefore = new StoryManager();
  smNightBefore.flags.vinh_wave = false;
  const nightChoicesBefore = smNightBefore.getChoices('night');
  assert(!nightChoicesBefore.some(c => c.text.includes('chụp với chú và chiếc Wave')),
    'night: Khi chưa có vinh_wave, KHÔNG hiện lựa chọn vinh_chup_anh');

  const smNight = new StoryManager();
  smNight.flags.vinh_wave = true;
  smNight.flags.vinh_chup_anh = false;

  const nightArrive = smNight.getArrival('night', '');
  assert(nightArrive.includes('đem chiếc Wave đi sửa lần cuối'), 'night: Lời chào Chú Vinh khớp Chương 3');

  const nightChoices = smNight.getChoices('night');
  const choiceChupAnh = nightChoices.find(c => c.text.includes('chụp với chú và chiếc Wave'));
  assert(!!choiceChupAnh, 'night: Với vinh_wave = true, HIỆN lựa chọn vinh_chup_anh');
  assert(choiceChupAnh && choiceChupAnh.bonusHearts === 3, 'night: Lựa chọn vinh_chup_anh cộng đúng +3 tim');

  smNight.applyEffects(choiceChupAnh.effects);
  assert(smNight.flags.vinh_chup_anh === true, 'night: Chọn xong bật cờ vinh_chup_anh = true');

  const nightServe = smNight.getServe('night', '');
  assert(nightServe.includes('Cảm ơn con đã đứng chụp với chú nha'), 'night: Lời phục vụ khớp khi vinh_chup_anh = true');

  const nightChoicesAfter = smNight.getChoices('night');
  assert(!nightChoicesAfter.some(c => c.text.includes('chụp với chú và chiếc Wave')),
    'night: Lựa chọn vinh_chup_anh ẩn đi sau khi đã chọn');

  // --- PHẦN 6: ĐIỀU KIỆN HOÀN THÀNH CHƯƠNG 3 (applyEffects) ---
  console.log('\n6. Kiểm tra hoàn thành Chương 3 (applyEffects):');
  // 6a. Khi chỉ có 3 trong 4 cờ
  const testSubsets = [
    { lan_hoi_am: false, ba_nhan_thu: true, app_ra_mat: true, vinh_chup_anh: true },
    { lan_hoi_am: true, ba_nhan_thu: false, app_ra_mat: true, vinh_chup_anh: true },
    { lan_hoi_am: true, ba_nhan_thu: true, app_ra_mat: false, vinh_chup_anh: true },
    { lan_hoi_am: true, ba_nhan_thu: true, app_ra_mat: true, vinh_chup_anh: false },
  ];

  for (let i = 0; i < testSubsets.length; i++) {
    const smSub = new StoryManager();
    Object.assign(smSub.flags, testSubsets[i]);
    const res = smSub.applyEffects({});
    assert(res !== 'chuong3', `Khi thiếu 1 cờ (trường hợp ${i + 1}), applyEffects không trả về 'chuong3'`);
  }

  // 6b. Khi cả 4 cờ đã bật
  const smFull = new StoryManager();
  smFull.flags.lan_hoi_am = true;
  smFull.flags.ba_nhan_thu = true;
  smFull.flags.app_ra_mat = true;
  smFull.flags.vinh_chup_anh = false; // chuẩn bị bật cờ thứ 4 qua effects

  const event1 = smFull.applyEffects({ vinh_chup_anh: true });
  assert(event1 === 'chuong3', "applyEffects trả về 'chuong3' khi cả 4 cờ đã bật");
  assert(smFull.flags.chuong3_xong === true, 'Cờ chuong3_xong được gán thành true');

  // 6c. Lần gọi tiếp theo không được trả về 'chuong3' nữa
  const event2 = smFull.applyEffects({ extra: 1 });
  assert(event2 === null, "Lần gọi sau trả về null (chỉ kích hoạt đúng MỘT lần)");

  // 6d. Vẫn đảm bảo trả về 'ending' cho chương 1 như cũ
  const smEnding = new StoryManager();
  smEnding.flags.hoa_da_gap_o = true;
  smEnding.flags.lan_biet_chuyen = false;
  const endRes = smEnding.applyEffects({ lan_biet_chuyen: true });
  assert(endRes === 'ending', "applyEffects vẫn trả về 'ending' cho Chương 1 như cũ");

  console.log('\n====================================================');
  console.log(`KẾT QUẢ TỔNG CỘNG: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

run();
