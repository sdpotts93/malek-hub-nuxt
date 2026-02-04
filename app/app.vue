<template>
  <div class="app-shell" :style="appShellStyle">
    <NuxtRouteAnnouncer />

    <Transition name="banner-slide">
      <div
        v-if="shouldShowBanner"
        ref="bannerRef"
        class="app-banner"
        :style="bannerStyle"
      >
        <a
          v-if="banner?.link"
          :href="banner.link"
          target="_blank"
          rel="noopener noreferrer"
          class="app-banner__link"
          v-html="bannerTextHtml"
        ></a>
        <span v-else class="app-banner__text" v-html="bannerTextHtml"></span>
      </div>
    </Transition>

    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
interface BannerData {
  text: string
  link?: string
  background?: string
  textColor?: string
}

const route = useRoute()
const { data } = useFetch<{ banner: BannerData | null }>(
  '/.netlify/functions/get-banner-graphql',
  { server: false }
)

const banner = computed(() => data.value?.banner ?? null)
const showBanner = computed(() => Boolean(banner.value?.text))
const isToolRoute = computed(() => route.path.startsWith('/app/') || route.path.startsWith('/render/'))
const isHomeRoute = computed(() => route.path === '/')
const shouldShowBanner = computed(() => showBanner.value && !isToolRoute.value && !isHomeRoute.value)

watchEffect(() => {
  // eslint-disable-next-line no-console
  console.log('[banner:data]', data.value)
  // eslint-disable-next-line no-console
  console.log('[banner:shouldShow]', shouldShowBanner.value, 'route', route.path)
})
const bannerTextHtml = computed(() => {
  const description = banner.value?.text
  const replacedDescription = description
    ? description.replace(/\*\*\*/g, '</strong>').replace(/\*\*/g, '<strong>')
    : null
  return replacedDescription || ''
})

const bannerRef = ref<HTMLElement | null>(null)
const bannerHeight = ref(0)
let bannerObserver: ResizeObserver | null = null

function updateBannerHeight() {
  bannerHeight.value = bannerRef.value?.offsetHeight || 0
}

onMounted(() => {
  updateBannerHeight()
  if (bannerRef.value) {
    bannerObserver = new ResizeObserver(updateBannerHeight)
    bannerObserver.observe(bannerRef.value)
  }
})

watch(shouldShowBanner, async () => {
  await nextTick()
  updateBannerHeight()
  if (bannerRef.value && bannerObserver) {
    bannerObserver.disconnect()
    bannerObserver.observe(bannerRef.value)
  }
})

onUnmounted(() => {
  bannerObserver?.disconnect()
})

const bannerStyle = computed(() => ({
  backgroundColor: banner.value?.background || '#000000',
  color: banner.value?.textColor || '#ffffff',
}))

const appShellStyle = computed(() => ({
  '--app-banner-offset': shouldShowBanner.value ? `${bannerHeight.value}px` : '0px',
}))

// Cart initialization is handled by each tool page (birth-poster, personaliza, momentos)
// to avoid duplicate fetches and allow each page to fetch only the products it needs
</script>

<style scoped lang="scss">
.app-shell {
  min-height: 100dvh;
}

.app-banner {
  position: sticky;
  top: 0;
  z-index: 10000;
  width: 100%;
  min-height: 36px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.app-banner__link,
.app-banner__text {
  color: inherit;
  text-decoration: none;
  font-weight: 100;
}
.app-banner__text ::v-deep(strong), .app-banner__link ::v-deep(strong) {
  font-weight: 700;
}

.app-banner__link {
  @include hover {
    text-decoration: underline;
  }
}

.banner-slide-enter-active {
  transition: transform 300ms ease, opacity 300ms ease;
}

.banner-slide-leave-active {
  transition: none;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
