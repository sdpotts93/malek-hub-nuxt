import { defineStore } from 'pinia'
import type { Cart, CartLineItem, BirthPosterState } from '~/types'

const CART_STORAGE_KEY = 'studiomalek_hub_cart_id'

interface CartState {
  cartId: string | null
  lines: CartLineItem[]
  isLoading: boolean
  error: string | null
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cartId: null,
    lines: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    // Total quantity of items
    totalQuantity(state): number {
      return state.lines.reduce((sum, item) => sum + item.quantity, 0)
    },

    // Subtotal price
    subtotal(state): number {
      return state.lines.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },

    // Check if cart is empty
    isEmpty(state): boolean {
      return state.lines.length === 0
    },

    // Get checkout URL
    checkoutUrl(state): string {
      // In production, this would be the Shopify checkout URL
      // For now, return a placeholder
      if (state.cartId) {
        return `https://studiomalek.myshopify.com/cart/${state.cartId}`
      }
      return '#'
    },
  },

  actions: {
    // Initialize cart from localStorage
    async init() {
      if (import.meta.client) {
        const storedCartId = localStorage.getItem(CART_STORAGE_KEY)
        if (storedCartId) {
          this.cartId = storedCartId
          await this.fetchCart()
        }
      }
    },

    // Fetch cart from Shopify (mock for now)
    async fetchCart() {
      if (!this.cartId) return

      this.isLoading = true
      this.error = null

      try {
        // TODO: Replace with actual Shopify Storefront API call
        // const response = await $fetch('/api/shopify/cart', {
        //   method: 'POST',
        //   body: { cartId: this.cartId }
        // })

        // Mock: Keep existing lines
        console.log('[Cart] Fetching cart:', this.cartId)
      } catch (error) {
        this.error = 'Error al cargar el carrito'
        console.error('[Cart] Fetch error:', error)
      } finally {
        this.isLoading = false
      }
    },

    // Create new cart
    async createCart(): Promise<string> {
      this.isLoading = true
      this.error = null

      try {
        // TODO: Replace with actual Shopify Storefront API call
        // const response = await $fetch('/api/shopify/cart/create', {
        //   method: 'POST'
        // })

        // Mock: Generate a random cart ID
        const newCartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        this.cartId = newCartId

        if (import.meta.client) {
          localStorage.setItem(CART_STORAGE_KEY, newCartId)
        }

        console.log('[Cart] Created new cart:', newCartId)
        return newCartId
      } catch (error) {
        this.error = 'Error al crear el carrito'
        console.error('[Cart] Create error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Add item to cart
    async addItem(item: Omit<CartLineItem, 'id'>) {
      this.isLoading = true
      this.error = null

      try {
        // Create cart if doesn't exist
        if (!this.cartId) {
          await this.createCart()
        }

        // TODO: Replace with actual Shopify Storefront API call
        // const response = await $fetch('/api/shopify/cart/add', {
        //   method: 'POST',
        //   body: { cartId: this.cartId, lines: [item] }
        // })

        // Mock: Add item locally
        const newItem: CartLineItem = {
          ...item,
          id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }

        // Check if same variant exists (without custom design)
        const existingIndex = this.lines.findIndex(
          (line) => line.variantId === item.variantId && !line.designConfig
        )

        if (existingIndex >= 0 && !item.designConfig) {
          // Increment quantity for non-custom items
          this.lines[existingIndex].quantity += item.quantity
        } else {
          // Add as new line (custom designs are always separate)
          this.lines.push(newItem)
        }

        console.log('[Cart] Added item:', newItem)
      } catch (error) {
        this.error = 'Error al agregar al carrito'
        console.error('[Cart] Add error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Add birth poster to cart
    async addBirthPoster(
      designState: BirthPosterState,
      thumbnail: string,
      variantId: string,
      price: number
    ) {
      const item: Omit<CartLineItem, 'id'> = {
        variantId,
        quantity: 1,
        title: 'Birth Poster Personalizado',
        price,
        image: thumbnail,
        designConfig: designState,
        designThumbnail: thumbnail,
        customAttributes: {
          babyCount: String(designState.babyCount),
          posterSize: designState.posterSize,
          babyNames: designState.babies.map((b) => b.nombre).join(', '),
        },
      }

      await this.addItem(item)
    },

    // Update item quantity
    async updateQuantity(lineId: string, quantity: number) {
      this.isLoading = true
      this.error = null

      try {
        if (quantity <= 0) {
          await this.removeItem(lineId)
          return
        }

        // TODO: Replace with actual Shopify Storefront API call

        // Mock: Update locally
        const item = this.lines.find((line) => line.id === lineId)
        if (item) {
          item.quantity = quantity
        }

        console.log('[Cart] Updated quantity:', lineId, quantity)
      } catch (error) {
        this.error = 'Error al actualizar cantidad'
        console.error('[Cart] Update error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Remove item from cart
    async removeItem(lineId: string) {
      this.isLoading = true
      this.error = null

      try {
        // TODO: Replace with actual Shopify Storefront API call

        // Mock: Remove locally
        const index = this.lines.findIndex((line) => line.id === lineId)
        if (index >= 0) {
          this.lines.splice(index, 1)
        }

        console.log('[Cart] Removed item:', lineId)
      } catch (error) {
        this.error = 'Error al eliminar del carrito'
        console.error('[Cart] Remove error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Clear cart
    async clearCart() {
      this.isLoading = true

      try {
        // TODO: Replace with actual Shopify Storefront API call

        // Mock: Clear locally
        this.lines = []
        this.cartId = null

        if (import.meta.client) {
          localStorage.removeItem(CART_STORAGE_KEY)
        }

        console.log('[Cart] Cleared')
      } catch (error) {
        console.error('[Cart] Clear error:', error)
      } finally {
        this.isLoading = false
      }
    },

    // Proceed to checkout
    async checkout() {
      if (this.isEmpty) return

      // TODO: Get actual checkout URL from Shopify
      // For now, log and show alert
      console.log('[Cart] Proceeding to checkout:', this.checkoutUrl)

      // In production:
      // window.location.href = this.checkoutUrl
    },
  },
})
