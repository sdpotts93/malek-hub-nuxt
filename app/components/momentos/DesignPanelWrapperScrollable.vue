<script setup lang="ts">
import type { DisenoTabType } from '~/stores/momentos'

// Define a simplified type for scroll sections within the diseño tab
type ScrollSectionType = 'diseno' | 'medidas' | 'marco'

const emit = defineEmits<{
  sectionInView: [section: ScrollSectionType]
  imageAssigned: []
}>()

const store = useMomentosStore()

// Tabs for the panel
const tabs: { id: DisenoTabType; label: string }[] = [
  { id: 'diseno', label: 'Diseño' },
  { id: 'imagenes', label: 'Imágenes' },
]

// Refs for scroll sections (only used when diseño tab is active)
const disenoRef = ref<HTMLElement | null>(null)
const medidasRef = ref<HTMLElement | null>(null)
const marcoRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// Section refs map for external access
const sectionRefs = computed(() => ({
  diseno: disenoRef.value,
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

// Scroll to a specific section (only works when diseño tab is active)
function scrollToSection(section: ScrollSectionType) {
  // If we're on imágenes tab and trying to scroll, switch to diseño tab first
  if (store.activeDisenoTab === 'imagenes') {
    store.setActiveDisenoTab('diseno')
    // Wait for DOM update then scroll
    nextTick(() => {
      nextTick(() => {
        performScroll(section)
      })
    })
  } else {
    performScroll(section)
  }
}

function performScroll(section: ScrollSectionType) {
  const sectionEl = sectionRefs.value[section]
  if (sectionEl && containerRef.value) {
    // Immediately emit the clicked section as active
    emit('sectionInView', section)

    // Ignore observer updates during scroll animation
    isScrollingProgrammatically.value = true
    if (scrollTimeout) clearTimeout(scrollTimeout)

    const containerTop = containerRef.value.getBoundingClientRect().top
    const sectionTop = sectionEl.getBoundingClientRect().top
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
  // Only track scroll when diseño tab is active
  if (store.activeDisenoTab !== 'diseno') return

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
    } else {
      // In top zone - diseño is active
      emit('sectionInView', 'diseno')
    }
  }
}

onMounted(() => {
  nextTick(() => {
    setupIntersectionObserver()
    containerRef.value?.addEventListener('scroll', handleScroll, { passive: true })
    // Emit initial section (diseño is at the top on mount)
    if (store.activeDisenoTab === 'diseno') {
      emit('sectionInView', 'diseno')
    }
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  containerRef.value?.removeEventListener('scroll', handleScroll)
})

// Re-setup observer when tab changes
watch(() => store.activeDisenoTab, (newTab) => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (newTab === 'diseno') {
    nextTick(() => {
      setupIntersectionObserver()
      // Emit 'diseno' as initial section when switching back to diseño tab
      emit('sectionInView', 'diseno')
    })
  }
})

function setupIntersectionObserver() {
  if (!containerRef.value) return
  // Only setup when diseño tab is active
  if (store.activeDisenoTab !== 'diseno') return

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
        const sectionId = entry.target.getAttribute('data-section') as ScrollSectionType
        if (sectionId) {
          emit('sectionInView', sectionId)
        }
      }
    }
  }, options)

  // Observe all sections
  const sections = [disenoRef, medidasRef, marcoRef]
  sections.forEach((sectionRef) => {
    if (sectionRef.value) {
      observer?.observe(sectionRef.value)
    }
  })
}

// Handle image assigned event from PanelDiseno
function handleImageAssigned() {
  emit('imageAssigned')
}
</script>

<template>
  <div ref="containerRef" class="design-panel-scrollable">
    <!-- Tabs -->
    <div class="design-panel-scrollable__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'design-panel-scrollable__tab',
          { 'design-panel-scrollable__tab--active': store.activeDisenoTab === tab.id }
        ]"
        @click="store.setActiveDisenoTab(tab.id)"
      >
        {{ tab.label }}
        <!-- Warning badge for imagenes tab when cells are empty -->
        <span
          v-if="tab.id === 'imagenes' && store.emptyCellCount > 0"
          class="design-panel-scrollable__tab-warning"
        >!</span>
      </button>
    </div>

    <!-- Diseño Tab: Scrollable sections -->
    <template v-if="store.activeDisenoTab === 'diseno'">
      <!-- Diseño Section -->
      <section
        ref="disenoRef"
        data-section="diseno"
        class="design-panel-scrollable__section"
      >
        <MomentosPanelsPanelDiseno show-only-content="diseno" />
      </section>

      <!-- Medidas Section -->
      <section
        ref="medidasRef"
        data-section="medidas"
        class="design-panel-scrollable__section"
      >
        <MomentosPanelsPanelMedidas />
      </section>

      <!-- Marco Section -->
      <section
        ref="marcoRef"
        data-section="marco"
        class="design-panel-scrollable__section"
      >
        <MomentosPanelsPanelMarco />
      </section>
    </template>

    <!-- Imágenes Tab: Full content as-is -->
    <div v-else class="design-panel-scrollable__imagenes">
      <MomentosPanelsPanelDiseno show-only-content="imagenes" @image-assigned="handleImageAssigned" />
    </div>
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

  &__tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    margin: 0 20px;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    background: #ffffff;
    z-index: 10;
  }

  &__tab {
    @include button-reset;
    flex: 1;
    padding: 16px 0;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #717680;
    text-align: center;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: color $transition-fast;

    @include hover {
      color: $color-brand;
    }

    &--active {
      color: #252b37;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: $color-brand;
      }

      @include hover {
        color: #252b37;
      }
    }
  }

  &__tab-warning {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: $color-error;
    border-radius: 50%;
    font-family: $font-primary;
    font-size: 10px;
    font-weight: $font-weight-bold;
    color: #ffffff;
    line-height: 1;
  }

  &__section {
    flex-shrink: 0;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;

    &:last-child {
      border-bottom: none;
      padding-bottom: 32px;
    }
  }

  &__imagenes {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-bottom: 32px;
  }
}
</style>
