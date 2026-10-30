// Card mẫu Tanqueray, CHỈ dùng khi chạy `npm run dev` trên máy mà chưa có NOTION_TOKEN.
// Không bao giờ được đưa lên web thật (xem notion.js).
export const SAMPLE_CARDS = [
  {
    id: "sample-tanqueray",
    name: "Tanqueray London Dry Gin",
    slug: "tanqueray-london-dry-gin",
    category: "Gin",
    sub_category: "London Dry",
    brand: "Tanqueray",
    producer: "Cameronbridge Distillery (Diageo)",
    country: "Anh (UK)",
    region: "Fife, Scotland",
    volume_ml: 750,
    base_ingredient: "Ngũ cốc",
    year_founded: 1830,
    tier: "Tiêu chuẩn",
    history_summary_vi:
      "Gần 200 năm, công thức bốn botanicals của Tanqueray gần như không đổi và trở thành chuẩn tham chiếu cho dòng London Dry.",
    history_timeline_vi: `1830 | Charles Tanqueray, khi đó 20 tuổi, phá lệ gia đình vốn theo nghề mục sư, mở xưởng chưng cất trên phố Vine, khu Bloomsbury, London.
Những năm 1830 | Ông thử nghiệm hơn 300 công thức, cuối cùng chốt bốn botanicals: juniper, coriander, angelica root và liquorice.
1868 | Charles qua đời, con trai Charles Waugh Tanqueray tiếp quản công ty.
1898 [cần kiểm tra] | Tanqueray sáp nhập với Gordon's thành Tanqueray Gordon & Co.
1998 | Sản xuất chuyển về Cameronbridge ở Fife, Scotland.
2021 | Ra mắt Tanqueray 0.0%, phiên bản không cồn.`,
    production_notes_vi: `Rượu nền ngũ cốc, chưng cất bốn lần
Botanicals đưa vào ở lần chưng cất thứ hai
Ba nồi đồng lớn (copper pot still) tại Cameronbridge`,
    abv_by_market: `47,3% | Mỹ, Canada, Đức, duty-free châu Âu
43,1% | Anh, Na Uy, Thụy Điển
40% | Úc, Canada, New Zealand`,
    expressions: `Tanqueray No. TEN | thêm bưởi, cam, chanh, hoa cúc
Tanqueray Rangpur | chanh Rangpur
Tanqueray Flor de Sevilla | cam Seville`,
    key_ingredients: ["Juniper", "Coriander", "Angelica root", "Liquorice"],
    ingredient_notes_vi: `Juniper | Quả bách xù | Thành phần bắt buộc của mọi chai gin. Mùi thông, nhựa, hơi cay; là xương sống hương vị của Tanqueray.
Coriander | Hạt ngò (rau mùi) | Cay ấm, gợi mùi cam quýt; tạo cảm giác tươi và cay nhẹ trên vòm miệng.
Angelica root | Rễ bạch chỉ | Mùi đất, khô; giúp liên kết các hương khác và tạo độ khô cho gin.
Liquorice | Rễ cam thảo | Ngọt nhẹ, làm tròn vị và tạo cảm giác đầy hơn trong miệng.`,
    flavor_profile: "sweet:1, fruity:1, floral:1, herbal_spicy:4, woody:0, smoky:0",
    flavor_tags: ["Herbal", "Spicy", "Citrus"],
    nose_vi: "Juniper tươi, mùi lá thông\nGỗ tuyết tùng\nVỏ chanh vàng",
    palate_vi: "Juniper đậm\nCoriander cay nhẹ\nLiquorice ngọt nhẹ",
    finish_vi: "Dài\nẤm cay như tiêu\nKhô và sạch",
    serve_neat_vi: "Rót khoảng 30 ml vào ly nhỏ miệng hẹp, nhiệt độ phòng. Để vài phút cho mùi juniper mở ra.",
    serve_rocks_vi: "Một viên đá lớn trong ly rocks. Đá tan chậm giúp vị dịu dần mà không bị loãng nhanh.",
    serve_tonic_vi: "Highball nhiều đá, tỷ lệ 1 gin : 3 tonic.",
    tonic_garnish_vi: "Chanh vàng",
    tonic_garnish_why_vi:
      "Một lát chanh vàng làm rõ note vỏ chanh trong mùi, giữ G&T khô và sạch đúng chất London Dry.",
    pairing_vi: `Khai vị · cuốn | Gỏi cuốn tôm thịt | B | Juniper và coriander cộng hưởng với húng quế, rau thơm trong cuốn. | G&T, lát chanh vàng
Nướng | Bò lá lốt | B | Mùi lá lốt nướng và tiêu được nâng lên nhờ vị cay ấm của coriander. | On the rocks
Món kho | Cá kho tộ | A | Món đậm mặn ngọt, thiếu độ tươi. Gin thêm mùi cam quýt và thảo mộc. | G&T, lát chanh vàng
Hải sản | Tôm nướng muối ớt | A | Gin thêm lớp mùi thảo mộc và cam quýt, giống vắt chanh lên tôm. | G&T
Chiên | Chả giò | C | Gin khô, sắc cắt vị béo của dầu chiên nhưng vẫn để vị thịt dẫn dắt. | G&T nhiều đá
Tráng miệng | Chè bưởi | C | Vị khô, hơi đắng của juniper đối lập với cốt dừa ngọt béo. | Neat, ly nhỏ`,
    sources: "https://en.wikipedia.org/wiki/Tanqueray",
  },
];
