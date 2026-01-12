<script setup lang="ts">
import { IMAGE_FILTERS, type ImageFilter, type CanvasCell } from '~/stores/momentos'

const store = useMomentosStore()

// Get the correct frame image based on format
const currentFrameImage = computed(() => {
  if (!store.frameStyle) return null
  switch (store.format) {
    case 'horizontal':
      return store.frameStyle.frameImageHorizontal
    case 'square':
      return store.frameStyle.frameImageSquare
    case 'vertical':
    default:
      return store.frameStyle.frameImage
  }
})

// Compute aspect ratio class based on format
const aspectClass = computed(() => {
  switch (store.format) {
    case 'square':
      return 'momentos-canvas--square'
    case 'horizontal':
      return 'momentos-canvas--horizontal'
    case 'vertical':
      return 'momentos-canvas--vertical'
  }
})

// Get grid dimensions
const gridDimensions = computed(() => store.gridDimensions)

// Get image URL for a cell
function getCellImageUrl(cell: CanvasCell): string | null {
  if (!cell.imageId) return null
  const img = store.getImageById(cell.imageId)
  return img?.mediumResUrl || null
}

// Get CSS filter for a cell
function getCellFilter(cell: CanvasCell): string {
  return IMAGE_FILTERS[cell.filter].cssFilter
}

// Handle drop on cell
function handleDrop(e: DragEvent, cellId: string) {
  e.preventDefault()
  const imageId = e.dataTransfer?.getData('imageId')
  if (imageId) {
    store.setImageToCell(cellId, imageId)
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

// Handle cell click
function handleCellClick(cell: CanvasCell) {
  if (cell.imageId) {
    // Select cell for editing
    store.selectCell(store.selectedCellId === cell.id ? null : cell.id)
  } else {
    // Open images tab to select an image
    store.setActivePanel('diseno')
    store.setActiveDisenoTab('imagenes')
    store.selectCell(cell.id)
  }
}

// Handle remove image from cell
function handleRemoveFromCell(cellId: string) {
  store.setImageToCell(cellId, null)
  store.selectCell(null)
}

// Handle rotation
function handleRotate(cellId: string) {
  store.rotateCell(cellId, 'cw')
}

// Handle zoom in
function handleZoomIn(cellId: string) {
  store.zoomCell(cellId, 0.25)
}

// Handle zoom out
function handleZoomOut(cellId: string) {
  store.zoomCell(cellId, -0.25)
}

// Handle filter change
function handleFilterChange(cellId: string, filter: ImageFilter) {
  store.setCellFilter(cellId, filter)
}

// Filter options for menu
const filterOptions = computed(() => Object.entries(IMAGE_FILTERS).map(([id, data]) => ({
  id: id as ImageFilter,
  label: data.label,
})))

// Close editing menu when clicking outside
function handleCanvasClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.momentos-canvas__cell') && !target.closest('.momentos-canvas__edit-menu')) {
    store.selectCell(null)
  }
}

// Global click listener to deselect when clicking outside canvas
function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  // Don't deselect if clicking on canvas, edit menu, panel library items, or lightbox
  if (
    target.closest('.momentos-canvas') ||
    target.closest('.momentos-canvas__edit-menu') ||
    target.closest('.panel-diseno__library-item') ||
    target.closest('.panel-diseno__lightbox')
  ) {
    return
  }
  store.selectCell(null)
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
})

// Track cell element refs for positioning edit menu
const cellRefs = ref<Map<string, HTMLElement>>(new Map())

function setCellRef(el: HTMLElement | null, cellId: string) {
  if (el) {
    cellRefs.value.set(cellId, el)
  } else {
    cellRefs.value.delete(cellId)
  }
}

// Get the selected cell with image for edit menu
const selectedCellWithImage = computed(() => {
  if (!store.selectedCellId) return null
  const cell = store.canvasCells.find(c => c.id === store.selectedCellId)
  if (!cell || !cell.imageId) return null
  return cell
})
</script>

