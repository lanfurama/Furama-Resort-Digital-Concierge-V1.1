-- Insert Promotions Data for Furama Resort Digital Concierge
-- This script adds sample promotion data in multiple languages

-- English Promotions
INSERT INTO public.promotions (title, description, discount, valid_until, image_color, image_url, language) VALUES
('Sunset Happy Hour', 'Buy 1 Get 1 Free on all cocktails at Hai Van Lounge. Enjoy stunning sunset views with your favorite drinks.', '50% OFF', 'Daily 17:00-19:00', 'bg-orange-500', NULL, 'English'),
('Spa Retreat', '90-minute aromatherapy massage package. Relax and rejuvenate with our premium spa services.', '20% OFF', 'Nov 30', 'bg-purple-500', NULL, 'English'),
('Seafood Buffet', 'Unlimited lobster and local seafood at Cafe Indochine. Fresh catch daily from local fishermen.', 'From $45', 'Sat & Sun', 'bg-blue-500', NULL, 'English'),
('Early Bird Special', 'Book your stay 30 days in advance and save on your room rate. Perfect for planning your perfect getaway.', '15% OFF', 'Dec 31', 'bg-emerald-500', NULL, 'English'),
('Poolside Paradise', 'Enjoy refreshing cocktails and light bites by the pool. Perfect for a relaxing afternoon.', '30% OFF', 'Daily 14:00-16:00', 'bg-cyan-500', NULL, 'English');

-- Vietnamese Promotions
INSERT INTO public.promotions (title, description, discount, valid_until, image_color, image_url, language) VALUES
('Giờ Vàng Hoàng Hôn', 'Mua 1 Tặng 1 cho tất cả cocktail tại Hai Van Lounge. Tận hưởng cảnh hoàng hôn tuyệt đẹp cùng đồ uống yêu thích của bạn.', 'Giảm 50%', 'Hàng ngày 17:00-19:00', 'bg-orange-500', NULL, 'Vietnamese'),
('Retreat Spa', 'Gói massage liệu pháp hương thơm 90 phút. Thư giãn và tái tạo năng lượng với dịch vụ spa cao cấp của chúng tôi.', 'Giảm 20%', '30 Tháng 11', 'bg-purple-500', NULL, 'Vietnamese'),
('Buffet Hải Sản', 'Tôm hùm và hải sản địa phương không giới hạn tại Cafe Indochine. Hải sản tươi sống hàng ngày từ ngư dân địa phương.', 'Từ $45', 'Thứ 7 & Chủ Nhật', 'bg-blue-500', NULL, 'Vietnamese'),
('Ưu Đãi Đặt Sớm', 'Đặt phòng trước 30 ngày và tiết kiệm giá phòng. Hoàn hảo cho việc lên kế hoạch cho kỳ nghỉ hoàn hảo của bạn.', 'Giảm 15%', '31 Tháng 12', 'bg-emerald-500', NULL, 'Vietnamese'),
('Thiên Đường Bên Hồ Bơi', 'Thưởng thức cocktail giải khát và đồ ăn nhẹ bên hồ bơi. Hoàn hảo cho một buổi chiều thư giãn.', 'Giảm 30%', 'Hàng ngày 14:00-16:00', 'bg-cyan-500', NULL, 'Vietnamese');

-- Korean Promotions
INSERT INTO public.promotions (title, description, discount, valid_until, image_color, image_url, language) VALUES
('선셋 해피아워', '하이 반 라운지에서 모든 칵테일 1+1 행사. 좋아하는 음료와 함께 멋진 석양을 감상하세요.', '50% 할인', '매일 17:00-19:00', 'bg-orange-500', NULL, 'Korean'),
('스파 리트리트', '90분 아로마테라피 마사지 패키지. 프리미엄 스파 서비스로 휴식과 회복을 경험하세요.', '20% 할인', '11월 30일', 'bg-purple-500', NULL, 'Korean'),
('해산물 뷔페', '카페 인도차이나에서 무제한 랍스터와 현지 해산물. 현지 어부들이 매일 잡은 신선한 해산물.', '$45부터', '토요일 & 일요일', 'bg-blue-500', NULL, 'Korean'),
('얼리버드 특가', '30일 전 예약 시 객실 요금 할인. 완벽한 휴가를 계획하기에 완벽합니다.', '15% 할인', '12월 31일', 'bg-emerald-500', NULL, 'Korean'),
('수영장 파라다이스', '수영장 옆에서 시원한 칵테일과 가벼운 간식을 즐기세요. 편안한 오후를 위한 완벽한 선택.', '30% 할인', '매일 14:00-16:00', 'bg-cyan-500', NULL, 'Korean');

