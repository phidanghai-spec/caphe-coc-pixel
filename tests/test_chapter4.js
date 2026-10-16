/**
 * tests/test_chapter4.js
 * Test suite xác minh toàn bộ logic cốt truyện Chương 4: "Chiếc Wave đi xa"
 * Chạy bằng lệnh: node tests/test_chapter4.js
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
  console.log('KIỂM TRA CHƯƠNG 4: CHIẾC WAVE ĐI XA');
  console.log('====================================================\n');

  // --- PHẦN 1: CỜ MẶC ĐỊNH CHƯƠNG 4 ĐỀU LÀ FALSE ---
  console.log('1. Kiểm tra trạng thái cờ mặc định của Chương 4:');
  const smDefault = new StoryManager();
  assert(smDefault.flags.vinh_nhuong_wave === false, 'Cờ vinh_nhuong_wave mặc định là false');
  assert(smDefault.flags.app_danh_gia === false, 'Cờ app_danh_gia mặc định là false');
  assert(smDefault.flags.ba_ve_hoi_an === false, 'Cờ ba_ve_hoi_an mặc định là false');
  assert(smDefault.flags.lan_cong_thuc === false, 'Cờ lan_cong_thuc mặc định là false');
  assert(smDefault.flags.chuong4_xong === false, 'Cờ chuong4_xong mặc định là false');

  // --- PHẦN 2: CẢNH NIGHT (CHÚ VINH) ---
  console.log('\n2. Kiểm tra cảnh night (Chú Vinh nhượng Wave):');
  const smNightBefore = new StoryManager();
  smNightBefore.flags.chuong3_xong = false;
  const nightChoicesBefore = smNightBefore.getChoices('night');
  assert(!nightChoicesBefore.some(c => c.text.includes('nhận chiếc Wave giùm chú')),
    'night: Khi chuong3_xong = false, KHÔNG hiện lựa chọn Chương 4 (nhận xe)');
  assert(!nightChoicesBefore.some(c => c.text.includes('giúp tìm người khác')),
    'night: Khi chuong3_xong = false, KHÔNG hiện lựa chọn Chương 4 (tìm người khác)');

  const smNight = new StoryManager();
  smNight.flags.chuong3_xong = true;
  smNight.flags.vinh_nhuong_wave = false;

  const nightArrive = smNight.getArrival('night', '');
  assert(nightArrive.includes('Cà phê nay nóng hơn đấy con. Chú có chuyện muốn hỏi con'),
    'night: Lời chào Chú Vinh khớp Chương 4');

  const nightChoices = smNight.getChoices('night');
  const choiceNhanXe = nightChoices.find(c => c.text.includes('nhận chiếc Wave giùm chú'));
  const choiceTimNguoi = nightChoices.find(c => c.text.includes('giúp tìm người khác'));
  assert(!!choiceNhanXe, 'night: Với chuong3_xong = true, HIỆN lựa chọn nhận xe');
  assert(choiceNhanXe && choiceNhanXe.bonusHearts === 3, 'night: Lựa chọn nhận xe cộng đúng +3 tim');
  assert(!!choiceTimNguoi, 'night: Với chuong3_xong = true, HIỆN lựa chọn tìm người khác');
  assert(choiceTimNguoi && choiceTimNguoi.bonusHearts === 2, 'night: Lựa chọn tìm người khác cộng đúng +2 tim');

  smNight.applyEffects(choiceNhanXe.effects);
  assert(smNight.flags.vinh_nhuong_wave === true, 'night: Chọn xong bật cờ vinh_nhuong_wave = true');

  const nightServe = smNight.getServe('night', '');
  assert(nightServe.includes('Chiếc xe đã có chủ mới rồi, con giữ cho chú nhé'),
    'night: Lời phục vụ khớp khi vinh_nhuong_wave = true');

  const nightChoicesAfter = smNight.getChoices('night');
  assert(!nightChoicesAfter.some(c => c.text.includes('nhận chiếc Wave giùm chú')),
    'night: Lựa chọn nhận xe ẩn đi sau khi đã chọn');
  assert(!nightChoicesAfter.some(c => c.text.includes('giúp tìm người khác')),
    'night: Lựa chọn tìm người khác ẩn đi sau khi đã chọn');

  // --- PHẦN 3: CẢNH INDOOR (ANH LÂM) ---
  console.log('\n3. Kiểm tra cảnh indoor (Anh Lâm đánh giá app):');
  const smIndoorBefore = new StoryManager();
  smIndoorBefore.flags.chuong3_xong = false;
  const indoorChoicesBefore = smIndoorBefore.getChoices('indoor');
  assert(!indoorChoicesBefore.some(c => c.text.includes('đổi chữ nút đặt đơn')),
    'indoor: Khi chuong3_xong = false, KHÔNG hiện lựa chọn app_danh_gia');

  const smIndoor = new StoryManager();
  smIndoor.flags.chuong3_xong = true;
  smIndoor.flags.app_danh_gia = false;

  const indoorArrive = smIndoor.getArrival('indoor', '');
  assert(indoorArrive.includes('Khách đầu tiên đã dùng app rồi, mình chờ góp ý đây'),
    'indoor: Lời chào Hoa & Lâm khớp Chương 4');

  const indoorChoices = smIndoor.getChoices('indoor');
  const choiceDanhGia = indoorChoices.find(c => c.text.includes('đổi chữ nút đặt đơn'));
  assert(!!choiceDanhGia, 'indoor: Với chuong3_xong = true, HIỆN lựa chọn app_danh_gia');
  assert(choiceDanhGia && choiceDanhGia.bonusHearts === 3, 'indoor: Lựa chọn app_danh_gia cộng đúng +3 tim');

  smIndoor.applyEffects(choiceDanhGia.effects);
  assert(smIndoor.flags.app_danh_gia === true, 'indoor: Chọn xong bật cờ app_danh_gia = true');

  const indoorServe = smIndoor.getServe('indoor', '');
  assert(indoorServe.includes('Góp ý hay thật, để mình sửa ngay'),
    'indoor: Lời phục vụ khớp khi app_danh_gia = true');

  const indoorChoicesAfter = smIndoor.getChoices('indoor');
  assert(!indoorChoicesAfter.some(c => c.text.includes('đổi chữ nút đặt đơn')),
    'indoor: Lựa chọn app_danh_gia ẩn đi sau khi đã chọn');

  // --- PHẦN 4: CẢNH MORNING (BÁC BA VỀ HỘI AN) ---
  console.log('\n4. Kiểm tra cảnh morning (Bác Ba về Hội An):');
  const smMorningBefore = new StoryManager();
  smMorningBefore.flags.chuong3_xong = false;
  const morningChoicesBefore = smMorningBefore.getChoices('morning');
  assert(!morningChoicesBefore.some(c => c.text.includes('trông quán cho bác')),
    'morning: Khi chuong3_xong = false, KHÔNG hiện lựa chọn ba_ve_hoi_an (trông quán)');
  assert(!morningChoicesBefore.some(c => c.text.includes('xe khách buổi sáng')),
    'morning: Khi chuong3_xong = false, KHÔNG hiện lựa chọn ba_ve_hoi_an (xe khách)');

  const smMorning = new StoryManager();
  smMorning.flags.chuong3_xong = true;
  smMorning.flags.ba_ve_hoi_an = false;

  const morningArrive = smMorning.getArrival('morning', '');
  assert(morningArrive.includes('Bác sắp về Hội An thăm cô Lan, con trông quán giúp bác nhé?'),
    'morning: Lời chào Bác Ba khớp Chương 4');

  const morningChoices = smMorning.getChoices('morning');
  const choiceTrongQuan = morningChoices.find(c => c.text.includes('trông quán cho bác'));
  const choiceXeKhach = morningChoices.find(c => c.text.includes('xe khách buổi sáng'));
  assert(!!choiceTrongQuan, 'morning: Với chuong3_xong = true, HIỆN lựa chọn trông quán');
  assert(choiceTrongQuan && choiceTrongQuan.bonusHearts === 3, 'morning: Lựa chọn trông quán cộng đúng +3 tim');
  assert(!!choiceXeKhach, 'morning: Với chuong3_xong = true, HIỆN lựa chọn xe khách');
  assert(choiceXeKhach && choiceXeKhach.bonusHearts === 2, 'morning: Lựa chọn xe khách cộng đúng +2 tim');

  smMorning.applyEffects(choiceTrongQuan.effects);
  assert(smMorning.flags.ba_ve_hoi_an === true, 'morning: Chọn xong bật cờ ba_ve_hoi_an = true');

  const morningServe = smMorning.getServe('morning', '');
  assert(morningServe.includes('Có con trông quán, bác yên tâm rồi'),
    'morning: Lời phục vụ khớp khi ba_ve_hoi_an = true');

  const morningChoicesAfter = smMorning.getChoices('morning');
  assert(!morningChoicesAfter.some(c => c.text.includes('trông quán cho bác')),
    'morning: Lựa chọn trông quán ẩn đi sau khi đã chọn');
  assert(!morningChoicesAfter.some(c => c.text.includes('xe khách buổi sáng')),
    'morning: Lựa chọn xe khách ẩn đi sau khi đã chọn');

  // --- PHẦN 5: CẢNH HOIAN (CÔ LAN CÔNG THỨC TRÀ MÓT) ---
  console.log('\n5. Kiểm tra cảnh hoian (Cô Lan trao công thức):');
  const smHoianBefore = new StoryManager();
  smHoianBefore.flags.chuong3_xong = false;
  const hoianChoicesBefore = smHoianBefore.getChoices('hoian');
  assert(!hoianChoicesBefore.some(c => c.text.includes('học công thức trà Mót')),
    'hoian: Khi chuong3_xong = false, KHÔNG hiện lựa chọn lan_cong_thuc (học công thức)');
  assert(!hoianChoicesBefore.some(c => c.text.includes('giữ bí mật của cô')),
    'hoian: Khi chuong3_xong = false, KHÔNG hiện lựa chọn lan_cong_thuc (giữ bí mật)');

  const smHoian = new StoryManager();
  smHoian.flags.chuong3_xong = true;
  smHoian.flags.lan_cong_thuc = false;

  const hoianArrive = smHoian.getArrival('hoian', '');
  assert(hoianArrive.includes('cô có công thức trà Mót gốc muốn trao con'),
    'hoian: Lời chào Cô Lan khớp Chương 4');

  const hoianChoices = smHoian.getChoices('hoian');
  const choiceHocCongThuc = hoianChoices.find(c => c.text.includes('học công thức trà Mót'));
  const choiceGiuBiMat = hoianChoices.find(c => c.text.includes('giữ bí mật của cô'));
  assert(!!choiceHocCongThuc, 'hoian: Với chuong3_xong = true, HIỆN lựa chọn học công thức');
  assert(choiceHocCongThuc && choiceHocCongThuc.bonusHearts === 4, 'hoian: Lựa chọn học công thức cộng đúng +4 tim');
  assert(!!choiceGiuBiMat, 'hoian: Với chuong3_xong = true, HIỆN lựa chọn giữ bí mật');
  assert(choiceGiuBiMat && choiceGiuBiMat.bonusHearts === 2, 'hoian: Lựa chọn giữ bí mật cộng đúng +2 tim');

  smHoian.applyEffects(choiceHocCongThuc.effects);
  assert(smHoian.flags.lan_cong_thuc === true, 'hoian: Chọn xong bật cờ lan_cong_thuc = true');

  const hoianServe = smHoian.getServe('hoian', '');
  assert(hoianServe.includes('Công thức đã truyền sang tay con rồi, pha cho thật khéo nhé'),
    'hoian: Lời phục vụ khớp khi lan_cong_thuc = true');

  const hoianChoicesAfter = smHoian.getChoices('hoian');
  assert(!hoianChoicesAfter.some(c => c.text.includes('học công thức trà Mót')),
    'hoian: Lựa chọn học công thức ẩn đi sau khi đã chọn');
  assert(!hoianChoicesAfter.some(c => c.text.includes('giữ bí mật của cô')),
    'hoian: Lựa chọn giữ bí mật ẩn đi sau khi đã chọn');

  // --- PHẦN 6: ĐIỀU KIỆN HOÀN THÀNH CHƯƠNG 4 (applyEffects) ---
  console.log('\n6. Kiểm tra hoàn thành Chương 4 (applyEffects):');
  // 6a. Khi chỉ có 3 trong 4 cờ
  const testSubsets = [
    { vinh_nhuong_wave: false, app_danh_gia: true, ba_ve_hoi_an: true, lan_cong_thuc: true },
    { vinh_nhuong_wave: true, app_danh_gia: false, ba_ve_hoi_an: true, lan_cong_thuc: true },
    { vinh_nhuong_wave: true, app_danh_gia: true, ba_ve_hoi_an: false, lan_cong_thuc: true },
    { vinh_nhuong_wave: true, app_danh_gia: true, ba_ve_hoi_an: true, lan_cong_thuc: false },
  ];

  for (let i = 0; i < testSubsets.length; i++) {
    const smSub = new StoryManager();
    // Đảm bảo chuong3_xong đã bật để không bị kích hoạt chuong3
    smSub.flags.chuong3_xong = true;
    Object.assign(smSub.flags, testSubsets[i]);
    const res = smSub.applyEffects({});
    assert(res !== 'chuong4', `Khi thiếu 1 cờ (trường hợp ${i + 1}), applyEffects không trả về 'chuong4'`);
  }

  // 6b. Khi cả 4 cờ đã bật
  const smFull = new StoryManager();
  smFull.flags.chuong3_xong = true;
  smFull.flags.vinh_nhuong_wave = true;
  smFull.flags.app_danh_gia = true;
  smFull.flags.ba_ve_hoi_an = true;
  smFull.flags.lan_cong_thuc = false; // chuẩn bị bật cờ thứ 4 qua effects

  const event1 = smFull.applyEffects({ lan_cong_thuc: true });
  assert(event1 === 'chuong4', "applyEffects trả về 'chuong4' khi cả 4 cờ đã bật");
  assert(smFull.flags.chuong4_xong === true, 'Cờ chuong4_xong được gán thành true');

  // 6c. Lần gọi tiếp theo không được trả về 'chuong4' nữa
  const event2 = smFull.applyEffects({ extra: 1 });
  assert(event2 === null, "Lần gọi sau trả về null (chỉ kích hoạt đúng MỘT lần)");

  // 6d. Vẫn đảm bảo trả về 'ending' cho Chương 1 và 'chuong3' cho Chương 3 như cũ
  const smEnding = new StoryManager();
  smEnding.flags.hoa_da_gap_o = true;
  smEnding.flags.lan_biet_chuyen = false;
  const endRes = smEnding.applyEffects({ lan_biet_chuyen: true });
  assert(endRes === 'ending', "applyEffects vẫn trả về 'ending' cho Chương 1 như cũ");

  const smCh3 = new StoryManager();
  smCh3.flags.lan_hoi_am = true;
  smCh3.flags.ba_nhan_thu = true;
  smCh3.flags.app_ra_mat = true;
  smCh3.flags.vinh_chup_anh = false;
  const ch3Res = smCh3.applyEffects({ vinh_chup_anh: true });
  assert(ch3Res === 'chuong3', "applyEffects vẫn trả về 'chuong3' cho Chương 3 như cũ");

  console.log('\n====================================================');
  console.log(`KẾT QUẢ TỔNG CỘNG: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

run();
