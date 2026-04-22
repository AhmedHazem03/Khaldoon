-- ============================================================
-- Khaldoun Restaurant — Menu Seed Data
-- Run ONCE in the Supabase SQL Editor after schema.sql
-- ============================================================

DO $$
DECLARE
  -- Category IDs
  v_cat_shawarma      uuid;
  v_cat_grilled       uuid;
  v_cat_charcoal      uuid;
  v_cat_western_sand  uuid;
  v_cat_western_meals uuid;
  v_cat_rice          uuid;
  v_cat_cheetos       uuid;
  v_cat_broasted      uuid;
  v_cat_kids          uuid;
  v_cat_sides         uuid;
  v_cat_extras        uuid;
  v_cat_kunafa        uuid;

  -- Reusable product ID
  v_p uuid;

BEGIN

  -- ============================================================
  -- CATEGORIES
  -- ============================================================

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('قسم الشاورما', '🥙', 1, true) RETURNING id INTO v_cat_shawarma;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('قسم الشواية', '🍗', 2, true) RETURNING id INTO v_cat_grilled;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('قسم الفحم', '🔥', 3, true) RETURNING id INTO v_cat_charcoal;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('ساندوتشات سوري', '🥪', 4, true) RETURNING id INTO v_cat_western_sand;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('وجبات الغربي', '🍽️', 5, true) RETURNING id INTO v_cat_western_meals;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('رز خلدون', '🍚', 6, true) RETURNING id INTO v_cat_rice;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('بروستد شيتوس', '🍗', 7, true) RETURNING id INTO v_cat_cheetos;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('البروستد العادي', '🍗', 8, true) RETURNING id INTO v_cat_broasted;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('وجبات أطفال', '🧒', 9, true) RETURNING id INTO v_cat_kids;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('المقبلات', '🥗', 10, true) RETURNING id INTO v_cat_sides;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('الإضافات', '➕', 11, true) RETURNING id INTO v_cat_extras;

  INSERT INTO categories (name, icon, order_index, is_visible)
    VALUES ('كنافة نابلسية', '🍮', 12, true) RETURNING id INTO v_cat_kunafa;


  -- ============================================================
  -- قسم الشاورما  (variants: فراخ / لحمة / مكس)
  -- ============================================================

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'ساندوتش شاورما وسط', 1, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ',  75, true, 1),
    (v_p, 'لحمة',  90, true, 2),
    (v_p, 'مكس',   80, true, 3);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'ساندوتش شاورما كبير', 2, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ',  85, true, 1),
    (v_p, 'لحمة', 100, true, 2),
    (v_p, 'مكس',   95, true, 3);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'ساندوتش شاورما صاروخ', 3, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 110, true, 1),
    (v_p, 'لحمة', 120, true, 2),
    (v_p, 'مكس',  115, true, 3);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'شاورما عربي سنجل', 4, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 115, true, 1),
    (v_p, 'لحمة', 135, true, 2),
    (v_p, 'مكس',  125, true, 3);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'شاورما عربي دبل', 5, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 190, true, 1),
    (v_p, 'لحمة', 225, true, 2),
    (v_p, 'مكس',  210, true, 3);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'شاورما عربي عائلي', 6, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 340, true, 1),
    (v_p, 'لحمة', 390, true, 2),
    (v_p, 'مكس',  370, true, 3);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'شاورما ماريا', 7, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 125, true, 1),
    (v_p, 'لحمة', 140, true, 2),
    (v_p, 'مكس',  135, true, 3);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'فتة شاورما صغير', 8, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 110, true, 1),
    (v_p, 'لحمة', 135, true, 2),
    (v_p, 'مكس',  125, true, 3);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'فتة شاورما كبير', 9, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 140, true, 1),
    (v_p, 'لحمة', 160, true, 2),
    (v_p, 'مكس',  150, true, 3);

  -- شمروخ و ريختر — فراخ/لحمة فقط (لا يوجد مكس)
  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'شمروخ', 10, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 130, true, 1),
    (v_p, 'لحمة', 170, true, 2);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'ريختر', 11, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 140, true, 1),
    (v_p, 'لحمة', 180, true, 2);

  -- وجبات الشاورما بالوزن — فراخ/لحمة فقط
  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'وجبة شاورما 250 جرام', 12, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 190, true, 1),
    (v_p, 'لحمة', 225, true, 2);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'وجبة شاورما 500 جرام', 13, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 350, true, 1),
    (v_p, 'لحمة', 395, true, 2);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_shawarma, 'وجبة شاورما 1000 جرام', 14, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'فراخ', 680, true, 1),
    (v_p, 'لحمة', 790, true, 2);


  -- ============================================================
  -- قسم الشواية  (سعر واحد لكل صنف)
  -- ============================================================

  INSERT INTO products (category_id, name, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_grilled, 'دجاجة شواية كاملة',      370, 1, true, 'add_to_cart'),
    (v_cat_grilled, 'نصف دجاجة شواية',         195, 2, true, 'add_to_cart'),
    (v_cat_grilled, 'ربع دجاجة ورك شواية',     115, 3, true, 'add_to_cart'),
    (v_cat_grilled, 'ربع دجاجة صدر شواية',     130, 4, true, 'add_to_cart'),
    (v_cat_grilled, 'دبل ورك دجاج شواية',      185, 5, true, 'add_to_cart'),
    (v_cat_grilled, 'دجاج شواية ساده',         330, 6, true, 'add_to_cart'),
    (v_cat_grilled, 'نصف دجاج شواية ساده',     180, 7, true, 'add_to_cart');


  -- ============================================================
  -- قسم الفحم  (سعر واحد لكل صنف)
  -- ============================================================

  INSERT INTO products (category_id, name, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_charcoal, 'فرخة مسحب فحم مخلية',       390, 1, true, 'add_to_cart'),
    (v_cat_charcoal, 'نص فرخة مسحب فحم مخلية',    210, 2, true, 'add_to_cart'),
    (v_cat_charcoal, 'وجبة كفتة لحمة فحم',        190, 3, true, 'add_to_cart'),
    (v_cat_charcoal, 'وجبة شيش طاووق فحم',        180, 4, true, 'add_to_cart'),
    (v_cat_charcoal, 'وجبة كفتة فراخ فحم',        180, 5, true, 'add_to_cart'),
    (v_cat_charcoal, 'ساندوتش كفتة فحم',          120, 6, true, 'add_to_cart'),
    (v_cat_charcoal, 'ساندوتش شيش طاووق فحم',     110, 7, true, 'add_to_cart'),
    (v_cat_charcoal, 'ساندوتش كفتة فراخ فحم',     110, 8, true, 'add_to_cart');


  -- ============================================================
  -- ساندوتشات سوري  (سعر واحد لكل صنف)
  -- ============================================================

  INSERT INTO products (category_id, name, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_western_sand, 'كرسبي',                    100,  1, true, 'add_to_cart'),
    (v_cat_western_sand, 'زنجر',                     100,  2, true, 'add_to_cart'),
    (v_cat_western_sand, 'اسكالوب بانيه',            100,  3, true, 'add_to_cart'),
    (v_cat_western_sand, 'سوبريم',                   110,  4, true, 'add_to_cart'),
    (v_cat_western_sand, 'فاهيتا دجاج',              110,  5, true, 'add_to_cart'),
    (v_cat_western_sand, 'مكسيكانو',                 110,  6, true, 'add_to_cart'),
    (v_cat_western_sand, 'شيش طاووق',                110,  7, true, 'add_to_cart'),
    (v_cat_western_sand, 'شمروخ كرسبي',              135,  8, true, 'add_to_cart'),
    (v_cat_western_sand, 'ماريا كرسبي',              150,  9, true, 'add_to_cart'),
    (v_cat_western_sand, 'بطاطس مكس جبن',             55, 10, true, 'add_to_cart'),
    (v_cat_western_sand, 'بطاطس',                     40, 11, true, 'add_to_cart'),
    (v_cat_western_sand, 'بطاطس موتزاريلا / شيدر',   45, 12, true, 'add_to_cart'),
    (v_cat_western_sand, 'بطاطس صيامي',               35, 13, true, 'add_to_cart');


  -- ============================================================
  -- وجبات الغربي  (سعر موحد 170 ج.م)
  -- ============================================================

  INSERT INTO products (category_id, name, description, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_western_meals, 'وجبة كرسبي',
     'قطع دجاج مقرمش',                                   170, 1, true, 'add_to_cart'),
    (v_cat_western_meals, 'وجبة زنجر',
     'قطع الدجاج المقرمش الحار',                          170, 2, true, 'add_to_cart'),
    (v_cat_western_meals, 'وجبة اسكالوب بانيه',
     'قطع دجاج البانيه',                                  170, 3, true, 'add_to_cart'),
    (v_cat_western_meals, 'وجبة سوبريم',
     'قطع دجاج رول محشو موتزاريلا',                       170, 4, true, 'add_to_cart'),
    (v_cat_western_meals, 'وجبة فاهيتا دجاج',
     'قطع دجاج بصوص الفاهيتا مع الفلفل الألوان',          170, 5, true, 'add_to_cart'),
    (v_cat_western_meals, 'وجبة مكسيكانو',
     'قطع دجاج بالصوص الحار',                             170, 6, true, 'add_to_cart'),
    (v_cat_western_meals, 'وجبة شيش طاووق',
     'قطع دجاج شيش طاووق',                                170, 7, true, 'add_to_cart');


  -- ============================================================
  -- رز خلدون  (سعر موحد 110 ج.م)
  -- ============================================================

  INSERT INTO products (category_id, name, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_rice, 'ارز كرسبي',        110, 1, true, 'add_to_cart'),
    (v_cat_rice, 'ارز زنجر',         110, 2, true, 'add_to_cart'),
    (v_cat_rice, 'ارز شيش طاووق',    110, 3, true, 'add_to_cart'),
    (v_cat_rice, 'ارز فاهيتا دجاج',  110, 4, true, 'add_to_cart'),
    (v_cat_rice, 'ارز مكسيكانو',     110, 5, true, 'add_to_cart');


  -- ============================================================
  -- بروستد شيتوس
  -- ============================================================

  INSERT INTO products (category_id, name, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_cheetos, 'فرخة شيتوس',               440, 1, true, 'add_to_cart'),
    (v_cat_cheetos, 'نص فرخة شيتوس',            235, 2, true, 'add_to_cart'),
    (v_cat_cheetos, 'ربع فرخة شيتوس صدر',       145, 3, true, 'add_to_cart'),
    (v_cat_cheetos, 'ربع فرخة شيتوس ورك',       130, 4, true, 'add_to_cart');


  -- ============================================================
  -- البروستد العادي
  -- ============================================================

  INSERT INTO products (category_id, name, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_broasted, 'ربع ورك بروست',   130, 1, true, 'add_to_cart'),
    (v_cat_broasted, 'ربع صدر بروست',   145, 2, true, 'add_to_cart'),
    (v_cat_broasted, 'نص فرخة بروست',   235, 3, true, 'add_to_cart'),
    (v_cat_broasted, 'فرخة بروست',      440, 4, true, 'add_to_cart');


  -- ============================================================
  -- وجبات أطفال خلدون  (سعر موحد 95 ج.م)
  -- ============================================================

  INSERT INTO products (category_id, name, description, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_kids, 'وجبة كرسبي أطفال',
     '2 قطعة كرسبي + أرز بسمتي + بطاطس + تومية + كاتشب',         95, 1, true, 'add_to_cart'),
    (v_cat_kids, 'وجبة شيش طاووق أطفال',
     '1 سيخ شيش طاووق + أرز بسمتي + بطاطس + تومية + كاتشب',       95, 2, true, 'add_to_cart');


  -- ============================================================
  -- المقبلات  (بعضها صغير/كبير، بعضها سعر واحد)
  -- ============================================================

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_sides, 'تومية', 1, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'صغير', 25, true, 1),
    (v_p, 'كبير', 50, true, 2);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_sides, 'تومية سبايسي', 2, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'صغير', 25, true, 1),
    (v_p, 'كبير', 50, true, 2);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_sides, 'طحينة', 3, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'صغير', 35, true, 1),
    (v_p, 'كبير', 50, true, 2);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_sides, 'كولسلو', 4, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'صغير', 35, true, 1),
    (v_p, 'كبير', 55, true, 2);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_sides, 'فتوش', 5, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'صغير', 35, true, 1),
    (v_p, 'كبير', 75, true, 2);

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_sides, 'تبولة', 6, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'صغير', 25, true, 1),
    (v_p, 'كبير', 55, true, 2);

  -- مقبلات بسعر واحد
  INSERT INTO products (category_id, name, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_sides, 'مخلل',       15,  7, true, 'add_to_cart'),
    (v_cat_sides, 'أرز بسمتي',  40,  8, true, 'add_to_cart'),
    (v_cat_sides, 'بطاطس',      30,  9, true, 'add_to_cart'),
    (v_cat_sides, 'عيش',         5, 10, true, 'add_to_cart');


  -- ============================================================
  -- الإضافات  (سعر موحد 20 ج.م)
  -- ============================================================

  INSERT INTO products (category_id, name, base_price, order_index, is_available, cta_type)
  VALUES
    (v_cat_extras, 'قطعة كرسبي',    20,  1, true, 'add_to_cart'),
    (v_cat_extras, 'قطعة زنجر',     20,  2, true, 'add_to_cart'),
    (v_cat_extras, 'قطعة اسكالوب',  20,  3, true, 'add_to_cart'),
    (v_cat_extras, 'سيخ شيش',       20,  4, true, 'add_to_cart'),
    (v_cat_extras, 'سيخ كفتة',      20,  5, true, 'add_to_cart'),
    (v_cat_extras, 'قطعة سوبريم',   20,  6, true, 'add_to_cart'),
    (v_cat_extras, 'موتزاريلا',     20,  7, true, 'add_to_cart'),
    (v_cat_extras, 'شيدر',          20,  8, true, 'add_to_cart'),
    (v_cat_extras, 'بطاطس',         20,  9, true, 'add_to_cart'),
    (v_cat_extras, 'محمره',         20, 10, true, 'add_to_cart');


  -- ============================================================
  -- كنافة نابلسية  (variants: صغير / كبير)
  -- ============================================================

  INSERT INTO products (category_id, name, order_index, is_available, cta_type)
    VALUES (v_cat_kunafa, 'كنافة نابلسية ساده', 1, true, 'add_to_cart') RETURNING id INTO v_p;
  INSERT INTO product_variants (product_id, variant_name, price, is_available, order_index) VALUES
    (v_p, 'صغير',  70, true, 1),
    (v_p, 'كبير', 100, true, 2);

END $$;
