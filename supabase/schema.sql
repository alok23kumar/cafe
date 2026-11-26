-- ==============================================================================
-- Ember & Bean Roastery — Supabase PostgreSQL Schema, RLS Policies & Seed Data
-- Run this script inside the Supabase SQL Editor.
-- All currency amounts are stored strictly in integer INR paise (₹250 = 25000).
-- ==============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==============================================================================
-- 1. CORE TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_3d_model TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  model_3d_url TEXT,
  is_featured_3d BOOLEAN NOT NULL DEFAULT false,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_veg BOOLEAN NOT NULL DEFAULT true, -- Indian FSSAI Veg / Non-Veg indicator
  is_iced BOOLEAN NOT NULL DEFAULT false,
  allergens TEXT[] NOT NULL DEFAULT '{}',
  tasting_notes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                  -- e.g. '250g Whole Bean', 'Regular (240ml)'
  price_paise INTEGER NOT NULL CHECK (price_paise > 0),
  texture_override_url TEXT,            -- Swaps 3D model texture dynamically on click
  color_hex TEXT
);

CREATE TABLE IF NOT EXISTS public.cafe_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,            -- e.g. 'Window Booth 1', 'Terracotta Patio 2'
  zone TEXT NOT NULL CHECK (zone IN ('indoor', 'patio', 'bar')),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  description TEXT,
  preview_3d_camera_pos JSONB           -- { "position": [x,y,z], "target": [x,y,z] }
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.cafe_tables(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'seated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reservations_valid_time_range CHECK (slot_end > slot_start)
);

-- Database-level atomic race protection: prevents two active bookings on the
-- same table from overlapping, even under concurrent API requests.
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_no_overlapping_active_slots;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_no_overlapping_active_slots
  EXCLUDE USING gist (
    table_id WITH =,
    tstzrange(slot_start, slot_end, '[)') WITH &&
  )
  WHERE (status IN ('confirmed', 'seated'));

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('pickup', 'delivery', 'dine_in')),
  delivery_address TEXT,
  total_paise INTEGER NOT NULL CHECK (total_paise > 0),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  order_status TEXT NOT NULL DEFAULT 'new' CHECK (order_status IN ('new', 'preparing', 'ready', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise > 0),
  customizations JSONB
);

-- ==============================================================================
-- 2. INDEXES FOR FAST QUERIES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured_3d ON public.products(is_featured_3d) WHERE is_featured_3d = true;
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table_slot ON public.reservations(table_id, slot_start, slot_end);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Public visitors (anon) can read menu catalog & cafe tables.
-- Checkout, Webhook updates, and Reservations are executed exclusively through
-- hardened Next.js API Route Handlers using the Service Role key.
-- Authenticated cafe admins (Supabase Auth) can manage inventory, orders & bookings.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Public Read: Categories, Products, Product Variants, Cafe Tables
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants"
  ON public.product_variants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can view cafe tables" ON public.cafe_tables;
CREATE POLICY "Public can view cafe tables"
  ON public.cafe_tables FOR SELECT
  USING (true);

-- Authenticated Admin Full Access on Catalog & Tables
DROP POLICY IF EXISTS "Admin manages categories" ON public.categories;
CREATE POLICY "Admin manages categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manages products" ON public.products;
CREATE POLICY "Admin manages products"
  ON public.products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manages product variants" ON public.product_variants;
CREATE POLICY "Admin manages product variants"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manages cafe tables" ON public.cafe_tables;
CREATE POLICY "Admin manages cafe tables"
  ON public.cafe_tables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Reservations, Orders & Order Items: NO direct anon SELECT/INSERT/UPDATE
-- (Prevents PII leaks and client-side price tampering; API routes use service_role)
DROP POLICY IF EXISTS "Admin manages reservations" ON public.reservations;
CREATE POLICY "Admin manages reservations"
  ON public.reservations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manages orders" ON public.orders;
CREATE POLICY "Admin manages orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin views order items" ON public.order_items;
CREATE POLICY "Admin views order items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 4. SUPABASE REALTIME PUBLICATION
-- ==============================================================================
-- Enables live order queue updates & live in_stock syncing across storefront/admin.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;
END $$;

-- ==============================================================================
-- 5. SAMPLE SEED DATA — EMBER & BEAN ROASTERY (INR IN PAISE)
-- ==============================================================================

