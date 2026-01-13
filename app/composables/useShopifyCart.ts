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
import { PRODUCT_IDS as PERSONALIZA_PRODUCT_IDS, generateHighResCrop, generateHighResComposite, isCropperReady, waitForCropper, getOrientationFromFormat } from '~/stores/personaliza'
import type { MomentosState, MomentosSize } from '~/stores/momentos'
import { MOMENTOS_PRODUCT_ID } from '~/stores/momentos'

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

  // Momentos product state
  const momentosProduct = ref<ProductData | null>(null)
  const momentosVariantLookup = ref<VariantLookup>(new Map())
  const isLoadingMomentosProduct = ref(false)
  const momentosProductError = ref<string | null>(null)

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
    // No image uploaded yet - show $0
    if (!state.imageUrl && !state.imageS3Url) {
      return { price: 0, compareAtPrice: null, variant: null }
    }

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
   * 2. Generate high-res composite image directly (5000px, bypasses DOM)
   * 3. Upload to S3 (custom-prints bucket)
   * 4. Add to Shopify cart with image URL as attribute
   */
  async function addPersonalizaToCart(
    _canvasElement: HTMLElement, // Kept for API compatibility, but no longer used
    state: PersonalizaState
  ): Promise<ValidationResult | null> {
    // IMPORTANT: Capture a snapshot of all values we need at the START
    // This prevents race conditions if user changes frame/size during async operations
    const snapshot = {
      posterSize: state.posterSize,
      imageFormat: state.imageFormat,
      frameStyleId: state.frameStyle?.id || null,
      frameStyleName: state.frameStyle?.name || 'Sin marco',
      hasMargin: state.hasMargin,
      marginColor: state.marginColor,
      title: state.title,
      subtitle: state.subtitle,
      textStyle: state.textStyle,
    }

    // Validate first
    const validation = validatePersonalizaForCart(state)
    if (!validation.isValid) {
      addToCartError.value = validation.message
      return validation
    }

    isAddingToCart.value = true
    addToCartError.value = null

    try {
      // 1. Get variant using snapshot values (not reactive state)
      const orientation = getOrientationFromFormat(snapshot.imageFormat)
      const variant = getPersonalizaVariant(orientation, snapshot.posterSize, snapshot.frameStyleId)
      if (!variant) {
        throw new Error('No se encontró la variante del producto')
      }

      // 2. Generate high-res crop from CropperJS (5000x5000 max)
      const { usePersonalizaStore } = await import('~/stores/personaliza')
      const personalizaStore = usePersonalizaStore()

      // Ensure cropper is ready - if not, switch to archivo panel and wait
      if (!isCropperReady()) {
        console.log('[ShopifyCart] Cropper not ready, switching to archivo panel...')
        personalizaStore.setActivePanel('archivo')
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

      // 3. Generate high-res composite directly using Canvas API (bypasses DOM)
      // This gives us full 5000px quality without downsampling through the preview element
      const compositeBlob = await generateHighResComposite(highResCropBlob, {
        orientation,
        hasMargin: snapshot.hasMargin,
        marginColor: snapshot.marginColor,
        title: snapshot.title,
        subtitle: snapshot.subtitle,
        textStyle: snapshot.textStyle,
      })

      // 4. Generate thumbnail from the composite image
      const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
      const renderer = useCanvasRenderer()

      // Convert blob to data URL for thumbnail generation
      const compositeDataUrl = await blobToDataUrl(compositeBlob)
      const thumbnailDataUrl = await renderer.resizeToThumbnail(compositeDataUrl, 200)

      // Convert thumbnail data URL to blob
      const thumbnailResponse = await fetch(thumbnailDataUrl)
      const thumbnailBlob = await thumbnailResponse.blob()

      // 5. Upload both to S3 (custom-prints bucket)
      const { useS3Upload } = await import('~/composables/useS3Upload')
      const uploader = useS3Upload()

      const [uploadResult, thumbnailUpload] = await Promise.all([
        uploader.uploadDesignImage(compositeBlob, 'personaliza', 'custom-prints'),
        uploader.uploadDesignImage(thumbnailBlob, 'personaliza-thumb', 'custom-prints'),
      ])

      // 6. Build description from snapshot (not reactive state)
      const formatLabel = snapshot.imageFormat === '1:1' ? 'Cuadrado' : snapshot.imageFormat === '7:5' ? 'Horizontal' : 'Vertical'
      const textInfo = snapshot.title ? `"${snapshot.title}"` : 'Sin texto'

      // 7. Add to Shopify cart with attributes (using snapshot values)
      await cartStore.addItem(variant.id, 1, [
        { key: '_imagen', value: uploadResult.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'Personaliza' },
        { key: 'Tamaño', value: snapshot.posterSize },
        { key: 'Formato', value: formatLabel },
        { key: 'Marco', value: snapshot.frameStyleName },
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
   * Convert blob to data URL
   */
  function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // ==========================================================================
  // Momentos Methods
  // ==========================================================================

  /**
   * Fetch momentos product with all variants
   */
  async function fetchMomentosProduct() {
    isLoadingMomentosProduct.value = true
    momentosProductError.value = null

    try {
      const data = await $fetch<ProductData>(`/api/shopify/product/${MOMENTOS_PRODUCT_ID}`)

      momentosProduct.value = data

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
      momentosVariantLookup.value = lookup
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load momentos product'
      momentosProductError.value = message
      console.error('[ShopifyCart] Fetch momentos product error:', err)
    } finally {
      isLoadingMomentosProduct.value = false
    }
  }

  /**
   * Get variant for a momentos size and frame combination
   */
  function getMomentosVariant(
    size: MomentosSize,
    frameId: string | null
  ): ShopifyVariant | null {
    const frameKey = frameId ? getFrameName(frameId) : 'sin marco'
    const key = `${size}_${frameKey}`
    return momentosVariantLookup.value.get(key) || null
  }

  /**
   * Calculate price for momentos state
   */
  function calculateMomentosPrice(state: MomentosState): {
    price: number
    compareAtPrice: number | null
    variant: ShopifyVariant | null
  } {
    const variant = getMomentosVariant(
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
   * Validate momentos state before adding to cart
   */
  function validateMomentosForCart(state: MomentosState): ValidationResult {
    // Check if at least one cell has an image (empty cells are allowed - they appear white)
    // The UI already warns about empty cells via the warning modal
    const filledCells = state.canvasCells.filter(c => c.imageId !== null)
    if (filledCells.length === 0) {
      return {
        isValid: false,
        message: 'Agrega al menos una imagen al collage',
        missingBabyIndex: null,
      }
    }

    // Check if variant exists
    const variant = getMomentosVariant(
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
   * Add momentos item to cart
   * 1. Validate state
   * 2. Generate high-res composite image from canvas
   * 3. Upload to S3 (momentos-malek bucket)
   * 4. Add to Shopify cart with image URL as attribute
   */
  async function addMomentosToCart(
    canvasElement: HTMLElement,
    state: MomentosState
  ): Promise<ValidationResult | null> {
    // IMPORTANT: Capture a snapshot of all values we need at the START
    // This prevents race conditions if user changes frame/size during async operations
    const snapshot = {
      posterSize: state.posterSize,
      format: state.format,
      imageCount: state.imageCount,
      frameStyleId: state.frameStyle?.id || null,
      frameStyleName: state.frameStyle?.name || 'Sin marco',
    }

    // Validate first (using snapshot values)
    const validation = validateMomentosForCart(state)
    if (!validation.isValid) {
      console.warn('[ShopifyCart] Validation failed:', validation.message)
      addToCartError.value = validation.message
      throw new Error(validation.message) // Throw so the error is visible to the user
    }

    isAddingToCart.value = true
    addToCartError.value = null

    try {
      // 1. Get variant using snapshot values (not reactive state)
      const variant = getMomentosVariant(snapshot.posterSize, snapshot.frameStyleId)
      if (!variant) {
        throw new Error('No se encontró la variante del producto')
      }

      // 2. Generate poster image from canvas element
      // Medium-res (2000px) images are sufficient for all grid sizes:
      // - 4 images: need ~1968px each → 2000px is perfect
      // - 25 images: need ~787px each → 2000px is 2.5x overkill
      // - 64 images: need ~492px each → 2000px is 4x overkill
      const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
      const renderer = useCanvasRenderer()

      const renderResult = await renderer.generatePosterImage(canvasElement)
      console.log(`[ShopifyCart] Momentos render: ${renderResult.width}x${renderResult.height}px (${(renderResult.blob.size / 1024 / 1024).toFixed(2)}MB)`)

      // Convert blob to data URL for thumbnail generation
      console.log('[ShopifyCart] Converting blob to data URL...')
      const blobDataUrl = await blobToDataUrl(renderResult.blob)
      console.log('[ShopifyCart] Blob converted, resizing for thumbnail...')

      // Resize for thumbnail
      const thumbnailDataUrl = await renderer.resizeToThumbnail(blobDataUrl, 200)
      console.log('[ShopifyCart] Thumbnail resized, converting to blob...')

      // Convert thumbnail data URL to blob
      const thumbnailResponse = await fetch(thumbnailDataUrl)
      const thumbnailBlob = await thumbnailResponse.blob()
      console.log('[ShopifyCart] Uploading to S3...')

      // 3. Upload both to S3 (momentos-malek bucket)
      const { useS3Upload } = await import('~/composables/useS3Upload')
      const uploader = useS3Upload()

      const [uploadResult, thumbnailUpload] = await Promise.all([
        uploader.uploadDesignImage(renderResult.blob, 'momentos', 'momentos-malek'),
        uploader.uploadDesignImage(thumbnailBlob, 'momentos-thumb', 'momentos-malek'),
      ])
      console.log('[ShopifyCart] S3 upload complete:', uploadResult.url)

      // 4. Build description from snapshot (not reactive state)
      const formatLabel = snapshot.format === 'square' ? 'Cuadrado' : snapshot.format === 'horizontal' ? 'Horizontal' : 'Vertical'

      // 5. Add to Shopify cart with attributes (using snapshot values)
      console.log('[ShopifyCart] Adding to Shopify cart...')
      await cartStore.addItem(variant.id, 1, [
        { key: '_imagen', value: uploadResult.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'Momentos' },
        { key: 'Tamaño', value: snapshot.posterSize },
        { key: 'Formato', value: formatLabel },
        { key: 'Imágenes', value: `${snapshot.imageCount} fotos` },
        { key: 'Marco', value: snapshot.frameStyleName },
      ])
      console.log('[ShopifyCart] ✓ Successfully added to cart!')

      return null // Success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar al carrito'
      addToCartError.value = message
      console.error('[ShopifyCart] Add momentos to cart error:', err)
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
    // Check each baby for missing name (only required if showScale is enabled)
    for (let i = 0; i < state.babies.length; i++) {
      const baby = state.babies[i]
      // Name is only required when showScale is enabled (shows "SCALE 1:1 OF {nombre}")
      if (baby?.showScale && (!baby.nombre || baby.nombre.trim() === '')) {
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
    // IMPORTANT: Capture a snapshot of all values we need at the START
    // This prevents race conditions if user changes frame/size during async operations
    const snapshot = {
      posterSize: state.posterSize,
      frameStyleId: state.frameStyle?.id || null,
      frameStyleName: state.frameStyle?.name || 'Sin marco',
      babyNames: state.babies.map(b => b.nombre || 'Sin nombre').join(', '),
    }

    // Validate first
    const validation = validateForCart(state)
    if (!validation.isValid) {
      addToCartError.value = validation.message
      return { validation }
    }

    isAddingToCart.value = true
    addToCartError.value = null

    try {
      // 1. Get variant using snapshot values (not reactive state)
      const variant = getVariant(snapshot.posterSize, snapshot.frameStyleId)
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

      // 4. Add to Shopify cart with attributes (using snapshot values)
      await cartStore.addItem(variant.id, 1, [
        { key: '_imagen', value: uploadResult.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'BirthPoster' },
        { key: 'Tamaño', value: snapshot.posterSize },
        { key: 'Marco', value: snapshot.frameStyleName },
        { key: 'Bebés', value: snapshot.babyNames },
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

    // Momentos Actions
    momentosProduct: computed(() => momentosProduct.value),
    isLoadingMomentosProduct,
    momentosProductError,
    fetchMomentosProduct,
    getMomentosVariant,
    calculateMomentosPrice,
    validateMomentosForCart,
    addMomentosToCart,

    // Cart actions (pass-through)
    updateQuantity: cartStore.updateQuantity.bind(cartStore),
    removeItem: cartStore.removeItem.bind(cartStore),
    clearCart: cartStore.clearCart.bind(cartStore),
    checkout: cartStore.checkout.bind(cartStore),
  }
}
