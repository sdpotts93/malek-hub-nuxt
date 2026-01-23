import { defineStore } from 'pinia'

const CART_STORAGE_KEY = 'studiomalek_hub_cart_id'

// Types for Shopify cart responses
interface ShopifyCartLine {
  id: string
  quantity: number
  variantId: string
  variantTitle: string
  productTitle: string
  price: number
  image: string | null
  attributes: Array<{ key: string; value: string }>
}

interface DiscountCode {
  code: string
  applicable: boolean
}

interface AutomaticDiscount {
  title: string
  amount: number
  type: 'automatic'
}

interface ShopifyCartResponse {
  id: string
  checkoutUrl: string
  totalQuantity: number
  subtotal: number
  total: number
  lines: ShopifyCartLine[]
  discountCodes?: DiscountCode[]
  automaticDiscounts?: AutomaticDiscount[]
  totalDiscount?: number
}

// Internal cart line with design image support
export interface CartLine {
  id: string
  quantity: number
  variantId: string
  variantTitle: string
  productTitle: string
  price: number
  shopifyImage: string | null // Original Shopify product image
  designImage: string | null // Custom design image from S3 (_imagen attribute)
  thumbnailImage: string | null // Low-res thumbnail from S3 (_thumbnail attribute)
  attributes: Array<{ key: string; value: string }>
}