INSERT INTO public.categories (name, slug, icon_3d_model, sort_order)
VALUES
  ('Signature Espresso & Brews', 'signature-brews', '/models/coffee-cup.glb', 1),
  ('Cold Brew & Iced Craft', 'iced-craft', '/models/pour-over.glb', 2),
  ('Single-Origin Coffee Beans', 'coffee-beans', '/models/coffee-bag.glb', 3),
  ('Artisanal Bakery & Kitchen', 'bakery-kitchen', '/models/croissant.glb', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed Products & Variants via CTEs for idempotency
WITH cat AS (
  SELECT id, slug FROM public.categories
),
inserted_products AS (
  INSERT INTO public.products (
    category_id, name, slug, description, image_url, model_3d_url,
    is_featured_3d, in_stock, is_veg, is_iced, allergens, tasting_notes
  )
  VALUES
    -- Signature Espresso & Brews
    (
      (SELECT id FROM cat WHERE slug = 'signature-brews'),
      'Velvet Cortado',
      'velvet-cortado',
      'Double ristretto of our Chikmagalur house espresso balanced with silky micro-foamed milk.',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      '/models/coffee-cup.glb',
      true, true, true, false,
      ARRAY['Dairy'],
      ARRAY['Roasted Hazelnut', 'Dark Cocoa', 'Caramel']
    ),
    (
      (SELECT id FROM cat WHERE slug = 'signature-brews'),
      'Pour-Over V60 Single Origin',
      'pour-over-v60',
      'Hand-poured Ratnagiri Estate Washed Arabica showcasing tea-like clarity and bright stone fruit.',
      'https://images.unsplash.com/photo-1545665225-b23b99e4d45e?auto=format&fit=crop&w=800&q=80',
      '/models/pour-over.glb',
      true, true, true, false,
      ARRAY[]::TEXT[],
      ARRAY['Jasmine', 'Bergamot', 'White Peach']
    ),
    (
      (SELECT id FROM cat WHERE slug = 'signature-brews'),
      'Jaggery Cinnamon Flat White',
      'jaggery-cinnamon-flat-white',
      'Signature Indian twist: organic palm jaggery reduction and Ceylon cinnamon folded into double espresso.',
      'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
      '/models/coffee-cup.glb',
      false, true, true, false,
      ARRAY['Dairy'],
      ARRAY['Warm Spice', 'Molasses', 'Velvet Crema']
    ),

    -- Cold Brew & Iced Craft
    (
      (SELECT id FROM cat WHERE slug = 'iced-craft'),
      'Iced Salted Caramel Latte',
      'iced-salted-caramel-latte',
      'House-burnt sea-salt caramel swirled over chilled milk and bold double-shot espresso over crystal ice.',
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
      '/models/coffee-cup.glb',
      true, true, true, true,
      ARRAY['Dairy'],
      ARRAY['Burnt Sugar', 'Sea Salt', 'Toasted Almond']
    ),
    (
      (SELECT id FROM cat WHERE slug = 'iced-craft'),
      'Ceremonial Uji Iced Matcha',
      'ceremonial-iced-matcha',
      'First-harvest Uji ceremonial matcha whisked to order over oat or dairy milk with light vanilla nectar.',
      'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
      '/models/coffee-cup.glb',
      true, true, true, true,
      ARRAY['Dairy'],
      ARRAY['Umami', 'Sweet Grass', 'Creamy Finish']
    ),
    (
      (SELECT id FROM cat WHERE slug = 'iced-craft'),
      '18-Hour Barrel Cold Brew',
      'barrel-cold-brew',
      'Slow-steeped coarse-ground Coorg Arabica served over a single hand-carved ice sphere with orange peel.',
      'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
      NULL,
      false, true, true, true,
      ARRAY[]::TEXT[],
      ARRAY['Dark Chocolate', 'Blood Orange', 'Smooth Body']
    ),

    -- Single-Origin Coffee Beans (Interactive 3D Bag Texture Swapping!)
    (
      (SELECT id FROM cat WHERE slug = 'coffee-beans'),
      'Ember Signature Roast Collection',
      'ember-signature-roast-beans',
      'Small-batch Indian specialty arabica roasted every Tuesday in our brass drum roaster. Click any roast profile to inspect the 3D bag.',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
      '/models/coffee-bag.glb',
      true, true, true, false,
      ARRAY[]::TEXT[],
      ARRAY['Single-Origin', 'Small Batch', '100% Arabica']
    ),
    (
      (SELECT id FROM cat WHERE slug = 'coffee-beans'),
      'Monsoon Malabar Reserve',
      'monsoon-malabar-reserve',
      'Coastal wind-aged beans with low acidity, syrupy mouthfeel, and lingering smoky spice notes.',
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80',
      '/models/coffee-bag.glb',
      true, true, true, false,
      ARRAY[]::TEXT[],
      ARRAY['Smoky Wood', 'Clove', 'Bittersweet Cocoa']
    ),

    -- Artisanal Bakery & Kitchen (Includes both Veg & Non-Veg for Indian cafe menu filters)
    (
      (SELECT id FROM cat WHERE slug = 'bakery-kitchen'),
      'Brown-Butter Almond Croissant',
      'almond-croissant',
      '27-layer French butter pastry twice-baked with toasted almond frangipane and flaked Mamra almonds.',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
      '/models/croissant.glb',
      true, true, true, false,
      ARRAY['Gluten', 'Dairy', 'Tree Nuts'],
      ARRAY['Flaky Butter', 'Toasted Almond', 'Vanilla Bean']
    ),
    (
      (SELECT id FROM cat WHERE slug = 'bakery-kitchen'),
      'Smoked Chicken & Pesto Sourdough',
      'smoked-chicken-pesto-sourdough',
      'Char-grilled herb chicken, house basil walnut pesto, roasted tomatoes, and aged cheddar on toasted country sourdough.',
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      NULL,
      false, true, false, false,
      ARRAY['Gluten', 'Dairy', 'Tree Nuts'],
      ARRAY['Smoky Herb', 'Tangy Sourdough', 'Fresh Basil']
    ),
    (
      (SELECT id FROM cat WHERE slug = 'bakery-kitchen'),
      'Truffle Mushroom & Brie Tartine',
      'truffle-mushroom-tartine',
      'Sauteed wild cremini mushrooms, whipped garlic brie, thyme, and black truffle oil on hearth-baked sourdough.',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
      NULL,
      false, true, true, false,
      ARRAY['Gluten', 'Dairy'],
      ARRAY['Earthy Truffle', 'Creamy Brie', 'Crisp Crust']
    ),
    (
      (SELECT id FROM cat WHERE slug = 'bakery-kitchen'),
      'Brioche Shakshuka Egg Toast',
      'brioche-shakshuka-toast',
      'Spiced roasted tomato-pepper ragout topped with a soft poached farm egg, feta crumble, and zaatar on toasted brioche.',
      'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80',
      NULL,
      false, true, false, false,
      ARRAY['Gluten', 'Dairy', 'Egg'],
      ARRAY['Spiced Tomato', 'Rich Yolk', 'Warm Zaatar']
    )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
)
SELECT COUNT(*) FROM inserted_products;

-- Seed Variants (idempotent check by product slug + label)
INSERT INTO public.product_variants (product_id, label, price_paise, texture_override_url, color_hex)
SELECT p.id, v.label, v.price_paise, v.texture_override_url, v.color_hex
FROM (
  VALUES
    -- Velvet Cortado
    ('velvet-cortado', 'Regular (150ml)', 24000, NULL, '#c87d44'),
    ('velvet-cortado', 'Oat Milk (150ml)', 29000, NULL, '#d9a16c'),

    -- Pour-Over V60
    ('pour-over-v60', 'Hot V60 (250ml)', 28000, NULL, '#a44d34'),
    ('pour-over-v60', 'Japanese Flash Iced (250ml)', 30000, NULL, '#c46c49'),

    -- Jaggery Cinnamon Flat White
    ('jaggery-cinnamon-flat-white', 'Regular (220ml)', 27000, NULL, '#b86b35'),
    ('jaggery-cinnamon-flat-white', 'Large (320ml)', 32000, NULL, '#d98a4e'),

    -- Iced Salted Caramel Latte
    ('iced-salted-caramel-latte', 'Regular Iced (300ml)', 29500, NULL, '#d98a4e'),
    ('iced-salted-caramel-latte', 'Large Iced + Extra Shot', 35500, NULL, '#a86432'),

    -- Ceremonial Uji Iced Matcha
    ('ceremonial-iced-matcha', 'Regular Oat Milk (300ml)', 34000, NULL, '#6c8f58'),
    ('ceremonial-iced-matcha', 'Large Coconut Milk (380ml)', 39000, NULL, '#82a96b'),

    -- 18-Hour Barrel Cold Brew
    ('barrel-cold-brew', 'Classic Black (300ml)', 25000, NULL, '#3b261d'),
    ('barrel-cold-brew', 'Tonic Citrus Fizz (320ml)', 29000, NULL, '#c97b3e'),

    -- Ember Signature Roast Collection (3D Bean Bag Texture & Material Swaps!)
    ('ember-signature-roast-beans', 'Chikmagalur House Medium (250g)', 58000, '/textures/roast-house.webp', '#d98a4e'),
    ('ember-signature-roast-beans', 'Ratnagiri Floral Light (250g)', 64000, '/textures/roast-light.webp', '#c26b4a'),
    ('ember-signature-roast-beans', 'Coorg Espresso Dark (250g)', 56000, '/textures/roast-dark.webp', '#5c3a28'),
    ('ember-signature-roast-beans', 'Chikmagalur House Medium (500g)', 108000, '/textures/roast-house.webp', '#e09a62'),

    -- Monsoon Malabar Reserve
    ('monsoon-malabar-reserve', '250g Whole Bean', 62000, '/textures/roast-malabar.webp', '#8a5236'),
    ('monsoon-malabar-reserve', '250g Espresso Fine Grind', 62000, '/textures/roast-malabar.webp', '#70412a'),
    ('monsoon-malabar-reserve', '500g Whole Bean', 115000, '/textures/roast-malabar.webp', '#9c6042'),

    -- Bakery & Kitchen
    ('almond-croissant', 'Single Pastry', 26000, NULL, '#d9a45b'),
    ('almond-croissant', 'Box of 2', 49000, NULL, '#c99044'),
    ('smoked-chicken-pesto-sourdough', 'Full Sandwich + Salad', 42000, NULL, '#a44d34'),
    ('truffle-mushroom-tartine', '2 Slices on Sourdough', 38000, NULL, '#7c5a43'),
    ('brioche-shakshuka-toast', 'Single Plate', 36000, NULL, '#b94e34')
) AS v(slug, label, price_paise, texture_override_url, color_hex)
JOIN public.products p ON p.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_variants pv
  WHERE pv.product_id = p.id AND pv.label = v.label
);

