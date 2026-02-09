<!-- Generated from Webflow reference; edit as needed -->
<script setup lang="ts">
const pageTitle = 'Personaliza - Studio Malek'
const pageDescription = 'Transforma tus recuerdos más preciados en obras de arte con Studio Malek. Personaliza e imprime tus propias imágenes, creando piezas únicas que cuenten tu historia. Convierte tus momentos inolvidables en impresiones duraderas y decora tu espacio con emociones. ¡Empieza tu viaje creativo con nosotros y haz que cada recuerdo cuente!';

useHead({
  title: pageTitle,
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogUrl: 'https://creaciones.studiomalek.com/personaliza',
  ogImage: 'https://creaciones.studiomalek.com/personaliza-og.jpg',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: 'https://creaciones.studiomalek.com/personaliza-og.jpg',
})

const uiStore = useUIStore()
const cartStore = useCartStore()
const cart = useShopifyCart()
const router = useRouter()
const $img = useImage()

const isSideMenuOpen = ref(false)
const isMobileCarousel = ref(false)
const highlightGalleryRef = ref<HTMLElement | null>(null)
let bgObserver: IntersectionObserver | null = null
let carouselMedia: MediaQueryList | null = null
let carouselListener: ((event?: MediaQueryListEvent) => void) | null = null

function toggleSideMenu() {
  isSideMenuOpen.value = !isSideMenuOpen.value
}

function closeSideMenu() {
  isSideMenuOpen.value = false
}

function getImage(src: string, width?: number, height?: number) {
  if (!src) return ''
  if (src.startsWith('http')) return src
  if (!width || !height) {
    return $img(src)
  }
  return $img(src, { width, height, fit: 'cover' })
}

function applyBackground(element: HTMLElement) {
  const srcValue = element.dataset.bgSrc || ''
  const sources = srcValue.split('|').map((value) => value.trim()).filter(Boolean)
  if (!sources.length) return
  const rect = element.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width * (window.devicePixelRatio || 1)))
  const height = Math.max(1, Math.round(rect.height * (window.devicePixelRatio || 1)))
  const urls = sources.map((src) => getImage(src, width, height))
  element.style.backgroundImage = urls.map((url) => `url("${url}")`).join(', ')
}

function setupLazyBackgrounds() {
  if (typeof window === 'undefined') return
  const elements = Array.from(document.querySelectorAll<HTMLElement>('.landing-page [data-bg-src]'))
  if (!elements.length) return

  const eagerElements = elements.filter((element) => element.dataset.bgEager === 'true')
  eagerElements.forEach(applyBackground)

  const lazyElements = elements.filter((element) => element.dataset.bgEager !== 'true')
  if (!lazyElements.length) return

  bgObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const element = entry.target as HTMLElement
        applyBackground(element)
        observer.unobserve(element)
      })
    },
    { rootMargin: '200px 0px' }
  )

  lazyElements.forEach((element) => bgObserver?.observe(element))
}

function handleLoaderWrapperClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('a')) return
  router.push('/app/personaliza?upload=1')
}

function handleLoaderWrapperKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    router.push('/app/personaliza?upload=1')
  }
}

function scrollHighlightGallery(direction: 'prev' | 'next') {
  const container = highlightGalleryRef.value
  if (!container) return
  const step = container.clientWidth
  const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth)
  const nextLeft = direction === 'next' ? container.scrollLeft + step : container.scrollLeft - step
  const clampedLeft = Math.min(maxScrollLeft, Math.max(0, nextLeft))
  container.scrollTo({ left: clampedLeft, behavior: 'smooth' })
}

onMounted(() => {
  cart.initCartOnly()
  setupLazyBackgrounds()
  if (typeof window !== 'undefined') {
    carouselMedia = window.matchMedia('(max-width: 991px)')
    carouselListener = () => {
      isMobileCarousel.value = carouselMedia?.matches ?? false
    }
    carouselListener()
    if (carouselMedia.addEventListener && carouselListener) {
      carouselMedia.addEventListener('change', carouselListener)
    } else {
      carouselMedia.addListener(carouselListener)
    }
  }
})

onBeforeUnmount(() => {
  bgObserver?.disconnect()
  if (carouselMedia && carouselListener) {
    if (carouselMedia.removeEventListener) {
      carouselMedia.removeEventListener('change', carouselListener)
    } else {
      carouselMedia.removeListener(carouselListener)
    }
  }
})
</script>

