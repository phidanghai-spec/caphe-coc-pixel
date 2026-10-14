// story.js — Cốt truyện "Chiếc ô vàng" cho Cà Phê Cóc Vỉa Hè
// Đặt trước game.js trong index.html

const STORY_DEFAULT_FLAGS = {
  o_vang_dang_tin: false,
  o_vang_o_quan: false,
  hoa_da_gap_o: false,
  lam_ho_tro: false,
  ba_gui_qua: false,
  lan_biet_chuyen: false,
  ket_thuc: false
};

// Mỗi dòng có thể có "when" (điều kiện theo cờ). Dòng đầu tiên khớp sẽ được dùng,
// nên đặt dòng có điều kiện lên trước, dòng mặc định để cuối.
const STORY_SCENES = {
  night: {
    arrive: [
      { when: f => f.o_vang_dang_tin && !f.o_vang_o_quan,
        text: 'Chú nghe nói có người tìm ô vàng trong nhóm rồi đó con. Chú chưa kịp trả, con giữ giùm chú ly này rồi tính tiếp nghen...' },
      { when: f => f.o_vang_o_quan,
        text: 'Cái ô vàng chú gửi con giữ nha, cảm ơn con nhiều. Chú yên tâm rồi, cho chú ly cà phê sữa đá ấm bụng.' },
      { text: 'Cho chú ly cà phê sữa đá nhiều sữa nghen con. Chạy cuốc cuối đêm mưa ướt sũng cả áo rồi... Hồi chiều chú chở một cô gái, xuống xe chú mới thấy cái ô vàng quên trên xe luôn á.' }
    ],
    choices: [
      { text: 'Chú để cái ô vàng lại đây, con giữ giúp chủ nhân.',
        when: f => !f.o_vang_o_quan,
        reply: 'Ừa, vậy chú yên tâm rồi. Có ai tới hỏi thì con nói giùm chú nghen!',
        bonusHearts: 3, effects: { o_vang_o_quan: true } },
      { text: 'Chú để con đăng lên nhóm xe ôm, biết đâu có người tìm ra chủ.',
        when: f => !f.o_vang_o_quan && !f.o_vang_dang_tin,
        reply: 'Ý hay đó con! Có tin tức gì chú nhờ con báo liền nghen.',
        bonusHearts: 2, effects: { o_vang_dang_tin: true } },
      { text: 'Chú ơi uống ly cho ấm người, đêm nay mưa lạnh quá!',
        reply: 'Cảm ơn con nhiều nghen, gặp được quán ấm áp như vầy chú mừng ghê!',
        bonusHearts: 2 }
    ],
    serve: [
      { when: f => f.o_vang_o_quan,
        text: 'Cà phê thơm béo, bánh mì giòn tan. Con giữ ô giùm chú, chú cảm ơn con nhiều nghen!' }
    ]
  },

  counter: {
    arrive: [
      { when: f => f.hoa_da_gap_o,
        text: 'Hôm nay em ghé uống ly trà đào lấy lại tinh thần thôi anh. Ô về tay rồi, em thấy nhẹ cả người.' },
      { when: f => f.o_vang_dang_tin || f.o_vang_o_quan,
        text: 'Anh ơi, em nghe nói có người nhặt được cái ô vàng... em ghé coi có tin gì không ạ.' },
      { text: 'Anh ơi, em tìm cái ô vàng bị bỏ quên tối qua mà không thấy. Đó là kỷ vật của mẹ em, em buồn lắm...' }
    ],
    choices: [
      { text: 'Em tìm cái ô vàng hả? Anh đang giữ nó nè.',
        when: f => f.o_vang_o_quan && !f.hoa_da_gap_o,
        reply: 'Trời ơi, đúng là ô của em rồi! Mẹ em mua cho ngày em đậu đại học đó anh. Em cảm ơn anh nhiều lắm...',
        bonusHearts: 4, effects: { hoa_da_gap_o: true } },
      { text: 'Nghe nói có người đăng tin tìm ô, em thử nhắn nhóm xe ôm đi.',
        when: f => f.o_vang_dang_tin && !f.o_vang_o_quan && !f.hoa_da_gap_o,
        reply: 'Dạ để em nhắn liền. Hy vọng chú xe ôm đó còn giữ cái ô cho em...',
        bonusHearts: 2 },
      { text: 'Em cố lên, đồ án qua môn là xuất sắc luôn!',
        reply: 'Dạ em cảm ơn anh, nghe anh động viên em có thêm 100% động lực rồi nè!',
        bonusHearts: 2 }
    ],
    serve: [
      { when: f => f.hoa_da_gap_o,
        text: 'Trà đào thơm nức mũi. Cảm ơn anh đã giữ ô cho em nha, em sẽ kể kết quả đồ án cho anh nghe!' }
    ]
  },

  indoor: {
    arrive: [
      { when: f => f.o_vang_dang_tin && !f.lam_ho_tro,
        text: 'Hồi sáng có bài đăng tìm cái ô vàng trong nhóm xe ôm, anh thấy rồi. Mà anh đang bận sửa server, em làm ly nhanh giùm anh nha.' },
      { text: 'Làm cho anh ly Cà Phê Muối béo mặn xứ Huế nha em. Kèm lát bánh Tiramisu phô mai, bug server dí từ sáng, cần sốc lại tinh thần...' }
    ],
    choices: [
      { text: 'Server lại 500 hả anh? Uống ly này rồi fix trong một nốt nhạc!',
        reply: 'Haha chuẩn em ơi, caffeine và kem muối béo mặn là thuốc giải duy nhất lúc này!',
        bonusHearts: 3 },
      { text: 'Bài tìm ô vàng đó, anh ghim giúp em lên đầu nhóm được không?',
        when: f => f.o_vang_dang_tin && !f.lam_ho_tro,
        reply: 'Được em, anh ghim luôn rồi. Có ai nhắn tin thì anh báo em liền.',
        bonusHearts: 3, effects: { lam_ho_tro: true } },
      { text: 'Kem muối béo thơm chuẩn vị Huế, chúc anh pass PR êm ru!',
        reply: 'Nghe êm ru là nhẹ cả đầu óc rồi em ơi, cảm ơn quán nha!',
        bonusHearts: 2 }
    ],
    serve: [
      { when: f => f.lam_ho_tro,
        text: 'Lớp kem muối béo ngậy, bánh tiramisu đỉnh chóp. Cảm ơn em đã giúp anh ghim bài nha, đúng lúc quá!' }
    ]
  },

  morning: {
    arrive: [
      { text: 'Cho bác ly Cà Phê Đen Đá đậm đà không đường con nhé. Kèm ổ bánh mì pa-tê giòn rụm, sáng ra làm ván cờ với mấy ông bạn già là thú vui tao nhã...' }
    ],
    choices: [
      { text: 'Dạ bác ngồi bàn gió mát nghen, sáng nay bác thắng ván nào chưa ạ?',
        reply: 'Haha bác vừa chiếu bí ông Tám một ván giòn giã con ạ!',
        bonusHearts: 3 },
      { text: 'Bác ơi, bác kể cháu nghe chuyện cô Lan Hội An đi bác.',
        when: f => !f.ba_gui_qua,
        reply: 'Ừ, hồi trẻ bác với cô Lan cùng xóm. Bác nhờ con mang cho cô một gói quà nhỏ, nói cô biết là bác vẫn nhớ.',
        bonusHearts: 3, effects: { ba_gui_qua: true } },
      { text: 'Cà phê Robusta rang mộc thơm nức mũi bác nhé!',
        reply: 'Đúng gu bác rồi đấy, người sành cà phê như cháu hiếm lắm!',
        bonusHearts: 2 }
    ],
    choices_after_sent: [
      { text: 'Dạ bác an tâm, con đã chuyển lời và quà đến cô Lan rồi ạ!',
        when: f => f.lan_biet_chuyen,
        reply: 'Cô Lan vui vẻ là bác mừng rồi. Con ngoan lắm, bác cảm ơn con thật nhiều!',
        bonusHearts: 3 }
    ],
    serve: [
      { when: f => f.ba_gui_qua,
        text: 'Cà phê đậm vị, đắng thanh hậu ngọt. Bánh mì nóng giòn. Đừng quên gói quà cho cô Lan nghen con!' }
    ]
  },

  hoian: {
    arrive: [
      { when: f => f.ba_gui_qua && !f.lan_biet_chuyen,
        text: 'Con ơi, con là người bác Ba nhờ đem quà cho cô hả? Cô nhớ ông ấy lắm, lâu quá rồi không gặp...' },
      { text: 'Pha cho cô ly Trà Mót thảo mộc thanh mát nha con ơi! Gánh hàng cả buổi chiều mệt nhoài, thêm đĩa bánh đập phố cổ chấm mắm nêm...' }
    ],
    choices: [
      { text: 'Hôm nay cô bán buôn đắt hàng không cô?',
        reply: 'Nhờ trời thương cũng bán được mấy gánh hàng rong con ạ, cảm ơn con hỏi thăm nghen!',
        bonusHearts: 3 },
      { text: 'Con hái cánh sen và nhánh sả làm trà Mót cho cô nha!',
        reply: 'Đúng điệu Hội An rồi con ơi, thơm thanh tao dễ chịu ghê!',
        bonusHearts: 2 },
      { text: 'Bác Ba nhắn cô là bác vẫn nhớ cô như ngày xưa.',
        when: f => f.ba_gui_qua && !f.lan_biet_chuyen,
        reply: 'Ông ấy... vẫn nhớ hả con. Cô mừng quá, con nói giùm cô cảm ơn ông ấy nghen...',
        bonusHearts: 4, effects: { lan_biet_chuyen: true } }
    ],
    serve: [
      { when: f => f.lan_biet_chuyen,
        text: 'Trà sen thơm dịu, bánh đập giòn bùi chấm mắm. Con về nói với bác Ba là cô cảm ơn ông ấy nhiều nghen!' }
    ]
  }
};