interface CartState {
  cartId: string | null
  checkoutUrl: string | null
  lines: CartLine[]
  totalQuantity: number
  subtotal: number
  total: number
  discountCodes: DiscountCode[]
  automaticDiscounts: AutomaticDiscount[]
  totalDiscount: number
  isLoading: boolean
  isApplyingDiscount: boolean
  error: string | null
  discountError: string | null
  _initialized: boolean // Track if init has been called
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cartId: null,
    checkoutUrl: null,
    lines: [],
    totalQuantity: 0,
    subtotal: 0,
    total: 0,
    discountCodes: [],
    automaticDiscounts: [],
    totalDiscount: 0,
    isLoading: false,
    isApplyingDiscount: false,
    error: null,
    discountError: null,
    _initialized: false,
  }),

  getters: {
    isEmpty: (state) => state.lines.length === 0,

    // Get display image for a cart line (design image if available, otherwise Shopify image)
    getLineImage: () => (line: CartLine): string | null => {
      return line.designImage || line.shopifyImage
    },

    // Get applicable discount codes
    appliedDiscountCodes: (state) => state.discountCodes.filter(d => d.applicable),

    // Check if there's an active discount
    hasDiscount: (state) => state.totalDiscount > 0,
  },

  actions: {
    // Transform Shopify response to internal cart lines
    _transformLines(shopifyLines: ShopifyCartLine[]): CartLine[] {
      return shopifyLines.map(line => {
        // Extract design images from attributes
        const imagenAttr = line.attributes.find(a => a.key === '_imagen')
        const thumbnailAttr = line.attributes.find(a => a.key === '_thumbnail')
        return {
          id: line.id,
          quantity: line.quantity,
          variantId: line.variantId,
          variantTitle: line.variantTitle,
          productTitle: line.productTitle,
          price: line.price,
          shopifyImage: line.image,
          designImage: imagenAttr?.value || null,
          thumbnailImage: thumbnailAttr?.value || null,
          attributes: line.attributes,
        }
      })
    },

    // Update state from Shopify response
    _updateFromResponse(response: ShopifyCartResponse) {
      this.cartId = response.id
      this.checkoutUrl = response.checkoutUrl
      this.totalQuantity = response.totalQuantity
      this.subtotal = response.subtotal
      this.total = response.total
      this.lines = this._transformLines(response.lines)

      // Update discount info if present
      if (response.discountCodes) {
        this.discountCodes = response.discountCodes
      }
      if (response.automaticDiscounts) {
        this.automaticDiscounts = response.automaticDiscounts
      }
      if (response.totalDiscount !== undefined) {
        this.totalDiscount = response.totalDiscount
      }

      // Persist cart ID
      if (import.meta.client && this.cartId) {
        localStorage.setItem(CART_STORAGE_KEY, this.cartId)
      }
    },

    // Initialize cart from localStorage (idempotent - only runs once)
    async init() {
      if (!import.meta.client) return

      // Prevent duplicate initialization
      if (this._initialized) return
      this._initialized = true

      const storedCartId = localStorage.getItem(CART_STORAGE_KEY)
      if (storedCartId) {
        this.cartId = storedCartId
        await this.fetchCart()
      }
    },

    // Fetch existing cart from Shopify
    async fetchCart() {
      if (!this.cartId) return

      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<ShopifyCartResponse>(
          '/api/shopify/cart/get',
          {
            method: 'POST',
            body: { cartId: this.cartId },
          }
        )
        this._updateFromResponse(response)
      } catch (err) {
        console.error('[Cart] Fetch error:', err)
        // Cart might have expired, clear it
        this.cartId = null
        this.lines = []
        if (import.meta.client) {
          localStorage.removeItem(CART_STORAGE_KEY)
        }
      } finally {
        this.isLoading = false
      }
    },

    // Create a new cart
    async createCart(): Promise<string> {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<{ cartId: string; checkoutUrl: string }>(
          '/api/shopify/cart/create',
          { method: 'POST' }
        )

        this.cartId = response.cartId
        this.checkoutUrl = response.checkoutUrl

        if (import.meta.client) {
          localStorage.setItem(CART_STORAGE_KEY, response.cartId)
        }

        return response.cartId
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create cart'
        this.error = message
        console.error('[Cart] Create error:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // Add item to cart
    async addItem(
      variantId: string,
      quantity: number = 1,
      attributes: Array<{ key: string; value: string }> = []
    ) {
      this.isLoading = true
      this.error = null

      try {
        // Create cart if doesn't exist
        if (!this.cartId) {
          await this.createCart()
        }

        const response = await $fetch<ShopifyCartResponse>(
          '/api/shopify/cart/add',
          {
            method: 'POST',
            body: {
              cartId: this.cartId,
              lines: [{
                merchandiseId: variantId,
                quantity,
                attributes,
              }],
            },
          }
        )

        this._updateFromResponse(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add to cart'
        this.error = message
        console.error('[Cart] Add error:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // Update line quantity
    async updateQuantity(lineId: string, quantity: number) {
      if (!this.cartId) return

      // If quantity is 0 or less, remove the item
      if (quantity <= 0) {
        await this.removeItem(lineId)
        return
      }

      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<ShopifyCartResponse>(
          '/api/shopify/cart/update',
          {
            method: 'POST',
            body: {
              cartId: this.cartId,
              lines: [{ id: lineId, quantity }],
            },
          }
        )

        this._updateFromResponse(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update quantity'
        this.error = message
        console.error('[Cart] Update error:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // Remove item from cart
    async removeItem(lineId: string) {
      if (!this.cartId) return

      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<ShopifyCartResponse>(
          '/api/shopify/cart/remove',
          {
            method: 'POST',
            body: {
              cartId: this.cartId,
              lineIds: [lineId],
            },
          }
        )

        this._updateFromResponse(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove item'
        this.error = message
        console.error('[Cart] Remove error:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // Clear cart (just remove from localStorage, Shopify carts expire naturally)
    clearCart() {
      this.cartId = null
      this.checkoutUrl = null
      this.lines = []
      this.totalQuantity = 0
      this.subtotal = 0

      if (import.meta.client) {
        localStorage.removeItem(CART_STORAGE_KEY)
      }
    },

    // Navigate to Shopify checkout
    checkout() {
      if (this.checkoutUrl && import.meta.client) {
        window.location.href = this.checkoutUrl
      }
    },

    // Apply a discount code
    async applyDiscountCode(code: string) {
      if (!this.cartId || !code.trim()) return

      this.isApplyingDiscount = true
      this.discountError = null

      try {
        // Combine existing codes with the new one (if not already present)
        const existingCodes = this.discountCodes.map(d => d.code)
        const normalizedCode = code.trim().toUpperCase()

        if (existingCodes.includes(normalizedCode)) {
          this.discountError = 'Este código ya está aplicado'
          return
        }

        const allCodes = [...existingCodes, normalizedCode]

        const response = await $fetch<ShopifyCartResponse>(
          '/api/shopify/cart/discount',
          {
            method: 'POST',
            body: {
              cartId: this.cartId,
              discountCodes: allCodes,
            },
          }
        )

        this._updateFromResponse(response)

        // Check if the new code was actually applied
        const appliedCode = this.discountCodes.find(
          d => d.code.toUpperCase() === normalizedCode
        )
        if (appliedCode && !appliedCode.applicable) {
          this.discountError = 'El código no es válido o no aplica a estos productos'
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al aplicar el código'
        this.discountError = message
        console.error('[Cart] Apply discount error:', err)
      } finally {
        this.isApplyingDiscount = false
      }
    },

    // Remove a discount code
    async removeDiscountCode(code: string) {
      if (!this.cartId) return

      this.isApplyingDiscount = true
      this.discountError = null

      try {
        // Filter out the code to remove
        const remainingCodes = this.discountCodes
          .map(d => d.code)
          .filter(c => c.toUpperCase() !== code.toUpperCase())

        const response = await $fetch<ShopifyCartResponse>(
          '/api/shopify/cart/discount',
          {
            method: 'POST',
            body: {
              cartId: this.cartId,
              discountCodes: remainingCodes,
            },
          }
        )

        this._updateFromResponse(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al eliminar el código'
        this.discountError = message
        console.error('[Cart] Remove discount error:', err)
      } finally {
        this.isApplyingDiscount = false
      }
    },
  },
})
