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
import { PRODUCT_IDS as PERSONALIZA_PRODUCT_IDS, generateHighResCrop, isCropperReady, waitForCropper, getOrientationFromFormat } from '~/stores/personaliza'
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

  // Track if products have been fetched (for idempotency)
  const _birthPosterFetched = ref(false)
  const _personalizaFetched = ref(false)
  const _momentosFetched = ref(false)

  /**
   * Fetch birth poster product with all variants (idempotent)
   */
  async function fetchProduct() {
    // Prevent duplicate fetches
    if (_birthPosterFetched.value || product.value) return
    _birthPosterFetched.value = true

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
      _birthPosterFetched.value = false // Allow retry on error
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
   * Fetch all personaliza products (square, horizontal, vertical) - idempotent
   */
  async function fetchPersonalizaProducts() {
    // Prevent duplicate fetches
    if (_personalizaFetched.value || personalizaProducts.value.square) return
    _personalizaFetched.value = true

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
      _personalizaFetched.value = false // Allow retry on error
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
   *
   * Server-side rendering approach (same as Momentos):
   * 1. Validate state
   * 2. Generate high-res cropped image from CropperJS
   * 3. Upload cropped image + config JSON + thumbnail to S3
   * 4. Add to Shopify cart with config URL
   *
   * The full high-res composite is rendered server-side via Browserless
   * when the order is placed (see netlify/functions/render-order-background.ts)
   */
  async function addPersonalizaToCart(
    canvasElement: HTMLElement,
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
    const timings: Record<string, number> = {}
    const startTime = performance.now()

    try {
      // 1. Get variant using snapshot values (not reactive state)
      const orientation = getOrientationFromFormat(snapshot.imageFormat)
      const variant = getPersonalizaVariant(orientation, snapshot.posterSize, snapshot.frameStyleId)
      if (!variant) {
        throw new Error('No se encontró la variante del producto')
      }
      timings.variant = performance.now() - startTime

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

      const cropStart = performance.now()
      const highResCropBlob = await generateHighResCrop()
      timings.highResCrop = performance.now() - cropStart
      console.log(`[ShopifyCart] High-res crop: ${timings.highResCrop.toFixed(0)}ms, size: ${highResCropBlob?.size || 0}`)

      if (!highResCropBlob) {
        throw new Error('No se pudo generar la imagen de alta resolución. Asegúrate de que la imagen esté cargada.')
      }

      // 3. Start fetching ALL presigned URLs early (in parallel with thumbnail generation)
      const { useS3Upload } = await import('~/composables/useS3Upload')
      const uploader = useS3Upload()

      // Start presigned URL fetch NOW - don't await yet
      // Fetch all 3 (crop, thumb, config) in parallel with thumbnail generation
      const presignedStart = performance.now()
      const presignedPromise = Promise.all([
        uploader.prepareImageUpload('personaliza-crop', 'custom-prints'),
        uploader.prepareImageUpload('personaliza-thumb', 'custom-prints'),
        uploader.prepareConfigUpload('personaliza-config', 'custom-prints'),
      ])

      // 4. Generate thumbnail from the canvas (runs in parallel with presigned URL fetch)
      const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
      const renderer = useCanvasRenderer()

      // On iOS Safari, blob URLs can fail on first render attempt.
      // Pre-convert the cropped blob to data URL and update the store temporarily.
      // This ensures the canvas has a data URL (not blob URL) when we render.
      const croppedBlob = personalizaStore.croppedBlob
      const croppedImageUrl = personalizaStore.croppedImageUrl
      let originalCroppedImageUrl: string | null = null

      if (croppedBlob) {
        // Convert blob to data URL and pre-load to ensure browser has it cached
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(croppedBlob)
        })

        // Pre-load the data URL image BEFORE updating the store
        // This ensures the browser has the image cached for reliable cloning on mobile Safari
        const preloadImg = new Image()
        await new Promise<void>((resolve) => {
          preloadImg.onload = () => resolve()
          preloadImg.onerror = () => resolve()
          preloadImg.src = dataUrl
        })
        try {
          await preloadImg.decode()
        } catch {
          // Continue anyway
        }

        // Temporarily replace blob URL with data URL
        originalCroppedImageUrl = croppedImageUrl
        personalizaStore.$patch({ croppedImageUrl: dataUrl })

        // Wait for Vue to re-render with data URL
        await nextTick()

        // Wait for the actual DOM image element to load
        const domImg = canvasElement.querySelector('.personaliza-canvas__image') as HTMLImageElement
        if (domImg) {
          // If src hasn't updated yet or image isn't complete, wait for it
          if (domImg.src !== dataUrl || !domImg.complete) {
            await new Promise<void>((resolve) => {
              const checkLoaded = () => {
                if (domImg.complete && domImg.naturalWidth > 0) {
                  resolve()
                } else {
                  requestAnimationFrame(checkLoaded)
                }
              }
              domImg.onload = () => resolve()
              domImg.onerror = () => resolve()
              // Start checking
              checkLoaded()
              // Timeout fallback
              setTimeout(resolve, 500)
            })
          }
        } else {
          // No img element found, just wait
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } else if (croppedImageUrl?.startsWith('blob:')) {
        // Fallback: fetch the blob URL and convert to data URL
        try {
          const response = await fetch(croppedImageUrl)
          const blob = await response.blob()
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })

          // Pre-load the data URL image
          const preloadImg = new Image()
          await new Promise<void>((resolve) => {
            preloadImg.onload = () => resolve()
            preloadImg.onerror = () => resolve()
            preloadImg.src = dataUrl
          })
          try {
            await preloadImg.decode()
          } catch {
            // Continue anyway
          }

          originalCroppedImageUrl = croppedImageUrl
          personalizaStore.$patch({ croppedImageUrl: dataUrl })
          await nextTick()

          // Wait for the actual DOM image element to load
          const domImg = canvasElement.querySelector('.personaliza-canvas__image') as HTMLImageElement
          if (domImg) {
            if (domImg.src !== dataUrl || !domImg.complete) {
              await new Promise<void>((resolve) => {
                const checkLoaded = () => {
                  if (domImg.complete && domImg.naturalWidth > 0) {
                    resolve()
                  } else {
                    requestAnimationFrame(checkLoaded)
                  }
                }
                domImg.onload = () => resolve()
                domImg.onerror = () => resolve()
                checkLoaded()
                setTimeout(resolve, 500)
              })
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (e) {
          console.error('[ShopifyCart] Failed to convert blob URL:', e)
        }
      }

      const thumbStart = performance.now()
      // Debug: Check if the DOM image is properly loaded
      const debugImg = canvasElement.querySelector('.personaliza-canvas__image') as HTMLImageElement
      console.log('[ShopifyCart] DOM image state:', {
        found: !!debugImg,
        src: debugImg?.src?.substring(0, 50) + '...',
        complete: debugImg?.complete,
        naturalWidth: debugImg?.naturalWidth,
        naturalHeight: debugImg?.naturalHeight,
      })
      console.log('[ShopifyCart] Generating thumbnail for Personaliza...')
      const thumbnailDataUrl = await renderer.generateThumbnail(canvasElement)
      timings.thumbnail = performance.now() - thumbStart
      console.log(`[ShopifyCart] Thumbnail generated in ${timings.thumbnail.toFixed(0)}ms, length: ${thumbnailDataUrl.length}`)

      // Restore original blob URL (optional - keeps memory usage lower)
      if (originalCroppedImageUrl) {
        personalizaStore.$patch({ croppedImageUrl: originalCroppedImageUrl })
      }

      // Convert thumbnail data URL to blob
      const thumbnailResponse = await fetch(thumbnailDataUrl)
      const thumbnailBlob = await thumbnailResponse.blob()

      // 5. Get design config snapshot from store
      const designConfig = personalizaStore.getSnapshot()

      // 6. Wait for presigned URLs (should already be ready by now)
      const [cropPrepared, thumbPrepared, configPrepared] = await presignedPromise
      timings.presignedUrls = performance.now() - presignedStart
      console.log(`[ShopifyCart] Presigned URLs ready in ${timings.presignedUrls.toFixed(0)}ms`)

      // 7. Upload cropped image and thumbnail using pre-fetched presigned URLs
      const uploadStart = performance.now()
      console.log('[ShopifyCart] Uploading cropped image + thumbnail to S3...')
      const [croppedImageUpload, thumbnailUpload] = await Promise.all([
        uploader.completeUpload(cropPrepared, highResCropBlob),
        uploader.completeUpload(thumbPrepared, thumbnailBlob),
      ])
      timings.s3Upload = performance.now() - uploadStart
      console.log(`[ShopifyCart] S3 upload (crop+thumb) in ${timings.s3Upload.toFixed(0)}ms`)

      // 8. Upload final config with cropped image URL (presigned URL already fetched)
      const configStart = performance.now()
      const configWithCroppedImage = {
        ...designConfig,
        croppedImageS3Url: croppedImageUpload.url,
      }
      const configBlob = new Blob([JSON.stringify(configWithCroppedImage)], { type: 'text/plain' })
      const finalConfigUpload = await uploader.completeUpload(configPrepared, configBlob)
      timings.configUpload = performance.now() - configStart
      console.log(`[ShopifyCart] Config upload in ${timings.configUpload.toFixed(0)}ms`)

      // 9. Build description from snapshot (not reactive state)
      const formatLabel = snapshot.imageFormat === '1:1' ? 'Cuadrado' : snapshot.imageFormat === '7:5' ? 'Horizontal' : 'Vertical'
      const textInfo = snapshot.title ? `"${snapshot.title}"` : 'Sin texto'

      // 10. Add to Shopify cart with config URL (server renders full image on order)
      const cartStart = performance.now()
      console.log('[ShopifyCart] Adding to Shopify cart...')
      await cartStore.addItem(variant.id, 1, [
        { key: '_config', value: finalConfigUpload.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'Personaliza' },
        { key: 'Tamaño', value: snapshot.posterSize },
        { key: 'Formato', value: formatLabel },
        { key: 'Marco', value: snapshot.frameStyleName },
        { key: 'Texto', value: textInfo },
      ])
      timings.shopifyCart = performance.now() - cartStart
      timings.total = performance.now() - startTime
      console.log(`[ShopifyCart] ✓ Added to cart in ${timings.shopifyCart.toFixed(0)}ms`)
      console.log(`[ShopifyCart] Total: ${timings.total.toFixed(0)}ms | Breakdown: crop=${timings.highResCrop?.toFixed(0)}ms, thumb=${timings.thumbnail?.toFixed(0)}ms, presigned=${timings.presignedUrls?.toFixed(0)}ms, s3=${timings.s3Upload?.toFixed(0)}ms, config=${timings.configUpload?.toFixed(0)}ms, cart=${timings.shopifyCart?.toFixed(0)}ms`)

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

  // ==========================================================================
  // Momentos Methods
  // ==========================================================================

  /**
   * Fetch momentos product with all variants
   */
  /**
   * Fetch momentos product (idempotent)
   */
  async function fetchMomentosProduct() {
    // Prevent duplicate fetches
    if (_momentosFetched.value || momentosProduct.value) return
    _momentosFetched.value = true

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
      _momentosFetched.value = false // Allow retry on error
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
   *
   * Server-side rendering approach:
   * 1. Validate state
   * 2. Generate thumbnail from canvas (fast, small)
   * 3. Upload config JSON + thumbnail to S3
   * 4. Add to Shopify cart with config URL
   *
   * The full high-res image is rendered server-side via Browserless
   * when the order is placed (see netlify/functions/render-order.ts)
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
      throw new Error(validation.message || 'Validación fallida') // Throw so the error is visible to the user
    }

    isAddingToCart.value = true
    addToCartError.value = null

    try {
      // 1. Get variant using snapshot values (not reactive state)
      const variant = getMomentosVariant(snapshot.posterSize, snapshot.frameStyleId)
      if (!variant) {
        throw new Error('No se encontró la variante del producto')
      }

      // 2. Start fetching presigned URLs early (in parallel with thumbnail generation)
      const { useS3Upload } = await import('~/composables/useS3Upload')
      const uploader = useS3Upload()

      // Start presigned URL fetch NOW - don't await yet
      const presignedPromise = Promise.all([
        uploader.prepareConfigUpload('momentos-config', 'momentos-malek'),
        uploader.prepareImageUpload('momentos-thumb', 'momentos-malek'),
      ])

      // 3. Generate thumbnail (runs in parallel with presigned URL fetch)
      const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
      const renderer = useCanvasRenderer()

      // On iOS Safari, blob URLs can fail on first render attempt.
      // Pre-swap blob URLs with S3 URLs or convert to data URLs for reliable rendering.
      const { useMomentosStore } = await import('~/stores/momentos')
      const momentosStore = useMomentosStore()

      // Store original URLs to restore later
      const originalUrls = momentosStore.uploadedImages.map(img => ({
        id: img.id,
        mediumResUrl: img.mediumResUrl,
      }))

      // Temporarily replace blob URLs with S3 URLs or data URLs for reliable rendering
      let swappedAny = false
      for (const img of momentosStore.uploadedImages) {
        if (img.mediumResUrl?.startsWith('blob:')) {
          if (img.s3MediumResUrl) {
            // Prefer S3 URL if available
            momentosStore.updateUploadedImage(img.id, { mediumResUrl: img.s3MediumResUrl })
            swappedAny = true
          } else {
            // S3 not ready - convert blob to data URL directly
            try {
              const response = await fetch(img.mediumResUrl)
              const blob = await response.blob()
              const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              momentosStore.updateUploadedImage(img.id, { mediumResUrl: dataUrl })
              swappedAny = true
            } catch (e) {
              console.error(`[ShopifyCart] Failed to convert blob URL for image ${img.id}:`, e)
            }
          }
        }
      }

      if (swappedAny) {
        // Wait for Vue to re-render with new URLs
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log('[ShopifyCart] Generating thumbnail...')
      const thumbnailDataUrl = await renderer.generateThumbnail(canvasElement)

      // Restore original blob URLs (keeps local preview fast)
      for (const orig of originalUrls) {
        const current = momentosStore.uploadedImages.find(img => img.id === orig.id)
        if (current && current.mediumResUrl !== orig.mediumResUrl) {
          momentosStore.updateUploadedImage(orig.id, { mediumResUrl: orig.mediumResUrl })
        }
      }

      // Convert thumbnail data URL to blob
      const thumbnailResponse = await fetch(thumbnailDataUrl)
      const thumbnailBlob = await thumbnailResponse.blob()

      // 4. Get design config snapshot from store
      const designConfig = momentosStore.getSnapshot()

      // 5. Wait for presigned URLs (should already be ready by now)
      const [configPrepared, thumbPrepared] = await presignedPromise

      // 6. Upload config + thumbnail to S3 using pre-fetched presigned URLs
      console.log('[ShopifyCart] Uploading config + thumbnail to S3...')
      const configBlob = new Blob([JSON.stringify(designConfig)], { type: 'text/plain' })
      const [configUpload, thumbnailUpload] = await Promise.all([
        uploader.completeUpload(configPrepared, configBlob),
        uploader.completeUpload(thumbPrepared, thumbnailBlob),
      ])
      console.log('[ShopifyCart] S3 upload complete:', configUpload.url)

      // 5. Build description from snapshot (not reactive state)
      const formatLabel = snapshot.format === 'square' ? 'Cuadrado' : snapshot.format === 'horizontal' ? 'Horizontal' : 'Vertical'

      // 6. Add to Shopify cart with config URL (server renders full image on order)
      console.log('[ShopifyCart] Adding to Shopify cart...')
      await cartStore.addItem(variant.id, 1, [
        { key: '_config', value: configUpload.url },
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
   *
   * Server-side rendering approach (same as Momentos):
   * 1. Validate state (names, variant)
   * 2. Generate thumbnail from canvas (fast, small)
   * 3. Upload config JSON + thumbnail to S3
   * 4. Add to Shopify cart with config URL
   *
   * The full high-res image is rendered server-side via Browserless
   * when the order is placed (see netlify/functions/render-order-background.ts)
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

      // 2. Generate thumbnail only (fast!) - no full render needed
      const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
      const renderer = useCanvasRenderer()

      console.log('[ShopifyCart] Generating thumbnail for Birth Poster...')
      const thumbnailDataUrl = await renderer.generateThumbnail(canvasElement)

      // Convert thumbnail data URL to blob
      const thumbnailResponse = await fetch(thumbnailDataUrl)
      const thumbnailBlob = await thumbnailResponse.blob()
      console.log(`[ShopifyCart] Thumbnail generated: ${(thumbnailBlob.size / 1024).toFixed(1)}KB`)

      // 3. Get design config snapshot from store
      const birthPosterStore = useBirthPosterStore()
      const designConfig = birthPosterStore.getSnapshot()

      // 4. Upload config + thumbnail to S3 (fast! ~100KB total vs 40MB before)
      const { useS3Upload } = await import('~/composables/useS3Upload')
      const uploader = useS3Upload()

      console.log('[ShopifyCart] Uploading config + thumbnail to S3...')
      const [configUpload, thumbnailUpload] = await Promise.all([
        uploader.uploadConfig(designConfig as unknown as Record<string, unknown>, 'birth-poster-config', 'momentos-malek'),
        uploader.uploadDesignImage(thumbnailBlob, 'birth-poster-thumb', 'momentos-malek'),
      ])
      console.log('[ShopifyCart] S3 upload complete:', configUpload.url)

      // 5. Add to Shopify cart with config URL (server renders full image on order)
      console.log('[ShopifyCart] Adding to Shopify cart...')
      await cartStore.addItem(variant.id, 1, [
        { key: '_config', value: configUpload.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'BirthPoster' },
        { key: 'Tamaño', value: snapshot.posterSize },
        { key: 'Marco', value: snapshot.frameStyleName },
        { key: 'Bebés', value: snapshot.babyNames },
      ])
      console.log('[ShopifyCart] ✓ Successfully added to cart!')

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
  /**
   * Initialize: fetch birth poster product and cart on mount
   * Use this only on birth-poster page
   */
  async function init() {
    await Promise.all([
      fetchProduct(),
      cartStore.init(),
    ])
  }

  /**
   * Initialize cart only (without fetching birth poster product)
   * Use this on personaliza and momentos pages
   */
  async function initCartOnly() {
    await cartStore.init()
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

    // Initialization
    init, // Use for birth-poster page (fetches birth poster product + cart)
    initCartOnly, // Use for personaliza/momentos pages (cart only)

    // Birth Poster Actions
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
