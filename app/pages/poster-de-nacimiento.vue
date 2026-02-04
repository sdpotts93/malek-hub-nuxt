<!-- Generated from Webflow reference; edit as needed -->
<script setup lang="ts">
const pageTitle = 'Póster de nacimiento - Studio Malek'
const pageDescription = 'Transforma tus recuerdos más preciados en obras de arte con Studio Malek. Personaliza e imprime tus propias imágenes, creando piezas únicas que cuenten tu historia. Convierte tus momentos inolvidables en impresiones duraderas y decora tu espacio con emociones. ¡Empieza tu viaje creativo con nosotros y haz que cada recuerdo cuente!';

useHead({
  title: pageTitle,
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogUrl: 'https://creaciones.studiomalek.com/poster-de-nacimiento',
  ogImage: 'https://creaciones.studiomalek.com/nacimiento-og.jpg',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: 'https://creaciones.studiomalek.com/nacimiento-og.jpg',
})

const uiStore = useUIStore()
const cartStore = useCartStore()
const cart = useShopifyCart()
const $img = useImage()

const isSideMenuOpen = ref(false)
let bgObserver: IntersectionObserver | null = null

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

onMounted(() => {
  cart.initCartOnly()
  setupLazyBackgrounds()
})

onBeforeUnmount(() => {
  bgObserver?.disconnect()
})
</script>

