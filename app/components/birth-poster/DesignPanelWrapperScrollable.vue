<script setup lang="ts">
import type { PanelType } from '~/types'

const emit = defineEmits<{
  sectionInView: [panel: PanelType]
}>()

const store = useBirthPosterStore()

// Refs for each section
const generalRef = ref<HTMLElement | null>(null)
const disenoRef = ref<HTMLElement | null>(null)
const datosRef = ref<HTMLElement | null>(null)
const medidasRef = ref<HTMLElement | null>(null)
const marcoRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// Section refs map for external access
const sectionRefs = computed(() => ({
  general: generalRef.value,
  diseno: disenoRef.value,
  datos: datosRef.value,
  medidas: medidasRef.value,
  marco: marcoRef.value,
}))

// Track if we're in programmatic scroll (ignore observer during this time)
const isScrollingProgrammatically = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

// Expose section refs and scroll function for parent
defineExpose({
  sectionRefs,
  scrollToSection,
  containerRef,
})

// Scroll to a specific section
function scrollToSection(panel: PanelType) {
  const section = sectionRefs.value[panel]
  if (section && containerRef.value) {
    // Immediately emit the clicked section as active
    emit('sectionInView', panel)

    // Ignore observer updates during scroll animation
    isScrollingProgrammatically.value = true
    if (scrollTimeout) clearTimeout(scrollTimeout)

    const containerTop = containerRef.value.getBoundingClientRect().top
    const sectionTop = section.getBoundingClientRect().top
    const offset = sectionTop - containerTop + containerRef.value.scrollTop - 20 // 20px offset from top

    containerRef.value.scrollTo({
      top: offset,
      behavior: 'smooth',
    })

    // Re-enable observer after scroll animation completes
    scrollTimeout = setTimeout(() => {
      isScrollingProgrammatically.value = false
    }, 500)
  }
}

// IntersectionObserver to track which section is in view
let observer: IntersectionObserver | null = null

// Track if we're in the bottom zone (where we use position-based detection)
const isInBottomZone = ref(false)

// Handle scroll - use position-based detection for bottom sections
function handleScroll() {
  if (!containerRef.value || isScrollingProgrammatically.value) return

  const { scrollTop, scrollHeight, clientHeight } = containerRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  const viewportHeight = clientHeight

  // Check if medidas section top is visible (we're in the bottom zone)
  const medidasSection = sectionRefs.value.medidas
  const marcoSection = sectionRefs.value.marco

  if (medidasSection && marcoSection) {
    const medidasTop = medidasSection.offsetTop - scrollTop
    const marcoTop = marcoSection.offsetTop - scrollTop

    // If medidas top is in the upper half of viewport, we're in bottom zone
    isInBottomZone.value = medidasTop < viewportHeight * 0.5

    if (isInBottomZone.value) {
      // At the very bottom → marco
      if (distanceFromBottom <= 1) {
        emit('sectionInView', 'marco')
      }
      // Marco section top is in upper third → marco
      else if (marcoTop < viewportHeight * 0.35) {
        emit('sectionInView', 'marco')
      }
      // Otherwise medidas
      else {
        emit('sectionInView', 'medidas')
      }
    }
  }
}

onMounted(() => {
  nextTick(() => {
    setupIntersectionObserver()
    containerRef.value?.addEventListener('scroll', handleScroll, { passive: true })
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  containerRef.value?.removeEventListener('scroll', handleScroll)
})

function setupIntersectionObserver() {
  if (!containerRef.value) return

  const options: IntersectionObserverInit = {
    root: containerRef.value,
    rootMargin: '-20% 0px -60% 0px', // Trigger when section is near top of viewport
    threshold: 0,
  }

  observer = new IntersectionObserver((entries) => {
    // Ignore during programmatic scroll or when in bottom zone (position-based there)
    if (isScrollingProgrammatically.value || isInBottomZone.value) return

    for (const entry of entries) {
      if (entry.isIntersecting) {
        const panelId = entry.target.getAttribute('data-panel') as PanelType
        if (panelId) {
          emit('sectionInView', panelId)
        }
      }
    }
  }, options)

  // Observe all sections
  const sections = [generalRef, disenoRef, datosRef, medidasRef, marcoRef]
  sections.forEach((sectionRef) => {
    if (sectionRef.value) {
      observer?.observe(sectionRef.value)
    }
  })
}
</script>

<template>
  <div ref="containerRef" class="design-panel-scrollable">
    <!-- General Section -->
    <section
      ref="generalRef"
      data-panel="general"
      class="design-panel-scrollable__section"
    >
      <BirthPosterPanelsPanelGeneral />
    </section>

    <!-- Unified Baby Tabs (only when babyCount > 1) -->
    <div v-if="store.babyCount > 1" class="design-panel-scrollable__baby-tabs">
      <BirthPosterBabyTabs underline always-show-badge />
    </div>

    <!-- Diseño Section -->
    <section
      ref="disenoRef"
      data-panel="diseno"
      :class="[
        'design-panel-scrollable__section',
        { 'design-panel-scrollable__section--no-border': store.babyCount > 1 }
      ]"
    >
      <BirthPosterPanelsPanelDiseno hide-baby-tabs />
    </section>

    <!-- Datos Section -->
    <section
      ref="datosRef"
      data-panel="datos"
      class="design-panel-scrollable__section"
    >
      <BirthPosterPanelsPanelDatos hide-baby-tabs />
    </section>

    <!-- Medidas Section -->
    <section
      ref="medidasRef"
      data-panel="medidas"
      class="design-panel-scrollable__section"
    >
      <BirthPosterPanelsPanelMedidas />
    </section>

    <!-- Marco Section -->
    <section
      ref="marcoRef"
      data-panel="marco"
      class="design-panel-scrollable__section"
    >
      <BirthPosterPanelsPanelMarco />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.design-panel-scrollable {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  @include custom-scrollbar;

  &__baby-tabs {
    flex-shrink: 0;
    margin: 0 20px;
  }

  &__section {
    flex-shrink: 0;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;

    &--no-border {
      border-bottom: none;
    }

    &:last-child {
      border-bottom: none;
      padding-bottom: 32px;
    }
  }
}
</style>