<template>
  <div
    :class="[
      'momentos-canvas',
      aspectClass,
      {
        'momentos-canvas--has-frame': store.frameStyle,
        'momentos-canvas--has-margin': store.hasMargin,
      }
    ]"
    :style="store.hasMargin ? { backgroundColor: store.marginColor } : {}"
    @click="handleCanvasClick"
  >
    <!-- Frame overlay when selected -->
    <div v-if="store.frameStyle && currentFrameImage" class="momentos-canvas__frame" data-html2canvas-ignore>
      <img
        :src="currentFrameImage"
        :alt="`Marco ${store.frameStyle.name}`"
        class="momentos-canvas__frame-image"
        crossorigin="anonymous"
      >
    </div>

    <!-- Main canvas content -->
    <div class="momentos-canvas__content">
      <!-- Image grid -->
      <div
        class="momentos-canvas__grid"
        :style="{
          gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
          gridTemplateRows: `repeat(${gridDimensions.rows}, 1fr)`,
        }"
      >
        <div
          v-for="cell in store.canvasCells"
          :key="cell.id"
          :ref="(el) => setCellRef(el as HTMLElement, cell.id)"
          :class="[
            'momentos-canvas__cell',
            {
              'momentos-canvas__cell--empty': !cell.imageId,
              'momentos-canvas__cell--selected': store.selectedCellId === cell.id,
            }
          ]"
          @click.stop="handleCellClick(cell)"
          @drop="handleDrop($event, cell.id)"
          @dragover="handleDragOver"
        >
          <!-- Empty cell placeholder -->
          <div v-if="!cell.imageId" class="momentos-canvas__placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>

          <!-- Image with transformations -->
          <div
            v-else
            class="momentos-canvas__cell-image-wrapper"
            :style="{
              transform: `rotate(${cell.rotation}deg) scale(${cell.zoom}) translate(${cell.panX}px, ${cell.panY}px)`,
              filter: getCellFilter(cell),
            }"
          >
            <img
              :src="getCellImageUrl(cell) || ''"
              alt=""
              class="momentos-canvas__cell-image"
            >
          </div>
        </div>
      </div>

      <!-- Edit menu (positioned at canvas level, outside grid) -->
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="selectedCellWithImage && cellRefs.get(selectedCellWithImage.id)"
            class="momentos-canvas__edit-menu"
            :style="{
              position: 'fixed',
              top: `${(cellRefs.get(selectedCellWithImage.id)?.getBoundingClientRect()?.bottom ?? 0) + 8}px`,
              left: `${((cellRefs.get(selectedCellWithImage.id)?.getBoundingClientRect()?.left ?? 0) + (cellRefs.get(selectedCellWithImage.id)?.getBoundingClientRect()?.right ?? 0)) / 2}px`,
              transform: 'translateX(-50%)',
            }"
            @click.stop
          >
            <button
              class="momentos-canvas__edit-btn"
              title="Rotar"
              @click="handleRotate(selectedCellWithImage.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
            </button>
            <button
              class="momentos-canvas__edit-btn"
              title="Acercar"
              :disabled="selectedCellWithImage.zoom >= 3"
              @click="handleZoomIn(selectedCellWithImage.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
                <path d="M11 8v6"/>
                <path d="M8 11h6"/>
              </svg>
            </button>
            <button
              class="momentos-canvas__edit-btn"
              title="Alejar"
              :disabled="selectedCellWithImage.zoom <= 1"
              @click="handleZoomOut(selectedCellWithImage.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
                <path d="M8 11h6"/>
              </svg>
            </button>

            <!-- Filter dropdown -->
            <div class="momentos-canvas__filter-dropdown">
              <select
                :value="selectedCellWithImage.filter"
                class="momentos-canvas__filter-select"
                @change="handleFilterChange(selectedCellWithImage.id, ($event.target as HTMLSelectElement).value as ImageFilter)"
              >
                <option
                  v-for="opt in filterOptions"
                  :key="opt.id"
                  :value="opt.id"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <button
              class="momentos-canvas__edit-btn momentos-canvas__edit-btn--delete"
              title="Eliminar"
              @click="handleRemoveFromCell(selectedCellWithImage.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </Transition>
      </Teleport>
    </div>

    <!-- Undo/Redo buttons -->
    <div class="momentos-canvas__history-controls" data-html2canvas-ignore>
      <button
        class="momentos-canvas__history-btn"
        :disabled="!store.canUndo"
        title="Deshacer"
        @click="store.undo()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6"/>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
        </svg>
      </button>
      <button
        class="momentos-canvas__history-btn"
        :disabled="!store.canRedo"
        title="Rehacer"
        @click="store.redo()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 7v6h-6"/>
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.momentos-canvas {
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 20px -5px #adadad;
  container-type: size;

  // When frame is active, allow overflow and remove shadow
  &--has-frame {
    overflow: visible;
    box-shadow: none;
  }

  // Frame extends outside the canvas
  &__frame {
    position: absolute;
    inset: -21.1%;
    z-index: 10;
    pointer-events: none;
    transform: translate(0.1%, 0.7%);
  }

  &__frame-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  // ==========================================================================
  // Aspect Ratio Variants
  // ==========================================================================

  // Square (1:1)
  &--square {
    aspect-ratio: 1;
    height: min(100cqh, 100cqw);
    width: auto;

    @include mobile {
      height: auto;
      width: 85%;
    }

    .momentos-canvas__frame {
      inset: -31%;
      transform: translate(0.3%, 0%);
    }
  }

  // Horizontal (7:5)
  &--horizontal {
    aspect-ratio: 7 / 5;
    width: min(100cqw, calc(100cqh * 7 / 5));
    height: auto;

    @include mobile {
      height: auto;
      width: 90%;
    }

    .momentos-canvas__frame {
      inset: -40.5%;
      transform: translate(0.3%, 0.8%);
    }
  }

  // Vertical (5:7)
  &--vertical {
    aspect-ratio: 5 / 7;
    height: min(100cqh, calc(100cqw * 7 / 5));
    width: auto;

    @include mobile {
      height: auto;
      width: 75%;
    }
  }

  // ==========================================================================
  // Content Layout
  // ==========================================================================
  &__content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 2%;
  }

  &--has-margin &__content {
    padding: 4%;
  }

  // ==========================================================================
  // Image Grid
  // ==========================================================================
  &__grid {
    flex: 1;
    display: grid;
    gap: 2px;
    width: 100%;
    height: 100%;
  }

  &--has-margin &__grid {
    gap: 4px;
  }

  &__cell {
    position: relative;
    background: #f5f5f5;
    overflow: hidden;
    cursor: pointer;
    transition: outline $transition-fast;

    &--empty {
      background: #f0f0f0;
    }

    &--selected {
      z-index: 5;

      // Visible border overlay on top of image
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        border: 3px solid $color-brand;
        z-index: 10;
        pointer-events: none;
      }

      // Subtle overlay tint
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: #ffffff69;
        z-index: 9;
        pointer-events: none;
      }
    }

    &:hover:not(&--selected) {
      outline: 1px solid rgba($color-brand, 0.5);
      outline-offset: -1px;
    }
  }

  &__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
    overflow: hidden;

    svg {
      width: 40%;
      height: 40%;
      max-width: 40px;
      max-height: 40px;
    }
  }

  &__cell-image-wrapper {
    position: absolute;
    inset: 0;
    overflow: hidden; // Clip zoomed/rotated images
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  &__cell-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  // ==========================================================================
  // Edit Menu - teleported to body, positioned below selected cell
  // ==========================================================================
  &__edit-menu {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 9999; // High z-index since it's in body
  }

  &__edit-btn {
    @include button-reset;
    @include flex-center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    @include hover {
      background: #f5f5f5;

      &:not(:disabled) {
        color: $color-brand;
      }
    }

    &--delete {
      color: #dc2626;

      @include hover {
        background: #fef2f2;
        color: #dc2626;
      }
    }
  }

  &__filter-dropdown {
    position: relative;
  }

  &__filter-select {
    padding: 4px 8px;
    font-family: $font-primary;
    font-size: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background: white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: $color-brand;
    }
  }

  // ==========================================================================
  // History Controls
  // ==========================================================================
  &__history-controls {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    z-index: 15;
  }

  &__history-btn {
    @include button-reset;
    @include flex-center;
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    @include hover {
      &:not(:disabled) {
        background: $color-brand-light;
        color: $color-brand;
      }
    }
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