class StoryManager {
  constructor() {
    this.flags = { ...STORY_DEFAULT_FLAGS };
  }

  pickLine(lines) {
    if (!lines || !Array.isArray(lines)) return null;
    const hit = lines.find(l => !l.when || l.when(this.flags));
    return hit ? hit.text : null;
  }

  getArrival(sceneKey, fallback) {
    const scene = STORY_SCENES[sceneKey];
    return (scene && this.pickLine(scene.arrive)) || fallback;
  }

  getServe(sceneKey, fallback) {
    const scene = STORY_SCENES[sceneKey];
    return (scene && scene.serve && this.pickLine(scene.serve)) || fallback;
  }

  getChoices(sceneKey) {
    const scene = STORY_SCENES[sceneKey];
    if (!scene) return [];
    let list = scene.choices ? scene.choices.filter(c => !c.when || c.when(this.flags)) : [];
    if (scene.choices_after_sent) {
      const extra = scene.choices_after_sent.filter(c => !c.when || c.when(this.flags));
      list = [...list, ...extra];
    }
    return list;
  }

  // Trả về 'ending' khi chương 1 vừa hoàn thành, ngược lại trả về null
  applyEffects(effects = {}) {
    if (!effects) return null;
    Object.assign(this.flags, effects);
    if (!this.flags.ket_thuc && this.flags.hoa_da_gap_o && this.flags.lan_biet_chuyen) {
      this.flags.ket_thuc = true;
      return 'ending';
    }
    return null;
  }
}