-- Seed Physical Cafe Tables (3 Zones: indoor, patio, bar)
INSERT INTO public.cafe_tables (name, zone, capacity, description, preview_3d_camera_pos)
VALUES
  (
    'Window Booth 1',
    'indoor',
    4,
    'Sunlit walnut banquette framed by terracotta plaster arches and warm brass pendants.',
    '{"position": [3.2, 2.2, 4.1], "target": [0, 0.6, 0]}'::jsonb
  ),
  (
    'Walnut Library Table 2',
    'indoor',
    6,
    'Quiet communal walnut slab ideal for laptops, tastings, and small group catch-ups.',
    '{"position": [-2.8, 2.5, 4.4], "target": [0, 0.6, 0]}'::jsonb
  ),
  (
    'Terracotta Patio 1',
    'patio',
    2,
    'Breezy outdoor bistro table tucked beneath string lights and potted palms.',
    '{"position": [2.4, 2.0, 3.8], "target": [0, 0.5, 0]}'::jsonb
  ),
  (
    'Garden Courtyard 4',
    'patio',
    4,
    'Shaded stone courtyard seating surrounded by jasmine vines and warm lanterns.',
    '{"position": [3.6, 2.4, 3.6], "target": [0, 0.5, 0]}'::jsonb
  ),
  (
    'Espresso Slow Bar 1',
    'bar',
    2,
    'Front-row brushed brass stools directly across from the V60 pour-over & espresso bar.',
    '{"position": [0.8, 1.8, 3.5], "target": [0, 0.7, 0]}'::jsonb
  ),
  (
    'Roaster Counter 2',
    'bar',
    2,
    'Intimate bar seats overlooking our copper drum roaster and tasting flight station.',
    '{"position": [-1.2, 1.8, 3.5], "target": [0, 0.7, 0]}'::jsonb
  )
ON CONFLICT (name) DO NOTHING;
