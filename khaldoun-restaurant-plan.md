# 🍗 خطة موقع مطعم خلدون — النسخة النهائية الشاملة v4.0

> **الشعار:** أصل السوري هون
> **العنوان:** شارع مستشفى الهلال بجوار كبده الفلاح
> **أرقام التواصل:** 01064414303 | 01120301003 | 01228889102
> **نظام العمل:** توصيل + استلام
> **الدفع:** كاش عند الاستلام فقط
> **اللغة:** عربي فقط (RTL)

---

## 1. أهداف المشروع

| الهدف | التفاصيل |
|---|---|
| 🖥️ رقمنة المنيو | عرض ديناميكي للأصناف مع إمكانية تحديث الأسعار لحظياً من لوحة الإدارة |
| 📲 تحويل الطلبات | إرسال الطلب تلقائياً عبر WhatsApp لرقم المطعم |
| ⚙️ لوحة إدارة كاملة | تحكم كامل في المنيو، المناطق، الأسعار، السوشيال ميديا، الطلبات، الإحصائيات |
| 🎯 نظام نقاط | ولاء العملاء — كسب نقاط على كل طلب + استخدامها كخصم جزئي |
| 📢 ربط السوشيال ميديا | روابط مباشرة لواتساب، فيسبوك، انستجرام، تيك توك |
| 📦 أرشفة الطلبات | حفظ كل الطلبات في قاعدة البيانات مع إحصائيات كاملة |

---

## 2. البنية التقنية (Tech Stack)

> أحدث الإصدارات المستقرة — أبريل 2026

| المكون | التقنية | الإصدار | السبب |
|---|---|---|---|
| Framework | Next.js | 15 (App Router + Turbopack) | أداء عالي، SSR، SEO ممتاز |
| Language | TypeScript | 5.x | type safety كاملة |
| Styling | Tailwind CSS | v4 | RTL built-in، تصميم سريع |
| Backend & Auth | Supabase | Latest | PostgreSQL + Storage + Auth |
| State Management | Zustand | v5 | إدارة Cart والجلسة |
| Forms & Validation | React Hook Form + Zod | Latest | validation قوي |
| Hosting | Vercel | Latest | سرعة عالية في مصر |
| WhatsApp | wa.me API | — | مجاني، بدون API key |

---

## 3. هيكل قاعدة البيانات (Supabase Schema)

### العلاقات العامة

```
categories → products → product_variants
                     ↓
auth.users ←→ users  → orders → order_items
                          ↓
                     point_transactions
guest orders: user_id = NULL (لا يُنشأ user record للـ guest)
offers               (جدول مستقل)
settings             (key-value store)
delivery_zones
```

---

### جدول `categories` — أقسام المنيو

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
name         text NOT NULL        -- اسم القسم بالعربي
icon         text                 -- إيموجي أو رمز
order_index  integer DEFAULT 0    -- ترتيب الظهور
is_visible   boolean DEFAULT true -- إخفاء/إظهار القسم
created_at   timestamp DEFAULT now()
```

---

### جدول `products` — الأصناف

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
category_id   uuid REFERENCES categories(id) ON DELETE CASCADE
name          text NOT NULL
description   text
base_price    integer          -- سعر الصنف لو مفيش متغيرات (مثل: تومية 25، مخلل 15)
image_url     text
is_available  boolean DEFAULT true
cta_type      text DEFAULT 'add_to_cart'  -- 'add_to_cart' | 'whatsapp_inquiry'
order_index   integer DEFAULT 0
created_at    timestamp DEFAULT now()
```

> **منطق base_price vs variants:** لو `product_variants` موجودة للصنف → استخدمها وتجاهل `base_price`. لو مفيش → استخدم `base_price` مباشرة. أصناف زي "تومية" و"مخلل" لا تحتاج variants.
> **cta_type:** الأصناف التي تحتاج استفسار (مثل تورتة الشاورما) → `cta_type = 'whatsapp_inquiry'` تعرض زر "تواصل للاستفسار" بدل "أضف للسلة".

---