-- Japanese Promotions
INSERT INTO public.promotions (title, description, discount, valid_until, image_color, image_url, language) VALUES
('サンセットハッピーアワー', 'ハイバンラウンジで全カクテル1+1。お気に入りのドリンクと素晴らしい夕日をお楽しみください。', '50%オフ', '毎日 17:00-19:00', 'bg-orange-500', NULL, 'Japanese'),
('スパリトリート', '90分のアロマテラピーマッサージパッケージ。プレミアムスパサービスでリラックスと回復をお楽しみください。', '20%オフ', '11月30日', 'bg-purple-500', NULL, 'Japanese'),
('シーフードビュッフェ', 'カフェインドシナで無制限のロブスターと地元のシーフード。地元の漁師が毎日獲った新鮮な魚介類。', '$45から', '土曜日 & 日曜日', 'bg-blue-500', NULL, 'Japanese'),
('早期予約特典', '30日前の予約で部屋代を節約。完璧な休暇を計画するのに最適です。', '15%オフ', '12月31日', 'bg-emerald-500', NULL, 'Japanese'),
('プールサイドパラダイス', 'プールサイドで爽やかなカクテルと軽食をお楽しみください。リラックスした午後には最適です。', '30%オフ', '毎日 14:00-16:00', 'bg-cyan-500', NULL, 'Japanese');

-- Chinese Promotions
INSERT INTO public.promotions (title, description, discount, valid_until, image_color, image_url, language) VALUES
('日落欢乐时光', '在海云酒廊购买任意鸡尾酒买一送一。与您最喜爱的饮品一起欣赏壮观的日落景色。', '50% 折扣', '每日 17:00-19:00', 'bg-orange-500', NULL, 'Chinese'),
('水疗静修', '90分钟芳香疗法按摩套餐。通过我们的高级水疗服务放松和恢复活力。', '20% 折扣', '11月30日', 'bg-purple-500', NULL, 'Chinese'),
('海鲜自助餐', '在印度支那咖啡厅享用无限量的龙虾和当地海鲜。每天从当地渔民那里采购的新鲜海鲜。', '从 $45', '周六 & 周日', 'bg-blue-500', NULL, 'Chinese'),
('早鸟特惠', '提前30天预订可享受房价折扣。非常适合规划您的完美假期。', '15% 折扣', '12月31日', 'bg-emerald-500', NULL, 'Chinese'),
('池畔天堂', '在池畔享用清爽的鸡尾酒和轻食。非常适合度过轻松的下午。', '30% 折扣', '每日 14:00-16:00', 'bg-cyan-500', NULL, 'Chinese');

-- French Promotions
INSERT INTO public.promotions (title, description, discount, valid_until, image_color, image_url, language) VALUES
('Happy Hour du Coucher de Soleil', 'Achetez 1, obtenez 1 gratuit sur tous les cocktails au Hai Van Lounge. Profitez de vues magnifiques sur le coucher de soleil avec vos boissons préférées.', '50% DE RÉDUCTION', 'Quotidien 17:00-19:00', 'bg-orange-500', NULL, 'French'),
('Retraite Spa', 'Forfait massage aromathérapie de 90 minutes. Détendez-vous et régénérez-vous avec nos services spa premium.', '20% DE RÉDUCTION', '30 Nov', 'bg-purple-500', NULL, 'French'),
('Buffet de Fruits de Mer', 'Homard et fruits de mer locaux illimités au Cafe Indochine. Pêche fraîche quotidienne des pêcheurs locaux.', 'À partir de $45', 'Sam & Dim', 'bg-blue-500', NULL, 'French'),
('Offre Early Bird', 'Réservez votre séjour 30 jours à l''avance et économisez sur votre tarif de chambre. Parfait pour planifier votre escapade parfaite.', '15% DE RÉDUCTION', '31 Déc', 'bg-emerald-500', NULL, 'French'),
('Paradis au Bord de la Piscine', 'Profitez de cocktails rafraîchissants et de collations légères au bord de la piscine. Parfait pour un après-midi relaxant.', '30% DE RÉDUCTION', 'Quotidien 14:00-16:00', 'bg-cyan-500', NULL, 'French');

-- Russian Promotions
INSERT INTO public.promotions (title, description, discount, valid_until, image_color, image_url, language) VALUES
('Счастливый час на закате', 'Купите 1, получите 1 бесплатно на все коктейли в Hai Van Lounge. Наслаждайтесь потрясающими видами на закат с вашими любимыми напитками.', '50% СКИДКА', 'Ежедневно 17:00-19:00', 'bg-orange-500', NULL, 'Russian'),
('Спа-ретрит', '90-минутный пакет ароматерапевтического массажа. Расслабьтесь и восстановитесь с нашими премиальными спа-услугами.', '20% СКИДКА', '30 Ноя', 'bg-purple-500', NULL, 'Russian'),
('Морепродуктовый буфет', 'Неограниченные омары и местные морепродукты в Cafe Indochine. Свежий улов ежедневно от местных рыбаков.', 'От $45', 'Сб & Вс', 'bg-blue-500', NULL, 'Russian'),
('Специальное предложение для ранних бронирований', 'Забронируйте проживание за 30 дней и сэкономьте на стоимости номера. Идеально для планирования идеального отпуска.', '15% СКИДКА', '31 Дек', 'bg-emerald-500', NULL, 'Russian'),
('Рай у бассейна', 'Наслаждайтесь освежающими коктейлями и легкими закусками у бассейна. Идеально для расслабленного дня.', '30% СКИДКА', 'Ежедневно 14:00-16:00', 'bg-cyan-500', NULL, 'Russian');

-- Verify the data
SELECT language, COUNT(*) as count FROM public.promotions GROUP BY language ORDER BY language;
