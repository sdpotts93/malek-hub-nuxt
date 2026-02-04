<!-- Generated from Webflow reference; edit as needed -->
<script setup lang="ts">
const pageTitle = 'Momentos - Studio Malek'
const pageDescription = 'Transforma tus recuerdos más preciados en obras de arte con Studio Malek. Personaliza e imprime tus propias imágenes, creando piezas únicas que cuenten tu historia. Convierte tus momentos inolvidables en impresiones duraderas y decora tu espacio con emociones. ¡Empieza tu viaje creativo con nosotros y haz que cada recuerdo cuente!';

useHead({
  title: pageTitle,
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogUrl: 'https://creaciones.studiomalek.com/momentos',
  ogImage: 'https://creaciones.studiomalek.com/momentos-og.jpg',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: 'https://creaciones.studiomalek.com/momentos-og.jpg',
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
  <div class="landing-page landing-page__body landing-page__body--momentos">
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
                  class="landing-page__hero-momentos"
                  data-bg-src="/landing-pages/images/main-momentos.avif"
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
                  <p class="landing-page__tuttorial-highlight-5 landing-page__hero">MOMENTOS</p>
                  <div class="landing-page__hero-title-wrapper-2">
                    <h1 class="landing-page__pages-title">Haz un collage con tus fotos favoritas</h1>
                  </div>
                  <div class="landing-page__hero-p">
                    <p class="landing-page__paragraph-large">Agrupa tus fotos favoritas en un solo cuadro. <br>Reúne tus mejores momentos: celebraciones, viajes y experiencias que quieres recordar siempre.</p>
                  </div>
                  <div class="landing-page__hero-button">
                    <NuxtLink to="/app/momentos" class="landing-page__button-2 landing-page__w-button">Diseña tu cuadro</NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="landing-page__loader-section landing-page__gradient">
            <div class="landing-page__container">
              <div class="landing-page__process-wraps">
                <div class="landing-page__templates-container">
                  <h2 class="landing-page__promo-title">Así de fácil funciona:</h2>
                </div>
                <div class="landing-page__process-wrap">
                  <div class="landing-page__process-item">
                    <div class="landing-page__process-image landing-page__momentos"><NuxtImg src="/landing-pages/images/Screenshot-2026-01-30-alle-11.21.20-AM.avif" loading="lazy" sizes="(max-width: 1274px) 100vw, 1274px" alt="" fit="cover" class="landing-page__image-7-copy" /></div>
                    <div class="landing-page__personaliza-sub landing-page__m-1"><NuxtImg src="/landing-pages/images/Screenshot-2026-02-03-alle-11.37.57-AM.avif" loading="lazy" alt=""  fit="cover" /></div>
                    <div class="landing-page__steps-text">
                      <div class="landing-page__step-title-wrap">
                        <h4 class="landing-page__steps-titles">Elige un estilo </h4>
                      </div>
                      <p>Decide cuántas fotos quieres imprimir, el color del fondo y el formato que más te guste.</p>
                    </div>
                  </div>
                  <div class="landing-page__process-item">
                    <div class="landing-page__process-image landing-page__momentos"><NuxtImg src="/landing-pages/images/Screenshot-2026-01-30-alle-11.18.44-AM.avif" loading="lazy" alt="" fit="cover" class="landing-page__image-7-copy" /></div>
                    <div class="landing-page__personaliza-sub landing-page__m-2"><NuxtImg src="/landing-pages/images/Screenshot-2026-02-03-alle-9.43.08-AM.avif" loading="lazy" alt=""  fit="cover" /></div>
                    <div class="landing-page__steps-text">
                      <div class="landing-page__step-title-wrap">
                        <h4 class="landing-page__steps-titles">Sube y organiza tus fotos</h4>
                      </div>
                      <p>Selecciona tus fotos favoritas y acomódalas como mejor se vean o en el orden de tu historia.</p>
                    </div>
                  </div>
                  <div class="landing-page__process-item">
                    <div class="landing-page__process-image landing-page__momentos"><NuxtImg src="/landing-pages/images/Screenshot-2026-01-30-alle-11.18.37-AM.avif" loading="lazy" sizes="(max-width: 670px) 100vw, 670px" alt="" fit="cover" class="landing-page__image-7-copy" /></div>
                    <div class="landing-page__personaliza-sub landing-page__frames-p">
                      <h4 class="landing-page__step-picture-titel">Selecciona un marco</h4><NuxtImg src="/landing-pages/images/Screenshot-2026-01-26-at-1.36.29-p.m..avif" loading="lazy" alt=""  fit="cover" />
                    </div>
                    <div class="landing-page__steps-text">
                      <div class="landing-page__step-title-wrap">
                        <h4 class="landing-page__steps-titles">Elige un marco y recíbelo en casa</h4>
                      </div>
                      <p>Elige tu marco favorito y recíbelo en 3 a 5 días, listo para colgar en tu pared.</p>
                    </div>
                  </div>
                </div>
                <div class="landing-page__templates-container">
                  <NuxtLink to="/app/momentos" class="landing-page__sec-ondary-button landing-page__w-button">¡Crea el tuyo!</NuxtLink>
                </div>
              </div>
            </div>
          </div>
          <div class="landing-page__about-wrap">
            <div class="landing-page__about-section">
              <div class="landing-page__about-text landing-page__about-wrap">
                <div class="landing-page__about-text-wrapper">
                  <div class="landing-page__about-title">
                    <p class="landing-page__tuttorial-highlight">CREA CON MALEK</p>
                    <h2 class="landing-page__promo-title">Un año de memorias en una sola pieza.</h2>
                  </div>
                  <div class="landing-page__hero-p">
                    <p class="landing-page__tuttorial-text">52 semanas, 12 meses, 365 días de momentos que no quieres olvidar. <br><br>Con <strong>Momentos</strong> puedes crear un cuadro que resuma todo un año: vacaciones, cumpleaños, cenas con amigos, tardes en familia.<br><br>Es el regalo perfecto para ti o para alguien especial. Una pieza que cuenta una historia completa cada vez que la miras.</p>
                  </div>
                  <div class="landing-page__promo-details">
                    <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"><span class="landing-page__icon landing-page__del">📦</span> Entrega 3-5 días</a>
                    <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"> <span class="landing-page__icon landing-page__del">🚚 </span>Envíos a todo México</a>
                    <a href="#" class="landing-page__nav-button landing-page__det landing-page__w-button"> <span class="landing-page__icon landing-page__del">✨ </span>Listo para colgar</a>
                  </div>
                  <div class="landing-page__templates-container landing-page__left">
                    <NuxtLink to="/app/momentos" class="landing-page__sec-ondary-button landing-page__w-button">¡Crea el tuyo!</NuxtLink>
                  </div>
                </div>
              </div>
              <div
                class="landing-page__about-text landing-page__momentos-pic"
                data-bg-src="/landing-pages/images/main-momentos1.avif"
              ></div>
            </div>
          </div>
          <div class="landing-page__marketing-sections">
            <div class="landing-page__loader-section landing-page__revieew landing-page__wbg">
              <div class="landing-page__loader-container">
                <div class="landing-page__hero-title-wrapper">
                  <h2 class="landing-page__promo-title">Algunas reseñas de la comunidad Studio Malek</h2>
                </div>
                <div class="landing-page__loader-poster-instruction-wrap">
                  <div class="landing-page__loader-step1">
                    <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                      <h3 class="landing-page__review-title"><strong>Excelente servicio</strong><br></h3>
                      <p class="landing-page__review-text">El proceso fue muy fácil, y antes de que te des cuenta ya te llegaron. Quedé encantado con las mías.</p>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div>
                        <h3 class="landing-page__testimonial-name"><strong>Andrea G.</strong><br></h3>
                        <p class="landing-page__testimonial-position">Guadalajara</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div>
                      <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                        <h3 class="landing-page__review-title"><strong>Tus mejores momentos</strong><br></h3>
                        <p class="landing-page__review-text">No puedo dejar de verlo y pensar que estamos viviendo nuestra mejor vida.  Siempre vale la pena acordarse de esos momentos por los que uno lo da todo.</p>
                      </div>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div>
                        <h3 class="landing-page__testimonial-name"><strong>Lorena O.</strong><br></h3>
                        <p class="landing-page__testimonial-position">CDMX</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                      <h3 class="landing-page__review-title"><strong>100% recomendable</strong><br></h3>
                      <p class="landing-page__review-text">Llegó en tiempo y forma, y en vivo se ve todavía más padre. Súper recomendable Studio Malek</p>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div>
                        <h3 class="landing-page__testimonial-name"><strong>Cinthya C.</strong><br></h3>
                        <p class="landing-page__testimonial-position">Mérida</p>
                      </div>
                    </div>
                  </div>
                  <div class="landing-page__loader-step1">
                    <div class="landing-page__review-top"><NuxtImg src="/landing-pages/images/five-stars-orange.webp" loading="lazy" alt="" width="106"  fit="contain" />
                      <h3 class="landing-page__review-title"><strong>Quede Sorprendido</strong><br></h3>
                      <p class="landing-page__review-text">Me sorprendió cañón. Armé el collage en minutos y cuando llegó se ve increíble. La calidad está brutal y con el marco luce súper pro.<br></p>
                    </div>
                    <div class="landing-page__review-testimonial">
                      <div>
                        <h3 class="landing-page__testimonial-name"><strong>Santiago B.</strong><br></h3>
                        <p class="landing-page__testimonial-position">Monterrey</p>
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
