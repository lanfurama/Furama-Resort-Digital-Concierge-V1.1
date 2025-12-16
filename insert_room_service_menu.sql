-- In-Room Dining Menu SQL Insert Statements
-- Generated from room_service_menu.csv
-- Category: Dining
-- Languages: Vietnamese, English, Korean, Japanese, Chinese, French, Russian
-- All names and descriptions are properly translated for each language

BEGIN;

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Salad Caesar với gà xông khói', 340000, 'Dining', 'Poached egg, crispy bacon, romaine lettuce, croutons', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('CAESAR SALAD WITH SMOKED CHICKEN', 340000, 'Dining', 'Poached egg, crispy bacon, romaine lettuce, croutons', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('시저 샐러드', 340000, 'Dining', '수란, 바삭한 베이컨, 로메인 상추, 크루통', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('シーザーサラダ', 340000, 'Dining', 'ポーチドエッグ, クリスピーベーコン, ロメインレタス, クルトン', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('凯撒沙拉', 340000, 'Dining', '水煮蛋, 脆培根, 长叶生菜, 面包丁', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Salade César', 340000, 'Dining', 'Œuf poché, bacon croustillant, laitue romaine, croûtons', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Салат Цезарь', 340000, 'Dining', 'Яйцо пашот, хрустящий бекон, салат ромэн, гренки', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Gói bò với hoa chuối', 260000, 'Dining', 'Sliced beef with banana blossom, Vietnamese herbs and seafood dressing', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('BEEF AND BANANA BLOSSOM SALAD', 260000, 'Dining', 'Sliced beef with banana blossom, Vietnamese herbs and seafood dressing', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('소고기와 바나나 꽃 샐러드', 260000, 'Dining', '얇게 썬 소고기 with 바나나 꽃, 베트남 허브 and 해산물 드레싱', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('牛肉とバナナの花サラダ', 260000, 'Dining', '薄切り牛肉 with バナナの花, ベトナムハーブ and シーフードドレッシング', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('牛肉香蕉花沙拉', 260000, 'Dining', '切片牛肉 with 香蕉花, 越南香草 and 海鲜酱', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Salade de Bœuf et Fleur de Bananier', 260000, 'Dining', 'Bœuf tranché with fleur de bananier, herbes vietnamiennes and vinaigrette aux fruits de mer', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Салат из Говядины и Цветка Банана', 260000, 'Dining', 'Нарезанная говядина with цветок банана, вьетнамские травы and заправка из морепродуктов', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Phô mai Mozzarella ăn kèm với cà chua lá húng quế tươi và dầu olive nguyên chất hào hạng', 440000, 'Dining', 'Buffalo Mozzarella with confit of tomatoes basil and extra virgin olive oil', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('DON CIPRIANI''S CAPRESE', 440000, 'Dining', 'Buffalo Mozzarella with confit of tomatoes basil and extra virgin olive oil', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('카프레제', 440000, 'Dining', '버팔로 모짜렐라 with confit of 토마토 바질 and 엑스트라 버진 올리브 오일', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('カプレーゼ', 440000, 'Dining', 'バッファローモッツァレラ with confit of トマト バジル and エクストラバージンオリーブオイル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('卡普雷塞', 440000, 'Dining', '水牛马苏里拉 with confit of 番茄 罗勒 and 特级初榨橄榄油', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Caprese', 440000, 'Dining', 'Mozzarella de Buffle with confit of tomates basilic and huile d''olive extra vierge', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Капрезе', 440000, 'Dining', 'Моцарелла из Буйволиного Молока with confit of помидоры базилик and оливковое масло экстра вирджин', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Mỳ dẹt và cà tím xếp lớp với xốt cà chua nguyên chất phô mai Parmesan phô mai Mozzarella và lá húng quế tươi', 250000, 'Dining', 'Layered eggplant with tomato sauce, Parmesan cheese, Mozzarella and basil', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PARMIGIANA DI MELANZANE', 250000, 'Dining', 'Layered eggplant with tomato sauce, Parmesan cheese, Mozzarella and basil', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('파르미지아나', 250000, 'Dining', '겹겹이 쌓은 가지 with 토마토 소스, 파르메산 치즈, 모짜렐라 and 바질', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('パルミジャーナ', 250000, 'Dining', '重ねたナス with トマトソース, パルメザンチーズ, モッツァレラ and バジル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('帕尔米贾纳', 250000, 'Dining', '分层茄子 with 番茄酱, 帕尔马干酪, 马苏里拉 and 罗勒', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Parmigiana', 250000, 'Dining', 'Aubergine en couches with sauce tomate, fromage Parmesan, Mozzarella and basilic', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Пармиджана', 250000, 'Dining', 'Слоеный баклажан with томатный соус, сыр Пармезан, Моцарелла and базилик', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Canh chua cá bớp', 250000, 'Dining', 'Cobia fish, tamarind, pineapple, tomato, okra, bean sprout and chili', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SWEET AND SOUR FISH BROTH', 250000, 'Dining', 'Cobia fish, tamarind, pineapple, tomato, okra, bean sprout and chili', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('탕수어 국물', 250000, 'Dining', '코비아 생선, 타마린드, 파인애플, tomato, 오크라, 콩나물 and 고추', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('甘酢魚のスープ', 250000, 'Dining', 'コビア魚, タマリンド, パイナップル, tomato, オクラ, もやし and チリ', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('酸甜鱼汤', 250000, 'Dining', '军曹鱼, 罗望子, 菠萝, tomato, 秋葵, 豆芽 and 辣椒', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Bouillon de Poisson Aigre-Doux', 250000, 'Dining', 'Poisson Cobia, tamarin, ananas, tomato, gombo, pousses de soja and piment', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Кисло-Сладкий Рыбный Бульон', 250000, 'Dining', 'Рыба Кобия, тамаринд, ананас, tomato, бамия, ростки сои and чили', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Súp đậu kiểu Venice và mỳ ống Manicotti với một chút dầu hương thảo thơm', 290000, 'Dining', 'Beans soup and manicotti pasta with rosemary oil', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PASTA E FAGIOLI', 290000, 'Dining', 'Beans soup and manicotti pasta with rosemary oil', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('파스타 에 파졸리', 290000, 'Dining', '콩 수프 and 마니코티 파스타 with 로즈마리 오일', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('パスタ・エ・ファジョーリ', 290000, 'Dining', '豆スープ and マニコッティパスタ with ローズマリーオイル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('意大利面豆汤', 290000, 'Dining', '豆汤 and 马尼科蒂意大利面 with 迷迭香油', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pâtes aux Haricots', 290000, 'Dining', 'Soupe aux haricots and pâtes manicotti with huile de romarin', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Паста с Фасолью', 290000, 'Dining', 'Суп из фасоли and маникотти паста with масло розмарина', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Sườn non rim ăn kèm cơm trắng', 290000, 'Dining', 'With fish sauce, shallot, garlic and black pepper', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SIMMERED YOUNG PORK RIBS', 290000, 'Dining', 'With fish sauce, shallot, garlic and black pepper', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('끓인 어린 돼지 갈비', 290000, 'Dining', 'With 생선 소스, 샬롯, 마늘 and 후추', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('若い豚のリブの煮込み', 290000, 'Dining', 'With 魚醤, エシャロット, ニンニク and 黒胡椒', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('炖小排骨', 290000, 'Dining', 'With 鱼露, 青葱, 大蒜 and 黑胡椒', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Côtes de Porc Jeunes Braisées', 290000, 'Dining', 'With sauce de poisson, échalote, ail and poivre noir', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Тушеные Молодые Свиные Ребра', 290000, 'Dining', 'With рыбный соус, лук-шалот, чеснок and черный перец', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Cá hồi áp chảo kiểu Xcot-len', 660000, 'Dining', 'With gratinated broccoli and potato crisps', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PAN FRIED SCOTTISH SALMON', 660000, 'Dining', 'With gratinated broccoli and potato crisps', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('스코틀랜드 연어', 660000, 'Dining', 'With 그라탕 브로콜리 and 감자 칩', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('スコットランドサーモン', 660000, 'Dining', 'With グラタンブロッコリー and ポテトチップス', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('苏格兰三文鱼', 660000, 'Dining', 'With 焗西兰花 and 薯片', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Saumon d''Écosse', 660000, 'Dining', 'With brocoli gratiné and chips de pomme de terre', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Шотландский Лосось', 660000, 'Dining', 'With брокколи гратен and картофельные чипсы', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Thịt gà xào hạt điều', 330000, 'Dining', 'Onion, baby corn, capsicum in oyster and roasted chilli paste with steamed rice', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('WOK FRIED CHICKEN WITH CASHEW NUTS', 330000, 'Dining', 'Onion, baby corn, capsicum in oyster and roasted chilli paste with steamed rice', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('볶음 닭고기', 330000, 'Dining', '양파, 베이비 콘, 피망 in 굴 and 구운 고추 페이스트 with 찐밥', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('炒めチキン', 330000, 'Dining', '玉ねぎ, ベビーコーン, ピーマン in カキ and ローストチリペースト with ご飯', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('炒鸡', 330000, 'Dining', '洋葱, 小玉米, 甜椒 in 牡蛎 and 烤辣椒酱 with 米饭', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Poulet Sauté au Wok', 330000, 'Dining', 'Oignon, mini maïs, poivron in huître and pâte de piment rôtie with riz cuit à la vapeur', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Курица Жареная в Воке', 330000, 'Dining', 'Лук, мини кукуруза, перец in устрица and жареная паста чили with пареный рис', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Thân bò Mỹ nướng (200g)', 690000, 'Dining', 'Served with red wine sauce and stuffed tomato', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('200G US STRIPLOIN', 690000, 'Dining', 'Served with red wine sauce and stuffed tomato', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('미국 스트립로인', 690000, 'Dining', 'Served with 레드 와인 소스 and 토마토 속을 채운', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('米国ストリップロイン', 690000, 'Dining', 'Served with 赤ワインソース and 詰めトマト', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('美国西冷牛排', 690000, 'Dining', 'Served with 红酒酱 and 酿番茄', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Entrecôte Américaine', 690000, 'Dining', 'Served with sauce au vin rouge and tomate farcie', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Американская Вырезка', 690000, 'Dining', 'Served with соус из красного вина and фаршированный помидор', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Mỳ Ý với sốt bò bằm cổ điển', 360000, 'Dining', 'Spaghetti with a classic Bolognese ragout', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SPAGHETTI ALLA BOLOGNESE', 360000, 'Dining', 'Spaghetti with a classic Bolognese ragout', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('스파게티 볼로네제', 360000, 'Dining', 'Spaghetti with a 클래식 볼로네제 라구', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('スパゲッティ・アッラ・ボロネーゼ', 360000, 'Dining', 'Spaghetti with a クラシックボロネーゼラグー', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('意大利肉酱面', 360000, 'Dining', 'Spaghetti with a 经典博洛尼亚肉酱', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Spaghettis à la Bolognaise', 360000, 'Dining', 'Spaghetti with a ragout bolognaise classique', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Спагетти Болоньезе', 360000, 'Dining', 'Spaghetti with a классический рагу болоньезе', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Bánh mỳ kẹp kiểu Furama', 430000, 'Dining', 'Smoked chicken, crispy bacon, fried egg, tomato, cucumber and romaine lettuce', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FURAMA CLUB SANDWICH', 430000, 'Dining', 'Smoked chicken, crispy bacon, fried egg, tomato, cucumber and romaine lettuce', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('클럽 샌드위치', 430000, 'Dining', '훈제 닭고기, 바삭한 베이컨, 프라이드 에그, tomato, 오이 and 로메인 상추', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('クラブサンドイッチ', 430000, 'Dining', 'スモークチキン, クリスピーベーコン, フライドエッグ, tomato, キュウリ and ロメインレタス', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('俱乐部三明治', 430000, 'Dining', '烟熏鸡肉, 脆培根, 煎蛋, tomato, 黄瓜 and 长叶生菜', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Club Sandwich', 430000, 'Dining', 'Poulet fumé, bacon croustillant, œuf au plat, tomato, concombre and laitue romaine', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Клубный Сэндвич', 430000, 'Dining', 'Копченая курица, хрустящий бекон, яичница, tomato, огурец and салат ромэн', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Mỳ Ý với trứng tiêu đen phô mai Percorino và thịt má heo Guanciable', 370000, 'Dining', 'Spaghetti with egg, black pepper, Pecorino cheese and Guanciale', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SPAGHETTI ALLA CARBONARA', 370000, 'Dining', 'Spaghetti with egg, black pepper, Pecorino cheese and Guanciale', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('스파게티 카르보나라', 370000, 'Dining', 'Spaghetti with 계란, 후추, 페코리노 치즈 and 관치알레', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('スパゲッティ・アッラ・カルボナーラ', 370000, 'Dining', 'Spaghetti with 卵, 黒胡椒, ペコリーノチーズ and グアンチャーレ', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('卡博纳拉意大利面', 370000, 'Dining', 'Spaghetti with 鸡蛋, 黑胡椒, 佩科里诺干酪 and 猪脸颊肉', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Spaghettis à la Carbonara', 370000, 'Dining', 'Spaghetti with œuf, poivre noir, fromage Pecorino and Guanciale', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Спагетти Карбонара', 370000, 'Dining', 'Spaghetti with яйцо, черный перец, сыр Пекорино and Гуанчале', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Phở bò kiểu Furama', 230000, 'Dining', 'Noodle soup with sliced beef, served with garlic flavored vinegar and homemade chili sauce', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FURAMA BEEF NOODLE SOUP', 230000, 'Dining', 'Noodle soup with sliced beef, served with garlic flavored vinegar and homemade chili sauce', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('소고기 국수', 230000, 'Dining', 'Noodle soup with sliced beef, served with 마늘 flavored vinegar and homemade 고추 sauce', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('牛肉麺', 230000, 'Dining', 'Noodle soup with sliced beef, served with ニンニク flavored vinegar and homemade チリ sauce', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('牛肉面', 230000, 'Dining', 'Noodle soup with sliced beef, served with 大蒜 flavored vinegar and homemade 辣椒 sauce', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Soupe de Nouilles au Bœuf', 230000, 'Dining', 'Noodle soup with sliced beef, served with ail flavored vinegar and homemade piment sauce', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Суп с Лапшой и Говядиной', 230000, 'Dining', 'Noodle soup with sliced beef, served with чеснок flavored vinegar and homemade чили sauce', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Mỳ Ý xào ngao tươi và dầu olive nguyên chất có vị tỏi và ớt', 430000, 'Dining', 'Linguine with clams, garlic, chili and extra virgin olive oil', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('LINGUINE ALLE VONGOLE', 430000, 'Dining', 'Linguine with clams, garlic, chili and extra virgin olive oil', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('링귀네 알레 봉골레', 430000, 'Dining', 'Linguine with 조개, 마늘, 고추 and 엑스트라 버진 올리브 오일', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('リングイネ・アッレ・ボンゴレ', 430000, 'Dining', 'Linguine with アサリ, ニンニク, チリ and エクストラバージンオリーブオイル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('蛤蜊扁面', 430000, 'Dining', 'Linguine with 蛤蜊, 大蒜, 辣椒 and 特级初榨橄榄油', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Linguines aux Palourdes', 430000, 'Dining', 'Linguine with palourdes, ail, piment and huile d''olive extra vierge', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Лингвини с Моллюсками', 430000, 'Dining', 'Linguine with моллюски, чеснок, чили and оливковое масло экстра вирджин', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Mì Quảng gà', 230000, 'Dining', 'Turmeric rice noodles with chicken, green chili, lime, garden herbs and sesame crackers', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MI QUANG" NOODLE SOUP', 230000, 'Dining', 'Turmeric rice noodles with chicken, green chili, lime, garden herbs and sesame crackers', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('미 쿠앙', 230000, 'Dining', '강황 쌀국수 with chicken, green 고추, 라임, 정원 허브 and 참깨 크래커', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ミー・クアン', 230000, 'Dining', 'ターメリックライスヌードル with chicken, green チリ, ライム, ガーデンハーブ and ごまクラッカー', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('广面', 230000, 'Dining', '姜黄米粉 with chicken, green 辣椒, 酸橙, 花园香草 and 芝麻饼干', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Mi Quang', 230000, 'Dining', 'nouilles de riz au curcuma with chicken, green piment, citron vert, herbes du jardin and crackers au sésame', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Ми Куанг', 230000, 'Dining', 'рисовые лапша с куркумой with chicken, green чили, лайм, садовые травы and крекеры с кунжутом', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Cơm chiên hải sản', 380000, 'Dining', 'With fish, squid, prawns, diced carrots, green peas, onion, corn and egg', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FRIED RICE WITH SEAFOOD', 380000, 'Dining', 'With fish, squid, prawns, diced carrots, green peas, onion, corn and egg', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('해산물 볶음밥', 380000, 'Dining', 'With 생선, 오징어, 새우, 깍둑 썬 당근, 완두콩, onion, 옥수수 and 계란', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('シーフードチャーハン', 380000, 'Dining', 'With 魚, イカ, エビ, 角切りニンジン, グリーンピース, onion, コーン and 卵', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('海鲜炒饭', 380000, 'Dining', 'With 鱼, 鱿鱼, 虾, 胡萝卜丁, 青豆, onion, 玉米 and 鸡蛋', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Riz Frit aux Fruits de Mer', 380000, 'Dining', 'With poisson, calmar, crevettes, carottes en dés, petits pois, onion, maïs and œuf', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Жареный Рис с Морепродуктами', 380000, 'Dining', 'With рыба, кальмар, креветки, морковь кубиками, зеленый горошек, onion, кукуруза and яйцо', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Xốt cà chua phô mai Mozzarella và húng quế', 300000, 'Dining', 'Tomato sauce, Mozzarella cheese and basil', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PIZZA MARGHERITA FURAMA', 300000, 'Dining', 'Tomato sauce, Mozzarella cheese and basil', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('피자 마르게리타', 300000, 'Dining', 'Tomato sauce, 모짜렐라 cheese and 바질', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ピザ・マルゲリータ', 300000, 'Dining', 'Tomato sauce, モッツァレラ cheese and バジル', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('玛格丽特披萨', 300000, 'Dining', 'Tomato sauce, 马苏里拉 cheese and 罗勒', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pizza Margherita', 300000, 'Dining', 'Tomato sauce, Mozzarella cheese and basilic', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Пицца Маргарита', 300000, 'Dining', 'Tomato sauce, Моцарелла cheese and базилик', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Xốt cà chua phô mai Mozzarella giăm bông Parma và nấm', 420000, 'Dining', 'Tomato sauce, Mozzarella cheese, cooked Parma ham and mushrooms', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PIZZA PROSCIUTTO E FUNGHI', 420000, 'Dining', 'Tomato sauce, Mozzarella cheese, cooked Parma ham and mushrooms', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('피자 프로슈토 에 펀기', 420000, 'Dining', 'Tomato sauce, 모짜렐라 cheese, 익힌 파르마 햄 and 버섯', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ピザ・プロシュート・エ・フンギ', 420000, 'Dining', 'Tomato sauce, モッツァレラ cheese, 調理済みパルマハム and キノコ', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('帕尔马火腿蘑菇披萨', 420000, 'Dining', 'Tomato sauce, 马苏里拉 cheese, 熟帕尔马火腿 and 蘑菇', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pizza Prosciutto e Funghi', 420000, 'Dining', 'Tomato sauce, Mozzarella cheese, jambon de Parme cuit and champignons', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Пицца Прошутто и Фунги', 420000, 'Dining', 'Tomato sauce, Моцарелла cheese, приготовленная пармская ветчина and грибы', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Phô mai Mozzarella phô mai Gorgonzola phô mai Taleggio và phô mai Parmesan', 370000, 'Dining', 'Mozzarella, Gorgonzola, Taleggio and Parmesan cheese', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PIZZA QUATTRO FORMAGGI', 370000, 'Dining', 'Mozzarella, Gorgonzola, Taleggio and Parmesan cheese', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('피자 콰트로 포르마지', 370000, 'Dining', '모짜렐라, 고르곤졸라, Tal계란io and 파르메산 치즈', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ピザ・クアットロ・フォルマッジ', 370000, 'Dining', 'モッツァレラ, ゴルゴンゾーラ, Tal卵io and パルメザンチーズ', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('四芝士披萨', 370000, 'Dining', '马苏里拉, 戈贡佐拉, Tal鸡蛋io and 帕尔马干酪', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pizza Quattro Formaggi', 370000, 'Dining', 'Mozzarella, Gorgonzola, Talœufio and fromage Parmesan', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Пицца Четыре Сыра', 370000, 'Dining', 'Моцарелла, Горгонзола, Talяйцоio and сыр Пармезан', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Xốt cà chua phô mai Mozzarella dứa và giăm bông', 330000, 'Dining', 'Tomato sauce, Mozzarella cheese, pineapple and ham', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('HAWAIIAN PIZZA', 330000, 'Dining', 'Tomato sauce, Mozzarella cheese, pineapple and ham', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('하와이안 피자', 330000, 'Dining', 'Tomato sauce, 모짜렐라 cheese, 파인애플 and ham', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ハワイアンピザ', 330000, 'Dining', 'Tomato sauce, モッツァレラ cheese, パイナップル and ham', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('夏威夷披萨', 330000, 'Dining', 'Tomato sauce, 马苏里拉 cheese, 菠萝 and ham', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pizza Hawaïenne', 330000, 'Dining', 'Tomato sauce, Mozzarella cheese, ananas and ham', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Гавайская Пицца', 330000, 'Dining', 'Tomato sauce, Моцарелла cheese, ананас and ham', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Xốt cà chua phô mai Mozzarella bông a ti sô giăm bông Parma và ô liu đen', 370000, 'Dining', 'Tomato sauce, Mozzarella cheese, artichoke, Parma ham, and black olives', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PIZZA CAPRICCIOSA', 370000, 'Dining', 'Tomato sauce, Mozzarella cheese, artichoke, Parma ham, and black olives', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('피자 카프리치오사', 370000, 'Dining', 'Tomato sauce, 모짜렐라 cheese, 아티초크, Parma ham, and 검은 올리브', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ピザ・カプリチョーザ', 370000, 'Dining', 'Tomato sauce, モッツァレラ cheese, アーティチョーク, Parma ham, and 黒オリーブ', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('卡普里乔萨披萨', 370000, 'Dining', 'Tomato sauce, 马苏里拉 cheese, 朝鲜蓟, Parma ham, and 黑橄榄', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pizza Capricciosa', 370000, 'Dining', 'Tomato sauce, Mozzarella cheese, artichaut, Parma ham, and olives noires', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Пицца Каприччоза', 370000, 'Dining', 'Tomato sauce, Моцарелла cheese, артишок, Parma ham, and черные оливки', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Xốt cà chua phô mai Mozzarella xúc xích các loại thịt xông khói và ớt đó', 370000, 'Dining', 'Tomato sauce, Mozzarella cheese, spicy salami, sausages, bacon and chili pepper', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MEAT LOVER PIZZA', 370000, 'Dining', 'Tomato sauce, Mozzarella cheese, spicy salami, sausages, bacon and chili pepper', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('미트 러버 피자', 370000, 'Dining', 'Tomato sauce, 모짜렐라 cheese, 매운 살라미, 소시지, bacon and 고추 pepper', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ミートラバーピザ', 370000, 'Dining', 'Tomato sauce, モッツァレラ cheese, スパイシーサラミ, ソーセージ, bacon and チリ pepper', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('肉食爱好者披萨', 370000, 'Dining', 'Tomato sauce, 马苏里拉 cheese, 辣萨拉米, 香肠, bacon and 辣椒 pepper', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pizza pour Amateurs de Viande', 370000, 'Dining', 'Tomato sauce, Mozzarella cheese, salami épicé, saucisses, bacon and piment pepper', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Пицца для Любителей Мяса', 370000, 'Dining', 'Tomato sauce, Моцарелла cheese, острая салями, колбасы, bacon and чили pepper', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Bánh que nhúng cà phê phú kem Mascarpone đánh bông và bột cacao', 270000, 'Dining', 'Lady finger biscuits, coffee, Mascarpone and cocoa', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TIRAMISU', 270000, 'Dining', 'Lady finger biscuits, coffee, Mascarpone and cocoa', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('티라미수', 270000, 'Dining', '레이디 핑거 비스킷, 커피, 마스카르포네 and 코코아', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ティラミス', 270000, 'Dining', 'レディフィンガービスケット, コーヒー, マスカルポーネ and ココア', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('提拉米苏', 270000, 'Dining', '手指饼干, 咖啡, 马斯卡彭 and 可可', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Tiramisu', 270000, 'Dining', 'biscuits doigts de dame, café, Mascarpone and cacao', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Тирамису', 270000, 'Dining', 'печенье леди пальчики, кофе, Маскарпоне and какао', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pizza nhân sô cô la Nutella vị hạt phỉ', 220000, 'Dining', 'Pizza with Nutella hazelnut chocolate paste', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PIZZA ALLA NUTELLA', 220000, 'Dining', 'Pizza with Nutella hazelnut chocolate paste', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('피자 알라 누텔라', 220000, 'Dining', 'Pizza with 누텔라 헤이즐넛 초콜릿 페이스트', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ピザ・アッラ・ヌテラ', 220000, 'Dining', 'Pizza with ヌテラヘーゼルナッツチョコレートペースト', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('能多益披萨', 220000, 'Dining', 'Pizza with 能多益榛子巧克力酱', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Pizza à la Nutella', 220000, 'Dining', 'Pizza with pâte de chocolat aux noisettes Nutella', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Пицца с Нутеллой', 220000, 'Dining', 'Pizza with шоколадная паста с лесными орехами Nutella', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Panna cotta với cam caramel', 270000, 'Dining', 'Panna cotta with caramelized orange', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PANNA COTTA ALLE ARANCE', 270000, 'Dining', 'Panna cotta with caramelized orange', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('판나 코타', 270000, 'Dining', 'Panna cotta with 캐러멜화된 오렌지', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('パンナコッタ', 270000, 'Dining', 'Panna cotta with キャラメリゼオレンジ', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('意式奶冻', 270000, 'Dining', 'Panna cotta with 焦糖橙', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Panna Cotta', 270000, 'Dining', 'Panna cotta with orange caramélisée', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Панна Котта', 270000, 'Dining', 'Panna cotta with карамелизированный апельсин', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Valdivieso Sauvignon Blanc Central Valley Chile', 958000, 'Dining', 'Fresh and crispy Sauvignon with clear notes of gooseberries and passion fruit. Lively wine with a pure finish', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO SAUVIGNON BLANC', 958000, 'Dining', 'Fresh and crispy Sauvignon with clear notes of gooseberries and passion fruit. Lively wine with a pure finish', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO SAUVIGNON BLANC', 958000, 'Dining', '신선하고 바삭한 소비뇽 with clear notes of 구스베리 and 패션프루트. 활기찬 와인 with a 순수한 마무리', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO SAUVIGNON BLANC', 958000, 'Dining', 'フレッシュでクリスピー ソーヴィニヨン with clear notes of グーズベリー and パッションフルーツ. 活気のあるワイン with a 純粋な仕上がり', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO SAUVIGNON BLANC', 958000, 'Dining', '新鲜脆爽 长相思 with clear notes of 醋栗 and 百香果. 活泼的葡萄酒 with a 纯净的收尾', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO SAUVIGNON BLANC', 958000, 'Dining', 'Frais et croustillant Sauvignon with clear notes of groseilles and fruit de la passion. Vin vif with a finition pure', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO SAUVIGNON BLANC', 958000, 'Dining', 'Свежий и хрустящий Совиньон with clear notes of крыжовник and маракуйя. Живое вино with a чистая отделка', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Vigneti Romio Romagna Trebbiano Italy', 958000, 'Dining', 'Elegantly fruity with floral notes, honeysuckle and lemon zest combining with a grassy hint on the nose. Good minerality and phenolics.', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA TREBBIANO', 958000, 'Dining', 'Elegantly fruity with floral notes, honeysuckle and lemon zest combining with a grassy hint on the nose. Good minerality and phenolics.', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA TREBBIANO', 958000, 'Dining', '우아하게 과일향 with 꽃 향, 인동덩굴 and 레몬 껍질 combining with a 풀 향 on the nose. 좋은 미네랄 and 페놀.', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA TREBBIANO', 958000, 'Dining', 'エレガントにフルーティー with 花の香り, スイカズラ and レモンの皮 combining with a 草の香り on the nose. 良いミネラル and フェノール.', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA TREBBIANO', 958000, 'Dining', '优雅果香 with 花香, 金银花 and 柠檬皮 combining with a 草香 on the nose. 良好的矿物质 and 酚类.', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA TREBBIANO', 958000, 'Dining', 'Élégamment fruité with notes florales, chèvrefeuille and zeste de citron combining with a note herbacée on the nose. Bonne minéralité and phénoliques.', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA TREBBIANO', 958000, 'Dining', 'Элегантно фруктовый with цветочные ноты, жимолость and цедра лимона combining with a травяной оттенок on the nose. Хорошая минеральность and фенольные.', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Valdivieso Cabernet Sauvignon Central Valley Chile', 958000, 'Dining', 'Medium to full bodied wine with rich berry fruit aromas, black current, vanilla and a touch of cocoa. Smooth finish.', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO CABERNET SAUVIGNON', 958000, 'Dining', 'Medium to full bodied wine with rich berry fruit aromas, black current, vanilla and a touch of cocoa. Smooth finish.', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO CABERNET SAUVIGNON', 958000, 'Dining', '중간에서 풀 바디 wine with 풍부한 베리 과일 향, 블랙 커런트, 바닐라 and a touch of 코코아. 부드러운 마무리.', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO CABERNET SAUVIGNON', 958000, 'Dining', 'ミディアムからフルボディ wine with 豊かなベリー果実の香り, ブラックカラント, バニラ and a touch of ココア. スムーズな仕上がり.', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO CABERNET SAUVIGNON', 958000, 'Dining', '中等至饱满 wine with 丰富的浆果香气, 黑加仑, 香草 and a touch of 可可. 顺滑的收尾.', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO CABERNET SAUVIGNON', 958000, 'Dining', 'Corps moyen à corsé wine with arômes riches de fruits rouges, cassis, vanille and a touch of cacao. Finition douce.', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VALDIVIESO CABERNET SAUVIGNON', 958000, 'Dining', 'Средне-полное тело wine with богатые ароматы ягодных фруктов, черная смородина, ваниль and a touch of какао. Плавная отделка.', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Vigneti Romio Romagna Sangiovese Superiore Riserva Italy', 958000, 'Dining', 'Deep crimson red. Ripe black cherries on the nose with a delicious hint of spice. With red berry flavours on the palate and fine tannins, this wine is well balanced with a long finish.', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA SANGIOVESE SUPERIORE RISERVA', 958000, 'Dining', 'Deep crimson red. Ripe black cherries on the nose with a delicious hint of spice. With red berry flavours on the palate and fine tannins, this wine is well balanced with a long finish.', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA SANGIOVESE SUPERIORE RISERVA', 958000, 'Dining', '깊은 진홍색. 익은 검은 체리 on the nose with a 맛있는 스파이스 향. With 빨간 베리 맛 on the palate and 미세한 탄닌, this wine is 잘 균형잡힌 with a 긴 여운.', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA SANGIOVESE SUPERIORE RISERVA', 958000, 'Dining', '深い深紅色. 熟した黒チェリー on the nose with a 美味しいスパイスの香り. With 赤いベリーの味 on the palate and 細かいタンニン, this wine is バランスの取れた with a 長い余韻.', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA SANGIOVESE SUPERIORE RISERVA', 958000, 'Dining', '深红色. 成熟的黑樱桃 on the nose with a 美味的香料味. With 红色浆果味 on the palate and 细腻的单宁, this wine is 平衡良好 with a 悠长的余韵.', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA SANGIOVESE SUPERIORE RISERVA', 958000, 'Dining', 'Rouge cramoisi profond. Cerises noires mûres on the nose with a délicieuse note d''épices. With saveurs de fruits rouges on the palate and tanins fins, this wine is bien équilibré with a longue finale.', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIGNETI ROMIO ROMAGNA SANGIOVESE SUPERIORE RISERVA', 958000, 'Dining', 'Глубокий малиновый красный. Спелые черные вишни on the nose with a вкусный оттенок специй. With вкусы красных ягод on the palate and тонкие танины, this wine is хорошо сбалансированный with a долгое послевкусие.', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Veuve Ambal Sparkling Brut Bourgogne France', 1078000, 'Dining', 'A delicate sparkling wine; fresh and fruity flavours combined with an elegant mouth feel and a clean, crispy finish.', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VEUVE AMBAL SPARKLING BRUT', 1078000, 'Dining', 'A delicate sparkling wine; fresh and fruity flavours combined with an elegant mouth feel and a clean, crispy finish.', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VEUVE AMBAL SPARKLING BRUT', 1078000, 'Dining', 'A 섬세한 스파클링 와인; 신선하고 과일향 combined with an 우아한 입안 느낌 and a 깨끗하고 바삭한 마무리.', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VEUVE AMBAL SPARKLING BRUT', 1078000, 'Dining', 'A 繊細なスパークリングワイン; フレッシュでフルーティーな味 combined with an エレガントな口当たり and a クリーンでクリスピーな仕上がり.', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VEUVE AMBAL SPARKLING BRUT', 1078000, 'Dining', 'A 精致的起泡酒; 新鲜果味 combined with an 优雅的口感 and a 干净脆爽的收尾.', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VEUVE AMBAL SPARKLING BRUT', 1078000, 'Dining', 'A vin pétillant délicat; saveurs fraîches et fruitées combined with an sensation en bouche élégante and a finition propre et croustillante.', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VEUVE AMBAL SPARKLING BRUT', 1078000, 'Dining', 'A нежное игристое вино; свежие и фруктовые вкусы combined with an элегантное ощущение во рту and a чистая, хрустящая отделка.', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Taittinger Brut Reserve Champagne', 3998000, 'Dining', 'A beautiful combination of freshness, elegance and richness. Fruity and lively with notes of peach, white flowers, vanilla and honey.', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TAITTINGER BRUT RESERVE', 3998000, 'Dining', 'A beautiful combination of freshness, elegance and richness. Fruity and lively with notes of peach, white flowers, vanilla and honey.', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TAITTINGER BRUT RESERVE', 3998000, 'Dining', 'A 아름다운 조합 of 신선함, 우아함 and 풍부함. Fruity and lively with notes of 복숭아, 흰 꽃, 바닐라 and 꿀.', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TAITTINGER BRUT RESERVE', 3998000, 'Dining', 'A 美しい組み合わせ of 新鮮さ, 優雅さ and 豊かさ. Fruity and lively with notes of 桃, 白い花, バニラ and 蜂蜜.', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TAITTINGER BRUT RESERVE', 3998000, 'Dining', 'A 美丽的组合 of 新鲜, 优雅 and 丰富. Fruity and lively with notes of 桃子, 白花, 香草 and 蜂蜜.', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TAITTINGER BRUT RESERVE', 3998000, 'Dining', 'A belle combinaison of fraîcheur, élégance and richesse. Fruity and lively with notes of pêche, fleurs blanches, vanille and miel.', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TAITTINGER BRUT RESERVE', 3998000, 'Dining', 'A красивое сочетание of свежесть, элегантность and богатство. Fruity and lively with notes of персик, белые цветы, ваниль and мед.', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Moet et Chandon Brut Imperial Champagne', 3998000, 'Dining', 'One of the most famous Champagnes in the world. A Champagne with a refined mousse and great depth', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MOET ET CHANDON BRUT IMPERIAL', 3998000, 'Dining', 'One of the most famous Champagnes in the world. A Champagne with a refined mousse and great depth', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MOET ET CHANDON BRUT IMPERIAL', 3998000, 'Dining', 'One of the 가장 유명한 샴페인 in the world. A Champagne with a 정제된 거품 and 큰 깊이', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MOET ET CHANDON BRUT IMPERIAL', 3998000, 'Dining', 'One of the 最も有名なシャンパン in the world. A Champagne with a 洗練されたムース and 大きな深み', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MOET ET CHANDON BRUT IMPERIAL', 3998000, 'Dining', 'One of the 最著名的香槟 in the world. A Champagne with a 精致的慕斯 and 深度', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MOET ET CHANDON BRUT IMPERIAL', 3998000, 'Dining', 'One of the Champagnes les plus célèbres in the world. A Champagne with a mousse raffinée and grande profondeur', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MOET ET CHANDON BRUT IMPERIAL', 3998000, 'Dining', 'One of the самые известные шампанские in the world. A Champagne with a изысканная пена and большая глубина', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Nước dưa hấu', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('WATERMELON JUICE', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('수박 주스', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('スイカジュース', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('西瓜汁', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Jus de Pastèque', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Арбузный Сок', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Nước cam', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ORANGE JUICE', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('오렌지 주스', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('オレンジジュース', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('橙汁', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Jus d''Orange', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Апельсиновый Сок', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Nước xoài', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('MANGO JUICE', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('망고 주스', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('マンゴージュース', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('芒果汁', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Jus de Mangue', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Сок Манго', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Nước dứa', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('PINEAPPLE JUICE', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('파인애플 주스', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('パイナップルジュース', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('菠萝汁', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Jus d''Ananas', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Ананасовый Сок', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Coca Cola', 78000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('COCA COLA', 78000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('코카콜라', 78000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('コカ・コーラ', 78000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('可口可乐', 78000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Coca-Cola', 78000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Кока-Кола', 78000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Coca Cola Light', 78000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('COCA COLA LIGHT', 78000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('코카콜라', 78000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('コカ・コーラ', 78000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('可口可乐', 78000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Coca-Cola', 78000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Кока-Кола', 78000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Tonic Schweppes', 78000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TONIC SCHWEPPES', 78000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TONIC SCHWEPPES', 78000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TONIC SCHWEPPES', 78000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TONIC SCHWEPPES', 78000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TONIC SCHWEPPES', 78000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('TONIC SCHWEPPES', 78000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Soda Schweppes', 78000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SODA SCHWEPPES', 78000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SODA SCHWEPPES', 78000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SODA SCHWEPPES', 78000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SODA SCHWEPPES', 78000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SODA SCHWEPPES', 78000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SODA SCHWEPPES', 78000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Sprite', 78000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SPRITE', 78000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SPRITE', 78000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SPRITE', 78000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SPRITE', 78000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SPRITE', 78000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SPRITE', 78000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Fanta', 78000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FANTA', 78000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FANTA', 78000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FANTA', 78000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FANTA', 78000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FANTA', 78000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('FANTA', 78000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Acqua Panna', 138000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ACQUA PANNA', 138000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ACQUA PANNA', 138000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ACQUA PANNA', 138000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ACQUA PANNA', 138000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ACQUA PANNA', 138000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ACQUA PANNA', 138000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('San Pellegrino', 138000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SAN PELLEGRINO', 138000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SAN PELLEGRINO', 138000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SAN PELLEGRINO', 138000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SAN PELLEGRINO', 138000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SAN PELLEGRINO', 138000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('SAN PELLEGRINO', 138000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Cà phê đen Việt Nam', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIETNAMESE BLACK COFFEE', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('베트남 블랙 커피', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ベトナムブラックコーヒー', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('越南黑咖啡', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Café Noir Vietnamien', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Вьетнамский Черный Кофе', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Cà phê sữa Việt Nam', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('VIETNAMESE MILK COFFEE', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('베트남 밀크 커피', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ベトナムミルクコーヒー', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('越南牛奶咖啡', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Café au Lait Vietnamien', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Вьетнамский Кофе с Молоком', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Cà phê không cafein', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('DECAFFEINATED COFFEE', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('디카페인 커피', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('デカフェコーヒー', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('无咖啡因咖啡', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Café Décaféiné', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Кофе без Кофеина', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Americano', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('AMERICANO', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('아메리카노', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('アメリカーノ', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('美式咖啡', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Américano', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Американо', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Espresso', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ESPRESSO', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('에스프레소', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('エスプレッソ', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('意式浓缩咖啡', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Expresso', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Эспрессо', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Cappuccino', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('CAPPUCCINO', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('카푸치노', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('カプチーノ', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('卡布奇诺', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Cappuccino', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Капучино', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Latte', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('LATTE', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('라떼', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ラテ', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('拿铁', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Latte', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Латте', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Larue/ Tiger', 98000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('LARUE/TIGER', 98000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('LARUE/TIGER', 98000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('LARUE/TIGER', 98000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('LARUE/TIGER', 98000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('LARUE/TIGER', 98000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('LARUE/TIGER', 98000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Heineken', 108000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('HEINEKEN', 108000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('HEINEKEN', 108000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('HEINEKEN', 108000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('HEINEKEN', 108000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('HEINEKEN', 108000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('HEINEKEN', 108000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Corona', 198000, 'Dining', NULL, 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('CORONA', 198000, 'Dining', NULL, 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('CORONA', 198000, 'Dining', NULL, 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('CORONA', 198000, 'Dining', NULL, 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('CORONA', 198000, 'Dining', NULL, 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('CORONA', 198000, 'Dining', NULL, 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('CORONA', 198000, 'Dining', NULL, 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Gói Diamond - Bao gồm thức ăn 01 chai rượu Champagne cho 2 người và thỏa thích uống các loại bia và nước ngọt không giới hạn trong 2 giờ đồng hồ', 5040000, 'Dining', 'Luxury BBQ dinner menu, a bottle of Champagne for two and 2-hour free flow of beer and soft drinks', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('DIAMOND PACKAGE', 5040000, 'Dining', 'Luxury BBQ dinner menu, a bottle of Champagne for two and 2-hour free flow of beer and soft drinks', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('다이아몬드 패키지', 5040000, 'Dining', '럭셔리 바베큐 저녁 메뉴, a 샴페인 한 병 for two and 2시간 무제한 of 맥주와 탄산음료', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ダイヤモンドパッケージ', 5040000, 'Dining', 'ラグジュアリーバーベキュー夕食メニュー, a シャンパン1本 for two and 2時間無制限 of ビールとソフトドリンク', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('钻石套餐', 5040000, 'Dining', '豪华烧烤晚餐菜单, a 香槟一瓶 for two and 2小时无限畅饮 of 啤酒和软饮料', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Forfait Diamant', 5040000, 'Dining', 'Menu dîner BBQ de luxe, a bouteille de Champagne for two and consommation illimitée de 2 heures of bière et boissons non alcoolisées', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Алмазный Пакет', 5040000, 'Dining', 'Меню ужина BBQ класса люкс, a бутылка шампанского for two and неограниченное потребление на 2 часа of пиво и безалкогольные напитки', 'Russian');

INSERT INTO menu_items (name, price, category, description, language) VALUES ('Gói Ruby - Bao gồm thức ăn và thỏa thích uống các loại bia và nước ngọt không giới hạn trong 2 giờ đồng hồ', 3360000, 'Dining', 'BBQ dinner menu and 2-hour free flow of beer and soft drinks', 'Vietnamese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('RUBY PACKAGE', 3360000, 'Dining', 'BBQ dinner menu and 2-hour free flow of beer and soft drinks', 'English');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('루비 패키지', 3360000, 'Dining', 'BBQ dinner menu and 2시간 무제한 of 맥주와 탄산음료', 'Korean');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('ルビーパッケージ', 3360000, 'Dining', 'BBQ dinner menu and 2時間無制限 of ビールとソフトドリンク', 'Japanese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('红宝石套餐', 3360000, 'Dining', 'BBQ dinner menu and 2小时无限畅饮 of 啤酒和软饮料', 'Chinese');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Forfait Rubis', 3360000, 'Dining', 'BBQ dinner menu and consommation illimitée de 2 heures of bière et boissons non alcoolisées', 'French');
INSERT INTO menu_items (name, price, category, description, language) VALUES ('Рубиновый Пакет', 3360000, 'Dining', 'BBQ dinner menu and неограниченное потребление на 2 часа of пиво и безалкогольные напитки', 'Russian');

COMMIT;