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

// Compute gap class based on format and image count
const gapClass = computed(() => {
  const count = store.imageCount
  const format = store.format

  if (format === 'square') {
    if (count === 4) return 'momentos-canvas--gap-small'
    if (count === 25) return 'momentos-canvas--gap-medium'
    if (count === 64) return 'momentos-canvas--gap-large'
  } else {
    // Horizontal and vertical formats
    if (count === 12) return 'momentos-canvas--gap-small'
    if (count === 35) return 'momentos-canvas--gap-medium'
    if (count === 88) return 'momentos-canvas--gap-large'
  }
  return null
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

// Track which cell is being hovered during drag
const hoveringCellId = ref<string | null>(null)

// Handle drop on cell
function handleDrop(e: DragEvent, cellId: string) {
  e.preventDefault()
  hoveringCellId.value = null
  const imageId = e.dataTransfer?.getData('imageId')
  if (imageId) {
    store.setImageToCell(cellId, imageId)
  }
  // Clear dragging state
  store.setDraggingImageId(null)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

// Handle drag enter on cell (for visual feedback)
function handleDragEnter(e: DragEvent, cellId: string) {
  e.preventDefault()
  // Only show hover state if dragging an image and cell is empty
  if (store.draggingImageId) {
    store.setIsDraggingOverCanvas(true)
    const cell = store.canvasCells.find(c => c.id === cellId)
    if (cell && !cell.imageId) {
      hoveringCellId.value = cellId
    }
  }
}

// Handle drag leave on cell
function handleDragLeave(e: DragEvent, cellId: string) {
  e.preventDefault()
  // Only clear if leaving this specific cell
  if (hoveringCellId.value === cellId) {
    // Check if we're leaving to a child element
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const currentTarget = e.currentTarget as HTMLElement
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      hoveringCellId.value = null
    }
  }
}

// Handle drag leave on grid (to detect leaving canvas entirely)
function handleGridDragLeave(e: DragEvent) {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement
  // If leaving the grid entirely (not to a child element)
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    store.setIsDraggingOverCanvas(false)
    hoveringCellId.value = null
  }
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
  // Don't deselect if clicking on canvas, edit menu, or anywhere in the design panel
  if (
    target.closest('.momentos-canvas') ||
    target.closest('.momentos-canvas__edit-menu') ||
    target.closest('.panel-diseno') ||
    target.closest('.panel-diseno__lightbox')
  ) {
    return
  }
  store.selectCell(null)
}

// Keyboard shortcuts for undo/redo
function handleKeyDown(e: KeyboardEvent) {
  // Ctrl+Z or Cmd+Z for undo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    if (store.canUndo) {
      store.undo()
    }
  }
  // Ctrl+Shift+Z or Cmd+Shift+Z for redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    if (store.canRedo) {
      store.redo()
    }
  }
  // Also support Ctrl+Y for redo (Windows convention)
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    if (store.canRedo) {
      store.redo()
    }
  }
}

// Pan/drag state
const isPanning = ref(false)
const panStartX = ref(0)
const panStartY = ref(0)
const initialPanX = ref(0)
const initialPanY = ref(0)
const panCellElement = ref<HTMLElement | null>(null)
const panImageData = ref<{ width: number; height: number } | null>(null)

// Calculate which axes can be panned based on image vs cell aspect ratio
function getPanLimits(cellElement: HTMLElement, imageWidth: number, imageHeight: number) {
  const cellRect = cellElement.getBoundingClientRect()
  const cellAspect = cellRect.width / cellRect.height
  const imageAspect = imageWidth / imageHeight

  // With object-fit: cover:
  // - If image is wider than cell (relative to aspect): can pan horizontally (0-100%)
  // - If image is taller than cell (relative to aspect): can pan vertically (0-100%)
  // The axis that "fits" should stay at 50%

  const canPanX = imageAspect > cellAspect
  const canPanY = imageAspect < cellAspect

  return {
    minX: canPanX ? 0 : 50,
    maxX: canPanX ? 100 : 50,
    minY: canPanY ? 0 : 50,
    maxY: canPanY ? 100 : 50,
  }
}

// Start panning
function handlePanStart(e: MouseEvent, cellId: string) {
  e.preventDefault()
  e.stopPropagation()
  const cell = store.canvasCells.find(c => c.id === cellId)
  if (!cell || !cell.imageId) return

  // Get image dimensions
  const image = store.getImageById(cell.imageId)
  if (!image) return

  // Get cell element
  const cellEl = cellRefs.value.get(cellId)
  if (!cellEl) return

  isPanning.value = true
  panStartX.value = e.clientX
  panStartY.value = e.clientY
  initialPanX.value = cell.panX
  initialPanY.value = cell.panY
  panCellElement.value = cellEl
  panImageData.value = { width: image.width, height: image.height }

  document.addEventListener('mousemove', handlePanMove)
  document.addEventListener('mouseup', handlePanEnd)
}

