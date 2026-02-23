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
import { MOMENTOS_PRODUCT_ID, calculateGridDimensions, IMAGE_FILTERS } from '~/stores/momentos'

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

type TrackAddToCartPayload = {
  price: number
  formattedPrice?: string
  productId?: string
  variantId?: string
  currency?: string
}

// Build a lookup map for variants: "size_frame" -> variant
type VariantLookup = Map<string, ShopifyVariant>

export function useShopifyCart() {
  const config = useRuntimeConfig()
  const nuxtApp = useNuxtApp()
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

  const trackAddToCart = (payload: TrackAddToCartPayload) => {
    if (!import.meta.client) return
    const tracker = nuxtApp.$trackAddToCart
    if (typeof tracker === 'function') {
      tracker(payload)
    }
  }

  const getAddToCartDevice = (): 'mobile' | 'desktop' => {
    if (!import.meta.client) return 'desktop'
    return window.innerWidth < 768 ? 'mobile' : 'desktop'
  }

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
      const compositeMaxDimension = 1200
      const compositeBackgroundColor = snapshot.hasMargin ? snapshot.marginColor : '#ffffff'

      const blobToDataUrl = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }

      const generateCompositeThumbnail = async (): Promise<string> => {
        const compositeBlob = await generateHighResComposite(
          highResCropBlob,
          {
            orientation,
            hasMargin: snapshot.hasMargin,
            marginColor: snapshot.marginColor,
            title: snapshot.title || '',
            subtitle: snapshot.subtitle || '',
            textStyle: snapshot.textStyle,
          },
          compositeMaxDimension
        )
        const compositeDataUrl = await blobToDataUrl(compositeBlob)
        return renderer.resizeToThumbnail(compositeDataUrl, 200, compositeBackgroundColor)
      }

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
      let thumbnailDataUrl = await renderer.generateThumbnail(canvasElement)

      // Restore original blob URL (optional - keeps memory usage lower)
      if (originalCroppedImageUrl) {
        personalizaStore.$patch({ croppedImageUrl: originalCroppedImageUrl })
      }

      // Convert thumbnail data URL to blob
      let thumbnailResponse = await fetch(thumbnailDataUrl)
      let thumbnailBlob = await thumbnailResponse.blob()

      // Mobile Safari can return a blank first render; retry once if blob is suspiciously small.
      if (thumbnailBlob.size < 5000) {
        console.warn(`[ShopifyCart] Thumbnail blob too small (${thumbnailBlob.size} bytes). Retrying render...`)
        await new Promise(resolve => setTimeout(resolve, 200))
        thumbnailDataUrl = await renderer.generateThumbnail(canvasElement)
        thumbnailResponse = await fetch(thumbnailDataUrl)
        thumbnailBlob = await thumbnailResponse.blob()
        console.log(`[ShopifyCart] Thumbnail retry size: ${thumbnailBlob.size} bytes`)
      }

      if (thumbnailBlob.size < 5000) {
        console.warn('[ShopifyCart] Thumbnail still blank after retry. Falling back to composite render...')
        thumbnailDataUrl = await generateCompositeThumbnail()
        thumbnailResponse = await fetch(thumbnailDataUrl)
        thumbnailBlob = await thumbnailResponse.blob()
        console.log(`[ShopifyCart] Composite thumbnail size: ${thumbnailBlob.size} bytes`)
      }

      timings.thumbnail = performance.now() - thumbStart

      // 5. Get design config snapshot from store
      const designConfig = personalizaStore.getSnapshot()

      // 6. Wait for presigned URLs (should already be ready by now)
      const [cropPrepared, thumbPrepared, configPrepared] = await presignedPromise
      timings.presignedUrls = performance.now() - presignedStart

      // 7. Upload cropped image and thumbnail using pre-fetched presigned URLs
      const uploadStart = performance.now()
      const [croppedImageUpload, thumbnailUpload] = await Promise.all([
        uploader.completeUpload(cropPrepared, highResCropBlob),
        uploader.completeUpload(thumbPrepared, thumbnailBlob),
      ])
      timings.s3Upload = performance.now() - uploadStart

      // 8. Upload final config with cropped image URL (presigned URL already fetched)
      const configStart = performance.now()
      const configWithCroppedImage = {
        ...designConfig,
        croppedImageS3Url: croppedImageUpload.url,
      }
      const configBlob = new Blob([JSON.stringify(configWithCroppedImage)], { type: 'text/plain' })
      const finalConfigUpload = await uploader.completeUpload(configPrepared, configBlob)
      timings.configUpload = performance.now() - configStart

      // 9. Build description from snapshot (not reactive state)
      const formatLabel = snapshot.imageFormat === '1:1' ? 'Cuadrado' : snapshot.imageFormat === '7:5' ? 'Horizontal' : 'Vertical'
      const textInfo = snapshot.title ? `"${snapshot.title}"` : 'Sin texto'
      const addedFromDevice = getAddToCartDevice()

      // 10. Add to Shopify cart with config URL (server renders full image on order)
      const cartStart = performance.now()
      await cartStore.addItem(variant.id, 1, [
        { key: '_config', value: finalConfigUpload.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'Personaliza' },
        { key: '_dispostivo', value: addedFromDevice },
        { key: 'Tamaño', value: snapshot.posterSize },
        { key: 'Formato', value: formatLabel },
        { key: 'Marco', value: snapshot.frameStyleName },
        { key: 'Texto', value: textInfo },
      ])
      timings.shopifyCart = performance.now() - cartStart
      timings.total = performance.now() - startTime

      trackAddToCart({
        price: Number(variant.price),
        formattedPrice: Number(variant.price).toString(),
        productId: PERSONALIZA_PRODUCT_IDS[orientation],
        variantId: variant.id,
        currency: 'MXN',
      })

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

  async function generatePersonalizaThumbnail(
    canvasElement: HTMLElement,
    state: PersonalizaState
  ): Promise<string> {
    const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
    const renderer = useCanvasRenderer()

    const { usePersonalizaStore } = await import('~/stores/personaliza')
    const personalizaStore = usePersonalizaStore()

    const blobToDataUrl = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

    const preloadDataUrl = async (dataUrl: string): Promise<void> => {
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
    }

    const waitForCanvasImage = async (dataUrl: string): Promise<void> => {
      const domImg = canvasElement.querySelector('.personaliza-canvas__image') as HTMLImageElement | null
      if (!domImg) {
        await new Promise(resolve => setTimeout(resolve, 100))
        return
      }
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
    }

    const applyDataUrl = async (dataUrl: string) => {
      await preloadDataUrl(dataUrl)
      personalizaStore.$patch({ croppedImageUrl: dataUrl })
      await nextTick()
      await waitForCanvasImage(dataUrl)
    }

    const orientation = getOrientationFromFormat(state.imageFormat)
    const compositeMaxDimension = 1200
    const compositeBackgroundColor = state.hasMargin ? state.marginColor : '#ffffff'

    const croppedBlob = personalizaStore.croppedBlob
    const croppedImageUrl = personalizaStore.croppedImageUrl
    let originalCroppedImageUrl: string | null = null

    if (croppedBlob) {
      const dataUrl = await blobToDataUrl(croppedBlob)
      originalCroppedImageUrl = croppedImageUrl
      await applyDataUrl(dataUrl)
    } else if (croppedImageUrl?.startsWith('blob:')) {
      try {
        const response = await fetch(croppedImageUrl)
        const blob = await response.blob()
        const dataUrl = await blobToDataUrl(blob)
        originalCroppedImageUrl = croppedImageUrl
        await applyDataUrl(dataUrl)
      } catch (e) {
        console.error('[ShopifyCart] Failed to convert cropped blob URL:', e)
      }
    }

    let thumbnailDataUrl = await renderer.generateThumbnail(canvasElement)

    if (originalCroppedImageUrl) {
      personalizaStore.$patch({ croppedImageUrl: originalCroppedImageUrl })
    }

    let thumbnailBlob = await (await fetch(thumbnailDataUrl)).blob()

    if (thumbnailBlob.size < 5000) {
      await new Promise(resolve => setTimeout(resolve, 200))
      thumbnailDataUrl = await renderer.generateThumbnail(canvasElement)
      thumbnailBlob = await (await fetch(thumbnailDataUrl)).blob()
    }

    if (thumbnailBlob.size < 5000) {
      let compositeSourceBlob: Blob | null = croppedBlob || null
      if (!compositeSourceBlob && croppedImageUrl) {
        try {
          const response = await fetch(croppedImageUrl)
          compositeSourceBlob = await response.blob()
        } catch (e) {
          console.error('[ShopifyCart] Failed to load cropped image for composite:', e)
        }
      }

      if (compositeSourceBlob) {
        try {
          const compositeBlob = await generateHighResComposite(
            compositeSourceBlob,
            {
              orientation,
              hasMargin: state.hasMargin,
              marginColor: state.marginColor,
              title: state.title || '',
              subtitle: state.subtitle || '',
              textStyle: state.textStyle,
            },
            compositeMaxDimension
          )
          const compositeDataUrl = await blobToDataUrl(compositeBlob)
          thumbnailDataUrl = await renderer.resizeToThumbnail(compositeDataUrl, 200, compositeBackgroundColor)
        } catch (e) {
          console.error('[ShopifyCart] Composite thumbnail fallback failed:', e)
        }
      }
    }

    return thumbnailDataUrl
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

  async function generateMomentosThumbnailData(
    canvasElement: HTMLElement,
    state: MomentosState,
    options: { preferComposite?: boolean } = {}
  ): Promise<{ dataUrl: string; blob: Blob }> {
    const { useCanvasRenderer } = await import('~/composables/useCanvasRenderer')
    const renderer = useCanvasRenderer()

    const { useMomentosStore } = await import('~/stores/momentos')
    const momentosStore = useMomentosStore()
    const uploadedImages = state.uploadedImages || []
    const originalUrls = new Map<string, string>()

    const swapToLowResUrls = async (): Promise<boolean> => {
      let swappedAny = false
      for (const img of momentosStore.uploadedImages) {
        const lowResUrl = img.lowResUrl || img.s3LowResUrl
        if (!lowResUrl || img.mediumResUrl === lowResUrl) continue
        if (!originalUrls.has(img.id)) {
          originalUrls.set(img.id, img.mediumResUrl)
        }
        momentosStore.updateUploadedImage(img.id, { mediumResUrl: lowResUrl })
        swappedAny = true
      }

      if (swappedAny) {
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return swappedAny
    }

    const swapBlobUrlsToDataUrls = async (): Promise<boolean> => {
      let swappedAny = false
      for (const img of momentosStore.uploadedImages) {
        if (!img.mediumResUrl?.startsWith('blob:')) continue
        try {
          const response = await fetch(img.mediumResUrl)
          const blob = await response.blob()
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          if (!originalUrls.has(img.id)) {
            originalUrls.set(img.id, img.mediumResUrl)
          }
          momentosStore.updateUploadedImage(img.id, { mediumResUrl: dataUrl })
          swappedAny = true
        } catch (e) {
          console.error(`[ShopifyCart] Failed to convert blob URL for image ${img.id}:`, e)
        }
      }

      if (swappedAny) {
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      return swappedAny
    }

    const restoreOriginalUrls = () => {
      for (const [id, mediumResUrl] of originalUrls.entries()) {
        const current = momentosStore.uploadedImages.find((img: MomentosState['uploadedImages'][number]) => img.id === id)
        if (current && current.mediumResUrl !== mediumResUrl) {
          momentosStore.updateUploadedImage(id, { mediumResUrl })
        }
      }
    }

    const isWebKitMobile = (() => {
      if (typeof navigator === 'undefined') return false
      const ua = navigator.userAgent
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
      return isIOS || isSafari
    })()

    const canvasBackground = window.getComputedStyle(canvasElement).backgroundColor
    const expectedImageCount = state.canvasCells.filter(cell => cell.imageId).length
    const imageWaitMs = (() => {
      if (expectedImageCount === 0) return 0
      const minWait = 2500
      const maxWait = 8000
      const baseWait = 1500
      const perImageWait = 120
      return Math.min(maxWait, Math.max(minWait, baseWait + expectedImageCount * perImageWait))
    })()
    const getMomentosImageStats = () => {
      const images = Array.from(canvasElement.querySelectorAll<HTMLImageElement>('.momentos-canvas__cell-image'))
      const loaded = images.filter((img: HTMLImageElement) => img.complete && img.naturalWidth > 0).length
      return { found: images.length, loaded }
    }
    const waitForMomentosImages = async (timeoutMs = 5000) => {
      const start = performance.now()
      let images: HTMLImageElement[] = []

      // Ensure the DOM has all expected image elements before waiting on loads
      for (let i = 0; i < 5; i++) {
        images = Array.from(canvasElement.querySelectorAll<HTMLImageElement>('.momentos-canvas__cell-image'))
        const loadedCount = images.filter((img: HTMLImageElement) => img.complete && img.naturalWidth > 0).length
        if (expectedImageCount === 0 || images.length >= expectedImageCount || loadedCount >= expectedImageCount) {
          break
        }
        await new Promise(resolve => {
          requestAnimationFrame(() => setTimeout(resolve, 100))
        })
      }

      console.log('[ShopifyCart] Momentos image load check:', {
        expected: expectedImageCount,
        found: images.length,
        loaded: images.filter((img: HTMLImageElement) => img.complete && img.naturalWidth > 0).length,
      })

      const remaining = Math.max(0, timeoutMs - (performance.now() - start))
      await Promise.all(images.map((img: HTMLImageElement) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve()
        return new Promise<void>((resolve) => {
          let settled = false
          const finish = () => {
            if (settled) return
            settled = true
            resolve()
          }
          const timeoutId = setTimeout(finish, remaining)
          const cleanup = () => {
            clearTimeout(timeoutId)
            finish()
          }
          img.onload = cleanup
          img.onerror = cleanup
          if (typeof img.decode === 'function') {
            img.decode().then(cleanup).catch(() => {})
          }
        })
      }))

      await new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      })
    }

    const parseRgb = (color: string): { r: number; g: number; b: number } | null => {
      const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
      if (rgbMatch) {
        return {
          r: Number(rgbMatch[1]),
          g: Number(rgbMatch[2]),
          b: Number(rgbMatch[3]),
        }
      }
      const hexMatch = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
      if (hexMatch) {
        const hex = hexMatch[1] ?? ''
        if (hex.length === 3) {
          const r = hex.charAt(0)
          const g = hex.charAt(1)
          const b = hex.charAt(2)
          return {
            r: parseInt(`${r}${r}`, 16),
            g: parseInt(`${g}${g}`, 16),
            b: parseInt(`${b}${b}`, 16),
          }
        }
        if (hex.length === 6) {
          return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
          }
        }
      }
      return null
    }

    const isThumbnailMostlyBackground = async (dataUrl: string): Promise<boolean> => {
      if (expectedImageCount === 0) return false
      const bg = parseRgb(canvasBackground)
      if (!bg) return false

      try {
        const img = new Image()
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = dataUrl
        })

        if (!img.naturalWidth || !img.naturalHeight) return false

        const sampleSize = 40
        const canvas = document.createElement('canvas')
        canvas.width = sampleSize
        canvas.height = sampleSize
        const ctx = canvas.getContext('2d')
        if (!ctx) return false
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

        const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize)
        const step = 4 * 5
        let matchCount = 0
        let totalCount = 0
        for (let i = 0; i < data.length; i += step) {
          const r = data[i] ?? 0
          const g = data[i + 1] ?? 0
          const b = data[i + 2] ?? 0
          const diff = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b)
          if (diff < 24) {
            matchCount++
          }
          totalCount++
        }

        return totalCount > 0 && matchCount / totalCount > 0.9
      } catch (e) {
        console.warn('[ShopifyCart] Thumbnail background check failed:', e)
        return false
      }
    }

    const getCompositeImageUrl = (img: MomentosState['uploadedImages'][number]): string | null => {
      return img.mediumResUrl ||
        img.lowResUrl ||
        img.s3MediumResUrl ||
        img.s3LowResUrl ||
        img.highResUrl ||
        img.s3HighResUrl ||
        null
    }

    const loadCompositeImage = (() => {
      const cache = new Map<string, HTMLImageElement>()
      return async (src: string): Promise<HTMLImageElement | null> => {
        if (cache.has(src)) return cache.get(src) || null
        const img = new Image()
        if (/^https?:/i.test(src)) {
          img.crossOrigin = 'anonymous'
        }
        img.decoding = 'async'
        const loaded = await new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
          img.src = src
        })
        if (!loaded) return null
        cache.set(src, img)
        return img
      }
    })()

    const getGapRatio = () => {
      if (state.imageCount === 4 || state.imageCount === 12) return 0.035
      if (state.imageCount === 25 || state.imageCount === 35) return 0.025
      if (state.imageCount === 64 || state.imageCount === 88) return 0.0175
      return 0.025
    }

    const generateMomentosCompositeThumbnail = async (): Promise<string> => {
      const format = state.format
      const aspectRatio = format === 'square' ? 1 : format === 'horizontal' ? 7 / 5 : 5 / 7
      let width: number
      let height: number
      if (aspectRatio >= 1) {
        width = thumbnailMaxSize
        height = Math.round(width / aspectRatio)
      } else {
        height = thumbnailMaxSize
        width = Math.round(height * aspectRatio)
      }

      const baseUnit = format === 'horizontal' ? height : width
      const padding = state.hasMargin ? baseUnit * 0.05 : 0
      const gap = baseUnit * getGapRatio()
      const backgroundFill = state.hasMargin ? state.marginColor : canvasBackground

      const { cols, rows } = calculateGridDimensions(state.imageCount, format)
      const contentWidth = Math.max(1, width - padding * 2)
      const contentHeight = Math.max(1, height - padding * 2)
      const cellWidth = (contentWidth - gap * (cols - 1)) / cols
      const cellHeight = (contentHeight - gap * (rows - 1)) / rows

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.fillStyle = backgroundFill || '#ffffff'
      ctx.fillRect(0, 0, width, height)

      for (let index = 0; index < state.canvasCells.length; index++) {
        const cell = state.canvasCells[index]
        if (!cell?.imageId) continue

        const row = Math.floor(index / cols)
        const col = index % cols
        if (row >= rows) continue

        const cellX = padding + col * (cellWidth + gap)
        const cellY = padding + row * (cellHeight + gap)

        const imageMeta = uploadedImages.find((img: MomentosState['uploadedImages'][number]) => img.id === cell.imageId)
        if (!imageMeta) continue
        const src = getCompositeImageUrl(imageMeta)
        if (!src) continue

        const img = await loadCompositeImage(src)
        if (!img?.naturalWidth || !img?.naturalHeight) continue

        const scale = Math.max(cellWidth / img.naturalWidth, cellHeight / img.naturalHeight)
        const drawWidth = img.naturalWidth * scale
        const drawHeight = img.naturalHeight * scale
        const panX = cell.panX ?? 50
        const panY = cell.panY ?? 50
        const offsetX = cellX + (cellWidth - drawWidth) * (panX / 100)
        const offsetY = cellY + (cellHeight - drawHeight) * (panY / 100)

        ctx.save()
        ctx.beginPath()
        ctx.rect(cellX, cellY, cellWidth, cellHeight)
        ctx.clip()

        const centerX = cellX + cellWidth / 2
        const centerY = cellY + cellHeight / 2
        ctx.translate(centerX, centerY)
        ctx.rotate((cell.rotation || 0) * Math.PI / 180)
        ctx.scale(cell.zoom || 1, cell.zoom || 1)
        ctx.translate(-centerX, -centerY)

        const filter = IMAGE_FILTERS[cell.filter]?.cssFilter || 'none'
        ctx.filter = filter
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
        ctx.restore()
      }

      return canvas.toDataURL('image/jpeg', 0.7)
    }

    const thumbnailMaxSize = isWebKitMobile ? 100 : 200
    const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      })
      try {
        return await Promise.race([promise, timeoutPromise])
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }

    const renderTimeoutMs = Math.min(12000, Math.max(4000, imageWaitMs + 2000))
    const generateMomentosThumbnail = async () => {
      const renderResult = await renderer.renderElement(canvasElement, {
        scale: 1,
        backgroundColor: canvasBackground,
      })
      return renderer.resizeToThumbnail(renderResult.dataUrl, thumbnailMaxSize, canvasBackground)
    }
    const renderMomentosThumbnail = async () => {
      return withTimeout(generateMomentosThumbnail(), renderTimeoutMs, 'Momentos thumbnail render')
    }

    try {
      if (options.preferComposite) {
        const compositeDataUrl = await generateMomentosCompositeThumbnail()
        const compositeBlob = await (await fetch(compositeDataUrl)).blob()
        return { dataUrl: compositeDataUrl, blob: compositeBlob }
      }

      const swappedToLowRes = await swapToLowResUrls()
      if (!swappedToLowRes) {
        await nextTick()
      }
      const stats = getMomentosImageStats()
      if (expectedImageCount > 0 && (stats.found < expectedImageCount || stats.loaded < expectedImageCount)) {
        await waitForMomentosImages(imageWaitMs)
      } else if (expectedImageCount > 0) {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }
      let thumbnailDataUrl = await renderMomentosThumbnail()
      if (swappedToLowRes) {
        restoreOriginalUrls()
      }

      // Convert thumbnail data URL to blob
      let thumbnailResponse = await fetch(thumbnailDataUrl)
      let thumbnailBlob = await thumbnailResponse.blob()
      let thumbnailLooksBlank = await isThumbnailMostlyBackground(thumbnailDataUrl)

      // Safari can return a blank first render; retry once if blob is suspiciously small.
      if (thumbnailBlob.size < 5000 || thumbnailLooksBlank) {
        console.warn('[ShopifyCart] Momentos thumbnail retrying...', {
          size: thumbnailBlob.size,
          blank: thumbnailLooksBlank,
        })
        await new Promise(resolve => setTimeout(resolve, 200))
        const swappedAgain = await swapToLowResUrls()
        if (!swappedAgain) {
          await nextTick()
        }
        const retryStats = getMomentosImageStats()
        if (expectedImageCount > 0 && (retryStats.found < expectedImageCount || retryStats.loaded < expectedImageCount)) {
          await waitForMomentosImages(imageWaitMs)
        } else if (expectedImageCount > 0) {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        }
        thumbnailDataUrl = await renderMomentosThumbnail()
        if (swappedAgain) {
          restoreOriginalUrls()
        }
        thumbnailResponse = await fetch(thumbnailDataUrl)
        thumbnailBlob = await thumbnailResponse.blob()
        thumbnailLooksBlank = await isThumbnailMostlyBackground(thumbnailDataUrl)
        console.log(`[ShopifyCart] Momentos thumbnail retry size: ${thumbnailBlob.size} bytes`)
      }

      if (thumbnailBlob.size < 5000 || thumbnailLooksBlank) {
        console.warn('[ShopifyCart] Momentos thumbnail still blank. Converting blob URLs to data URLs and retrying...', {
          size: thumbnailBlob.size,
          blank: thumbnailLooksBlank,
        })
        const swappedAny = await swapBlobUrlsToDataUrls()
        if (swappedAny) {
          await waitForMomentosImages(imageWaitMs)
          thumbnailDataUrl = await renderMomentosThumbnail()
          thumbnailResponse = await fetch(thumbnailDataUrl)
          thumbnailBlob = await thumbnailResponse.blob()
          thumbnailLooksBlank = await isThumbnailMostlyBackground(thumbnailDataUrl)
          console.log(`[ShopifyCart] Momentos thumbnail data URL retry size: ${thumbnailBlob.size} bytes`)
          restoreOriginalUrls()
        }
      }

      if (thumbnailBlob.size < 5000 || thumbnailLooksBlank) {
        console.warn('[ShopifyCart] Momentos thumbnail fallback to composite render...', {
          size: thumbnailBlob.size,
          blank: thumbnailLooksBlank,
        })
        thumbnailDataUrl = await generateMomentosCompositeThumbnail()
        thumbnailResponse = await fetch(thumbnailDataUrl)
        thumbnailBlob = await thumbnailResponse.blob()
      }

      return {
        dataUrl: thumbnailDataUrl,
        blob: thumbnailBlob,
      }
    } catch (err) {
      console.warn('[ShopifyCart] Momentos thumbnail render failed, falling back to composite:', err)
      const fallbackDataUrl = await generateMomentosCompositeThumbnail()
      const fallbackBlob = await (await fetch(fallbackDataUrl)).blob()
      return { dataUrl: fallbackDataUrl, blob: fallbackBlob }
    } finally {
      restoreOriginalUrls()
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
  ): Promise<{ thumbnail: string } | null> {
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
      const { dataUrl: thumbnailDataUrl, blob: thumbnailBlob } = await generateMomentosThumbnailData(
        canvasElement,
        state
      )

      // 4. Get design config snapshot from store
      const { useMomentosStore } = await import('~/stores/momentos')
      const momentosStore = useMomentosStore()
      const designConfig = momentosStore.getSnapshot()

      // 5. Wait for presigned URLs (should already be ready by now)
      const [configPrepared, thumbPrepared] = await presignedPromise

      // 6. Upload config + thumbnail to S3 using pre-fetched presigned URLs
      const configBlob = new Blob([JSON.stringify(designConfig)], { type: 'text/plain' })
      const [configUpload, thumbnailUpload] = await Promise.all([
        uploader.completeUpload(configPrepared, configBlob),
        uploader.completeUpload(thumbPrepared, thumbnailBlob),
      ])

      // 5. Build description from snapshot (not reactive state)
      const formatLabel = snapshot.format === 'square' ? 'Cuadrado' : snapshot.format === 'horizontal' ? 'Horizontal' : 'Vertical'
      const addedFromDevice = getAddToCartDevice()
      const lineAttributes: { key: string; value: string }[] = [
        { key: '_config', value: configUpload.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'Momentos' },
        { key: '_dispostivo', value: addedFromDevice },
        { key: 'Tamaño', value: snapshot.posterSize },
        { key: 'Formato', value: formatLabel },
        { key: 'Imágenes', value: `${snapshot.imageCount} fotos` },
        { key: 'Marco', value: snapshot.frameStyleName },
      ]

      if (state.usePaspartu) {
        lineAttributes.push({ key: 'Paspartú', value: 'Con Marialuisa' })
      }

      // 6. Add to Shopify cart with config URL (server renders full image on order)
      await cartStore.addItem(variant.id, 1, lineAttributes)

      trackAddToCart({
        price: Number(variant.price),
        formattedPrice: Number(variant.price).toString(),
        productId: MOMENTOS_PRODUCT_ID,
        variantId: variant.id,
        currency: 'MXN',
      })

      return { thumbnail: thumbnailDataUrl }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar al carrito'
      addToCartError.value = message
      console.error('[ShopifyCart] Add momentos to cart error:', err)
      throw err
    } finally {
      isAddingToCart.value = false
    }
  }

  async function generateMomentosThumbnail(
    canvasElement: HTMLElement,
    state: MomentosState
  ): Promise<string> {
    const { dataUrl } = await generateMomentosThumbnailData(canvasElement, state)
    return dataUrl
  }

  async function generateMomentosHistoryThumbnail(
    canvasElement: HTMLElement,
    state: MomentosState
  ): Promise<string> {
    const { dataUrl } = await generateMomentosThumbnailData(canvasElement, state)
    return dataUrl
  }

  async function generateMomentosHistoryThumbnailFromState(
    state: MomentosState
  ): Promise<string> {
    const isWebKitMobile = (() => {
      if (typeof navigator === 'undefined') return false
      const ua = navigator.userAgent
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
      return isIOS || isSafari
    })()
    const thumbnailMaxSize = isWebKitMobile ? 100 : 200

    const format = state.format
    const aspectRatio = format === 'square' ? 1 : format === 'horizontal' ? 7 / 5 : 5 / 7
    let width: number
    let height: number
    if (aspectRatio >= 1) {
      width = thumbnailMaxSize
      height = Math.round(width / aspectRatio)
    } else {
      height = thumbnailMaxSize
      width = Math.round(height * aspectRatio)
    }

    const baseUnit = format === 'horizontal' ? height : width
    const padding = state.hasMargin ? baseUnit * 0.05 : 0
    const gapRatio = (() => {
      if (state.imageCount === 4 || state.imageCount === 12) return 0.035
      if (state.imageCount === 25 || state.imageCount === 35) return 0.025
      if (state.imageCount === 64 || state.imageCount === 88) return 0.0175
      return 0.025
    })()
    const gap = baseUnit * gapRatio
    const backgroundFill = state.hasMargin ? state.marginColor : '#ffffff'

    const { cols, rows } = calculateGridDimensions(state.imageCount, format)
    const contentWidth = Math.max(1, width - padding * 2)
    const contentHeight = Math.max(1, height - padding * 2)
    const cellWidth = (contentWidth - gap * (cols - 1)) / cols
    const cellHeight = (contentHeight - gap * (rows - 1)) / rows

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = backgroundFill || '#ffffff'
    ctx.fillRect(0, 0, width, height)

    const uploadedImages = state.uploadedImages || []
    const getCompositeImageUrl = (img: MomentosState['uploadedImages'][number]): string | null => {
      return img.mediumResUrl ||
        img.lowResUrl ||
        img.s3MediumResUrl ||
        img.s3LowResUrl ||
        img.highResUrl ||
        img.s3HighResUrl ||
        null
    }

    const loadCompositeImage = (() => {
      const cache = new Map<string, HTMLImageElement>()
      return async (src: string): Promise<HTMLImageElement | null> => {
        if (cache.has(src)) return cache.get(src) || null
        const img = new Image()
        if (/^https?:/i.test(src)) {
          img.crossOrigin = 'anonymous'
        }
        img.decoding = 'async'
        const loaded = await new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
          img.src = src
        })
        if (!loaded) return null
        cache.set(src, img)
        return img
      }
    })()

    for (let index = 0; index < state.canvasCells.length; index++) {
      const cell = state.canvasCells[index]
      if (!cell?.imageId) continue

      const row = Math.floor(index / cols)
      const col = index % cols
      if (row >= rows) continue

      const cellX = padding + col * (cellWidth + gap)
      const cellY = padding + row * (cellHeight + gap)

      const imageMeta = uploadedImages.find((img: MomentosState['uploadedImages'][number]) => img.id === cell.imageId)
      if (!imageMeta) continue
      const src = getCompositeImageUrl(imageMeta)
      if (!src) continue

      const img = await loadCompositeImage(src)
      if (!img?.naturalWidth || !img?.naturalHeight) continue

      const scale = Math.max(cellWidth / img.naturalWidth, cellHeight / img.naturalHeight)
      const drawWidth = img.naturalWidth * scale
      const drawHeight = img.naturalHeight * scale
      const panX = cell.panX ?? 50
      const panY = cell.panY ?? 50
      const offsetX = cellX + (cellWidth - drawWidth) * (panX / 100)
      const offsetY = cellY + (cellHeight - drawHeight) * (panY / 100)

      ctx.save()
      ctx.beginPath()
      ctx.rect(cellX, cellY, cellWidth, cellHeight)
      ctx.clip()

      const centerX = cellX + cellWidth / 2
      const centerY = cellY + cellHeight / 2
      ctx.translate(centerX, centerY)
      ctx.rotate((cell.rotation || 0) * Math.PI / 180)
      const zoom = typeof cell.zoom === 'number' ? cell.zoom : 1
      ctx.scale(zoom, zoom)
      ctx.translate(-centerX, -centerY)

      const filter = IMAGE_FILTERS[cell.filter]?.cssFilter || 'none'
      ctx.filter = filter
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
      ctx.restore()
    }

    return canvas.toDataURL('image/jpeg', 0.7)
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

      const thumbnailDataUrl = await renderer.generateThumbnail(canvasElement)

      // Convert thumbnail data URL to blob
      const thumbnailResponse = await fetch(thumbnailDataUrl)
      const thumbnailBlob = await thumbnailResponse.blob()

      // 3. Get design config snapshot from store
      const birthPosterStore = useBirthPosterStore()
      const designConfig = birthPosterStore.getSnapshot()

      // 4. Upload config + thumbnail to S3 (fast! ~100KB total vs 40MB before)
      const { useS3Upload } = await import('~/composables/useS3Upload')
      const uploader = useS3Upload()

      const [configUpload, thumbnailUpload] = await Promise.all([
        uploader.uploadConfig(designConfig as unknown as Record<string, unknown>, 'birth-poster-config', 'momentos-malek'),
        uploader.uploadDesignImage(thumbnailBlob, 'birth-poster-thumb', 'momentos-malek'),
      ])
      const addedFromDevice = getAddToCartDevice()

      // 5. Add to Shopify cart with config URL (server renders full image on order)
      await cartStore.addItem(variant.id, 1, [
        { key: '_config', value: configUpload.url },
        { key: '_thumbnail', value: thumbnailUpload.url },
        { key: '_shop', value: 'BirthPoster' },
        { key: '_dispostivo', value: addedFromDevice },
        { key: 'Tamaño', value: snapshot.posterSize },
        { key: 'Marco', value: snapshot.frameStyleName },
        { key: 'Bebés', value: snapshot.babyNames },
      ])

      trackAddToCart({
        price: Number(variant.price),
        formattedPrice: Number(variant.price).toString(),
        productId: config.public.birthPosterProductId,
        variantId: variant.id,
        currency: 'MXN',
      })

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
    generatePersonalizaThumbnail,

    // Momentos Actions
    momentosProduct: computed(() => momentosProduct.value),
    isLoadingMomentosProduct,
    momentosProductError,
    fetchMomentosProduct,
    getMomentosVariant,
    calculateMomentosPrice,
    validateMomentosForCart,
    addMomentosToCart,
    generateMomentosThumbnail,
    generateMomentosHistoryThumbnail,
    generateMomentosHistoryThumbnailFromState,

    // Cart actions (pass-through)
    updateQuantity: cartStore.updateQuantity.bind(cartStore),
    removeItem: cartStore.removeItem.bind(cartStore),
    clearCart: cartStore.clearCart.bind(cartStore),
    checkout: cartStore.checkout.bind(cartStore),
  }
}
