"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  buildCartLineKey,
  type CartItem,
  type HeroDrinkId,
  type TableZone,
} from "@/types/database";

export interface BeanBagPreviewState {
  productId: string | null;
  variantId: string | null;
  variantLabel: string;
  textureUrl: string;
  accentColorHex: string;
}

interface AddToCartInput {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  imageUrl: string;
  isVeg: boolean;
  pricePaise: number;
  qty?: number;
  customizations?: Record<string, string>;
}

interface CafeState {
  // --- 3D Aesthetic & Live Commerce Sync ---
  activeHeroDrink: HeroDrinkId;
  selectedBeanTextureUrl: string;
  selectedBeanColorHex: string;
  beanPreview: BeanBagPreviewState;
  activeReservationZone: TableZone;
  isLiteMode: boolean;

  setActiveHeroDrink: (drink: HeroDrinkId) => void;
  setSelectedBeanTexture: (url: string, colorHex?: string) => void;
  setBeanPreview: (preview: Partial<BeanBagPreviewState>) => void;
  setActiveReservationZone: (zone: TableZone) => void;
  toggleLiteMode: (val?: boolean) => void;

  // --- Commercial Cart & Drawer UI ---
  cart: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (input: AddToCartInput) => void;
  updateItemQty: (lineKey: string, qty: number) => void;
  removeFromCart: (lineKey: string) => void;
  clearCart: () => void;
}

const DEFAULT_BEAN_TEXTURE = "/textures/roast-house.webp";
const DEFAULT_BEAN_COLOR = "#d98a4e";

export const useCafeStore = create<CafeState>()(
  persist(
    (set) => ({
      activeHeroDrink: "espresso",
      selectedBeanTextureUrl: DEFAULT_BEAN_TEXTURE,
      selectedBeanColorHex: DEFAULT_BEAN_COLOR,
      beanPreview: {
        productId: null,
        variantId: null,
        variantLabel: "Chikmagalur Estate — Medium Roast",
        textureUrl: DEFAULT_BEAN_TEXTURE,
        accentColorHex: DEFAULT_BEAN_COLOR,
      },
      activeReservationZone: "indoor",
      isLiteMode: false,

      setActiveHeroDrink: (drink) => set({ activeHeroDrink: drink }),

      setSelectedBeanTexture: (url, colorHex) =>
        set((state) => ({
          selectedBeanTextureUrl: url,
          selectedBeanColorHex: colorHex ?? state.selectedBeanColorHex,
          beanPreview: {
            ...state.beanPreview,
            textureUrl: url,
            accentColorHex: colorHex ?? state.beanPreview.accentColorHex,
          },
        })),

      setBeanPreview: (preview) =>
        set((state) => {
          const next = { ...state.beanPreview, ...preview };
          return {
            beanPreview: next,
            selectedBeanTextureUrl: next.textureUrl,
            selectedBeanColorHex: next.accentColorHex,
          };
        }),

      setActiveReservationZone: (zone) => set({ activeReservationZone: zone }),

      toggleLiteMode: (val) =>
        set((state) => ({
          isLiteMode: typeof val === "boolean" ? val : !state.isLiteMode,
        })),

      cart: [],
      isCartOpen: false,

      setCartOpen: (open) => set({ isCartOpen: open }),

      addToCart: (input) =>
        set((state) => {
          const qtyToAdd = Math.max(1, input.qty ?? 1);
          const lineKey = buildCartLineKey(input.variantId, input.customizations);
          const existing = state.cart.find((item) => item.lineKey === lineKey);

          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.lineKey === lineKey
                  ? { ...item, qty: item.qty + qtyToAdd }
                  : item
              ),
              isCartOpen: true,
            };
          }

          const newItem: CartItem = {
            lineKey,
            productId: input.productId,
            variantId: input.variantId,
            productName: input.productName,
            variantLabel: input.variantLabel,
            imageUrl: input.imageUrl,
            isVeg: input.isVeg,
            pricePaise: input.pricePaise,
            qty: qtyToAdd,
            customizations: input.customizations,
          };

          return {
            cart: [...state.cart, newItem],
            isCartOpen: true,
          };
        }),

      updateItemQty: (lineKey, qty) =>
        set((state) => {
          if (qty <= 0) {
            return {
              cart: state.cart.filter((item) => item.lineKey !== lineKey),
            };
          }
          return {
            cart: state.cart.map((item) =>
              item.lineKey === lineKey ? { ...item, qty } : item
            ),
          };
        }),

      removeFromCart: (lineKey) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.lineKey !== lineKey),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "ember-bean-cafe-store-v1",
      storage: createJSONStorage(() => localStorage),
      // Persist cart and Lite Mode preference; keep UI modals closed on refresh
      partialize: (state) => ({
        cart: state.cart,
        isLiteMode: state.isLiteMode,
      }),
    }
  )
);

// --- Reusable Derived Selectors ---
export const selectCartCount = (state: CafeState): number =>
  state.cart.reduce((sum, item) => sum + item.qty, 0);

export const selectCartSubtotalPaise = (state: CafeState): number =>
  state.cart.reduce((sum, item) => sum + item.pricePaise * item.qty, 0);
