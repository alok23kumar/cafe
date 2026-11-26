import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CafeTable,
  Category,
  ProductWithVariants,
} from "@/types/database";

// =============================================================================
// Preview Fallback Catalog (Matches supabase/schema.sql seed data)
// Used automatically if Supabase env vars are not yet configured.
// =============================================================================

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "cat-signature-brews",
    name: "Signature Espresso & Brews",
    slug: "signature-brews",
    icon_3d_model: "/models/coffee-cup.glb",
    sort_order: 1,
  },
  {
    id: "cat-iced-craft",
    name: "Cold Brew & Iced Craft",
    slug: "iced-craft",
    icon_3d_model: "/models/pour-over.glb",
    sort_order: 2,
  },
  {
    id: "cat-coffee-beans",
    name: "Single-Origin Coffee Beans",
    slug: "coffee-beans",
    icon_3d_model: "/models/coffee-bag.glb",
    sort_order: 3,
  },
  {
    id: "cat-bakery-kitchen",
    name: "Artisanal Bakery & Kitchen",
    slug: "bakery-kitchen",
    icon_3d_model: "/models/croissant.glb",
    sort_order: 4,
  },
];

export const FALLBACK_PRODUCTS: ProductWithVariants[] = [
  {
    id: "prod-velvet-cortado",
    category_id: "cat-signature-brews",
    name: "Velvet Cortado",
    slug: "velvet-cortado",
    description:
      "Double ristretto of our Chikmagalur house espresso balanced with silky micro-foamed milk.",
    image_url:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    model_3d_url: "/models/coffee-cup.glb",
    is_featured_3d: true,
    in_stock: true,
    is_veg: true,
    is_iced: false,
    allergens: ["Dairy"],
    tasting_notes: ["Roasted Hazelnut", "Dark Cocoa", "Caramel"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-cortado-reg",
        product_id: "prod-velvet-cortado",
        label: "Regular (150ml)",
        price_paise: 24000,
        texture_override_url: null,
        color_hex: "#c87d44",
      },
      {
        id: "var-cortado-oat",
        product_id: "prod-velvet-cortado",
        label: "Oat Milk (150ml)",
        price_paise: 29000,
        texture_override_url: null,
        color_hex: "#d9a16c",
      },
    ],
  },
  {
    id: "prod-pour-over",
    category_id: "cat-signature-brews",
    name: "Pour-Over V60 Single Origin",
    slug: "pour-over-v60",
    description:
      "Hand-poured Ratnagiri Estate Washed Arabica showcasing tea-like clarity and bright stone fruit.",
    image_url:
      "https://images.unsplash.com/photo-1545665225-b23b99e4d45e?auto=format&fit=crop&w=800&q=80",
    model_3d_url: "/models/pour-over.glb",
    is_featured_3d: true,
    in_stock: true,
    is_veg: true,
    is_iced: false,
    allergens: [],
    tasting_notes: ["Jasmine", "Bergamot", "White Peach"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-v60-hot",
        product_id: "prod-pour-over",
        label: "Hot V60 (250ml)",
        price_paise: 28000,
        texture_override_url: null,
        color_hex: "#a44d34",
      },
      {
        id: "var-v60-iced",
        product_id: "prod-pour-over",
        label: "Japanese Flash Iced (250ml)",
        price_paise: 30000,
        texture_override_url: null,
        color_hex: "#c46c49",
      },
    ],
  },
  {
    id: "prod-jaggery-flat-white",
    category_id: "cat-signature-brews",
    name: "Jaggery Cinnamon Flat White",
    slug: "jaggery-cinnamon-flat-white",
    description:
      "Organic palm jaggery reduction and Ceylon cinnamon folded into double house espresso.",
    image_url:
      "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80",
    model_3d_url: "/models/coffee-cup.glb",
    is_featured_3d: false,
    in_stock: true,
    is_veg: true,
    is_iced: false,
    allergens: ["Dairy"],
    tasting_notes: ["Warm Spice", "Molasses", "Velvet Crema"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-jaggery-reg",
        product_id: "prod-jaggery-flat-white",
        label: "Regular (220ml)",
        price_paise: 27000,
        texture_override_url: null,
        color_hex: "#b86b35",
      },
      {
        id: "var-jaggery-lg",
        product_id: "prod-jaggery-flat-white",
        label: "Large (320ml)",
        price_paise: 32000,
        texture_override_url: null,
        color_hex: "#d98a4e",
      },
    ],
  },
  {
    id: "prod-iced-salted-caramel",
    category_id: "cat-iced-craft",
    name: "Iced Salted Caramel Latte",
    slug: "iced-salted-caramel-latte",
    description:
      "House-burnt sea-salt caramel swirled over chilled milk and bold double-shot espresso over crystal ice.",
    image_url:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
    model_3d_url: "/models/coffee-cup.glb",
    is_featured_3d: true,
    in_stock: true,
    is_veg: true,
    is_iced: true,
    allergens: ["Dairy"],
    tasting_notes: ["Burnt Sugar", "Sea Salt", "Toasted Almond"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-caramel-reg",
        product_id: "prod-iced-salted-caramel",
        label: "Regular Iced (300ml)",
        price_paise: 29500,
        texture_override_url: null,
        color_hex: "#d98a4e",
      },
      {
        id: "var-caramel-lg",
        product_id: "prod-iced-salted-caramel",
        label: "Large Iced + Extra Shot",
        price_paise: 35500,
        texture_override_url: null,
        color_hex: "#a86432",
      },
    ],
  },
  {
    id: "prod-iced-matcha",
    category_id: "cat-iced-craft",
    name: "Ceremonial Uji Iced Matcha",
    slug: "ceremonial-iced-matcha",
    description:
      "First-harvest Uji ceremonial matcha whisked to order over oat or dairy milk with light vanilla nectar.",
    image_url:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",
    model_3d_url: "/models/coffee-cup.glb",
    is_featured_3d: true,
    in_stock: true,
    is_veg: true,
    is_iced: true,
    allergens: ["Dairy"],
    tasting_notes: ["Umami", "Sweet Grass", "Creamy Finish"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-matcha-oat",
        product_id: "prod-iced-matcha",
        label: "Regular Oat Milk (300ml)",
        price_paise: 34000,
        texture_override_url: null,
        color_hex: "#6c8f58",
      },
      {
        id: "var-matcha-coconut",
        product_id: "prod-iced-matcha",
        label: "Large Coconut Milk (380ml)",
        price_paise: 39000,
        texture_override_url: null,
        color_hex: "#82a96b",
      },
    ],
  },
  {
    id: "prod-cold-brew",
    category_id: "cat-iced-craft",
    name: "18-Hour Barrel Cold Brew",
    slug: "barrel-cold-brew",
    description:
      "Slow-steeped coarse-ground Coorg Arabica served over a single hand-carved ice sphere with orange peel.",
    image_url:
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
    model_3d_url: null,
    is_featured_3d: false,
    in_stock: true,
    is_veg: true,
    is_iced: true,
    allergens: [],
    tasting_notes: ["Dark Chocolate", "Blood Orange", "Smooth Body"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-cb-black",
        product_id: "prod-cold-brew",
        label: "Classic Black (300ml)",
        price_paise: 25000,
        texture_override_url: null,
        color_hex: "#3b261d",
      },
      {
        id: "var-cb-tonic",
        product_id: "prod-cold-brew",
        label: "Tonic Citrus Fizz (320ml)",
        price_paise: 29000,
        texture_override_url: null,
        color_hex: "#c97b3e",
      },
    ],
  },
  {
    id: "prod-ember-beans",
    category_id: "cat-coffee-beans",
    name: "Ember Signature Roast Collection",
    slug: "ember-signature-roast-beans",
    description:
      "Small-batch Indian specialty arabica roasted every Tuesday in our brass drum roaster. Click any roast profile to update the live 3D coffee bag.",
    image_url:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
    model_3d_url: "/models/coffee-bag.glb",
    is_featured_3d: true,
    in_stock: true,
    is_veg: true,
    is_iced: false,
    allergens: [],
    tasting_notes: ["Single-Origin", "Small Batch", "100% Arabica"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-beans-house-250",
        product_id: "prod-ember-beans",
        label: "Chikmagalur House Medium (250g)",
        price_paise: 58000,
        texture_override_url: "/textures/roast-house.webp",
        color_hex: "#d98a4e",
      },
      {
        id: "var-beans-ratnagiri-250",
        product_id: "prod-ember-beans",
        label: "Ratnagiri Floral Light (250g)",
        price_paise: 64000,
        texture_override_url: "/textures/roast-light.webp",
        color_hex: "#c26b4a",
      },
      {
        id: "var-beans-coorg-250",
        product_id: "prod-ember-beans",
        label: "Coorg Espresso Dark (250g)",
        price_paise: 56000,
        texture_override_url: "/textures/roast-dark.webp",
        color_hex: "#8a5236",
      },
      {
        id: "var-beans-house-500",
        product_id: "prod-ember-beans",
        label: "Chikmagalur House Medium (500g)",
        price_paise: 108000,
        texture_override_url: "/textures/roast-house.webp",
        color_hex: "#e09a62",
      },
    ],
  },
  {
    id: "prod-malabar-beans",
    category_id: "cat-coffee-beans",
    name: "Monsoon Malabar Reserve",
    slug: "monsoon-malabar-reserve",
    description:
      "Coastal wind-aged beans with low acidity, syrupy mouthfeel, and lingering smoky spice notes.",
    image_url:
      "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80",
    model_3d_url: "/models/coffee-bag.glb",
    is_featured_3d: true,
    in_stock: true,
    is_veg: true,
    is_iced: false,
    allergens: [],
    tasting_notes: ["Smoky Wood", "Clove", "Bittersweet Cocoa"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-malabar-250-wb",
        product_id: "prod-malabar-beans",
        label: "250g Whole Bean",
        price_paise: 62000,
        texture_override_url: "/textures/roast-malabar.webp",
        color_hex: "#b56a3c",
      },
      {
        id: "var-malabar-250-esp",
        product_id: "prod-malabar-beans",
        label: "250g Espresso Fine Grind",
        price_paise: 62000,
        texture_override_url: "/textures/roast-malabar.webp",
        color_hex: "#8a5236",
      },
      {
        id: "var-malabar-500-wb",
        product_id: "prod-malabar-beans",
        label: "500g Whole Bean",
        price_paise: 115000,
        texture_override_url: "/textures/roast-malabar.webp",
        color_hex: "#d98a4e",
      },
    ],
  },
  {
    id: "prod-almond-croissant",
    category_id: "cat-bakery-kitchen",
    name: "Brown-Butter Almond Croissant",
    slug: "almond-croissant",
    description:
      "27-layer French butter pastry twice-baked with toasted almond frangipane and flaked Mamra almonds.",
    image_url:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
    model_3d_url: "/models/croissant.glb",
    is_featured_3d: true,
    in_stock: true,
    is_veg: true,
    is_iced: false,
    allergens: ["Gluten", "Dairy", "Tree Nuts"],
    tasting_notes: ["Flaky Butter", "Toasted Almond", "Vanilla Bean"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-croissant-1",
        product_id: "prod-almond-croissant",
        label: "Single Pastry",
        price_paise: 26000,
        texture_override_url: null,
        color_hex: "#d9a45b",
      },
      {
        id: "var-croissant-2",
        product_id: "prod-almond-croissant",
        label: "Box of 2",
        price_paise: 49000,
        texture_override_url: null,
        color_hex: "#c99044",
      },
    ],
  },
  {
    id: "prod-chicken-sourdough",
    category_id: "cat-bakery-kitchen",
    name: "Smoked Chicken & Pesto Sourdough",
    slug: "smoked-chicken-pesto-sourdough",
    description:
      "Char-grilled herb chicken, house basil walnut pesto, roasted tomatoes, and aged cheddar on toasted country sourdough.",
    image_url:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
    model_3d_url: null,
    is_featured_3d: false,
    in_stock: true,
    is_veg: false,
    is_iced: false,
    allergens: ["Gluten", "Dairy", "Tree Nuts"],
    tasting_notes: ["Smoky Herb", "Tangy Sourdough", "Fresh Basil"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-chicken-full",
        product_id: "prod-chicken-sourdough",
        label: "Full Sandwich + Salad",
        price_paise: 42000,
        texture_override_url: null,
        color_hex: "#a44d34",
      },
    ],
  },
  {
    id: "prod-mushroom-tartine",
    category_id: "cat-bakery-kitchen",
    name: "Truffle Mushroom & Brie Tartine",
    slug: "truffle-mushroom-tartine",
    description:
      "Sauteed wild cremini mushrooms, whipped garlic brie, thyme, and black truffle oil on hearth-baked sourdough.",
    image_url:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
    model_3d_url: null,
    is_featured_3d: false,
    in_stock: true,
    is_veg: true,
    is_iced: false,
    allergens: ["Gluten", "Dairy"],
    tasting_notes: ["Earthy Truffle", "Creamy Brie", "Crisp Crust"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-tartine-2",
        product_id: "prod-mushroom-tartine",
        label: "2 Slices on Sourdough",
        price_paise: 38000,
        texture_override_url: null,
        color_hex: "#7c5a43",
      },
    ],
  },
  {
    id: "prod-shakshuka-toast",
    category_id: "cat-bakery-kitchen",
    name: "Brioche Shakshuka Egg Toast",
    slug: "brioche-shakshuka-toast",
    description:
      "Spiced roasted tomato-pepper ragout topped with a soft poached farm egg, feta crumble, and zaatar on toasted brioche.",
    image_url:
      "https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80",
    model_3d_url: null,
    is_featured_3d: false,
    in_stock: true,
    is_veg: false,
    is_iced: false,
    allergens: ["Gluten", "Dairy", "Egg"],
    tasting_notes: ["Spiced Tomato", "Rich Yolk", "Warm Zaatar"],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: "var-shakshuka-1",
        product_id: "prod-shakshuka-toast",
        label: "Single Plate",
        price_paise: 36000,
        texture_override_url: null,
        color_hex: "#b94e34",
      },
    ],
  },
];

