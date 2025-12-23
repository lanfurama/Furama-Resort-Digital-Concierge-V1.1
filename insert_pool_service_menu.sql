-- Pool Service Menu SQL Insert Statements
-- Category: Pool
-- Languages: Vietnamese, English, Korean, Japanese, Chinese, French, Russian
-- All names and descriptions are properly translated for each language

BEGIN;

-- Basket boat - 15 minutes
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Thuyền thúng - 15 phút', 150000, 'Pool', 'Thuê thuyền thúng trong 15 phút', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Basket boat - 15 minutes', 150000, 'Pool', 'Basket boat rental for 15 minutes', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('바구니 보트 - 15분', 150000, 'Pool', '15분간 바구니 보트 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('バスケットボート - 15分', 150000, 'Pool', '15分間のバスケットボートレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('篮子船 - 15分钟', 150000, 'Pool', '篮子船租赁15分钟', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Bateau panier - 15 minutes', 150000, 'Pool', 'Location de bateau panier pour 15 minutes', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Корзина-лодка - 15 минут', 150000, 'Pool', 'Аренда корзины-лодки на 15 минут', 'Russian');

-- Basket boat - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Thuyền thúng - 1 giờ', 350000, 'Pool', 'Thuê thuyền thúng trong 1 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Basket boat - 1 hour', 350000, 'Pool', 'Basket boat rental for 1 hour', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('바구니 보트 - 1시간', 350000, 'Pool', '1시간간 바구니 보트 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('バスケットボート - 1時間', 350000, 'Pool', '1時間のバスケットボートレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('篮子船 - 1小时', 350000, 'Pool', '篮子船租赁1小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Bateau panier - 1 heure', 350000, 'Pool', 'Location de bateau panier pour 1 heure', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Корзина-лодка - 1 час', 350000, 'Pool', 'Аренда корзины-лодки на 1 час', 'Russian');

-- Stand Up Paddle Board - 1/2 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Ván chèo đứng - 30 phút', 350000, 'Pool', 'Thuê ván chèo đứng trong 30 phút', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Stand Up Paddle Board - 1/2 hour', 350000, 'Pool', 'Stand up paddle board rental for 30 minutes', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('스탠드업 패들보드 - 30분', 350000, 'Pool', '30분간 스탠드업 패들보드 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('スタンドアップパドルボード - 30分', 350000, 'Pool', '30分間のスタンドアップパドルボードレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('站立式桨板 - 30分钟', 350000, 'Pool', '站立式桨板租赁30分钟', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Planche à pagaie debout - 30 minutes', 350000, 'Pool', 'Location de planche à pagaie debout pour 30 minutes', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Доска для сапсерфинга - 30 минут', 350000, 'Pool', 'Аренда доски для сапсерфинга на 30 минут', 'Russian');

-- Stand Up Paddle Board - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Ván chèo đứng - 1 giờ', 550000, 'Pool', 'Thuê ván chèo đứng trong 1 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Stand Up Paddle Board - 1 hour', 550000, 'Pool', 'Stand up paddle board rental for 1 hour', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('스탠드업 패들보드 - 1시간', 550000, 'Pool', '1시간간 스탠드업 패들보드 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('スタンドアップパドルボード - 1時間', 550000, 'Pool', '1時間のスタンドアップパドルボードレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('站立式桨板 - 1小时', 550000, 'Pool', '站立式桨板租赁1小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Planche à pagaie debout - 1 heure', 550000, 'Pool', 'Location de planche à pagaie debout pour 1 heure', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Доска для сапсерфинга - 1 час', 550000, 'Pool', 'Аренда доски для сапсерфинга на 1 час', 'Russian');

-- Stand Up Paddle Board lesson - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Học ván chèo đứng - 1 giờ', 1400000, 'Pool', 'Lớp học ván chèo đứng trong 1 giờ với hướng dẫn viên', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Stand Up Paddle Board lesson - 1 hour', 1400000, 'Pool', 'Stand up paddle board lesson for 1 hour with instructor', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('스탠드업 패들보드 레슨 - 1시간', 1400000, 'Pool', '강사와 함께하는 1시간 스탠드업 패들보드 레슨', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('スタンドアップパドルボードレッスン - 1時間', 1400000, 'Pool', 'インストラクター付き1時間のスタンドアップパドルボードレッスン', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('站立式桨板课程 - 1小时', 1400000, 'Pool', '教练指导的1小时站立式桨板课程', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Leçon de planche à pagaie debout - 1 heure', 1400000, 'Pool', 'Leçon de planche à pagaie debout d''1 heure avec instructeur', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Урок сапсерфинга - 1 час', 1400000, 'Pool', 'Урок сапсерфинга на 1 час с инструктором', 'Russian');

-- Surf board hire - 1/2 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Thuê ván lướt sóng - 30 phút', 450000, 'Pool', 'Thuê ván lướt sóng trong 30 phút', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Surf board hire - 1/2 hour', 450000, 'Pool', 'Surf board rental for 30 minutes', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('서핑보드 대여 - 30분', 450000, 'Pool', '30분간 서핑보드 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('サーフボードレンタル - 30分', 450000, 'Pool', '30分間のサーフボードレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('冲浪板租赁 - 30分钟', 450000, 'Pool', '冲浪板租赁30分钟', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Location de planche de surf - 30 minutes', 450000, 'Pool', 'Location de planche de surf pour 30 minutes', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Аренда доски для серфинга - 30 минут', 450000, 'Pool', 'Аренда доски для серфинга на 30 минут', 'Russian');

-- Surf board hire - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Thuê ván lướt sóng - 1 giờ', 550000, 'Pool', 'Thuê ván lướt sóng trong 1 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Surf board hire - 1 hour', 550000, 'Pool', 'Surf board rental for 1 hour', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('서핑보드 대여 - 1시간', 550000, 'Pool', '1시간간 서핑보드 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('サーフボードレンタル - 1時間', 550000, 'Pool', '1時間のサーフボードレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('冲浪板租赁 - 1小时', 550000, 'Pool', '冲浪板租赁1小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Location de planche de surf - 1 heure', 550000, 'Pool', 'Location de planche de surf pour 1 heure', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Аренда доски для серфинга - 1 час', 550000, 'Pool', 'Аренда доски для серфинга на 1 час', 'Russian');

-- Surf board lesson - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Học lướt sóng - 1 giờ', 1400000, 'Pool', 'Lớp học lướt sóng trong 1 giờ với hướng dẫn viên', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Surf board lesson - 1 hour', 1400000, 'Pool', 'Surf board lesson for 1 hour with instructor', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('서핑보드 레슨 - 1시간', 1400000, 'Pool', '강사와 함께하는 1시간 서핑보드 레슨', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('サーフボードレッスン - 1時間', 1400000, 'Pool', 'インストラクター付き1時間のサーフボードレッスン', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('冲浪板课程 - 1小时', 1400000, 'Pool', '教练指导的1小时冲浪板课程', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Leçon de planche de surf - 1 heure', 1400000, 'Pool', 'Leçon de planche de surf d''1 heure avec instructeur', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Урок серфинга - 1 час', 1400000, 'Pool', 'Урок серфинга на 1 час с инструктором', 'Russian');

-- Windsurfing - 1/2 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Lướt ván buồm - 30 phút', 400000, 'Pool', 'Thuê ván lướt buồm trong 30 phút', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Windsurfing - 1/2 hour', 400000, 'Pool', 'Windsurfing rental for 30 minutes', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('윈드서핑 - 30분', 400000, 'Pool', '30분간 윈드서핑 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ウィンドサーフィン - 30分', 400000, 'Pool', '30分間のウィンドサーフィンレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('风帆冲浪 - 30分钟', 400000, 'Pool', '风帆冲浪租赁30分钟', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Planche à voile - 30 minutes', 400000, 'Pool', 'Location de planche à voile pour 30 minutes', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Виндсерфинг - 30 минут', 400000, 'Pool', 'Аренда виндсерфинга на 30 минут', 'Russian');

-- Windsurfing - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Lướt ván buồm - 1 giờ', 600000, 'Pool', 'Thuê ván lướt buồm trong 1 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Windsurfing - 1 hour', 600000, 'Pool', 'Windsurfing rental for 1 hour', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('윈드서핑 - 1시간', 600000, 'Pool', '1시간간 윈드서핑 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ウィンドサーフィン - 1時間', 600000, 'Pool', '1時間のウィンドサーフィンレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('风帆冲浪 - 1小时', 600000, 'Pool', '风帆冲浪租赁1小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Planche à voile - 1 heure', 600000, 'Pool', 'Location de planche à voile pour 1 heure', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Виндсерфинг - 1 час', 600000, 'Pool', 'Аренда виндсерфинга на 1 час', 'Russian');

-- Windsurfing lesson - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Học lướt ván buồm - 1 giờ', 1400000, 'Pool', 'Lớp học lướt ván buồm trong 1 giờ với hướng dẫn viên', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Windsurfing lesson - 1 hour', 1400000, 'Pool', 'Windsurfing lesson for 1 hour with instructor', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('윈드서핑 레슨 - 1시간', 1400000, 'Pool', '강사와 함께하는 1시간 윈드서핑 레슨', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ウィンドサーフィンレッスン - 1時間', 1400000, 'Pool', 'インストラクター付き1時間のウィンドサーフィンレッスン', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('风帆冲浪课程 - 1小时', 1400000, 'Pool', '教练指导的1小时风帆冲浪课程', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Leçon de planche à voile - 1 heure', 1400000, 'Pool', 'Leçon de planche à voile d''1 heure avec instructeur', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Урок виндсерфинга - 1 час', 1400000, 'Pool', 'Урок виндсерфинга на 1 час с инструктором', 'Russian');

-- Ocean Kayak - 1/2 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Kayak biển - 30 phút', 300000, 'Pool', 'Thuê kayak biển trong 30 phút', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Ocean Kayak - 1/2 hour', 300000, 'Pool', 'Ocean kayak rental for 30 minutes', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('오션 카약 - 30분', 300000, 'Pool', '30분간 오션 카약 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('オーシャンカヤック - 30分', 300000, 'Pool', '30分間のオーシャンカヤックレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('海洋皮划艇 - 30分钟', 300000, 'Pool', '海洋皮划艇租赁30分钟', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Kayak de mer - 30 minutes', 300000, 'Pool', 'Location de kayak de mer pour 30 minutes', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Морской каяк - 30 минут', 300000, 'Pool', 'Аренда морского каяка на 30 минут', 'Russian');

-- Ocean Kayak - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Kayak biển - 1 giờ', 450000, 'Pool', 'Thuê kayak biển trong 1 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Ocean Kayak - 1 hour', 450000, 'Pool', 'Ocean kayak rental for 1 hour', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('오션 카약 - 1시간', 450000, 'Pool', '1시간간 오션 카약 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('オーシャンカヤック - 1時間', 450000, 'Pool', '1時間のオーシャンカヤックレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('海洋皮划艇 - 1小时', 450000, 'Pool', '海洋皮划艇租赁1小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Kayak de mer - 1 heure', 450000, 'Pool', 'Location de kayak de mer pour 1 heure', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Морской каяк - 1 час', 450000, 'Pool', 'Аренда морского каяка на 1 час', 'Russian');

-- Body Board - 1 hour
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Ván bơi - 1 giờ', 250000, 'Pool', 'Thuê ván bơi trong 1 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Body Board - 1 hour', 250000, 'Pool', 'Body board rental for 1 hour', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('보디보드 - 1시간', 250000, 'Pool', '1시간간 보디보드 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ボディボード - 1時間', 250000, 'Pool', '1時間のボディボードレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('趴板 - 1小时', 250000, 'Pool', '趴板租赁1小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Planche de bodyboard - 1 heure', 250000, 'Pool', 'Location de planche de bodyboard pour 1 heure', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Бодиборд - 1 час', 250000, 'Pool', 'Аренда бодиборда на 1 час', 'Russian');

-- Life vest hire - 1/2 day
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Thuê áo phao - Nửa ngày', 80000, 'Pool', 'Thuê áo phao trong nửa ngày', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Life vest hire - 1/2 day', 80000, 'Pool', 'Life vest rental for half day', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('구명조끼 대여 - 반나절', 80000, 'Pool', '반나절간 구명조끼 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ライフベストレンタル - 半日', 80000, 'Pool', '半日のライフベストレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('救生衣租赁 - 半天', 80000, 'Pool', '救生衣租赁半天', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Location de gilet de sauvetage - Demi-journée', 80000, 'Pool', 'Location de gilet de sauvetage pour une demi-journée', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Аренда спасательного жилета - Полдня', 80000, 'Pool', 'Аренда спасательного жилета на полдня', 'Russian');

-- Life vest hire - 1 day
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Thuê áo phao - 1 ngày', 150000, 'Pool', 'Thuê áo phao trong 1 ngày', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Life vest hire - 1 day', 150000, 'Pool', 'Life vest rental for 1 day', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('구명조끼 대여 - 1일', 150000, 'Pool', '1일간 구명조끼 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ライフベストレンタル - 1日', 150000, 'Pool', '1日のライフベストレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('救生衣租赁 - 1天', 150000, 'Pool', '救生衣租赁1天', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Location de gilet de sauvetage - 1 jour', 150000, 'Pool', 'Location de gilet de sauvetage pour 1 jour', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Аренда спасательного жилета - 1 день', 150000, 'Pool', 'Аренда спасательного жилета на 1 день', 'Russian');

-- Swimming Float - Round float - 2 hours
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Phao bơi tròn - 2 giờ', 180000, 'Pool', 'Thuê phao bơi tròn trong 2 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Swimming Float - Round float - 2 hours', 180000, 'Pool', 'Round swimming float rental for 2 hours', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('수영용 플로트 - 둥근 플로트 - 2시간', 180000, 'Pool', '2시간간 둥근 수영용 플로트 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('水泳用フロート - 丸型フロート - 2時間', 180000, 'Pool', '2時間の丸型水泳用フロートレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('游泳浮具 - 圆形浮具 - 2小时', 180000, 'Pool', '圆形游泳浮具租赁2小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Flotteur de natation - Flotteur rond - 2 heures', 180000, 'Pool', 'Location de flotteur de natation rond pour 2 heures', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Плавательный поплавок - Круглый поплавок - 2 часа', 180000, 'Pool', 'Аренда круглого плавательного поплавка на 2 часа', 'Russian');

-- Swimming Float - Round float - 4 hours
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Phao bơi tròn - 4 giờ', 300000, 'Pool', 'Thuê phao bơi tròn trong 4 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Swimming Float - Round float - 4 hours', 300000, 'Pool', 'Round swimming float rental for 4 hours', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('수영용 플로트 - 둥근 플로트 - 4시간', 300000, 'Pool', '4시간간 둥근 수영용 플로트 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('水泳用フロート - 丸型フロート - 4時間', 300000, 'Pool', '4時間の丸型水泳用フロートレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('游泳浮具 - 圆形浮具 - 4小时', 300000, 'Pool', '圆形游泳浮具租赁4小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Flotteur de natation - Flotteur rond - 4 heures', 300000, 'Pool', 'Location de flotteur de natation rond pour 4 heures', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Плавательный поплавок - Круглый поплавок - 4 часа', 300000, 'Pool', 'Аренда круглого плавательного поплавка на 4 часа', 'Russian');

-- Swimming Float - Shaped float - 2 hours
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Phao bơi hình dạng - 2 giờ', 300000, 'Pool', 'Thuê phao bơi hình dạng trong 2 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Swimming Float - Shaped float - 2 hours', 300000, 'Pool', 'Shaped swimming float rental for 2 hours', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('수영용 플로트 - 모양 플로트 - 2시간', 300000, 'Pool', '2시간간 모양 수영용 플로트 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('水泳用フロート - 形付きフロート - 2時間', 300000, 'Pool', '2時間の形付き水泳用フロートレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('游泳浮具 - 造型浮具 - 2小时', 300000, 'Pool', '造型游泳浮具租赁2小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Flotteur de natation - Flotteur en forme - 2 heures', 300000, 'Pool', 'Location de flotteur de natation en forme pour 2 heures', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Плавательный поплавок - Фигурный поплавок - 2 часа', 300000, 'Pool', 'Аренда фигурного плавательного поплавка на 2 часа', 'Russian');

-- Swimming Float - Shaped float - 4 hours
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Phao bơi hình dạng - 4 giờ', 450000, 'Pool', 'Thuê phao bơi hình dạng trong 4 giờ', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Swimming Float - Shaped float - 4 hours', 450000, 'Pool', 'Shaped swimming float rental for 4 hours', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('수영용 플로트 - 모양 플로트 - 4시간', 450000, 'Pool', '4시간간 모양 수영용 플로트 대여', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('水泳用フロート - 形付きフロート - 4時間', 450000, 'Pool', '4時間の形付き水泳用フロートレンタル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('游泳浮具 - 造型浮具 - 4小时', 450000, 'Pool', '造型游泳浮具租赁4小时', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Flotteur de natation - Flotteur en forme - 4 heures', 450000, 'Pool', 'Location de flotteur de natation en forme pour 4 heures', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Плавательный поплавок - Фигурный поплавок - 4 часа', 450000, 'Pool', 'Аренда фигурного плавательного поплавка на 4 часа', 'Russian');

COMMIT;










