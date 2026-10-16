/**
 * tests/test_visual_fixes.js
 * Bộ test kiểm tra 5 lỗi hiển thị vừa sửa:
 * 1. Màu ly nước theo món (hàm thuần getDrinkColor)
 * 2. Tọa độ neo & danh sách ô trống của mèo (hoian, counter, indoor)
 * 3. Điểm spawn từ cửa quán phố (indoor) & giữ nguyên vẹn chân
 * 4. Điểm spawn từ đầu cầu gỗ & độ sắc nét trong cảnh hoàng hôn (hoian)
 * 5. Tỉ lệ scale nhân vật cân đối theo bối cảnh
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

// 1. Nạp game.js trong sandbox
global.window = global;
global.window.addEventListener = () => {};
global.Image = class Image {};
global.document = {
  getElementById: () => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {} },
    style: {}
  }),
  querySelectorAll: () => [],
  createElement: () => ({
    getContext: () => ({
      fillRect: () => {},
      clearRect: () => {},
      drawImage: () => {}
    }),
    width: 640,
    height: 360
  })
};

const gamePath = path.join(__dirname, '..', 'game.js');
const gameCode = fs.readFileSync(gamePath, 'utf8');
vm.runInThisContext(gameCode);

console.log('====================================================');
console.log('KIỂM TRA CÁC BƯỚC SỬA LỖI HIỂN THỊ (VISUAL FIXES)');
console.log('====================================================\n');

// --- 1. HÀM THUẦN getDrinkColor ---
console.log('1. Kiểm tra hàm thuần getDrinkColor(drinkName):');
assert(typeof getDrinkColor === 'function', 'getDrinkColor là hàm thuần và đã được export');
assert(getDrinkColor('Ly Trống...') === 'transparent', 'Ly trống trả về transparent');
assert(getDrinkColor('') === 'transparent', 'Chuỗi rỗng trả về transparent');
assert(getDrinkColor(null) === 'transparent', 'null/undefined trả về transparent');

assert(getDrinkColor('Cà Phê Muối Xứ Huế') === '#3d2314', 'Cà Phê Muối có màu nâu sẫm cà phê muối');
assert(getDrinkColor('Cà Phê Trứng Hà Nội') === '#f59e0b', 'Cà Phê Trứng có màu vàng óng kem trứng');
assert(getDrinkColor('Trà Đào Cam Sả') === '#ea580c', 'Trà Đào Cam Sả có màu cam đào tươi sáng');
assert(getDrinkColor('Trà Mót Hội An (Sen & Sả)') === '#d97706', 'Trà Mót Hội An có màu hổ phách sen');
assert(getDrinkColor('Cà Phê Sữa Đá (Đã khuấy)') === '#a16207', 'Cà Phê Sữa Đá đã khuấy có màu nâu caramel');
assert(getDrinkColor('Cà Phê Sữa (Chưa khuấy)') === '#451a03', 'Cà Phê Sữa chưa khuấy có màu nâu đậm phân tầng');
assert(getDrinkColor('Cà Phê Đen Đá') === '#1a0f07', 'Cà Phê Đen Đá có màu đen tuyền');
assert(getDrinkColor('Sữa Đặc Pha Nóng') === '#fffbeb', 'Sữa Đặc Pha Nóng có màu trắng ngà');
assert(getDrinkColor('Trà Đá Vỉa Hè') === '#c27803', 'Trà Đá Vỉa Hè có màu vàng hổ phách');
assert(getDrinkColor('Ly Đá Không') === 'rgba(186, 230, 253, 0.7)', 'Ly Đá Không có màu đá trong suốt mát lạnh');

// --- 2. VỊ TRÍ NEO CỦA MÈO ---
console.log('\n2. Kiểm tra vị trí neo của Mèo Miu Miu:');
const hoianCfg = SCENE_CONFIGS.hoian;
assert(hoianCfg.cat && hoianCfg.cat.y >= 300, 'Hoàng Hôn: Mèo đứng trên mặt đất (y >= 300), không đè lên bát đĩa bàn trước');
assert(hoianCfg.cat && hoianCfg.cat.x < 420, 'Hoàng Hôn: Mèo nằm ngoài vùng bày biện đĩa thức ăn');

const counterCfg = SCENE_CONFIGS.counter;
assert(counterCfg.cat && counterCfg.cat.spotName === 'stool_cushion', 'Quầy Bar Gỗ: Mèo được neo trên mặt ghế quầy bar');
assert(counterCfg.cat && counterCfg.cat.y <= 240, 'Quầy Bar Gỗ: Mèo nằm trên đệm ghế (y <= 240), không rơi xuống chân ghế');

const indoorCfg = SCENE_CONFIGS.indoor;
assert(Array.isArray(indoorCfg.catSpots) && indoorCfg.catSpots.length >= 3, 'Quán Phố: Có danh sách catSpots định nghĩa các ô sàn trống');
assert(indoorCfg.catSpots.every(s => s.x && s.y), 'Quán Phố: Mọi spot đều có tọa độ hợp lệ, tránh vật cản');

// --- 3. ĐIỂM SPAWN & SPRITE QUÁN PHỐ (INDOOR) ---
console.log('\n3. Kiểm tra cảnh Quán Phố (Indoor - Lâm Dev):');
assert(indoorCfg.door && indoorCfg.door.x === 228 && indoorCfg.door.y === 238, 'Quán Phố: Tọa độ cửa vào đã được định nghĩa chính xác tại (228, 238)');
assert(indoorCfg.route.entry.x === 228, 'Quán Phố: Điểm spawn bắt đầu từ cửa vào (x=228), KHÔNG vào từ mép trái màn hình (-50)');
assert(indoorCfg.route.entry.scale <= 0.55, 'Quán Phố: Tỉ lệ ở cửa nhỏ hơn (xa hơn theo luật xa gần)');
assert(indoorCfg.route.scaleNear <= 0.80, 'Quán Phố: Tỉ lệ khi ngồi ghế bar cân đối với ghế và quầy');

// --- 4. ĐIỂM SPAWN & ĐỘ NÉT CẢNH HOÀNG HÔN (HOIAN) ---
console.log('\n4. Kiểm tra cảnh Hoàng Hôn (Hội An - Cô Lan):');
assert(hoianCfg.bridge && hoianCfg.bridge.x === 260 && hoianCfg.bridge.y === 328, 'Hoàng Hôn: Tọa độ đầu cầu gỗ đã được định nghĩa tại (260, 328)');
assert(hoianCfg.route.entry.x === 260 && hoianCfg.route.entry.y === 328, 'Hoàng Hôn: Điểm spawn bắt đầu từ đầu cầu gỗ trên sông Hoài');
assert(hoianCfg.route.seat.x === 420 && hoianCfg.route.seat.y === 268, 'Hoàng Hôn: Điểm ngồi ghế bàn tre đón khách hợp lý');
assert(hoianCfg.route.scaleNear <= 0.80, 'Hoàng Hôn: Tỉ lệ nhân vật cân đối với bàn ghế tre');

// --- 5. KIỂM TRA TOAST VÀ NHÃN MÓN ĂN (DISH LABEL) ---
console.log('\n5. Kiểm tra Toast & Nhãn Bánh Mì Đêm:');
const cssPath = path.join(__dirname, '..', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const htmlPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('<div id="toast" class="toast hidden"></div>') &&
       htmlContent.indexOf('<div id="toast"') < htmlContent.indexOf('id="dialogue-box"'),
       'Toast nằm phía trên khung hội thoại trong DOM (.canvas-wrapper)');
assert(cssContent.includes('.dish-label') && cssContent.includes('z-index: 10'),
       'Nhãn Bánh Mì Đêm có z-index: 10 nổi bật trên đĩa bánh, không bị đè');
assert(cssContent.includes('.dish-label') && (cssContent.includes('position: relative') || cssContent.includes('position: absolute')),
       'Nhãn Bánh Mì Đêm được định vị riêng biệt không bị đĩa bánh đè');
assert(cssContent.includes('.toast') && cssContent.includes('position: absolute') && cssContent.includes('bottom: 12px'),
       'Toast có position: absolute và bottom: 12px nằm ở góc dưới khung hình cảnh');

// Kiểm tra chi tiết tọa độ mèo quầy bar
assert(counterCfg.cat.x === 488 && counterCfg.cat.y === 218,
       'Quầy Bar Gỗ: Tọa độ mèo chính xác tại (x: 488, y: 218) trên tâm đệm ghế bar');

// Kiểm tra chuỗi waypoint cảnh Hoàng Hôn
const hoianWaypoints = hoianCfg.route.waypoints;
assert(Array.isArray(hoianWaypoints) && hoianWaypoints.length === 2,
       'Hoàng Hôn: Có đủ 2 waypoints trung gian dẫn từ đầu cầu lên bàn tre');
assert(hoianWaypoints[0].x === 310 && hoianWaypoints[0].y === 300,
       'Hoàng Hôn: Waypoint 1 tại (310, 300) bước lên thềm quán');
assert(hoianWaypoints[1].x === 365 && hoianWaypoints[1].y === 280,
       'Hoàng Hôn: Waypoint 2 tại (365, 280) đi dọc hành lang bàn tre');

// --- 6. TỔNG KẾT ---
console.log('\n====================================================');
console.log(`KẾT QUẢ KIỂM TRA HIỂN THỊ: ${passed} PASS, ${failed} FAIL`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