// Handle pan movement
function handlePanMove(e: MouseEvent) {
  if (!isPanning.value || !store.selectedCellId || !panCellElement.value || !panImageData.value) return

  const cell = store.canvasCells.find(c => c.id === store.selectedCellId)
  if (!cell) return

  const cellRect = panCellElement.value.getBoundingClientRect()
  const deltaX = e.clientX - panStartX.value
  const deltaY = e.clientY - panStartY.value

  // Convert pixel movement to percentage
  // Moving the mouse left should increase object-position (show more of the right side)
  const percentDeltaX = -(deltaX / cellRect.width) * 100
  const percentDeltaY = -(deltaY / cellRect.height) * 100

  // Get pan limits
  const limits = getPanLimits(panCellElement.value, panImageData.value.width, panImageData.value.height)

  // Calculate new pan values and clamp to limits
  const newPanX = Math.max(limits.minX, Math.min(limits.maxX, initialPanX.value + percentDeltaX))
  const newPanY = Math.max(limits.minY, Math.min(limits.maxY, initialPanY.value + percentDeltaY))

  // Use live pan (no history) during drag for smooth performance
  store.panCellLive(store.selectedCellId, newPanX, newPanY)
}

// End panning
function handlePanEnd() {
  if (isPanning.value && store.selectedCellId) {
    const cell = store.canvasCells.find(c => c.id === store.selectedCellId)
    if (cell && (cell.panX !== initialPanX.value || cell.panY !== initialPanY.value)) {
      // Push to history only at the end of drag
      store.panCell(store.selectedCellId, cell.panX, cell.panY, initialPanX.value, initialPanY.value)
    }
  }
  isPanning.value = false
  panCellElement.value = null
  panImageData.value = null
  document.removeEventListener('mousemove', handlePanMove)
  document.removeEventListener('mouseup', handlePanEnd)
}

// Get object-position style for a cell's image
function getCellObjectPosition(cell: CanvasCell): string {
  return `${cell.panX}% ${cell.panY}%`
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mousemove', handlePanMove)
  document.removeEventListener('mouseup', handlePanEnd)
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

// Calculate edit menu position to keep it on screen
const editMenuStyle = computed((): Record<string, string> => {
  if (!selectedCellWithImage.value) return {}

  const cellEl = cellRefs.value.get(selectedCellWithImage.value.id)
  if (!cellEl) return {}

  const cellRect = cellEl.getBoundingClientRect()
  const menuWidth = 260 // Approximate width of the menu
  const menuHeight = 44 // Approximate height of the menu
  const gap = 8 // Gap between cell and menu
  const screenPadding = 12 // Minimum padding from screen edges

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Calculate initial position (centered below cell)
  let top = cellRect.bottom + gap
  let left = (cellRect.left + cellRect.right) / 2
  let transformX = '-50%'

  // Check if menu would go off the bottom of the screen
  if (top + menuHeight > viewportHeight - screenPadding) {
    // Position above the cell instead
    top = cellRect.top - gap - menuHeight
  }

  // Calculate the actual left position after transform
  const actualLeft = left - menuWidth / 2

  // Check if menu would go off the left edge
  if (actualLeft < screenPadding) {
    left = screenPadding
    transformX = '0'
  }
  // Check if menu would go off the right edge
  else if (actualLeft + menuWidth > viewportWidth - screenPadding) {
    left = viewportWidth - screenPadding - menuWidth
    transformX = '0'
  }

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    transform: `translateX(${transformX})`,
  }
})
</script>

