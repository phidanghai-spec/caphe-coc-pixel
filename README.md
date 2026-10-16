# ☕ Cà Phê Cóc Vỉa Hè — Cozy Pixel Cafe Simulator
> *A nostalgic Vietnamese sidewalk cafe simulator crafted with retro pixel art, procedural soundscapes, interactive barista hands & branching narrative stories.*

![License](https://img.shields.io/badge/License-MIT-amber.svg)
![Tech](https://img.shields.io/badge/Tech-HTML5%20Canvas%20%7C%20Vanilla%20JS%20%7C%20Web%20Audio-orange.svg)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20Ready-green.svg)

---

## 🌟 Giới Thiệu (Overview)

**Cà Phê Cóc Vỉa Hè** là tựa game web mô phỏng không gian quán cà phê vỉa hè Việt Nam mang phong cách retro pixel art hoài niệm, ấm cúng và nhẹ nhàng. Game kết hợp giữa lối chơi pha chế tương tác thủ công, chu kỳ di chuyển nhân vật sống động từ [`agent-sprite-forge`](https://github.com/phidanghai-spec/agent-sprite-forge), cùng chuỗi cốt truyện phân nhánh dựa trên cờ sự kiện.

Đặc biệt, dự án được xây dựng 100% bằng **HTML5 Canvas, Vanilla CSS & Web Audio API** không phụ thuộc framework nặng nề, tối ưu phần cứng siêu nhẹ, mượt mà trên mọi thiết bị.

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 1. 🏙️ 5 Bối Cảnh Phố Thị Đậm Chất Việt Nam
* **🌧️ Đêm Mưa Vỉa Hè (Phố Khuya):** Chú Vinh (Xe ôm công nghệ) ghé quán uống cà phê sữa đá, nhâm nhi bánh mì đêm giòn rụm trong tiếng mưa rơi tí tách.
* **☕ Quầy Bar Gỗ Cổ Điển (Ấm Cúng):** Bạn Hoa (Sinh viên thiết kế) cày đồ án bên ly trà đào cam sả và bánh sừng bò thơm bơ.
* **🏬 Quán Phố Hiện Đại (Rộn Ràng):** Anh Lâm (Senior Developer) nạp caffeine với ly Cà Phê Muối xứ Huế và bánh ngọt Tiramisu để fix bug server.
* **☀️ Sáng Sớm Phố Cổ (Cà Phê Sáng):** Bác Ba (Cán bộ hưu trí đánh cờ) ngắm phố phường bên ly Cà Phê Đen Đá đậm đà và ổ bánh mì pa-tê.
* **🏮 Hoàng Hôn Bờ Sông Hội An (Bờ Sông Hoài):** Cô Lan (Tiểu thương phố cổ) nhâm nhi Trà Mót sả chanh sen thơm dịu và đĩa bánh đập chấm mắm nêm.

### 2. 🖐️ Quầy Pha Chế Tương Tác & Hoạt Ảnh Bàn Tay Barista
* **Bàn tay rót sữa đặc:** Nghiêng lon sữa đặc Ông Thọ rót dòng sữa trắng ngà xuống đáy ly.
* **Bàn tay rót cà phê:** Cầm ấm phin nghiêng rót dòng cà phê Robusta đen sánh thơm lừng.
* **Bàn tay kẹp đá inox:** Gắp viên đá lạnh thả giòn tan vào ly.
* **Bàn tay khuấy muỗng xoay tròn:** Cầm muỗng dài khuấy đều tạo **lốc xoáy chất lỏng (`liquid-vortex`)**, chuyển màu cà phê sữa sánh mịn.
* **Bàn tay thả topping:** Trang trí lát đào giòn, nhánh sả thơm hoặc cánh sen tươi.
* **Minigame đánh bông kem trứng:** Đánh bông 100% lòng đỏ trứng gà ta béo ngậy cho món Cà Phê Trứng Hà Nội.

### 3. 📖 Cốt Truyện Phân Nhánh "Chiếc Ô Vàng" (Flag-based Narrative)
* Hệ thống quản lý cốt truyện độc lập (`story.js`) dựa trên cờ trạng thái, phi tuyến tính.
* Người chơi tự do ghé thăm các quán theo bất kỳ thứ tự nào, câu thoại và nhánh lựa chọn sẽ tự động thích ứng thông minh.
* Hoàn thành Chương 1 khi giúp chiếc ô kỷ vật tìm về đúng tay chủ nhân và chuyển lời nhắn tình xưa giữa Bác Ba và Cô Lan.

### 4. 🎧 Động Cơ Âm Thanh Procedural Web Audio
* Tự động tổng hợp âm thanh thực tế bằng code (không cần file mp3 nặng): Tiếng mưa rơi thật (Pink noise), tiếng chim hót sớm mai, tiếng nước chảy sông Hoài, tiếng muỗng khuấy lách cách, tiếng mèo kêu "Meo meo~".
* Tích hợp máy phát nhạc Lofi Guitar acoustic thư giãn.

### 5. 📸 Tiệm Tạp Hóa Nâng Cấp & Chụp Ảnh Polaroid
* Cửa hàng nâng cấp vật dụng: Pate cho mèo Miu Miu, Đài cát-xét vintage, Đèn lồng Hội An, Phin mạ vàng...
* Chụp ảnh Polaroid lưu lại khoảnh khắc ấm áp cùng từng vị khách kèm mốc thời gian thực tế.

---

## 🎮 Cách Chơi & Cài Đặt (Getting Started)

Game hoàn toàn là web tĩnh, bạn không cần cài đặt Node.js hay cơ sở dữ liệu phức tạp:

### Cách 1: Chạy trực tiếp bằng Python
```bash
# Clone repository
git clone https://github.com/phidanghai-spec/caphe-coc-pixel.git

# Di chuyển vào thư mục dự án
cd caphe-coc-pixel

# Khởi động web server cục bộ
python -m http.server 3000
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

### Cách 2: Mở trực tiếp
Mở file `index.html` bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Safari).

---

## 📂 Cấu Trúc Dự Án (Project Structure)

```
caphe-coc-pixel/
├── index.html       # Cấu trúc giao diện game, canvas, quầy pha chế & modal
├── style.css        # Hệ thống thiết kế Retro Pixel, hoạt ảnh bàn tay Barista
├── game.js          # Game engine, Canvas Renderer, Web Audio API & tương tác
├── story.js         # Hệ thống cờ (flags) quản lý cốt truyện "Chiếc ô vàng"
├── assets/          # Bộ sưu tập Pixel Art backgrounds, sprites & portraits
└── README.md        # Tài liệu hướng dẫn dự án
```

---

## 🗺️ Lộ Trình Phát Triển (Roadmap)

- [x] **Tuần 1:** MVP Quầy pha chế tương tác, 5 bối cảnh, Barista hands, Procedural Audio, Locomotion nhân vật.
- [x] **Khởi động Tuần 2:** Chương 1 cốt truyện "Chiếc ô vàng", chuẩn hóa sprite và bối cảnh.
- [x] **Tuần 2:** Chương 2 mở rộng (bí mật tình xưa, biểu cảm chân dung động, tích hợp Sprite Atlas từ `agent-sprite-forge`).
- [x] **Chương 3 — Những lá thư:**
  - Cô Lan viết thư hồi âm, Bác Ba nhận được.
  - App của Hoa và Lâm ra mắt.
  - Chú Vinh chụp ảnh cuối với chiếc Wave.
  - Khi đủ 4 mạch, game hiện thông báo hoàn thành (cờ `chuong3_xong`).
  - Trạng thái: đã hoàn thành.
- [ ] **Tuần 3:** Chu kỳ ngày - đêm động, sự kiện ngẫu nhiên đường phố (cúp điện, mưa rào trú mưa, dọn bàn vỉa hè).
- [ ] **Tuần 4:** Đóng gói PWA (chơi offline toàn màn hình điện thoại) & Triển khai lên Vercel/GitHub Pages.

---

## 📜 Bản Quyền (License)

Dự án được phát triển với tinh thần tôn vinh văn hóa vỉa hè Việt Nam.  
Phát hành theo giấy phép [MIT License](LICENSE).