<template>
  <div class="landing-page landing-page__body landing-page__body--personaliza">
    <div id="builder" class="landing-page__page-wrapper">
        <div id="nav" class="landing-page__landings-container">
          <div class="landing-page__container nav">
            <div class="landing-page__nav-bar">
              <div class="landing-page__nav-menu landing-page__links">
                <button
                  type="button"
                  class="landing-page__pankacke landing-page__nav-toggle"
                  aria-label="Abrir menú"
                  @click="toggleSideMenu"
                >
                  <div class="landing-page__pankacke-line landing-page___2"></div>
                  <div class="landing-page__pankacke-line landing-page___1"></div>
                </button>
                <div class="landing-page__navigation-links">
                  <a href="https://www.studiomalek.com/collections/cuadros" target="_blank" class="landing-page__link-nav landing-page__w-inline-block">
                    <div>Colecciones</div>
                  </a>
                  <a href="https://www.studiomalek.com/collections/marcos" target="_blank" class="landing-page__link-nav landing-page__w-inline-block">
                    <div>Marcos</div>
                  </a>
                  <a href="#" class="landing-page__link-nav landing-page__current landing-page__w-inline-block">
                    <div>Creaciones</div>
                  </a>
                  <button
                    type="button"
                    class="landing-page__pancake landing-page__nav-toggle"
                    aria-label="Abrir menú"
                    @click="toggleSideMenu"
                  >
                    <div class="landing-page__pankacke-line landing-page___2"></div>
                    <div class="landing-page__pankacke-line landing-page___1"></div>
                  </button>
                  <a href="https://www.studiomalek.com/collections/set-de-cuadros" target="_blank" class="landing-page__link-nav landing-page__w-inline-block">
                    <div>Sets</div>
                  </a>
                  <a href="https://www.studiomalek.com/pages/negocios" target="_blank" class="landing-page__link-nav landing-page__w-inline-block">
                    <div>For Business</div>
                  </a>
                </div>
              </div>
              <a href="https://www.studiomalek.com/" target="_blank" class="landing-page__w-inline-block">
                <div class="landing-page__nav-logo-2 landing-page__builder"></div>
              </a>
              <div class="landing-page__nav-links-wrapper landing-page__builder">
                <a href="https://www.studiomalek.com/account" target="_blank" class="landing-page__nav-profile landing-page__start">
                  <span class="landing-page__iniciar-sesion-link"></span>
                </a>
                <div id="email-profile" class="landing-page__email-profile">albertoamoretti@gmail.com</div>
                <a href="https://www.studiomalek.com/account" target="_blank" class="landing-page__nav-profile">
                  <div class="landing-page__menu-icons landing-page__profile"></div>
                </a>
                <button
                  type="button"
                  class="landing-page__nav-icon cart landing-page__nav-icon-button"
                  aria-label="Carrito"
                  @click="uiStore.toggleCart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                  </svg>
                  <span
                    v-if="cartStore.totalQuantity > 0"
                    class="landing-page__cart-badge"
                  >
                    {{ cartStore.totalQuantity }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="landing-page__hero-home-wrapper">
          <div class="landing-page__hero-home-flex-wrapper">
            <div class="landing-page__homepage-right-side">
              <div class="landing-page__loader-left">
                <div class="landing-page__loader-title-wrapper landing-page__desktop">
                  <h1 class="landing-page__loader-h1">Convierte tus momentos favoritos en obras de arte.</h1>
                  <p class="landing-page__loader-subtitle">Personaliza tu imagen, enmárcala y recíbela en casa.<br></p>
                </div>
                <div
                  class="landing-page__loader-main-wrapper"
                  role="link"
                  tabindex="0"
                  aria-label="Abrir personalizador y subir imagen"
                  @click="handleLoaderWrapperClick"
                  @keydown="handleLoaderWrapperKeydown"
                >
                  <div class="landing-page__picture-preview-tools">
                    <div class="landing-page__preview-orientation">
                      <div class="landing-page__orientation-options">
                        <div class="landing-page__orientation">Cuadrado</div>
                        <div class="landing-page__orientation landing-page__orientation-selected">Vertical</div>
                        <div class="landing-page__orientation">Horizontal</div>
                      </div>
                    </div>
                    <div class="landing-page__preview-size">
                      <div class="landing-page__size-cursor-wrapper">
                        <div class="landing-page__slider-bar">
                          <div class="landing-page__slider-progress"></div>
                          <div class="landing-page__slider-controller"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style="background-color:rgb(255,254,253)" class="landing-page__loader-frame landing-page___3">
                    <NuxtLink to="/app/personaliza?upload=1" class="landing-page__loader-link landing-page__w-inline-block">
                      <div data-w-id="cf3a245f-ef6c-c116-397f-ad0b93279a76" class="landing-page__loader-button landing-page__round-cta">
                        <div class="landing-page__icon-loader landing-page__round landing-page__big"></div>
                        <div class="landing-page__loader-title">Carga tu archivo aquí</div>
                        <div class="landing-page__loader-detail-text landing-page__transparent-bg">
                          <div class="landing-page__uploader-text">o haz click aquí para</div>
                          <div class="landing-page__uploader-text landing-page__highlight">Subir</div>
                        </div>
                      </div>
                    </NuxtLink>
                    <div class="landing-page__picture-loaded-wrapper">
                      <div class="landing-page__picture-preview"><NuxtImg src="/landing-pages/images/photo-1504019853082-9a4cb128c1ef.avif" loading="lazy" sizes="(max-width: 1000px) 100vw, 1000px" alt="" fit="cover" class="landing-page__picture-file" /></div>
                      <div data-w-id="cf3a245f-ef6c-c116-397f-ad0b93279a83" class="landing-page__picture-loaded-cancel"></div>
                      <div class="landing-page__details landing-page__size-warnings">
                        <div class="landing-page__tyco-text-right-3 landing-page__error">
                          <div class="landing-page__text-block-7">Intenta subir otro archivo - <strong>Tamaño mínimo recomendado</strong>: 200 DPI - 1500x3000 px</div>
                        </div>
                      </div>
                    </div>
                    <div class="landing-page__next-step-button">
                      <NuxtLink to="/app/personaliza?upload=1" class="landing-page__button landing-page__next-step landing-page__w-button">Siguiente paso <span class="landing-page__icon landing-page__next-step"></span></NuxtLink>
                    </div>
                    <div class="landing-page__gif-wrapper">
                      <div class="landing-page__gif-container"><NuxtImg src="/landing-pages/images/Rolling-1s-207px.gif" loading="lazy" alt="" fit="cover" class="landing-page__image-2" /></div>
                    </div>
                  </div>
                  <div class="landing-page__tyco-text-home"><strong class="landing-page__bold-text">Tamaño máximo 20mb.</strong> Al cargar una imagen o URL, acepta nuestros <a href="https://www.studiomalek.com/pages/terminos-condiciones" target="_blank" class="landing-page__textlink landing-page__spaced">Términos de servicio</a>.<br></div>
                </div>
                <div class="landing-page__loader-terms-wrapper"></div>
              </div>
            </div>
            <div class="landing-page__home-left-side"></div>
          </div>
          <div class="landing-page__landing-gallery landing-page__gradient">
            <div class="landing-page__container landing-page__designs-gallery">
              <div class="landing-page__templates-container">
                <h2 class="landing-page__promo-title landing-page__centered"><strong>Categorías favoritas</strong></h2>
              </div>
              <div class="landing-page__highlight-carousel">
                <button
                  v-if="isMobileCarousel"
                  type="button"
                  class="landing-page__carousel-arrow landing-page__carousel-arrow--prev"
                  aria-label="Anterior"
                  @click="scrollHighlightGallery('prev')"
                >
                  <span class="landing-page__carousel-arrow-icon" aria-hidden="true">&lsaquo;</span>
                </button>
                <div ref="highlightGalleryRef" class="landing-page__highlight-gallery landing-page__styles">
                  <div class="landing-page__category-item">
                  <div class="landing-page__collecction-square-picture"><NuxtImg alt="" src="/landing-pages/images/pexels-arthurbrognoli-2260786.avif" loading="lazy" width="200" height="200" sizes="(max-width: 479px) 140px, (max-width: 1279px) 160px, (max-width: 1439px) 170px, (max-width: 1919px) 180px, 200px" fit="cover" class="landing-page__category-pic" /></div>
                  <h4 class="landing-page__category-title">Viajes</h4>
                  <div class="landing-page__category-item-date">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-block">
                        <div class="landing-page__bottom-line"></div>
                      </div>
                    </div>
                  </div>
                  </div>
                  <div class="landing-page__category-item">
                  <div class="landing-page__collecction-square-picture"><NuxtImg alt="" src="/landing-pages/images/pexels-arina-krasnikova-5416634.avif" loading="lazy" width="200" height="200" sizes="(max-width: 479px) 140px, (max-width: 1279px) 160px, (max-width: 1439px) 170px, (max-width: 1919px) 180px, 200px" fit="cover" class="landing-page__category-pic" /></div>
                  <h4 class="landing-page__category-title">Familia</h4>
                  <div class="landing-page__category-item-date">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-block">
                        <div class="landing-page__bottom-line"></div>
                      </div>
                    </div>
                  </div>
                  </div>
                  <div class="landing-page__category-item">
                  <div class="landing-page__collecction-square-picture"><NuxtImg alt="" src="/landing-pages/images/pexels-jonathanborba-13617315.avif" loading="lazy" width="200" height="200" sizes="(max-width: 479px) 140px, (max-width: 1279px) 160px, (max-width: 1439px) 170px, (max-width: 1919px) 180px, 200px" fit="cover" class="landing-page__category-pic" /></div>
                  <h4 class="landing-page__category-title">Boda</h4>
                  <div class="landing-page__category-item-date">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-block">
                        <div class="landing-page__bottom-line"></div>
                      </div>
                    </div>
                  </div>
                  </div>
                  <div class="landing-page__category-item">
                  <div class="landing-page__collecction-square-picture"><NuxtImg alt="" src="/landing-pages/images/pexels-jess-vide-4601355.jpg" loading="lazy" width="200" height="200" sizes="(max-width: 479px) 140px, (max-width: 1279px) 160px, (max-width: 1439px) 170px, (max-width: 1919px) 180px, 200px" fit="cover" class="landing-page__category-pic" /></div>
                  <h4 class="landing-page__category-title">Fotografías</h4>
                  <div class="landing-page__category-item-date">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-block">
                        <div class="landing-page__bottom-line"></div>
                      </div>
                    </div>
                  </div>
                  </div>
                  <div class="landing-page__category-item">
                  <div class="landing-page__collecction-square-picture"><NuxtImg alt="" src="/landing-pages/images/7624362.avif" loading="lazy" width="200" height="200" sizes="(max-width: 479px) 140px, (max-width: 1279px) 160px, (max-width: 1439px) 170px, (max-width: 1919px) 180px, 200px" fit="cover" class="landing-page__category-pic" /></div>
                  <h4 class="landing-page__category-title">Ilustraciones</h4>
                  <div class="landing-page__category-item-date">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-block">
                        <div class="landing-page__bottom-line"></div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
                <button
                  v-if="isMobileCarousel"
                  type="button"
                  class="landing-page__carousel-arrow landing-page__carousel-arrow--next"
                  aria-label="Siguiente"
                  @click="scrollHighlightGallery('next')"
                >
                  <span class="landing-page__carousel-arrow-icon" aria-hidden="true">&rsaquo;</span>
                </button>
              </div>
              <NuxtLink to="/app/personaliza?upload=1" class="landing-page__sec-ondary-button landing-page__w-button">¡Crea el tuyo!</NuxtLink>
            </div>
          </div>
          <div class="landing-page__marketing-sections">
            <div class="landing-page__loader-section landing-page__process">
              <div class="landing-page__promo-container">
                <div class="landing-page__poster-container">
                  <div class="landing-page__poster-promo-left">
                    <div
                      class="landing-page__poster-crreator-1"
                      data-bg-src="/landing-pages/images/paisajes_blanco_y_negro_set-1.webp"
                    ></div>
                  </div>
                  <div class="landing-page__poster-promo-right">
                    <div class="landing-page__promo-text-container">
                      <p class="landing-page__tuttorial-highlight">Crea con Malek</p>
                      <h2 class="landing-page__promo-title">Nunca fue tán fácil crear un cuadro personalizado.</h2>
                      <p class="landing-page__tuttorial-text">Fotos de boda, los primeros pasos de tu bebé, retratos familiares, ese atardecer que no puedes olvidar... cualquier imagen especial puede convertirse en arte para tu hogar.<br><br><strong>Sube tu foto, selecciona el tamaño, agrega un marco o margen de color, y listo</strong>. Nosotros validamos la resolución y te recomendamos el tamaño ideal para que la impresión quede perfecta.</p>
                      <div class="landing-page__promo-details">
                        <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"><span class="landing-page__icon landing-page__del">📦</span> Entrega 3-5 días</a>
                        <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"> <span class="landing-page__icon landing-page__del">🚚 </span>Envíos a todo México</a>
                        <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"> <span class="landing-page__icon landing-page__del">✨ </span>Listo para colgar</a>
                      </div>
                      <div class="landing-page__cta-div">
                        <NuxtLink to="/app/personaliza?upload=1" class="landing-page__primary-button landing-page__w-button">¡Empieza a crear!</NuxtLink>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="landing-page__loader-section landing-page__gradient">
              <div class="landing-page__container">
                <div class="landing-page__process-wraps">
                  <div class="landing-page__templates-container">
                    <h2 class="landing-page__promo-title"><strong>Así de fácil lo haces.</strong></h2>
                  </div>
                  <div class="landing-page__process-wrap">
                    <div class="landing-page__process-item">
                      <div class="landing-page__process-image">
                        <div class="landing-page__personaliza-image-uno"><NuxtImg src="/landing-pages/images/young-blonde-woman-beach-1.avif" loading="lazy" alt=""  fit="cover" /></div>
                      </div>
                      <div class="landing-page__personaliza-sub"><NuxtImg src="/landing-pages/images/Screenshot-2026-02-03-alle-10.35.11-AM.avif" loading="lazy" sizes="(max-width: 1414px) 100vw, 1414px" alt=""  fit="cover" /></div>
                      <div class="landing-page__steps-text">
                        <div class="landing-page__step-title-wrap">
                          <h4 class="landing-page__steps-titles">Carga una imagen </h4>
                        </div>
                        <p>Carga tu foto favorita desde tu celular o laptop y elige la orientación ideal.</p>
                      </div>
                    </div>
                    <div class="landing-page__process-item">
                      <div class="landing-page__process-image">
                        <div class="landing-page__personaliza-image-dos">
                          <div class="landing-page__div-block-9"><NuxtImg src="/landing-pages/images/young-blonde-woman-beach-1.avif" loading="lazy" alt=""  fit="cover" /></div>
                          <h4 class="landing-page__steps-titles landing-page__centered">Summer 2025</h4>
                        </div>
                      </div>
                      <div class="landing-page__personaliza-sub"><NuxtImg src="/landing-pages/images/Screenshot-2026-02-03-alle-10.22.13-AM.avif" loading="lazy" alt=""  fit="cover" /></div>
                      <div class="landing-page__steps-text">
                        <div class="landing-page__step-title-wrap">
                          <h4 class="landing-page__steps-titles">Edita y personaliza</h4>
                        </div>
                        <p>Agrega un texto especial y elige un margen del color que más te guste.</p>
                      </div>
                    </div>
                    <div class="landing-page__process-item">
                      <div class="landing-page__process-image"><NuxtImg src="/landing-pages/images/personaliza-shot.avif" loading="lazy" alt="" fit="cover" class="landing-page__image-7" /></div>
                      <div class="landing-page__personaliza-sub landing-page__frames-p">
                        <h4 class="landing-page__step-picture-titel">Selecciona un marco</h4><NuxtImg src="/landing-pages/images/Screenshot-2026-01-26-at-1.36.29-p.m..avif" loading="lazy" alt=""  fit="cover" />
                      </div>
                      <div class="landing-page__steps-text">
                        <div class="landing-page__step-title-wrap">
                          <h4 class="landing-page__steps-titles"><strong>Elige tu marco y recíbelo</strong></h4>
                        </div>
                        <p>Selecciona tu marco favorito y recíbelo en casa, listo para colgar en 3–5 días.</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__templates-container">
                    <NuxtLink to="/app/personaliza?upload=1" class="landing-page__sec-ondary-button landing-page__w-button">¡Crea el tuyo!</NuxtLink>
                  </div>
                </div>
              </div>
            </div>
            <div class="landing-page__loader-section landing-page__revieew">
              <div class="landing-page__loader-container">
                <div class="landing-page__hero-title-wrapper">
                  <h2 class="landing-page__promo-title">Algunas reseñas de la comunidad Studio Malek</h2>
                </div>
                <div class="landing-page__loader-poster-instruction-wrap">
                  <div class="landing-page__loader-step1">
                    <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                      <h3 class="landing-page__review-title">¡Todo Perfecto!<br></h3>
                      <p class="landing-page__review-text">¡Hola! No había tenido oportunidad de compartirles que recibimos nuestros cuadros, todo perfecto con la entrega. <strong>¡Los cuadros me encantaron!</strong></p>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div
                        class="landing-page__avatar landing-page___1"
                        data-bg-src="/landing-pages/images/Polo_G_Review_180x.avif"
                      ></div>
                      <div>
                        <h3 class="landing-page__testimonial-name">Polo<br></h3>
                        <p class="landing-page__testimonial-position">Monterrey</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div>
                      <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                        <h3 class="landing-page__review-title">Muy buena Calidad<br></h3>
                        <p class="landing-page__review-text">Los colores son super nítidos y la calidad de impresión es muy buena. Estoy muy satisfecha con mi compra, es igual de cómo se muestra en la página. <strong>Llegó antes de lo esperado.</strong></p>
                      </div>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div
                        class="landing-page__avatar"
                        data-bg-src="/landing-pages/images/Denisse_de_A_180x-1.avif"
                      ></div>
                      <div>
                        <h3 class="landing-page__testimonial-name">Dennise<br></h3>
                        <p class="landing-page__testimonial-position">Guadalajara</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                      <h3 class="landing-page__review-title">Me gustaron los cuadros<br></h3>
                      <p class="landing-page__review-text">Me gustaron los cuadros. Sobre todo que no pesan y los puedes colgar con seguridad.<br><br>Los empacaron muy bien, venían bien protegidos. ¡Recomendables!</p>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div
                        class="landing-page__avatar landing-page___3"
                        data-bg-src="/landing-pages/images/Paulina_T_180x.avif"
                      ></div>
                      <div>
                        <h3 class="landing-page__testimonial-name">Paulina<br></h3>
                        <p class="landing-page__testimonial-position">León</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                      <h3 class="landing-page__review-title">Súper lindos y gran servicio! <br></h3>
                      <p class="landing-page__review-text">Súper lindos y gran servicio! Los cuadros están súper lindos, súper buena comunicación. <strong>Sin duda volveré a comprarles!</strong><br></p>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div
                        class="landing-page__avatar landing-page___4"
                        data-bg-src="/landing-pages/images/Screenshot-2023-09-25-alle-7.56.44-AM.avif"
                      ></div>
                      <div>
                        <h3 class="landing-page__testimonial-name">Fadia<br></h3>
                        <p class="landing-page__testimonial-position">CDMX</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="landing-page__footer">
            <div class="landing-page__footer-container">
              <div class="landing-page__footer-col">
                <a href="#" class="landing-page__malek-logo landing-page__w-inline-block">
                  <div class="landing-page__footer-title">Studio Malek S.A. de C.V.</div>
                </a>
                <div>
                  <div class="landing-page__footer-text">Whatsapp: <a href="https://wa.me/523316995405?text=Hola%2C%20%0ATengo%20una%20duda%20acerca%20de%20..." target="_blank" class="landing-page__link landing-page__white">3316995405<br>‍</a>hello@studiomalek.com<br><br>Horario de Atención<br>9 - 17 hrs de Lunes a Viernes.<br><br>Instagram: studio_malek<br>Zapopan, Jalisco. México</div>
                </div>
              </div>
              <div class="landing-page__footer-content">
                <div class="landing-page__footer-title">Malek</div>
                <div class="landing-page__footer-links-wrap">
                  <a href="https://www.studiomalek.com/" target="_blank" class="landing-page__footer-links">Cuadros</a>
                  <a href="https://www.studiomalek.com/collections/marcos" target="_blank" class="landing-page__footer-links">Marcos</a>
                  <a href="https://www.studiomalek.com/collections/" target="_blank" class="landing-page__footer-links">Colecciones</a>
                  <a href="https://www.studiomalek.com/pages/negocios" target="_blank" class="landing-page__footer-links">Para negocios</a>
                  <a href="https://artwall.studiomalek.com/" target="_blank" class="landing-page__footer-links">Crea tu muro</a>
                  <a href="https://www.studiomalek.com/pages/terminos-condiciones" target="_blank" class="landing-page__footer-links">Terminos y Condiciones</a>
                  <a href="https://www.studiomalek.com/pages/privacidad" target="_blank" class="landing-page__footer-links">Políticas de privacidad</a>
                </div>
              </div>
              <div class="landing-page__footer-content">
                <div class="landing-page__footer-title">Cuenta</div>
                <div class="landing-page__footer-links-wrap">
                  <a href="https://www.studiomalek.com/account" target="_blank" class="landing-page__footer-links">Perfil</a>
                  <a href="https://www.studiomalek.com/account" target="_blank" class="landing-page__footer-links">Iniciar sesión</a>
                  <a href="https://www.studiomalek.com/account" target="_blank" class="landing-page__footer-links">Pedidos</a>
                </div>
              </div>
              <div class="landing-page__footer-content">
                <div class="landing-page__footer-title">Contacto</div>
                <div class="landing-page__footer-links-wrap">
                  <a href="mailto:hello.com" target="_blank" class="landing-page__footer-links">Correo</a>
                  <a href="https://www.instagram.com/studio_malek/" target="_blank" class="landing-page__footer-links">Instagram</a>
                  <a href="https://www.facebook.com/studio.malek.mx/" target="_blank" class="landing-page__footer-links">Facebook</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="landing-page__side-menu"
          :class="{ 'landing-page__side-menu--open': isSideMenuOpen }"
          @click.self="closeSideMenu"
        >
          <div
            class="landing-page__side-menu-panel"
            :class="{ 'landing-page__side-menu-panel--open': isSideMenuOpen }"
          >
            <div class="landing-page__menu-links-wrapper">
              <a href="https://www.studiomalek.com/collections/" target="_blank" class="landing-page__left-nav-link">Colecciones <span class="landing-page__text-span"></span></a>
              <a href="https://www.studiomalek.com/collections/marcos" target="_blank" class="landing-page__left-nav-link">Marcos <span class="landing-page__text-span"></span></a>
              <NuxtLink to="/personaliza" class="landing-page__left-nav-link">Creaciones<span class="landing-page__text-span"></span></NuxtLink>
              <a href="https://www.studiomalek.com/collections/set-de-cuadros" target="_blank" class="landing-page__left-nav-link">Sets<span class="landing-page__text-span"></span></a>
              <a href="https://www.studiomalek.com/pages/negocios" target="_blank" class="landing-page__left-nav-link">For Business <span class="landing-page__text-span"></span></a>
              <div class="landing-page__menu-footer">
                <a href="https://www.studiomalek.com/account" target="_blank" class="landing-page__footlink">Tu cuenta</a>
                <div class="landing-page__foot-dot"></div>
                <a href="mailto:hello@studiomalek.com?subject=Contact%20Studio%20Malek" target="_blank" class="landing-page__footlink">Contacto</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    <SharedCartSidebar />
  </div>
</template>


<style lang="scss">
.landing-page {
  min-height: 100dvh;
}


.landing-page__nav-toggle,
.landing-page__nav-icon-button {
  @include button-reset;
  cursor: pointer;
}

.landing-page__nav-icon-button {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: $radius-xl;
  background: #1a202c;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color $transition-fast, color $transition-fast;

  @include hover {
    background: #2d3748;
    color: #ffffff;
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

.landing-page__cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #e53e3e;
  color: #ffffff;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
}

.landing-page .landing-page__side-menu {
  display: block;
  opacity: 0;
  pointer-events: none;
  transition: opacity $transition-base;
}

.landing-page .landing-page__side-menu.landing-page__side-menu--open {
  opacity: 1;
  pointer-events: auto;
}

.landing-page .landing-page__side-menu-panel {
  display: block;
  opacity: 1;
  transform: translate3d(-100%, 0, 0);
  transition: transform $transition-slow;
  will-change: transform;
}

.landing-page .landing-page__side-menu-panel.landing-page__side-menu-panel--open {
  transform: translate3d(0, 0, 0);
}
</style>