<template>
  <div
    :class="[
      'momentos-canvas',
      aspectClass,
      gapClass,
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
        @dragleave="handleGridDragLeave"
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
              'momentos-canvas__cell--drop-target': hoveringCellId === cell.id,
            }
          ]"
          :data-render-transparent="!cell.imageId ? '' : undefined"
          @click.stop="handleCellClick(cell)"
          @drop="handleDrop($event, cell.id)"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter($event, cell.id)"
          @dragleave="handleDragLeave($event, cell.id)"
        >
          <!-- Empty cell placeholder (excluded from render) -->
          <div v-if="!cell.imageId" class="momentos-canvas__placeholder" data-render-transparent data-html2canvas-ignore>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>

          <!-- Image with transformations (only render when image URL exists) -->
          <div
            v-else-if="getCellImageUrl(cell)"
            class="momentos-canvas__cell-image-wrapper"
            :style="{
              transform: `rotate(${cell.rotation}deg) scale(${cell.zoom})`,
              filter: getCellFilter(cell),
            }"
          >
            <img
              :src="getCellImageUrl(cell)!"
              alt=""
              class="momentos-canvas__cell-image"
              crossorigin="anonymous"
              :style="{ objectPosition: getCellObjectPosition(cell) }"
            >
          </div>

          <!-- Pan handle overlay for selected cells with images (excluded from render) -->
          <div
            v-if="cell.imageId && store.selectedCellId === cell.id"
            class="momentos-canvas__pan-overlay"
            :class="{ 'momentos-canvas__pan-overlay--panning': isPanning }"
            data-html2canvas-ignore
            @mousedown="handlePanStart($event, cell.id)"
          >
            <img
              src="/momentos-icons/hand.svg"
              alt="Mover imagen"
              class="momentos-canvas__pan-icon"
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
            :style="editMenuStyle"
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
  // Content Layout - using container units for consistency across formats
  // Always use the smaller dimension unit for visual consistency:
  // - Square: cqw (width = height)
  // - Horizontal: cqh (height is smaller)
  // - Vertical: cqw (width is smaller)
  // ==========================================================================
  $padding-base: 5; // Base padding value (applied with appropriate unit per format)

  &__content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0;
    // Animate padding changes when margin is toggled
    transition: padding 0.3s ease-out;
  }

  // Square format - use cqw (width = height)
  &--square.momentos-canvas--has-margin &__content {
    padding: #{$padding-base}cqw;
  }

  // Horizontal format - use cqh (height is the smaller dimension)
  &--horizontal.momentos-canvas--has-margin &__content {
    padding: #{$padding-base}cqh;
  }

  // Vertical format - use cqw (width is the smaller dimension)
  &--vertical.momentos-canvas--has-margin &__content {
    padding: #{$padding-base}cqw;
  }

  // ==========================================================================
  // Image Grid
  // ==========================================================================
  &__grid {
    flex: 1;
    display: grid;
    gap: 0;
    width: 100%;
    height: 100%;
    transition: gap 0.3s ease-out;
  }

  // Base gap when margin is enabled (before gap class overrides)
  // Using container units for consistency
  &--square.momentos-canvas--has-margin &__grid {
    gap: 1.5cqw;
  }

  &--horizontal.momentos-canvas--has-margin &__grid {
    gap: 1.5cqh;
  }

  &--vertical.momentos-canvas--has-margin &__grid {
    gap: 1.5cqw;
  }

  // ==========================================================================
  // Dynamic gap based on image count (consistent across all formats)
  // Uses the smaller dimension for each format to ensure visual consistency:
  // - Square: cqw (width = height)
  // - Horizontal: cqh (height is smaller)
  // - Vertical: cqw (width is smaller)
  // ==========================================================================

  // Square format - use cqw (width = height, doesn't matter)
  &--square {
    &.momentos-canvas--gap-small .momentos-canvas__grid {
      gap: 3.5cqw;
    }

    &.momentos-canvas--gap-medium .momentos-canvas__grid {
      gap: 2.5cqw;
    }

    &.momentos-canvas--gap-large .momentos-canvas__grid {
      gap: 1.75cqw;
    }
  }

  // Horizontal format - use cqh (height is the smaller dimension)
  &--horizontal {
    &.momentos-canvas--gap-small .momentos-canvas__grid {
      gap: 3.5cqh;
    }

    &.momentos-canvas--gap-medium .momentos-canvas__grid {
      gap: 2.5cqh;
    }

    &.momentos-canvas--gap-large .momentos-canvas__grid {
      gap: 1.75cqh;
    }
  }

  // Vertical format - use cqw (width is the smaller dimension)
  &--vertical {
    &.momentos-canvas--gap-small .momentos-canvas__grid {
      gap: 3.5cqw;
    }

    &.momentos-canvas--gap-medium .momentos-canvas__grid {
      gap: 2.5cqw;
    }

    &.momentos-canvas--gap-large .momentos-canvas__grid {
      gap: 1.75cqw;
    }
  }

  &__cell {
    position: relative;
    background: transparent;
    overflow: hidden;
    cursor: pointer;
    transition: outline $transition-fast;

    &--empty {
      background: #f0f0f0; // Gray in UI, made transparent during render via data-render-transparent
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
        z-index: 9;
        pointer-events: none;
      }
    }

    &:hover:not(&--selected) {
      outline: 1px solid rgba($color-brand, 0.5);
      outline-offset: -1px;
    }

    // Drop target state when dragging an image over an empty cell
    &--drop-target {
      outline: 2px solid $color-brand;
      outline-offset: -2px;
      background: rgba($color-brand, 0.1);
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
    // Only animate filter changes, not transform (for smooth panning)
    transition: filter 0.2s ease;
  }

  &__cell-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    // No transition on object-position for responsive panning
  }

  // ==========================================================================
  // Pan Overlay - shown on selected cells to allow dragging
  // ==========================================================================
  &__pan-overlay {
    position: absolute;
    inset: 0;
    z-index: 11;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    background: rgba(0, 0, 0, 0.1);
    transition: background-color $transition-fast;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }

    &--panning {
      cursor: grabbing;
      background: rgba(0, 0, 0, 0.25);
    }
  }

  &__pan-icon {
    width: 32px;
    height: 32px;
    max-height: 70%;
    max-width: 70%;
    opacity: 1;
    pointer-events: none;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
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
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
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