export const FALLBACK_TABLES: CafeTable[] = [
  {
    id: "table-window-1",
    name: "Window Booth 1",
    zone: "indoor",
    capacity: 4,
    description:
      "Sunlit walnut banquette framed by terracotta plaster arches and warm brass pendants.",
    preview_3d_camera_pos: { position: [3.2, 2.2, 4.1], target: [0, 0.6, 0] },
  },
  {
    id: "table-library-2",
    name: "Walnut Library Table 2",
    zone: "indoor",
    capacity: 6,
    description:
      "Quiet communal walnut slab ideal for laptops, tastings, and small group catch-ups.",
    preview_3d_camera_pos: { position: [-2.8, 2.5, 4.4], target: [0, 0.6, 0] },
  },
  {
    id: "table-patio-1",
    name: "Terracotta Patio 1",
    zone: "patio",
    capacity: 2,
    description:
      "Breezy outdoor bistro table tucked beneath string lights and potted palms.",
    preview_3d_camera_pos: { position: [2.4, 2.0, 3.8], target: [0, 0.5, 0] },
  },
  {
    id: "table-courtyard-4",
    name: "Garden Courtyard 4",
    zone: "patio",
    capacity: 4,
    description:
      "Shaded stone courtyard seating surrounded by jasmine vines and warm lanterns.",
    preview_3d_camera_pos: { position: [3.6, 2.4, 3.6], target: [0, 0.5, 0] },
  },
  {
    id: "table-bar-1",
    name: "Espresso Slow Bar 1",
    zone: "bar",
    capacity: 2,
    description:
      "Front-row brushed brass stools directly across from the V60 pour-over & espresso bar.",
    preview_3d_camera_pos: { position: [0.8, 1.8, 3.5], target: [0, 0.7, 0] },
  },
  {
    id: "table-roaster-2",
    name: "Roaster Counter 2",
    zone: "bar",
    capacity: 2,
    description:
      "Intimate bar seats overlooking our copper drum roaster and tasting flight station.",
    preview_3d_camera_pos: { position: [-1.2, 1.8, 3.5], target: [0, 0.7, 0] },
  },
];

function hasLiveSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project-ref"));
}

export async function getCatalogData(): Promise<{
  categories: Category[];
  products: ProductWithVariants[];
  isLiveDb: boolean;
}> {
  if (!hasLiveSupabaseEnv()) {
    return {
      categories: FALLBACK_CATEGORIES,
      products: FALLBACK_PRODUCTS,
      isLiveDb: false,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const [{ data: categories, error: catErr }, { data: products, error: prodErr }] =
      await Promise.all([
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase
          .from("products")
          .select("*, product_variants(*)")
          .order("created_at", { ascending: true }),
      ]);

    if (catErr || prodErr || !products || products.length === 0) {
      return {
        categories: FALLBACK_CATEGORIES,
        products: FALLBACK_PRODUCTS,
        isLiveDb: false,
      };
    }

    return {
      categories: (categories ?? []) as Category[],
      products: products as ProductWithVariants[],
      isLiveDb: true,
    };
  } catch {
    return {
      categories: FALLBACK_CATEGORIES,
      products: FALLBACK_PRODUCTS,
      isLiveDb: false,
    };
  }
}

export async function getCafeTables(): Promise<{
  tables: CafeTable[];
  isLiveDb: boolean;
}> {
  if (!hasLiveSupabaseEnv()) {
    return { tables: FALLBACK_TABLES, isLiveDb: false };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("cafe_tables")
      .select("*")
      .order("zone", { ascending: true });

    if (error || !data || data.length === 0) {
      return { tables: FALLBACK_TABLES, isLiveDb: false };
    }

    return { tables: data as CafeTable[], isLiveDb: true };
  } catch {
    return { tables: FALLBACK_TABLES, isLiveDb: false };
  }
}
