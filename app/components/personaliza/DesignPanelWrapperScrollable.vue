<script setup lang="ts">
import type { PersonalizaPanelType } from '~/stores/personaliza'

interface Props {
  showMarginControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showMarginControls: true,
})

const emit = defineEmits<{
  sectionInView: [panel: PersonalizaPanelType]
}>()

// Refs for each section
const archivoRef = ref<HTMLElement | null>(null)
const margenRef = ref<HTMLElement | null>(null)
const textoRef = ref<HTMLElement | null>(null)
const medidasRef = ref<HTMLElement | null>(null)
const marcoRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// Section refs map for external access
const sectionRefs = computed(() => ({
  archivo: archivoRef.value,
  margen: margenRef.value,
  texto: textoRef.value,
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
function scrollToSection(panel: PersonalizaPanelType) {
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
        const panelId = entry.target.getAttribute('data-panel') as PersonalizaPanelType
        if (panelId) {
          emit('sectionInView', panelId)
        }
      }
    }
  }, options)

  // Observe all sections
  const sections = [archivoRef, margenRef, textoRef, medidasRef, marcoRef]
  sections.forEach((sectionRef) => {
    if (sectionRef.value) {
      observer?.observe(sectionRef.value)
    }
  })
}
</script>

<template>
  <div ref="containerRef" class="design-panel-scrollable">
    <!-- Archivo Section -->
    <section
      ref="archivoRef"
      data-panel="archivo"
      class="design-panel-scrollable__section"
    >
      <PersonalizaPanelsPanelArchivo />
    </section>

    <!-- Margen Section -->
    <section
      ref="margenRef"
      data-panel="margen"
      class="design-panel-scrollable__section"
    >
      <PersonalizaPanelsPanelMargen />
    </section>

    <!-- Texto Section -->
    <section
      ref="textoRef"
      data-panel="texto"
      class="design-panel-scrollable__section"
    >
      <PersonalizaPanelsPanelTexto :show-margin-controls="props.showMarginControls" />
    </section>

    <!-- Medidas Section -->
    <section
      ref="medidasRef"
      data-panel="medidas"
      class="design-panel-scrollable__section"
    >
      <PersonalizaPanelsPanelMedidas />
    </section>

    <!-- Marco Section -->
    <section
      ref="marcoRef"
      data-panel="marco"
      class="design-panel-scrollable__section"
    >
      <PersonalizaPanelsPanelMarco />
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

  &__section {
    flex-shrink: 0;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;

    &:last-child {
      border-bottom: none;
      padding-bottom: 32px;
    }
  }
}
</style>