### جدول `product_variants` — المتغيرات (فراخ/لحمة/مكس/أحجام)

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
product_id    uuid REFERENCES products(id) ON DELETE CASCADE
variant_name  text NOT NULL   -- "فراخ" | "لحمة" | "مكس" | "وسط" | "كبير" إلخ
price         integer NOT NULL -- بالجنيه المصري
is_available  boolean DEFAULT true
order_index   integer DEFAULT 0
```

---

### جدول `users` — العملاء

```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
auth_id          uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE  -- ربط حتمي مع Supabase Auth
phone_number     text UNIQUE NOT NULL
name             text
default_address  text        -- العنوان الافتراضي للتوصيل
points_balance   integer DEFAULT 0
created_at       timestamp DEFAULT now()
```

> **ملاحظة — Phone Auth:** Supabase Phone Auth يتطلب OTP + SMS provider. الحل: **Email Auth** مع البريد الوهمي `{phone}@khaldoun.local`. مثال: `01064414303@khaldoun.local`. الرقم الحقيقي يُحفظ في `raw_user_meta_data: { phone_number: "01064414303" }`. لا OTP، لا SMS، تسجيل فوري.
> - بدون reset password — العميل يتواصل مع المطعم يدوياً لإعادة التعيين
> **الأدمن:** يُضاف في Supabase عبر `app_metadata: { role: 'admin' }` + Row Level Security
> **🔒 مهم — Trigger تلقائي:** عند إنشاء حساب جديد في `auth.users`، الـ trigger يملأ `public.users` تلقائياً بالـ `auth_id` — بدونه لن تعرف الكود مين المستخدم المسجّل:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, phone_number, name)
  VALUES (
    NEW.id,
    -- NEW.phone يكون NULL مع Email Auth — الرقم مُخزَّن في raw_user_meta_data
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### جدول `orders` — الطلبات

```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_code        text UNIQUE NOT NULL  -- رقم طلب بشري مثل "KH-1042" — يُولَّد بـ trigger تلقائياً
user_id           uuid REFERENCES users(id) -- null للطلبات الـ guest
customer_name     text NOT NULL    -- snapshot مستقل عن الحساب
customer_phone    text NOT NULL
delivery_address  text             -- null لو استلام
order_type        text NOT NULL    -- "delivery" | "pickup"
zone_id           uuid REFERENCES delivery_zones(id)  -- مطلوب للتوصيل (CHECK constraint بالأسفل)
notes             text             -- ملاحظات العميل
status            text DEFAULT 'pending'  -- pending | confirmed | delivered | cancelled
subtotal          integer NOT NULL
delivery_fee      integer DEFAULT 0
discount_amount   integer DEFAULT 0  -- خصم النقاط
total_price       integer NOT NULL
points_used       integer DEFAULT 0
points_earned     integer DEFAULT 0
points_status     text DEFAULT 'pending'  -- 'pending' | 'confirmed' — النقاط تُضاف للرصيد فقط عند confirmed
whatsapp_opened   boolean DEFAULT false   -- فتح الواتساب، مش تأكيد الإرسال (wa.me بيفتح الأبليكيشن فقط)
-- ملاحظة: is_guest_order محذوف — استخدم (user_id IS NULL) مباشرةً في كل الـ queries
created_at        timestamp DEFAULT now(),
CONSTRAINT chk_zone_required CHECK (order_type = 'pickup' OR zone_id IS NOT NULL)
```

> **order_code Trigger:**

```sql
CREATE SEQUENCE order_code_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS trigger AS $$
BEGIN
  NEW.order_code := 'KH-' || nextval('order_code_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_code
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_code();
```

> **Trigger — إدارة النقاط تلقائياً عند تغيير حالة الطلب (confirmed / cancelled):**

```sql
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- عند confirmed: أضف النقاط المكتسبة للرصيد
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed'
     AND NEW.points_earned > 0 AND NEW.user_id IS NOT NULL THEN
    UPDATE users
    SET points_balance = points_balance + NEW.points_earned
    WHERE id = NEW.user_id;
    INSERT INTO point_transactions (user_id, order_id, transaction_type, points)
    VALUES (NEW.user_id, NEW.id, 'earned', NEW.points_earned);
    NEW.points_status := 'confirmed';
  END IF;

  -- عند إلغاء طلب كان confirmed: اسحب النقاط المكتسبة
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled'
     AND OLD.points_earned > 0 AND OLD.user_id IS NOT NULL THEN
    UPDATE users
    SET points_balance = GREATEST(0, points_balance - OLD.points_earned)
    WHERE id = OLD.user_id;
    INSERT INTO point_transactions
      (user_id, order_id, transaction_type, points, note)
    VALUES (OLD.user_id, OLD.id, 'manual_deduct', OLD.points_earned,
            'تراجع — إلغاء طلب ' || OLD.order_code);
    NEW.points_status := 'cancelled';
  END IF;

  -- عند إلغاء أي طلب: أعد points_used (النقاط التي خصمها العميل كخصم)
  -- يُنفَّذ بغض النظر عن الحالة السابقة (pending أو confirmed)
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled'
     AND OLD.points_used > 0 AND OLD.user_id IS NOT NULL THEN
    UPDATE users
    SET points_balance = points_balance + OLD.points_used
    WHERE id = OLD.user_id;
    INSERT INTO point_transactions
      (user_id, order_id, transaction_type, points, note)
    VALUES (OLD.user_id, OLD.id, 'manual_add', OLD.points_used,
            'استرداد خصم — إلغاء طلب ' || OLD.order_code);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION handle_order_status_change();
```

> **مهم:** هذا الـ trigger يُغني عن أي كود يدوي لتحديث `points_balance` عند تغيير الحالة — الأدمن يغيّر الحالة فقط، والـ trigger يتولى الباقي تلقائياً.

---

### جدول `order_items` — تفاصيل أصناف كل طلب ✅ جديد

```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_id       uuid REFERENCES orders(id) ON DELETE CASCADE
product_id     uuid REFERENCES products(id) ON DELETE SET NULL   -- SET NULL عشان لو اتحذف الصنف، الطلب القديم يفضل
variant_id     uuid REFERENCES product_variants(id) ON DELETE SET NULL  -- nullable
product_name   text NOT NULL   -- snapshot اسم الصنف وقت الطلب
variant_name   text            -- snapshot اسم المتغير
unit_price     integer NOT NULL -- snapshot السعر وقت الطلب
quantity       integer NOT NULL DEFAULT 1
subtotal       integer NOT NULL -- unit_price × quantity
CONSTRAINT chk_order_item_subtotal CHECK (subtotal = unit_price * quantity)
```

> **مهم:** حفظ snapshot للاسم والسعر وقت الطلب — لو الأدمن غيّر السعر أو حذف الصنف بعدين لا يأثر على الطلبات القديمة
> **ON DELETE SET NULL:** لو اتحذف الصنف، product_id يبقى NULL لكن product_name + unit_price (الـ snapshot) تفضل موجودة — كافية لعرض الطلبات القديمة

---

### جدول `delivery_zones` — مناطق التوصيل

```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
zone_name  text NOT NULL
fee        integer NOT NULL
is_active  boolean DEFAULT true
created_at timestamp DEFAULT now()
```

---

### جدول `point_transactions` — سجل عمليات النقاط ✅ جديد

```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id           uuid REFERENCES users(id) ON DELETE CASCADE
order_id          uuid REFERENCES orders(id) -- nullable (للعمليات اليدوية)
transaction_type  text NOT NULL  -- "earned" | "redeemed" | "manual_add" | "manual_deduct"
points            integer NOT NULL CHECK (points > 0)  -- دايماً موجب — transaction_type بيحدد الاتجاه
note              text
created_at        timestamp DEFAULT now()
```

> **قاعدة النقاط:** الـ `points` دايماً موجب. الاتجاه يتحدد من `transaction_type`:
> - `earned` / `manual_add` → يُضاف للرصيد
> - `redeemed` / `manual_deduct` → يُخصم من الرصيد
> ده يمنع الـ redundancy ويوضح المنطق للـ AI agent.

> **🔒 Atomic RPC — منع Race Condition:** استخدام النقاط + حفظ الطلب لازم يتنفّذوا داخل RPC واحدة بـ transaction. لو العميل فتح تابين أو طلب من جهازين في نفس الوقت، `FOR UPDATE` يقفل صف المستخدم ويمنع استخدام نفس النقاط مرتين:

```sql
CREATE OR REPLACE FUNCTION create_order_with_points(
  p_user_id       uuid,
  p_points_to_use integer,
  p_subtotal      integer,
  p_delivery_fee  integer,
  p_discount      integer,
  p_total         integer,
  p_order_data    jsonb,   -- { customer_name, customer_phone, delivery_address, order_type, zone_id, notes }
  p_items         jsonb    -- [{ product_id, variant_id, product_name, variant_name, unit_price, quantity }]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance        integer;
  v_order_id       uuid;
  v_points_per_100 integer;
  v_points_earned  integer;
  v_item           jsonb;
BEGIN
  -- Validation: منع قيم سالبة (لو p_points_to_use = -50 سيُضيف نقاط بدل ما يخصم!)
  IF p_points_to_use < 0 THEN
    RAISE EXCEPTION 'invalid_points: لا يجوز نقاط سالبة';
  END IF;

  -- قفل صف المستخدم لمنع race condition
  SELECT points_balance INTO v_balance
  FROM users WHERE id = p_user_id FOR UPDATE;

  IF v_balance < p_points_to_use THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  -- حساب النقاط المكتسبة صراحةً من settings
  SELECT COALESCE(CAST(value AS integer), 1)
  INTO v_points_per_100
  FROM settings WHERE key = 'points_per_100_egp';

  -- النقاط تُحسب على subtotal فقط — ليس على التوصيل أو الخصم
  v_points_earned := FLOOR(p_subtotal::numeric / 100) * COALESCE(v_points_per_100, 1);

  -- حفظ الطلب مع points_earned الصريحة
  INSERT INTO orders (
    user_id, customer_name, customer_phone, delivery_address,
    order_type, zone_id, notes,
    subtotal, delivery_fee, discount_amount, total_price,
    points_used, points_earned
  ) VALUES (
    p_user_id,
    p_order_data->>'customer_name',
    p_order_data->>'customer_phone',
    p_order_data->>'delivery_address',
    p_order_data->>'order_type',
    NULLIF(p_order_data->>'zone_id', '')::uuid,
    p_order_data->>'notes',
    p_subtotal, p_delivery_fee, p_discount, p_total,
    p_points_to_use, v_points_earned
  ) RETURNING id INTO v_order_id;

  -- إدخال order_items مع snapshot الأسماء والأسعار (كان مفقوداً تماماً!)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, product_id, variant_id,
      product_name, variant_name,
      unit_price, quantity, subtotal
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      NULLIF(v_item->>'variant_id', '')::uuid,
      v_item->>'product_name',
      NULLIF(v_item->>'variant_name', ''),
      (v_item->>'unit_price')::integer,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::integer * (v_item->>'quantity')::integer
    );
  END LOOP;

  -- خصم النقاط المستخدمة فوراً من الرصيد (atomically)
  IF p_points_to_use > 0 THEN
    UPDATE users SET points_balance = points_balance - p_points_to_use
    WHERE id = p_user_id;
    INSERT INTO point_transactions (user_id, order_id, transaction_type, points)
    VALUES (p_user_id, v_order_id, 'redeemed', p_points_to_use);
  END IF;

  RETURN v_order_id;
END;
$$;
```

---

### جدول `offers` — العروض والبانرات ✅ جديد (منفصل عن settings)

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
title       text
image_url   text
expires_at  timestamp   -- null = بدون تاريخ انتهاء
is_active   boolean DEFAULT true
order_index integer DEFAULT 0
created_at  timestamp DEFAULT now()
```

---

### جدول `settings` — إعدادات النظام (key-value)

```sql
key   text PRIMARY KEY
value text
```

**المفاتيح الكاملة:**

| المفتاح | الوصف | مثال |
|---|---|---|
| `whatsapp_order_number` | رقم الواتساب المستلم للطلبات | 201064414303 |
| `whatsapp_social_url` | رابط الواتساب في الفوتر | https://wa.me/... |
| `facebook_url` | رابط صفحة الفيسبوك | https://fb.com/... |
| `instagram_url` | رابط الانستجرام | https://instagram.com/... |
| `tiktok_url` | رابط التيك توك | https://tiktok.com/... |
| `phone_1` | رقم الهاتف الأول | 01064414303 |
| `phone_2` | رقم الهاتف الثاني | 01120301003 |
| `phone_3` | رقم الهاتف الثالث | 01228889102 |
| `restaurant_address` | عنوان المطعم | شارع مستشفى الهلال... |
| `delivery_enabled` | تفعيل التوصيل | true/false |
| `pickup_enabled` | تفعيل الاستلام | true/false |
| `points_per_100_egp` | نقاط مكتسبة لكل 100 جنيه | 1 |
| `point_value_egp` | قيمة النقطة الواحدة بالجنيه | 0.5 |
| `max_points_discount_pct` | أقصى نسبة خصم بالنقاط | 20 |
| `stat_customers` | عدد العملاء (للعرض) — قيمة manual يحددها الأدمن | 5000 |
| `stat_years` | سنوات الخبرة (للعرض) | 10 |
| `working_hours` | أوقات العمل (للعرض للعملاء) | 10:00 ص — 2:00 ص |
| `is_ordering_open` | قبول الطلبات حالياً | true/false |

> **💡 stat_customers — المنطق المحدد:** قيمة manual فقط — الأدمن يحدّثها يدوياً من `/admin/settings`. لا يوجد `SELECT COUNT(*)` تلقائي عند كل request. الأدمن يرى العدد الحقيقي في `/admin/customers` ويضع ما يشاء في `stat_customers` للعرض.

---

### Indexes — الأداء

```sql
-- أكتر الحقول بحثاً — بدون هذي الـ indexes هيعمل full table scan لكل query
CREATE INDEX idx_orders_customer_phone   ON orders(customer_phone);
CREATE INDEX idx_orders_created_at       ON orders(created_at DESC);
CREATE INDEX idx_orders_status           ON orders(status);
CREATE INDEX idx_orders_order_code       ON orders(order_code);
CREATE INDEX idx_users_phone_number      ON users(phone_number);
CREATE INDEX idx_order_items_order_id    ON order_items(order_id);
CREATE INDEX idx_point_tx_user_id        ON point_transactions(user_id);

-- indexes مركّبة للـ dashboard — تمنع full scan مع growth
CREATE INDEX idx_orders_created_status   ON orders(created_at DESC, status);
CREATE INDEX idx_order_items_product     ON order_items(product_id, order_id);

-- index للمنيو — تُسرّع fetch الأصناف المتاحة لكل قسم
CREATE INDEX idx_products_category_avail ON products(category_id, is_available, order_index);
```

---

### Supabase Storage — استراتيجية الصور

| الإعداد | القيمة |
|---|---|
| Bucket | `menu-images` |
| الصلاحية | Public read — لا يحتاج auth لعرض الصور |
| Max upload | 1MB لكل صورة |
| ضغط | Supabase Image Transformation: `?width=400&quality=75` للموبايل |
| الفورمات | JPG / PNG / WebP |
| التسمية | `{product_id}-{timestamp}.webp` |

> **مهم في مصر:** البندويدث ضيق — دايماً استخدم Supabase Transform في الـ `image_url` عند العرض. صورة 2MB هتبطّئ الموقع جداً على الموبايل.

---

## 4. صفحات الموقع

### 4.1 الصفحة الرئيسية `/`

- **هيدر:** شعار خلدون + "أصل السوري هون" + أرقام الهاتف + أيقونات سوشيال
- **Hero Section:** صورة غلاف + شعار + زر "اطلب دلوقتي"
- **قسم العروض:** بانرات متحركة من جدول `offers`
- **أقسام المنيو السريعة:** كروت بصور للأقسام
- **إحصائيات:** عدد العملاء / سنوات الخبرة (من `settings`)
- **فوتر:** سوشيال ميديا + أرقام + عنوان

---

### 4.2 صفحة المنيو `/menu`

- تبويبات أفقية للتنقل بين الأقسام
- كل قسم يعرض: صورة + اسم + وصف + سعر أو متغيرات
- زر "أضف للطلب" على كل صنف
- Variant Selector للأصناف متعددة النكهات/الأحجام

---

### أقسام المنيو الكاملة

#### 📌 قسم الشاورما

| الصنف | فراخ | لحمة | مكس |
|---|---|---|---|
| ساندوتش شاورما وسط | 75 | 90 | 80 |
| ساندوتش شاورما كبير | 85 | 100 | 95 |
| ساندوتش شاورما صاروخ | 110 | 120 | 115 |
| شاورما عربي سنجل | 115 | 135 | 125 |
| شاورما عربي دبل | 190 | 225 | 210 |
| شاورما عربي عائلي | 340 | 390 | 370 |
| شاورما ماريا | 125 | 140 | 135 |
| فتة شاورما صغير | 110 | 135 | 125 |
| فتة شاورما كبير | 140 | 160 | 150 |
| شمروخ | 130 | 170 | — |
| ريختر | 140 | 180 | — |
| وجبة شاورما 250 جرام | 190 | 225 | 170 |
| وجبة شاورما 500 جرام | 350 | 395 | 225 |
| وجبة شاورما 1000 جرام | 680 | 790 | 395 |

> يقدم مع الوجبات: عيش - بطاطس - تومية - مخلل
> تورتة الشاورما: زر "تواصل مباشر للاستفسار" بدل سعر ثابت

---

#### 📌 قسم الشوايه

| الصنف | السعر |
|---|---|
| دجاجة شوايه كاملة | 370 |
| نصف دجاجة شوايه | 195 |
| ربع دجاجة ورك شوايه | 115 (حسب المتاح) |
| ربع دجاجة صدر شوايه | 130 (حسب المتاح) |
| دبل ورك دجاج شوايه | 185 |
| دجاج شوايه ساده | 330 |
| نصف دجاج شوايه ساده | 180 |

> يقدم مع الوجبات: أرز بسمتي + بطاطس + عيش + تومية + مخلل

---

#### 📌 قسم الفحم

| الصنف | السعر |
|---|---|
| فرخه مسحب فحم مخليه | 390 |
| نص فرخه مسحب فحم مخليه | 210 |
| وجبة كفتة لحمة فحم | 190 |
| وجبة شيش طاووق فحم | 180 |
| وجبة كفته فراخ فحم | 180 |
| ساندوتش كفتة فحم | 120 |
| ساندوتش شيش طاووق فحم | 110 |
| ساندوتش كفته فراخ فحم | 110 |

> يقدم مع الوجبات: أرز بسمتي + بطاطس + عيش + تومية + مخلل

---

#### 📌 قسم الغربي

| الصنف | سوري (قطعة) | وجبة |
|---|---|---|
| كرسبي | 100 | 170 |
| زنجر | 100 | 170 |
| اسكالوب بانيه | 100 | 170 |
| سوبريم | 110 | 170 |
| فاهيتا دجاج | 110 | 170 |
| مكسيكانو | 110 | 170 |
| شيش طاووق | 110 | 170 |
| شمروخ كريسبي | 135 | — |
| ماريا كريسبي | 150 | — |

> جانب البطاطس مع الوجبة (يُضاف كـ order_item منفصل بسعره الخاص): عادي 40 | مكس جبن 55 | موتزريلا/شيدر 45 | صيامي 35

---

#### 📌 رز خلدون

| الصنف | السعر |
|---|---|
| ارز كرسبي | 110 |
| ارز زنجر | 110 |
| ارز شيش طاووق | 110 |
| ارز فاهيتا دجاج | 110 |
| ارز مكسيكانو | 110 |

---

#### 📌 بروستد شيتوس

| الصنف | السعر |
|---|---|
| فرخة شيتوس | 440 |
| نص فرخة شيتوس | 235 |
| ربع فرخة شيتوس صدر | 145 |
| ربع فرخة شيتوس ورك | 130 |

---

#### 📌 البروستد

| الصنف | السعر | القطع |
|---|---|---|
| ربع ورك بروست | 130 | 2 قطع |
| ربع صدر بروست | 145 | 3 قطع |
| نص فرخه بروست | 235 | 5 قطع |
| فرخه بروست | 440 | 10 قطع |

---

#### 📌 المقبلات

| الصنف | السعر |
|---|---|
| تومية | 25 |
| تومية سبايسي | 25 |
| طحينة | 35 |
| كولسلو | 35 |
| فتوش | 25 |
| تبوله | 25 |
| مخلل | 15 |
| أرز بسمتي | 40 |
| بطاطس مقرمشة | 30 |
| عيش | 5 |

---

#### 📌 إضافات

| الصنف | السعر |
|---|---|
| موتزاريلا | 20 |
| شيدر | 20 |
| إضافة بطاطس | 20 |
| محمرة | 20 |
| قطعة كرسبي | 50 |
| قطعة زنجر | 50 |
| قطعة سكالوب | 50 |
| سيخ شيش | 55 |
| سيخ كفتة | 75 |
| قطعة سوبريم | 55 |

---

#### 📌 وجبات أطفال خلدون

| الصنف | السعر | المحتوى |
|---|---|---|
| وجبة كرسبي | 95 | 2 قطعة كرسبي + أرز بسمتي + بطاطس + تومية + كاتشب |
| وجبة شيش طاووق | 95 | 1 سيخ شيش طاووق + أرز بسمتي + بطاطس + تومية + كاتشب |

---

#### 📌 كنافة نابلسية

| الصنف | السعر |
|---|---|
| ساده صغير | 70 |
| ساده كبير | 100 |

---

### 4.3 صفحة عربة التسوق `/cart`

- عرض الأصناف المختارة مع الكميات + تعديل
- اختيار نوع الطلب: توصيل أم استلام
- لو توصيل: اختيار المنطقة + رسوم التوصيل تلقائياً
- لو استلام: عرض عنوان المطعم
- حساب الإجمالي المبدئي + النقاط المتوقعة
- **🔒 Zustand persist:** الـ cart يُحفظ في `localStorage` تلقائياً — لو العميل جاله تليفون أو أغلق المتصفح بالغلط، العربة تفضل موجودة:

  ```ts
  // stores/cart.ts
  import { persist } from 'zustand/middleware'
  export const useCartStore = create(persist(..., { name: 'khaldoun-cart' }))
  ```

---

### 4.4 صفحة إتمام الطلب `/checkout`

**للعميل المسجّل:**
- بيانات حسابه تملأ تلقائياً
- زر "استخدم بيانات حسابي" لو احتاج يأكدها
- slider لاختيار عدد النقاط — الحد الأقصى: `min(points_balance × point_value_egp, subtotal × max_pct / 100)`
  - مثال: رصيد 1000 نقطة (= 500 ج) على طلب 150 ج بـ 20% حد → الـ slider يقف عند 30 ج (ليس 500 ج)
- عرض: رصيد النقاط الحالي | القيمة بالجنيه | الإجمالي بعد الخصم
- أزرار [−] و[+] لضبط دقيق بجانب الـ slider (مناسب للموبايل)

**للزائر (guest):**
- حقل: الاسم + رقم الهاتف + العنوان (للتوصيل)
- حقل ملاحظات (اختياري)
- زر "سجّل وفّر نقاطك" (اختياري)

**للجميع:**
- عرض النقاط المكتسبة المتوقعة على هذا الطلب
- زر "إتمام الطلب عبر واتساب"

---

### 4.5 تدفق الطلب الكامل

```
اختيار الأصناف (مع المتغيرات)
        ↓
Cart (عرض + تعديل الكميات)
        ↓
Checkout:
  ┌─────────────────────────────────────┐
  │ مسجّل؟                               │
  │ آه → بيانات تلقائية + slider النقاط  │
  │ لأ → يدخل: اسم + هاتف + عنوان       │
  └─────────────────────────────────────┘
        ↓
حساب: subtotal + delivery_fee - discount = total
        ↓
حفظ الطلب في Supabase (orders + order_items)
        ↓
فتح واتساب برسالة جاهزة ومنسّقة (تتضمن order_code مثل KH-1042)
        ↓
⚠️ صفحة تأكيد الإرسال: "هل ضغطت على إرسال في الواتساب؟"
  [✅ آه أرسلت — اكتمل الطلب]    [↩ أعد فتح الواتساب]
  (wa.me يفتح التطبيق فقط — لا يؤكد إرسال الرسالة)
        ↓
[مسجّل] تسجيل النقاط في point_transactions بحالة points_status = 'pending'
         النقاط لا تُضاف للرصيد إلا لما يغيّر الأدمن الطلب لـ 'confirmed' من لوحة الإدارة
[guest]  user_id = null — لا يُنشأ سجل في users
⚠️ دمج الطلبات عند التسجيل: بالـ session token فقط — ليس بالرقم وحده
```

---

### نموذج رسالة الواتساب الكاملة

```
🍗 طلب جديد من مطعم خلدون

� رقم الطلب: KH-1042
�👤 الاسم: محمد أحمد
📞 الهاتف: 01XXXXXXXXX
📍 العنوان: شارع X، حي Y
🚗 نوع الطلب: توصيل | منطقة: المنطقة X
📝 ملاحظات: بدون بصل

━━━━━━━━━━━━━━━━━━
🛒 الأصناف:
• شاورما عربي دبل (فراخ) × 2 = 380 جنيه
• كرسبي سوري × 1 = 100 جنيه
• بطاطس مكس جبن × 1 = 55 جنيه
━━━━━━━━━━━━━━━━━━
💰 المجموع: 535 جنيه
🛵 رسوم التوصيل: 25 جنيه
⭐ خصم النقاط: 10 جنيه (20 نقطة)
💵 الإجمالي الكلي: 550 جنيه
⭐ نقاط مكتسبة: 5 نقاط
━━━━━━━━━━━━━━━━━━
💳 طريقة الدفع: كاش عند الاستلام
```

---

### 4.6 صفحة تسجيل الدخول `/login`

- رقم الهاتف + كلمة سر (بدون OTP — بدون reset password)
- لو حساب جديد: إنشاء مباشر بدون تحقق
- بعد التسجيل: **لا يتم دمج الطلبات القديمة بالرقم وحده** — خطر أمني. الدمج يتم فقط لو الطلب طُلّب من نفس الجهاز (session token) خلال نفس الجلسة.

---

### 4.7 صفحة الحساب الشخصي `/profile`

- رصيد النقاط الحالي
- جدول point_transactions (تاريخ الكسب والاستخدام)
- تاريخ الطلبات (من orders) — مع عرض `order_code` (مثل KH-1042) لكل طلب
- تعديل الاسم + العنوان الافتراضي
- **إلغاء الطلب:** زر "إلغاء" يظهر فقط لو:
  - الحالة `'pending'`
  - ومرّ أقل من 5 دقائق على `created_at`
  - عند الإلغاء: `status = 'cancelled'` + إعادة النقاط المستخدمة (لو فيه خصم نقاط)

---

## 5. نظام النقاط — المنطق الكامل

### الكسب

- الأدمن يحدد: كام نقطة لكل 100 جنيه (من `settings.points_per_100_egp`)
- **النقاط تُحسب على `subtotal` فقط** — بدون رسوم التوصيل وبدون قيمة الخصم (لا تُكسب نقاط على فلوس لم تُدفع فعلاً)
- مثال: subtotal 535 ج → النقاط = `floor(535 / 100) × 1` = 5 نقاط (نفس أرقام مثال رسالة الواتساب في §4.5 — التوصيل والخصم لا يؤثران على الحساب)
- النقاط تُسجَّل بحالة `points_status = 'pending'` عند حفظ الطلب
- تُضاف للرصيد فعلياً عبر Trigger تلقائي لما يغيّر الأدمن الطلب لـ `'confirmed'`
- لو الأدمن غيّر `confirmed` → `cancelled` → Trigger يسحب النقاط المكتسبة تلقائياً
- ده يمنع كسب نقاط على طلب لم يصل للمطعم فعلاً

### الاستخدام

- بس للعملاء المسجّلين في صفحة الـ checkout
- **الحد الأقصى للـ slider:** `min(points_balance × point_value_egp, subtotal × max_points_discount_pct / 100)`
  - يمنع استخدام نقاط بقيمة أكبر من النسبة المحددة من الطلب
  - مثال: رصيد 1000 نقطة (500 ج) + طلب 150 ج + حد 20% → الـ slider يقف عند 30 ج (ليس 500 ج)
- الأدمن يحدد: قيمة النقطة بالجنيه (من `settings.point_value_egp`)
- الأدمن يحدد: أقصى نسبة خصم من الطلب (من `settings.max_points_discount_pct`)
- مثال: 20 نقطة × 0.5 جنيه = 10 جنيه خصم

### في لوحة الأدمن

- مشاهدة رصيد نقاط أي عميل
- إضافة/خصم نقاط يدوياً مع ملاحظة
- كل العمليات تُسجَّل في `point_transactions`
- تعديل: نسبة الكسب + قيمة النقطة + أقصى خصم

---

## 6. لوحة الإدارة `/admin`

> الدخول: حساب أدمن مخصص في Supabase (app_metadata role: admin)
> Row Level Security يمنع وصول العملاء العاديين

### 6.1 داشبورد الإحصائيات `/admin/dashboard`

- إجمالي الطلبات: اليوم / الأسبوع / الشهر
- إجمالي الإيرادات
- أكتر الأصناف طلباً
- عدد العملاء الجدد
- أكتر مناطق التوصيل
- رسم بياني للطلبات بالوقت

### 6.2 إدارة الطلبات `/admin/orders`

- جدول بكل الطلبات (من الأحدث) — **pagination: 25 طلب لكل صفحة (cursor-based من Supabase)**
- فلترة بالحالة / التاريخ / نوع الطلب
- تفاصيل كل طلب (الأصناف + العميل + المنطقة)
- تغيير حالة الطلب: pending → confirmed → delivered → cancelled
  - عند `confirmed`: تُفعَّل النقاط (`points_status = 'confirmed'` + إضافة للرصيد)
- البحث برقم الهاتف أو الاسم أو `order_code` (مثل KH-1042)

### 6.3 إدارة المنيو `/admin/menu`

- إضافة صنف جديد (اسم + صورة + وصف + فئة + متغيرات)
- تعديل سعر أي صنف أو متغير
- إخفاء صنف مؤقتاً (غير متوفر)
- حذف صنف
- إعادة ترتيب الأقسام والأصناف (drag & drop)
- رفع/تغيير صور الأصناف مباشرة (Supabase Storage)

### 6.4 إدارة العروض `/admin/offers`

- إضافة بانر عرض (صورة + نص + تاريخ انتهاء)
- إخفاء/إظهار عروض
- إعادة الترتيب

### 6.5 إدارة مناطق التوصيل `/admin/zones`

- إضافة منطقة جديدة وتحديد السعر
- تعديل سعر التوصيل لكل منطقة
- تفعيل/تعطيل منطقة

### 6.6 إدارة العملاء والنقاط `/admin/customers`

- قائمة العملاء المسجّلين
- رصيد نقاط كل عميل
- تاريخ طلبات العميل
- إضافة/خصم نقاط يدوياً مع ملاحظة

### 6.7 إعدادات النظام `/admin/settings`

- **واتساب الطلبات:** الرقم المستلم للطلبات
- **واتساب التواصل:** رابط الواتساب في الفوتر
- **فيسبوك:** رابط الصفحة
- **انستجرام:** رابط البروفايل
- **تيك توك:** رابط الأكاونت
- **أرقام الهاتف:** الأرقام الثلاثة المعروضة
- **العنوان:** عنوان المطعم
- **نظام النقاط:** نسبة الكسب + قيمة النقطة + أقصى خصم
- **إحصائيات العرض:** عدد العملاء + سنوات الخبرة
- **التوصيل/الاستلام:** تفعيل/تعطيل

> جميع القيم تُخزَّن في `settings` وتُعرَض ديناميكياً بدون إعادة نشر الكود

---

## 7. روابط السوشيال ميديا

| المنصة | الظهور في الموقع | قابل للتعديل من الأدمن |
|---|---|---|
| واتساب | فوتر + زر عائم | ✅ |
| فيسبوك | فوتر + هيدر | ✅ |
| انستجرام | فوتر + هيدر | ✅ |
| تيك توك | فوتر | ✅ |

**مكونات الظهور:**
1. أيقونات السوشيال في الفوتر — 4 أيقونات ملونة
2. زر واتساب عائم (Fixed Bottom Right) — محادثة مباشرة — **لا يظهر في `/cart` و `/checkout`** (يتعارض مع Sticky Bottom Bar)
3. شريط التواصل في الهيدر — أرقام الهاتف الثلاثة
4. صفحة "تواصل معنا" — تجمع كل وسائل التواصل

---

## 8. التصميم والـ UI

### ألوان العلامة التجارية

```css
--primary:    #1E2A4A  /* كحلي داكن — الخلفيات الرئيسية */
--accent:     #F26522  /* برتقالي — الأزرار والعناوين */
--background: #FDF5EC  /* كريمي فاتح — خلفية الصفحات */
--text:       #1A1A1A  /* أسود للنصوص */
--white:      #FFFFFF
```

### قواعد التصميم

- **RTL كامل:** `dir="rtl"` على الـ html + Tailwind v4 RTL built-in
- **Mobile-first:** أغلب العملاء من الموبايل
- **فونت عربي:** Cairo أو Tajawal من Google Fonts
- **الأيقونات:** Lucide React

---

### مواصفات الموبايل — تفاصيل تنفيذية

#### الهيدر (موبايل)
- **يعرض فقط:** شعار + أيقونة cart مع badge عدد الأصناف
- أرقام الهاتف الثلاثة وأيقونات السوشيال: تُنقل للفوتر (الهيدر لا يتحمل 3 أرقام على شاشة 390px)
- `position: sticky; top: 0; z-index: 50`

#### تبويبات المنيو (CategoryTabs)

8 أقسام لا تتناسب مع شاشة 390px — يجب scroll أفقي مع snap:

```tsx
<div className="flex overflow-x-auto scrollbar-hide snap-x gap-2 px-4 pb-1">
  {categories.map(cat => (
    <button
      key={cat.id}
      className={`snap-start shrink-0 px-4 rounded-full text-sm font-medium
                  min-h-[44px] whitespace-nowrap transition-colors
                  ${active === cat.id
                    ? 'bg-accent text-white'
                    : 'bg-white border border-gray-200 text-gray-700'}`}
      onClick={() => {
        setActive(cat.id)
        // تمركز التبويب النشط على الشاشة تلقائياً
        btnRef.current?.scrollIntoView({ inline: 'center', behavior: 'smooth' })
      }}
    >
      {cat.icon} {cat.name}
    </button>
  ))}
</div>
```

#### VariantSelector (موبايل)

Segment buttons بدلاً من dropdown — dropdown صعب على الموبايل:

```tsx
<div className="flex gap-2 flex-wrap">
  {variants.map(v => (
    <button
      key={v.id}
      className={`px-4 py-2 rounded-xl border text-sm font-medium min-h-[44px]
        ${selected?.id === v.id
          ? 'bg-accent text-white border-accent'
          : 'bg-white border-gray-200 text-gray-800'}`}
      onClick={() => setSelected(v)}
    >
      {v.variant_name}
    </button>
  ))}
</div>
<p className="text-accent font-bold text-xl mt-2">{selected?.price} ج</p>
```

- `min-height: 44px` على كل زر (Apple HIG / Material Design standard)
- السعر يتغيّر ديناميكياً مع الـ variant المختار

#### CartDrawer → Bottom Sheet

- على الموبايل: Bottom Sheet (يصعد من الأسفل) — ليس Side Drawer (يقطع الـ content)
- `drag handle` للـ close + `backdrop` للـ dismiss بالضغط خارجها
- `max-h-[85vh] overflow-y-auto` لمنع خروج الشاشة

#### Sticky Bottom Bar (Cart + Checkout)

العميل لا يحتاج scroll للوصول لزر التأكيد:

```tsx
<div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200
               px-4 py-3 flex items-center gap-3">
  <div className="shrink-0">
    <p className="text-xs text-gray-500">الإجمالي</p>
    <p className="text-lg font-bold text-primary">{total} ج</p>
  </div>
  <button className="flex-1 bg-accent text-white rounded-2xl font-bold
                     min-h-[52px] text-base">
    إتمام الطلب عبر واتساب
  </button>
</div>
// تحتجز المساحة: <div className="pb-24" /> في آخر الصفحة
```

#### PointsSlider (موبايل)

Range input وحده صعب التحكم بدقة — أضف أزرار [+/-]:

```tsx
<div className="space-y-3">
  {/* maxDiscount = Math.floor(Math.min(balance*pv, subtotal*pct/100) / pv) * pv
      يضمن أن maxDiscount مضاعف صحيح لـ pointValue — يمنع كسور في الـ slider */}
  <input
    type="range" min={0} max={maxDiscount} step={pointValue}
    value={discount} onChange={e => setDiscount(+e.target.value)}
    className="w-full accent-orange-500 h-2"
  />
  <div className="flex items-center justify-between gap-3">
    <button onClick={decrement}
      className="w-11 h-11 rounded-full border text-xl font-bold">−</button>
    <span className="font-bold text-center">
      {/* Math.round يضمن usedPoints عدد صحيح دائماً بغض النظر عن floating point */}
      {Math.round(discount / pointValue)} نقطة = {discount} ج
    </span>
    <button onClick={increment}
      className="w-11 h-11 rounded-full border text-xl font-bold">+</button>
  </div>
</div>
```

#### ProductCard — عرض "يشمل"

```tsx
{product.serves && (
  <div className="flex gap-1 flex-wrap mt-1">
    {product.serves.map(item => (
      <span key={item}
        className="text-xs bg-orange-50 text-orange-700 rounded-full px-2 py-0.5">
        {item}
      </span>
    ))}
  </div>
)}
```

#### محتوى "يقدم مع الوجبات" — كيفية التخزين

محتوى "يقدم مع:أرز + بطاطس + عيش + تومية + مخلل" لا يوجد حقل خاص به في products. يُخزّن كـ `description` بصيغة JSON أو نص مفصول بفاصلة بيضاء ويُعرض كـ chips.

```
khaldoun-restaurant/
├── middleware.ts               ← حماية /admin — يتحقق من JWT + role = admin ويعيد redirect لـ /login لو فشل
├── app/
│   ├── page.tsx                    ← الصفحة الرئيسية
│   ├── menu/page.tsx               ← صفحة المنيو
│   ├── cart/page.tsx               ← عربة التسوق
│   ├── checkout/page.tsx           ← إتمام الطلب + النقاط
│   ├── login/page.tsx              ← تسجيل الدخول
│   ├── profile/page.tsx            ← الحساب الشخصي
│   ├── order-confirm/page.tsx      ← تأكيد إرسال الواتساب (هل ضغطت إرسال؟)
│   └── admin/
│       ├── page.tsx                ← redirect → dashboard
│       ├── dashboard/page.tsx      ← الإحصائيات
│       ├── orders/page.tsx         ← أرشيف الطلبات ✅
│       ├── menu/page.tsx           ← إدارة المنيو
│       ├── offers/page.tsx         ← إدارة العروض
│       ├── zones/page.tsx          ← مناطق التوصيل
│       ├── customers/page.tsx      ← العملاء والنقاط ✅
│       └── settings/page.tsx       ← الإعدادات الكاملة
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── menu/
│   │   ├── CategoryTabs.tsx
│   │   ├── ProductCard.tsx
│   │   └── VariantSelector.tsx
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   └── CartItem.tsx
│   ├── checkout/
│   │   ├── PointsSlider.tsx        ← slider النقاط ✅
│   │   ├── OrderSummary.tsx
│   │   └── WhatsappButton.tsx
│   ├── admin/
│   │   ├── OrdersTable.tsx         ✅
│   │   ├── StatsCards.tsx          ✅
│   │   └── PointsManager.tsx       ✅
│   └── ui/
│       ├── SocialLinks.tsx
│       └── FloatingWhatsapp.tsx
├── lib/
│   ├── supabase.ts
│   ├── whatsapp.ts                 ← توليد رسالة الواتساب
│   ├── points.ts                   ← منطق حساب النقاط
│   └── settings.ts                 ← قراءة الإعدادات (React cache() + revalidateTag('settings'))
├── stores/
│   └── cart.ts                     ← Zustand cart store
└── types/
    └── index.ts                    ← TypeScript Types
```

---

## 10. نقاط مهمة للتطوير

| النقطة | التفاصيل |
|---|---|
| ⚠️ Snapshot الأسعار | حفظ اسم الصنف والسعر في `order_items` وقت الطلب — لو الأدمن حذف أو عدّل الصنف لا يأثر على الطلبات القديمة |
| ⚠️ Guest → مسجّل | **الدمج بالرقم وحده خطر أمني.** استخدم session token: اربط الطلب بالحساب الجديد فقط لو نفس الجهاز/الجلسة |
| ⚠️ النقاط — التوقيت | تُسجّل كـ `pending` عند الطلب — تُفعَّل فقط لما يغيّر الأدمن الحالة لـ `confirmed` |
| ⚠️ الشوايه | بعض الأصناف "حسب المتاح" — checkbox إتاحة في الأدمن |
| ⚠️ تورتة الشاورما | `cta_type = 'whatsapp_inquiry'` في الـ products — يعرض زر تواصل بدل "أضف للسلة" |
| ⚠️ الأدمن Role | Supabase: `app_metadata: { role: 'admin' }` + Row Level Security |
| ⚠️ order_code | يُولَّد تلقائياً بـ trigger كـ "KH-1042" — يظهر في الواتساب وصفحة الـ profile ولوحة الأدمن |
| ⚠️ Cart Persistence | `zustand/middleware persist` + `localStorage` — إجباري على الموبايل |
| ⚠️ base_price | للأصناف بدون variants (مقبلات، إضافات) — لو فيه variants يتجاهل base_price |
| ⚠️ Pagination | admin/orders: 25 طلب لكل صفحة بـ cursor-based pagination من Supabase |
| ⚠️ إلغاء الطلب | في /profile — خلال 5 دقائق فقط + حالة pending فقط + يعيد النقاط المستخدمة |
| ✅ SUPABASE_SERVICE_ROLE_KEY | Server-only — في Server Actions أو Route Handlers فقط — ليس في NEXT_PUBLIC_ |
| ✅ كاش فقط | لا يحتاج payment gateway |
| ✅ بدون OTP | تسجيل بهاتف + كلمة سر — بدون reset password |
| ✅ RTL | Tailwind v4 RTL built-in |
| ✅ الإعدادات ديناميكية | كل قيم `settings` تُعرَض بدون إعادة نشر الكود |
| ✅ whatsapp_opened | مش `whatsapp_sent` — wa.me بيفتح الأبليكيشن فقط، مش بيؤكد الإرسال |
| ⚠️ Cart Stale Prices | عند فتح `/checkout`، revalidate أسعار الـ cart من DB — أبلّغ العميل لو في تغيير في السعر قبل إتمام الطلب |
| ⚠️ WhatsApp URL Length | رسالة كبيرة (10+ أصناف عربية) قد تتجاوز 2048 حرف بعد encoding — `lib/whatsapp.ts` يـ truncate ويضيف "للتفاصيل: رقم الطلب KH-XXXX" |
| ⚠️ Settings Cache | `lib/settings.ts` يستخدم `React cache()` (React 19 built-in) + `revalidateTag('settings')` بعد كل تعديل من الأدمن — `unstable_cache` مهجور في Next.js 15، وـ`revalidate: 3600` خطر لو غيّر الأدمن رقم الواتساب |
| ⚠️ Points Trigger | جميع تغييرات `points_balance` تتم عبر Trigger أو RPC فقط — لا يجوز `UPDATE users SET points_balance` مباشرةً من الكود |
| ⚠️ Rate Limiting | Supabase Auth: rate limiting مفعّل تلقائياً (5 محاولات/دقيقة) — أضف throttle على `app/api/orders/route.ts` (10 طلبات/دقيقة/IP) باستخدام Vercel KV |
| ⚠️ Phone Validation | أرقام مصر: 11 رقم تبدأ 010/011/012/015 — Regex: `/^01[0125][0-9]{8}$/` — validate في `CheckoutForm` و `RegisterForm` قبل الإرسال |
| ⚠️ FloatingWhatsapp | استخدم `usePathname()` داخل `'use client'` فقط لإخفاء الزر — لا تعتمد على SSR (يحدث hydration mismatch في App Router) |
| ⚠️ Settings Validation | `settings.value` نوعه `text` — دائماً `parseFloat(value ?? 'fallback')` مع fallback. إضافة `type="number"` + `min` + `max` في نماذج الأدمن لمنع قيم غير صالحة |
| ⚠️ is_guest_order | محذوف من المخطط — استخدم `(user_id IS NULL)` مباشرةً في كل الـ queries |
| ✅ Admin Middleware | `middleware.ts` يقرأ JWT من cookie → يتحقق من `app_metadata.role === 'admin'` → redirect لـ `/login` لو فشل |
| ✅ Session Token (Guest) | UUID يُولَّد في `sessionStorage` عند أول زيارة، يُحفظ مع كل guest order كـ `guest_token text`، صلاحيته حتى إغلاق المتصفح. عند التسجيل: `UPDATE orders SET user_id = newId WHERE guest_token = $token AND user_id IS NULL` |
| ✅ أوقات العمل | `settings.is_ordering_open` يُقرأ في middleware أو server component — لو `false`: إخفاء زر "اطلب" وعرض رسالة "المطعم مغلق حالياً" |

---

## 11. خارطة الطريق (Roadmap)

### 🔵 المرحلة الأولى — البنية التحتية (أسبوع 1)

- [ ] إنشاء مشروع Supabase
- [ ] تصميم قاعدة البيانات الكاملة (كل الجداول)
- [ ] إدخال بيانات المنيو كاملاً
- [ ] إعداد Supabase Auth + Row Level Security
- [ ] إنشاء مشروع Next.js 15 + Tailwind v4 ورفعه على Vercel

### 🟡 المرحلة الثانية — واجهة المنيو (أسبوع 2)

- [ ] الصفحة الرئيسية (هيدر + فوتر + hero + عروض)
- [ ] صفحة المنيو بالتبويبات
- [ ] كروت الأصناف مع VariantSelector
- [ ] Cart State Management (Zustand)

### 🟠 المرحلة الثالثة — الطلبات والنقاط (أسبوع 3)

- [ ] صفحة Checkout (توصيل/استلام + مناطق)
- [ ] PointsSlider للعملاء المسجّلين
- [ ] توليد رسالة الواتساب الكاملة
- [ ] حفظ الطلب في Supabase (orders + order_items)
- [ ] صفحة تسجيل الدخول (هاتف + كلمة سر)
- [ ] صفحة Profile + تاريخ النقاط

### 🔴 المرحلة الرابعة — لوحة الإدارة (أسبوع 4)

- [ ] Dashboard الإحصائيات
- [ ] Orders Table + تغيير الحالة
- [ ] إدارة المنيو (إضافة/تعديل/حذف/إخفاء + رفع صور)
- [ ] إدارة العروض والبانرات
- [ ] إدارة مناطق التوصيل
- [ ] إدارة العملاء والنقاط (إضافة/خصم يدوي)
- [ ] صفحة الإعدادات الكاملة (سوشيال + أرقام + نقاط)

### ✅ المرحلة الخامسة — الاختبار والإطلاق (أسبوع 5)

- [ ] اختبار تدفق الطلب كامل (guest + مسجّل)
- [ ] اختبار نظام النقاط (كسب + استخدام + انضمام)
- [ ] اختبار لوحة الإدارة كاملة
- [ ] ضبط SEO (وصف، كيوردز، OG Tags)
- [ ] اختبار على أحجام شاشات مختلفة
- [ ] الإطلاق الرسمي على Vercel + ربط الدومين

---

## 12. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # ⚠️ Server-only — لا يبدأ بـ NEXT_PUBLIC_ أبداً

# إعدادات عامة
NEXT_PUBLIC_RESTAURANT_NAME=مطعم خلدون
NEXT_PUBLIC_DEFAULT_WHATSAPP=201064414303
```

> **🔒 أمان SUPABASE_SERVICE_ROLE_KEY:** يتجاوز كل Row Level Security — يُستخدم فقط في:
> - Server Actions (`'use server'`)
> - Route Handlers (`app/api/...`)
> - Migration scripts
> **لو ظهر في DevTools = قاعدة البيانات كلها معرضة للحذف.**

---

## 13. RLS Policies الأساسية

> **تفعيل RLS:** `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` — كرر لكل جدول. بدون policies، RLS يمنع الجميع من القراءة والكتابة.

```sql
-- الجمهور: قراءة المنيو المتاح فقط
CREATE POLICY "public read products"    ON products    FOR SELECT USING (is_available = true);
CREATE POLICY "public read categories"  ON categories  FOR SELECT USING (is_visible = true);
CREATE POLICY "public read variants"    ON product_variants FOR SELECT USING (is_available = true);
CREATE POLICY "public read offers"      ON offers      FOR SELECT USING (is_active = true);
CREATE POLICY "public read zones"       ON delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "public read settings"    ON settings    FOR SELECT USING (true);

-- العميل: يرى طلباته فقط
CREATE POLICY "user read own orders" ON orders
  FOR SELECT USING (
    auth.uid() = (SELECT auth_id FROM users WHERE id = user_id)
  );

-- العميل: يُنشئ طلبات (عبر RPC فقط — الـ RPC تستخدم SECURITY DEFINER)
CREATE POLICY "user insert order via rpc" ON orders
  FOR INSERT WITH CHECK (true);  -- الـ RPC تتحكم بالمنطق

-- العميل: يرى نقاطه فقط
CREATE POLICY "user read own points" ON point_transactions
  FOR SELECT USING (
    auth.uid() = (SELECT auth_id FROM users WHERE id = user_id)
  );

-- العميل: يعدّل ملفه الشخصي فقط
CREATE POLICY "user update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- العميل: يقرأ ملفه الشخصي فقط
CREATE POLICY "user read own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- الأدمن: صلاحيات كاملة — role مُخزَّن في app_metadata (لا يستطيع المستخدم تعديله)
CREATE POLICY "admin full access orders" ON orders
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
-- طبّق نفس الـ policy على: products, categories, product_variants,
-- users, point_transactions, delivery_zones, offers, settings
```

---

## 14. TypeScript Types الأساسية

```ts
// types/index.ts
export interface Category {
  id: string; name: string; icon: string
  order_index: number; is_visible: boolean
}

export interface ProductVariant {
  id: string; product_id: string; variant_name: string
  price: number; is_available: boolean; order_index: number
}

export interface Product {
  id: string; category_id: string; name: string
  description: string | null; base_price: number | null
  image_url: string | null; is_available: boolean
  cta_type: 'add_to_cart' | 'whatsapp_inquiry'
  order_index: number; variants?: ProductVariant[]
}

export interface CartItem {
  product_id: string; variant_id: string | null
  product_name: string; variant_name: string | null
  unit_price: number; quantity: number
}

export interface Order {
  id: string; order_code: string; user_id: string | null
  customer_name: string; customer_phone: string
  delivery_address: string | null
  order_type: 'delivery' | 'pickup'; zone_id: string | null
  notes: string | null
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  subtotal: number; delivery_fee: number
  discount_amount: number; total_price: number
  points_used: number; points_earned: number
  points_status: 'pending' | 'confirmed' | 'cancelled'
  whatsapp_opened: boolean; created_at: string
}

export interface DeliveryZone {
  id: string; zone_name: string; fee: number
  is_active: boolean; created_at: string
}

export interface PointTransaction {
  id: string; user_id: string; order_id: string | null
  transaction_type: 'earned' | 'redeemed' | 'manual_add' | 'manual_deduct'
  points: number; note: string | null; created_at: string
}

export interface Settings {
  whatsapp_order_number: string; whatsapp_social_url: string
  facebook_url: string; instagram_url: string; tiktok_url: string
  phone_1: string; phone_2: string; phone_3: string
  restaurant_address: string
  delivery_enabled: string; pickup_enabled: string
  points_per_100_egp: string; point_value_egp: string
  max_points_discount_pct: string
  stat_customers: string; stat_years: string
  working_hours: string; is_ordering_open: string
}
```

---

*📅 آخر تحديث: أبريل 2026 | الإصدار: 6.0 — نسخة شاملة: RPC كامل + Triggers + TypeScript + RLS + Mobile UI*
