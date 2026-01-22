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
    const containerTop = containerRef.value.getBoundingClientRect().top
    const sectionTop = section.getBoundingClientRect().top
    const offset = sectionTop - containerTop + containerRef.value.scrollTop - 20 // 20px offset from top

    containerRef.value.scrollTo({
      top: offset,
      behavior: 'smooth',
    })
  }
}

// IntersectionObserver to track which section is in view
let observer: IntersectionObserver | null = null

onMounted(() => {
  nextTick(() => {
    setupIntersectionObserver()
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

function setupIntersectionObserver() {
  if (!containerRef.value) return

  const options: IntersectionObserverInit = {
    root: containerRef.value,
    rootMargin: '-20% 0px -60% 0px', // Trigger when section is near top of viewport
    threshold: 0,
  }

  observer = new IntersectionObserver((entries) => {
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
