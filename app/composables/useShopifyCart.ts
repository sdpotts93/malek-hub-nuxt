/**
 * Shopify Cart Composable
 *
 * Handles fetching product variants, calculating prices,
 * and adding birth posters / personaliza items to cart with S3 image upload.
 */

import { useCartStore } from '~/stores/cart'
import { useBirthPosterStore } from '~/stores/birthPoster'
import type { BirthPosterState, PosterSize } from '~/types'
import type { PersonalizaState, ImageOrientation, PersonalizaSize } from '~/stores/personaliza'
import { PRODUCT_IDS as PERSONALIZA_PRODUCT_IDS, generateHighResCrop, isCropperReady, waitForCropper } from '~/stores/personaliza'

// Validation result
interface ValidationResult {
  isValid: boolean
  message: string | null
  missingBabyIndex: number | null // Index of first baby with missing name
}

// Variant data fetched from Shopify
interface ShopifyVariant {
  id: string
  title: string
  price: number
  compareAtPrice: number | null
  available: boolean
  options: Array<{ name: string; value: string }>
}

interface ProductData {
  id: string
  title: string
  variants: ShopifyVariant[]
}

// Build a lookup map for variants: "size_frame" -> variant
type VariantLookup = Map<string, ShopifyVariant>

export function useShopifyCart() {
  const config = useRuntimeConfig()
  const cartStore = useCartStore()

  // Product and variant state (Birth Poster)
  const product = ref<ProductData | null>(null)
  const variantLookup = ref<VariantLookup>(new Map())
  const isLoadingProduct = ref(false)
  const productError = ref<string | null>(null)

  // Personaliza products state (3 products: square, horizontal, vertical)
  const personalizaProducts = ref<Record<ImageOrientation, ProductData | null>>({
    square: null,
    horizontal: null,
    vertical: null,
  })
  const personalizaVariantLookups = ref<Record<ImageOrientation, VariantLookup>>({
    square: new Map(),
    horizontal: new Map(),
    vertical: new Map(),
  })
  const isLoadingPersonalizaProducts = ref(false)
  const personalizaProductError = ref<string | null>(null)

  // Add to cart state
  const isAddingToCart = ref(false)
  const addToCartError = ref<string | null>(null)

  /**
   * Fetch birth poster product with all variants
   */
  async function fetchProduct() {
    isLoadingProduct.value = true
    productError.value = null

    try {
      const productId = config.public.birthPosterProductId
      const data = await $fetch<ProductData>(`/api/shopify/product/${productId}`)

      product.value = data

      // Build variant lookup map
      const lookup = new Map<string, ShopifyVariant>()
      for (const variant of data.variants) {
        // Parse variant title like "50x70 / Sin marco" or "50x70 / Negro"
        const [size, frame] = variant.title.split(' / ').map(s => s.trim())
        if (size && frame) {
          const key = `${size}_${frame.toLowerCase()}`
          lookup.set(key, variant)
        }
      }
      variantLookup.value = lookup
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load product'
      productError.value = message
      console.error('[ShopifyCart] Fetch error:', err)
    } finally {
      isLoadingProduct.value = false
    }
  }

  /**
   * Get variant for a size and frame combination
   */
  function getVariant(size: PosterSize, frameId: string | null): ShopifyVariant | null {
    const frameKey = frameId ? getFrameName(frameId) : 'sin marco'
    const key = `${size}_${frameKey}`
    return variantLookup.value.get(key) || null
  }

  /**
   * Map frame ID to Shopify option value
   * Frame IDs come as 'frame-negro', 'frame-blanco', etc.
   * Shopify variants use 'Negro', 'Blanco', etc. (lowercase for lookup key)
   */
  function getFrameName(frameId: string): string {
    // Strip 'frame-' prefix if present
    const normalizedId = frameId.replace(/^frame-/, '')

    const frameMap: Record<string, string> = {
      'negro': 'negro',
      'blanco': 'blanco',
      'roble': 'roble',
      'nogal': 'nogal',
    }
    return frameMap[normalizedId] || 'sin marco'
  }

  /**
   * Calculate price for current birth poster state
   */
  function calculatePrice(state: BirthPosterState): {
    price: number
    compareAtPrice: number | null
    variant: ShopifyVariant | null
  } {
    const variant = getVariant(state.posterSize, state.frameStyle?.id || null)

    if (!variant) {
      return { price: 0, compareAtPrice: null, variant: null }
    }

    return {
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      variant,
    }
  }

  /**
   * Format price for display (Mexican Pesos)
   */
  function formatPrice(price: number): string {
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
    return `${formatted} MXN`
  }

  // ==========================================================================
  // Personaliza Methods
  // ==========================================================================

  /**
   * Fetch all personaliza products (square, horizontal, vertical)
   */
  async function fetchPersonalizaProducts() {
    isLoadingPersonalizaProducts.value = true
    personalizaProductError.value = null

    try {
      const orientations: ImageOrientation[] = ['square', 'horizontal', 'vertical']

      await Promise.all(
        orientations.map(async (orientation) => {
          const productId = PERSONALIZA_PRODUCT_IDS[orientation]
          const data = await $fetch<ProductData>(`/api/shopify/product/${productId}`)

          personalizaProducts.value[orientation] = data

          // Build variant lookup for this orientation
          const lookup = new Map<string, ShopifyVariant>()
          for (const variant of data.variants) {
            // Parse variant title like "50x70 / Sin marco" or "50x70 / Negro"
            const [size, frame] = variant.title.split(' / ').map(s => s.trim())
            if (size && frame) {
              const key = `${size}_${frame.toLowerCase()}`
              lookup.set(key, variant)
            }
          }
          personalizaVariantLookups.value[orientation] = lookup
        })
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load personaliza products'
      personalizaProductError.value = message
      console.error('[ShopifyCart] Fetch personaliza products error:', err)
    } finally {
      isLoadingPersonalizaProducts.value = false
    }
  }

  /**
   * Get variant for a personaliza size and frame combination
   */
  function getPersonalizaVariant(
    orientation: ImageOrientation,
    size: PersonalizaSize,
    frameId: string | null
  ): ShopifyVariant | null {
    const frameKey = frameId ? getFrameName(frameId) : 'sin marco'
    const key = `${size}_${frameKey}`
    return personalizaVariantLookups.value[orientation]?.get(key) || null
  }

  /**
   * Calculate price for personaliza state
   */
  function calculatePersonalizaPrice(state: PersonalizaState): {
    price: number
    compareAtPrice: number | null
    variant: ShopifyVariant | null
  } {
    const orientation = getOrientationFromFormat(state.imageFormat)
    const variant = getPersonalizaVariant(
      orientation,
      state.posterSize,
      state.frameStyle?.id || null
    )

    if (!variant) {
      return { price: 0, compareAtPrice: null, variant: null }
    }

    return {
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      variant,
    }
  }

  /**
   * Validate personaliza state before adding to cart
   */
  function validatePersonalizaForCart(state: PersonalizaState): ValidationResult {
    // Check if image is ready
    if (!state.isImageReady || !state.croppedImageUrl) {
      return {
        isValid: false,
        message: 'Por favor sube y recorta una imagen',
        missingBabyIndex: null,
      }
    }

    // Check size warning acknowledgment
    if (state.showSizeWarning && !state.sizeWarningAcknowledged) {
      return {
        isValid: false,
        message: 'Por favor confirma que entiendes la advertencia de resolución',
        missingBabyIndex: null,
      }
    }

    // Check if variant exists
    const orientation = getOrientationFromFormat(state.imageFormat)
    const variant = getPersonalizaVariant(
      orientation,
      state.posterSize,
      state.frameStyle?.id || null
    )
    if (!variant) {
      return {
        isValid: false,
        message: 'Combinación de tamaño y marco no disponible',
        missingBabyIndex: null,
      }
    }

    return {
      isValid: true,
      message: null,
      missingBabyIndex: null,
    }
  }

  /**
   * Add personaliza item to cart
   * 1. Validate state
   * 2. Generate high-res image from canvas
   * 3. Upload to S3 (custom-prints bucket)
   * 4. Add to Shopify cart with image URL as attribute
   */
  async function addPersonalizaToCart(
    canvasElement: HTMLElement,
    state: PersonalizaState
  ): Promise<ValidationResult | null> {
    // Validate first
    const validation = validatePersonalizaForCart(state)
    if (!validation.isValid) {
      addToCartError.value = validation.message
      return validation
    }

    isAddingToCart.value = true
    addToCartError.value = null

    try {
      // 1. Get variant (already validated above)
      const { variant } = calculatePersonalizaPrice(state)
      if (!variant) {
        throw new Error('No se encontró la variante del producto')
      }

      // 2. Generate high-res crop from CropperJS (4000x4000 max)
      // This ensures we use the original image at full resolution
      const { usePersonalizaStore } = await import('~/stores/personaliza')
      const personalizaStore = usePersonalizaStore()

      // Ensure cropper is ready - if not, switch to archivo panel and wait
      if (!isCropperReady()) {
        console.log('[ShopifyCart] Cropper not ready, switching to archivo panel...')
        personalizaStore.setActivePanel('archivo')
        // Wait for Vue to update and cropper to initialize
        await nextTick()
        try {
          await waitForCropper(5000)
        } catch {
          throw new Error('No se pudo inicializar el editor de imagen. Por favor, regresa al panel de Archivo y vuelve a intentar.')
        }
      }

      const highResCropBlob = await generateHighResCrop()
      if (!highResCropBlob) {
        throw new Error('No se pudo generar la imagen de alta resolución. Asegúrate de que la imagen esté cargada.')
      }

      // 3. Temporarily swap the cropped image with high-res version
      // Save current preview for restoration
      const originalCroppedUrl = personalizaStore.croppedImageUrl
      const originalCroppedBlob = personalizaStore.croppedBlob

      // Set high-res version
      personalizaStore.setCroppedImage(highResCropBlob)

      // Wait for canvas to update with high-res image
      await nextTick()
      // Small delay to ensure image is loaded in canvas
      await new Promise(resolve => setTimeout(resolve, 100))

      // 4. Generate images from the canvas element (now using high-res crop)
      const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
      const renderer = useCanvasRenderer()

      // Generate high-res image, then resize it for thumbnail (avoids re-rendering issues)
      const renderResult = await renderer.generatePosterImage(canvasElement)
      const thumbnailDataUrl = await renderer.resizeToThumbnail(renderResult.dataUrl, 200)

      // 5. Restore original preview (don't leave high-res in memory)
      if (originalCroppedBlob) {
        personalizaStore.setCroppedImage(originalCroppedBlob)
      } else if (originalCroppedUrl) {
        // If we only had the URL, regenerate from the cropper
        // This shouldn't happen in normal flow, but just in case
        console.warn('[ShopifyCart] Restoring from URL, preview may be regenerated')
      }

      // Convert thumbnail data URL to blob
      const thumbnailResponse = await fetch(thumbnailDataUrl)
      const thumbnailBlob = await thumbnailResponse.blob()

      // 6. Upload both to S3 (custom-prints bucket)
      const { useS3Upload } = await import('~/composables/useS3Upload')
      const uploader = useS3Upload()

      const [uploadResult, thumbnailUpload] = await Promise.all([
        uploader.uploadDesignImage(renderResult.blob, 'personaliza', 'custom-prints'),
        uploader.uploadDesignImage(thumbnailBlob, 'personaliza-thumb', 'custom-prints'),
      ])

      // 7. Build description from state
      const formatLabel = state.imageFormat === '1:1' ? 'Cuadrado' : state.imageFormat === '7:5' ? 'Horizontal' : 'Vertical'
      const textInfo = state.title ? `"${state.title}"` : 'Sin texto'

      // 8. Add to Shopify cart with attributes
      await cartStore.addItem(variant.id, 1, [
        { key: '_imagen', value: uploadResult.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'Personaliza' },
        { key: 'Tamaño', value: state.posterSize },
        { key: 'Formato', value: formatLabel },
        { key: 'Marco', value: state.frameStyle?.name || 'Sin marco' },
        { key: 'Texto', value: textInfo },
      ])

      return null // Success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar al carrito'
      addToCartError.value = message
      console.error('[ShopifyCart] Add personaliza to cart error:', err)
      throw err
    } finally {
      isAddingToCart.value = false
    }
  }

  /**
   * Validate birth poster state before adding to cart
   * Returns validation result with info about missing data
   */
  function validateForCart(state: BirthPosterState): ValidationResult {
    // Check each baby for missing name
    for (let i = 0; i < state.babies.length; i++) {
      const baby = state.babies[i]
      if (!baby || !baby.nombre || baby.nombre.trim() === '') {
        return {
          isValid: false,
          message: 'Por favor completa el nombre de tu bebé',
          missingBabyIndex: i,
        }
      }
    }

    // Check if variant exists
    const variant = getVariant(state.posterSize, state.frameStyle?.id || null)
    if (!variant) {
      return {
        isValid: false,
        message: 'Combinación de tamaño y marco no disponible',
        missingBabyIndex: null,
      }
    }

    return {
      isValid: true,
      message: null,
      missingBabyIndex: null,
    }
  }

  /**
   * Add birth poster to cart
   * 1. Validate state (names, variant)
   * 2. Generate high-res image from canvas
   * 3. Upload to S3
   * 4. Add to Shopify cart with image URL as attribute
   *
   * Returns object with validation error, or thumbnail on success
   */
  async function addBirthPosterToCart(
    canvasElement: HTMLElement,
    state: BirthPosterState
  ): Promise<{ validation: ValidationResult } | { thumbnail: string }> {
    // Validate first
    const validation = validateForCart(state)
    if (!validation.isValid) {
      addToCartError.value = validation.message
      return { validation }
    }

    isAddingToCart.value = true
    addToCartError.value = null

    try {
      // 1. Get variant (already validated above)
      const { variant } = calculatePrice(state)
      if (!variant) {
        throw new Error('No se encontró la variante del producto')
      }

      // 2. Generate images from the canvas element
      const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
      const renderer = useCanvasRenderer()

      // Generate high-res image
      const renderResult = await renderer.generatePosterImage(canvasElement)

      // Convert blob to data URL (more reliable than using dataUrl from render for thumbnails)
      const blobDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(renderResult.blob)
      })

      // Resize blob data URL for thumbnail
      const thumbnailDataUrl = await renderer.resizeToThumbnail(blobDataUrl, 200)

      // Convert thumbnail data URL to blob
      const thumbnailResponse = await fetch(thumbnailDataUrl)
      const thumbnailBlob = await thumbnailResponse.blob()

      // 3. Upload both to S3
      const { useS3Upload } = await import('~/composables/useS3Upload')
      const uploader = useS3Upload()

      const [uploadResult, thumbnailUpload] = await Promise.all([
        uploader.uploadDesignImage(renderResult.blob, 'birth-poster'),
        uploader.uploadDesignImage(thumbnailBlob, 'birth-poster-thumb'),
      ])

      // 4. Add to Shopify cart with attributes
      const babyNames = state.babies.map(b => b.nombre || 'Sin nombre').join(', ')

      await cartStore.addItem(variant.id, 1, [
        { key: '_imagen', value: uploadResult.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'BirthPoster' },
        { key: 'Tamaño', value: state.posterSize },
        { key: 'Marco', value: state.frameStyle?.name || 'Sin marco' },
        { key: 'Bebés', value: babyNames },
      ])

      // Return thumbnail for history saving (avoids re-rendering)
      return { thumbnail: thumbnailDataUrl }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar al carrito'
      addToCartError.value = message
      console.error('[ShopifyCart] Add to cart error:', err)
      throw err
    } finally {
      isAddingToCart.value = false
    }
  }

  /**
   * Initialize: fetch product and cart on mount
   */
  async function init() {
    await Promise.all([
      fetchProduct(),
      cartStore.init(),
    ])
  }

  return {
    // Product state (Birth Poster)
    product: computed(() => product.value),
    isLoadingProduct,
    productError,

    // Personaliza products state
    personalizaProducts: computed(() => personalizaProducts.value),
    isLoadingPersonalizaProducts,
    personalizaProductError,

    // Cart state (from store)
    cartId: computed(() => cartStore.cartId),
    lines: computed(() => cartStore.lines),
    totalQuantity: computed(() => cartStore.totalQuantity),
    subtotal: computed(() => cartStore.subtotal),
    isEmpty: computed(() => cartStore.isEmpty),
    isLoading: computed(() => cartStore.isLoading),
    checkoutUrl: computed(() => cartStore.checkoutUrl),
    error: computed(() => cartStore.error),

    // Add to cart state
    isAddingToCart,
    addToCartError,

    // Birth Poster Actions
    init,
    fetchProduct,
    getVariant,
    calculatePrice,
    formatPrice,
    validateForCart,
    addBirthPosterToCart,

    // Personaliza Actions
    fetchPersonalizaProducts,
    getPersonalizaVariant,
    calculatePersonalizaPrice,
    validatePersonalizaForCart,
    addPersonalizaToCart,

    // Cart actions (pass-through)
    updateQuantity: cartStore.updateQuantity.bind(cartStore),
    removeItem: cartStore.removeItem.bind(cartStore),
    clearCart: cartStore.clearCart.bind(cartStore),
    checkout: cartStore.checkout.bind(cartStore),
  }
}