<template>
  <div class="landing-page landing-page__body landing-page__body--poster-de-nacimiento">
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
          <div class="landing-page__content-wrapper">
            <div class="landing-page__section-hero">
              <div class="landing-page__hero-bg">
                <div class="landing-page__bg-right-2"></div>
                <div
                  class="landing-page__hero-bp"
                  data-bg-src="/landing-pages/images/main-babya.jpg"
                >
                  <div data-w-id="9f06a2ae-86f3-62bc-413b-7b203509235b" class="landing-page__more-prod">
                    <div class="landing-page__cart-row-2">
                      <div
                        class="landing-page__cart-picture-2 landing-page___1"
                        data-bg-src="/landing-pages/images/Screenshot-2023-10-29-alle-11.03.27-PM.png"
                      ></div>
                      <div class="landing-page__cart-data-2">
                        <div class="landing-page__cart-data-line">
                          <div class="landing-page__cart-item-title-2">Flores Yellow</div>
                        </div>
                        <div class="landing-page__cart-item-description-2">100x60 cm</div>
                        <div class="landing-page__price-block">
                          <div class="landing-page__cart-item-description-2 landing-page__price landing-page__cancelled landing-page__over">$1,500 mxn</div>
                          <div class="landing-page__cart-item-description-2 landing-page__price landing-page__red landing-page__over">$1,000 mxn</div>
                        </div>
                      </div>
                    </div>
                    <div class="landing-page__cart-row-2">
                      <div
                        class="landing-page__cart-picture-2"
                        data-bg-src="/landing-pages/images/Screenshot-2023-10-29-alle-11.03.35-PM.png"
                      ></div>
                      <div class="landing-page__cart-data-2">
                        <div class="landing-page__cart-data-line">
                          <div class="landing-page__cart-item-title-2">Cuadro Full Blue</div>
                        </div>
                        <div class="landing-page__cart-item-description-2">100x60 cm</div>
                        <div class="landing-page__price-block">
                          <div class="landing-page__cart-item-description-2 landing-page__price landing-page__cancelled landing-page__over">$1,500 mxn</div>
                          <div class="landing-page__cart-item-description-2 landing-page__price landing-page__red landing-page__over">$1,000 mxn</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="landing-page__hero-text-wrapper">
                <div class="landing-page__hero-text-left-3">
                  <p class="landing-page__tuttorial-highlight-5 landing-page__hero">The birth Poster</p>
                  <div class="landing-page__hero-title-wrapper-2">
                    <h1 class="landing-page__pages-title">Celebra la llegada de tu bebé con un cuadro a escala real.</h1>
                  </div>
                  <div class="landing-page__hero-p">
                    <p class="landing-page__paragraph-large">Un póster personalizado con el nombre, fecha, peso y medidas de tu bebé, impreso a tamaño 1:1. El recuerdo perfecto de lo pequeñito que era.</p>
                  </div>
                  <div class="landing-page__hero-button">
                    <NuxtLink to="/app/poster-de-nacimiento" class="landing-page__button-2 landing-page__w-button">Diseña tu poster</NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="landing-page__landing-gallery landing-page__bp-gradient">
            <div class="landing-page__container landing-page__gallerys">
              <div class="landing-page__templates-container title">
                <h2 class="landing-page__promo-title landing-page__centered">Diseños de nuestros clientes</h2>
              </div>
              <div class="landing-page__highlight-gallery landing-page__birthposter-gallery">
                <NuxtLink to="/app/poster-de-nacimiento" class="landing-page__birth-poster-item">
                  <div class="landing-page__birthposter-item-pic"><NuxtImg src="/landing-pages/images/bp-3.webp" loading="lazy" alt="" fit="cover" class="landing-page__image-5" /></div>
                  <div class="landing-page__item-data landing-page__list-item">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-wrap">
                        <h4 class="landing-page__item-title">Línea marcada</h4>
                      </div>
                    </div>
                    <div class="landing-page__collection-link">Fondo beige - Marco nogal - <span>50x40 Cm</span></div>
                    <div class="landing-page__item-price">
                      <div class="landing-page__price-block">
                        <div class="landing-page__cart-item-description-2 landing-page__price landing-page__red">$<strong>2,585 </strong> mxn</div>
                      </div>
                    </div>
                  </div>
                </NuxtLink>
                <NuxtLink to="/app/poster-de-nacimiento" class="landing-page__birth-poster-item">
                  <div class="landing-page__birthposter-item-pic"><NuxtImg src="/landing-pages/images/Screenshot-2026-02-03-alle-11.34.23-AM.avif" loading="lazy" sizes="(max-width: 948px) 100vw, 948px" alt="" fit="cover" class="landing-page__image-5" /></div>
                  <div class="landing-page__item-data landing-page__list-item">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-wrap">
                        <h4 class="landing-page__item-title">Línea contínua</h4>
                      </div>
                    </div>
                    <div class="landing-page__collection-link">Fondo blanco - Marco negro - <span>70x50 Cm</span></div>
                    <div class="landing-page__item-price">
                      <div class="landing-page__price-block">
                        <div class="landing-page__cart-item-description-2 landing-page__price landing-page__red">$<strong>3,165</strong> mxn</div>
                      </div>
                    </div>
                  </div>
                </NuxtLink>
                <NuxtLink to="/app/poster-de-nacimiento" class="landing-page__birth-poster-item">
                  <div class="landing-page__birthposter-item-pic"><NuxtImg src="/landing-pages/images/bp-1.webp" loading="lazy" alt="" fit="cover" class="landing-page__image-5" /></div>
                  <div class="landing-page__item-data landing-page__list-item">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-wrap">
                        <h4 class="landing-page__item-title">Trazos liegeros</h4>
                      </div>
                    </div>
                    <div class="landing-page__collection-link">Fondo caramelo - Marco roble - <span>50x40 Cm</span></div>
                    <div class="landing-page__item-price">
                      <div class="landing-page__price-block">
                        <div class="landing-page__cart-item-description-2 landing-page__price landing-page__red">$<strong>2,585 </strong> mxn</div>
                      </div>
                    </div>
                  </div>
                </NuxtLink>
                <NuxtLink to="/app/poster-de-nacimiento" class="landing-page__birth-poster-item">
                  <div class="landing-page__birthposter-item-pic"><NuxtImg src="/landing-pages/images/Screenshot-2026-02-03-alle-11.32.26-AM.avif" loading="lazy" sizes="(max-width: 948px) 100vw, 948px" alt="" fit="cover" class="landing-page__image-5" /></div>
                  <div class="landing-page__item-data landing-page__list-item">
                    <div class="landing-page__title-wrap">
                      <div class="landing-page__title-wrap">
                        <h4 class="landing-page__item-title">Aquarella</h4>
                      </div>
                    </div>
                    <div class="landing-page__collection-link">Fondo blanco - Marco nogal - <span>50x40 Cm</span></div>
                    <div class="landing-page__item-price">
                      <div class="landing-page__price-block">
                        <div class="landing-page__cart-item-description-2 landing-page__price landing-page__red">$<strong>2,585</strong> mxn</div>
                      </div>
                    </div>
                  </div>
                </NuxtLink>
              </div>
              <div class="landing-page__templates-container">
                <NuxtLink to="/app/poster-de-nacimiento" class="landing-page__button-secondary landing-page__w-button">¡Empieza a crear el tuyo!</NuxtLink>
              </div>
            </div>
          </div>
          <div class="landing-page__about-wrap">
            <div class="landing-page__about-section">
              <div class="landing-page__about-text landing-page__about-wrap">
                <div class="landing-page__about-text-wrapper">
                  <div class="landing-page__about-title">
                    <p class="landing-page__tuttorial-highlight">CREA CON MALEK</p>
                    <h2 class="landing-page__promo-title">Un recuerdo para siemprede lo pequeños que son.</h2>
                  </div>
                  <div class="landing-page__hero-p">
                    <p class="landing-page__tuttorial-text">Un detalle ideal para celebrar el día en que nació tu bebé. Con un diseño minimalista, muestra su tamaño real al nacer y se convierte en un detalle precioso para revivir esos primeros momentos.</p>
                  </div>
                </div>
              </div>
              <div
                class="landing-page__about-text landing-page__pic-about-2"
                data-bg-src="/landing-pages/images/bb-Poster1.avif"
              ></div>
            </div>
            <div class="landing-page__about-section">
              <div
                class="landing-page__about-text landing-page__pic-about3"
                data-bg-src="/landing-pages/images/bb-Poster2.avif"
              ></div>
              <div class="landing-page__about-text landing-page__inverted">
                <div class="landing-page__about-text-wrapper">
                  <div class="landing-page__about-title">
                    <p class="landing-page__tuttorial-highlight">Crea con Malek</p>
                    <h2 class="landing-page__promo-title">Un recuerdo que van a atesorar por siempre</h2>
                  </div>
                  <p class="landing-page__tuttorial-text">Baby shower, bautizo, primer cumpleaños o simplemente para celebrar a unos papás primerizos. Un Birth Poster es el detalle que van a querer colgar en la habitación desde el primer día.</p>
                  <div class="landing-page__promo-details">
                    <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"><span class="landing-page__icon landing-page__del">📦</span> Entrega 3-5 días</a>
                    <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"> <span class="landing-page__icon landing-page__del">🚚 </span>Envíos a todo México</a>
                    <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"> <span class="landing-page__icon landing-page__del">✨ </span>Listo para colgar</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="landing-page__marketing-sections">
            <div class="landing-page__loader-section landing-page__gradient">
              <div class="landing-page__container">
                <div class="landing-page__process-wraps">
                  <div class="landing-page__templates-container">
                    <h2 class="landing-page__promo-title">Así de fácil funciona:</h2>
                  </div>
                  <div class="landing-page__process-wrap">
                    <div class="landing-page__process-item">
                      <div class="landing-page__process-image">
                        <div class="landing-page__personaliza-image-uno landing-page__birth"><NuxtImg src="/landing-pages/images/bp-4.webp" loading="lazy" alt="" fit="cover" class="landing-page__shadow-pic" /></div>
                      </div>
                      <div class="landing-page__personaliza-sub landing-page__b-1"><NuxtImg src="/landing-pages/images/Screenshot-2026-01-30-alle-10.59.34-AM.avif" loading="lazy" sizes="(max-width: 748px) 100vw, 748px" alt=""  fit="cover" /></div>
                      <div class="landing-page__steps-text">
                        <div class="landing-page__step-title-wrap">
                          <h4 class="landing-page__steps-titles">Elige un estilo </h4>
                        </div>
                        <p>Selecciona el estilo de trazo que más te guste, hacia qué lado estará volteando y su color.</p>
                      </div>
                    </div>
                    <div class="landing-page__process-item">
                      <div class="landing-page__process-image">
                        <div class="landing-page__personaliza-image-uno landing-page__birth"><NuxtImg src="/landing-pages/images/bp-2.webp" loading="lazy" alt="" fit="cover" class="landing-page__shadow-pic" /></div>
                      </div>
                      <div class="landing-page__personaliza-sub landing-page__b-2"><NuxtImg src="/landing-pages/images/Screenshot-2026-01-30-alle-11.01.15-AM.avif" loading="lazy" sizes="(max-width: 748px) 100vw, 748px" alt=""  fit="cover" /></div>
                      <div class="landing-page__steps-text">
                        <div class="landing-page__step-title-wrap">
                          <h4 class="landing-page__steps-titles">Personaliza con sus datos</h4>
                        </div>
                        <p>Agrega el nombre, talla, peso, lugar y fecha y hora en que nación. Puedes elegir también el color del fondo.</p>
                      </div>
                    </div>
                    <div class="landing-page__process-item">
                      <div class="landing-page__process-image"><NuxtImg src="/landing-pages/images/bp-1.webp" loading="lazy" alt="" fit="cover" class="landing-page__image-7" /></div>
                      <div class="landing-page__personaliza-sub landing-page__frames">
                        <h4 class="landing-page__step-picture-titel">Selecciona un marco</h4><NuxtImg src="/landing-pages/images/Screenshot-2026-01-26-at-1.36.29-p.m..avif" loading="lazy" alt=""  fit="cover" />
                      </div>
                      <div class="landing-page__steps-text">
                        <div class="landing-page__step-title-wrap">
                          <h4 class="landing-page__steps-titles">Elige un marco y recíbelo en casa</h4>
                        </div>
                        <p>Agrega tu marco favorito y recíbelo en casa o donde tú nos indiques, listo para colgar a tu pared en 3-5 días.</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__templates-container">
                    <NuxtLink to="/app/poster-de-nacimiento" class="landing-page__sec-ondary-button landing-page__w-button">¡Crea el tuyo!</NuxtLink>
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
                      <h3 class="landing-page__review-title"><strong>Ideal para cuarto infantil</strong><br></h3>
                      <p class="landing-page__review-text">Lo pedí para el cuarto de mi bebé y quedó precioso. Me encantó que se ve súper limpio y elegante, y el tamaño al nacer se siente como algo muy especial. Llegó bien empacado y la impresión se ve de muy buena calidad.</p>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div>
                        <h3 class="landing-page__testimonial-name">Polo<br></h3>
                        <p class="landing-page__testimonial-position">Monterrey</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div>
                      <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                        <h3 class="landing-page__review-title"><strong>¡Super regalo para Mamás!</strong><br></h3>
                        <p class="landing-page__review-text">Se lo regalé a mi hermana y literal casí  llora cuando lo vio 😭  <br><br>Además está padre porque no es el típico regalo, es algo que sí se queda para siempre.</p>
                      </div>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div>
                        <h3 class="landing-page__testimonial-name">Dennise<br></h3>
                        <p class="landing-page__testimonial-position">Guadalajara</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                      <h3 class="landing-page__review-title"><strong>Muy muy bonito</strong><br></h3>
                      <p class="landing-page__review-text">Me gustó muchísimo el diseño, está súper bonito y combina con todo. <br>Lo único es que me tardé en decidirme porque quería estar segura de los datos, pero ya viéndolo en la pared valió totalmente la pena.</p>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div>
                        <h3 class="landing-page__testimonial-name">Paulina<br></h3>
                        <p class="landing-page__testimonial-position">León</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                      <h3 class="landing-page__review-title"><strong>Buena calidad</strong><br></h3>
                      <p class="landing-page__review-text">Está increíble. Me sorprendió lo bien que se ve en persona, el papel y el marco se siente de calidad. Es de esas cosas que te hacen recordar lo chiquito que era tu bebé 🥺 <br></p>
                    </div>
                    <div class="landing-page__review-testimonial">
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
        <div class="landing-page__dashboard">
          <div class="landing-page__more-info-overlay">
            <div class="landing-page__more-info-cards-wrapper">
              <div class="landing-page__more-info-block">
                <div class="landing-page__sizes-info-wrapper">
                  <div class="landing-page__sizes-info-image"><NuxtImg src="/landing-pages/images/Size_Guide_Studio_Malek_600x600.webp" loading="lazy" alt="" fit="cover" class="landing-page__image-4" /></div>
                  <div class="landing-page__sizes-table">
                    <div class="landing-page__sizes-title">
                      <div class="landing-page__sizes-orientation-text">Tamaños y Orientación</div>
                    </div>
                    <div class="landing-page__table">
                      <div class="landing-page__line">
                        <div class="landing-page__header-cell landing-page__first">
                          <div>Orientación</div>
                        </div>
                        <div class="landing-page__header-cell">
                          <div>Impresión</div>
                        </div>
                        <div class="landing-page__header-cell landing-page__last">
                          <div>Enmarcada</div>
                        </div>
                      </div>
                      <div class="landing-page__line">
                        <div class="landing-page__body-cell landing-page__first">
                          <div>Vertical/Horizontal</div>
                        </div>
                        <div class="landing-page__body-cell">
                          <div>70x100 cm</div>
                        </div>
                        <div class="landing-page__body-cell landing-page__last">
                          <div>71x102 cm</div>
                        </div>
                      </div>
                      <div class="landing-page__line">
                        <div class="landing-page__body-cell landing-page__first">
                          <div>Vertical/Horizontal</div>
                        </div>
                        <div class="landing-page__body-cell">
                          <div>50x70 cm</div>
                        </div>
                        <div class="landing-page__body-cell landing-page__last">
                          <div>52x72 cm</div>
                        </div>
                      </div>
                      <div class="landing-page__line">
                        <div class="landing-page__body-cell landing-page__first">
                          <div>Vertical/Horizontal</div>
                        </div>
                        <div class="landing-page__body-cell">
                          <div>40x50 cm</div>
                        </div>
                        <div class="landing-page__body-cell landing-page__last">
                          <div>42x52 cm</div>
                        </div>
                      </div>
                      <div class="landing-page__line">
                        <div class="landing-page__body-cell landing-page__first">
                          <div>Vertical/Horizontal</div>
                        </div>
                        <div class="landing-page__body-cell">
                          <div>30x40 cm</div>
                        </div>
                        <div class="landing-page__body-cell landing-page__last">
                          <div>32x42 cm</div>
                        </div>
                      </div>
                      <div class="landing-page__line">
                        <div class="landing-page__body-cell landing-page__first landing-page__bottom">
                          <div>Cuadrado</div>
                        </div>
                        <div class="landing-page__body-cell landing-page__bottom">
                          <div>50x50 cm</div>
                        </div>
                        <div class="landing-page__body-cell landing-page__last landing-page__bottom">
                          <div>52x52 cm</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div data-w-id="c641c10a-551b-412b-735b-8ae40c37ce32" class="landing-page__close-more-info"></div>
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
