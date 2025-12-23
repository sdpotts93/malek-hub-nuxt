/**
 * Shopify Cart Composable
 *
 * This is a placeholder implementation with mock data.
 * TODO: Replace with actual Shopify Storefront API integration
 *
 * Shopify Storefront API endpoints needed:
 * - cartCreate mutation
 * - cartLinesAdd mutation
 * - cartLinesUpdate mutation
 * - cartLinesRemove mutation
 * - cart query
 */

import { useCartStore } from '~/stores/cart'
import type { BirthPosterState } from '~/types'

// Mock product data for birth poster
const BIRTH_POSTER_VARIANTS = {
  // Vertical sizes (1-2 babies)
  '30x40': {
    id: 'gid://shopify/ProductVariant/30x40',
    price: 1350,
    compareAtPrice: 3250,
  },
  '40x50': {
    id: 'gid://shopify/ProductVariant/40x50',
    price: 1550,
    compareAtPrice: 3650,
  },
  '50x70': {
    id: 'gid://shopify/ProductVariant/50x70',
    price: 1850,
    compareAtPrice: 4250,
  },
  '70x100': {
    id: 'gid://shopify/ProductVariant/70x100',
    price: 2350,
    compareAtPrice: 5250,
  },
  // Horizontal sizes (3-4 babies)
  '40x30': {
    id: 'gid://shopify/ProductVariant/40x30',
    price: 1350,
    compareAtPrice: 3250,
  },
  '50x40': {
    id: 'gid://shopify/ProductVariant/50x40',
    price: 1550,
    compareAtPrice: 3650,
  },
  '70x50': {
    id: 'gid://shopify/ProductVariant/70x50',
    price: 1850,
    compareAtPrice: 4250,
  },
  '100x70': {
    id: 'gid://shopify/ProductVariant/100x70',
    price: 2350,
    compareAtPrice: 5250,
  },
}

// Mock frame prices (to add to total)
const FRAME_PRICES = {
  'frame-natural': 850,
  'frame-black': 850,
  'frame-white': 850,
  'frame-oak': 950,
}

export function useShopifyCart() {
  const cartStore = useCartStore()

  /**
   * Get variant info for a poster size
   */
  function getVariantForSize(size: string) {
    return BIRTH_POSTER_VARIANTS[size as keyof typeof BIRTH_POSTER_VARIANTS] || null
  }

  /**
   * Calculate total price for birth poster
   */
  function calculateBirthPosterPrice(state: BirthPosterState): {
    price: number
    compareAtPrice: number
  } {
    const variant = getVariantForSize(state.posterSize)
    if (!variant) {
      return { price: 0, compareAtPrice: 0 }
    }

    let price = variant.price
    let compareAtPrice = variant.compareAtPrice

    // Add frame price if selected
    if (state.frameStyle) {
      const framePrice = FRAME_PRICES[state.frameStyle.id as keyof typeof FRAME_PRICES] || 0
      price += framePrice
      compareAtPrice += framePrice
    }

    return { price, compareAtPrice }
  }

  /**
   * Format price for display (Mexican Pesos)
   */
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  /**
   * Add birth poster to cart
   */
  async function addBirthPosterToCart(
    state: BirthPosterState,
    thumbnail: string
  ): Promise<void> {
    const variant = getVariantForSize(state.posterSize)
    if (!variant) {
      throw new Error('Invalid poster size')
    }

    const { price } = calculateBirthPosterPrice(state)

    await cartStore.addBirthPoster(state, thumbnail, variant.id, price)
  }

  /**
   * Initialize cart on mount
   */
  async function initCart() {
    await cartStore.init()
  }

  return {
    // Store state
    cartId: computed(() => cartStore.cartId),
    lines: computed(() => cartStore.lines),
    totalQuantity: computed(() => cartStore.totalQuantity),
    subtotal: computed(() => cartStore.subtotal),
    isEmpty: computed(() => cartStore.isEmpty),
    isLoading: computed(() => cartStore.isLoading),
    error: computed(() => cartStore.error),

    // Actions
    initCart,
    addBirthPosterToCart,
    updateQuantity: cartStore.updateQuantity,
    removeItem: cartStore.removeItem,
    clearCart: cartStore.clearCart,
    checkout: cartStore.checkout,

    // Utilities
    getVariantForSize,
    calculateBirthPosterPrice,
    formatPrice,
  }
}
