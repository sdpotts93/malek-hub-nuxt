<script setup lang="ts">
import CropperJS from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import type { ImageFormat } from '~/stores/personaliza'

defineOptions({
  name: 'PersonalizaPanelsPanelArchivo',
})

const store = usePersonalizaStore()
const { uploadDesignImage } = useS3Upload()

// Refs
const fileInput = ref<HTMLInputElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
let cropper: CropperJS | null = null

// Drag state
const isDragging = ref(false)

// Track if we're changing the image (to know when to reset text config)
const isChangingImage = ref(false)

// Track if we're loading from saved state
const isRestoringCrop = ref(false)

// Track when cropper is ready (to avoid flash of unstyled image)
const isCropperReady = ref(false)

// Debounce timer for preview generation
let previewDebounceTimer: ReturnType<typeof setTimeout> | null = null
const PREVIEW_DEBOUNCE_MS = 200

// Image source for cropper - use blob URL if available, fall back to S3 URL
const cropperImageSrc = computed(() => store.imageUrl || store.imageS3Url)

// Zoom levels - calculated dynamically based on image/container ratio
let minZoom = 0.1 // Will be set when cropper is ready (fit ratio)
let maxZoom = 3 // Will be set when cropper is ready (3x fit ratio)

// Format options with visual preview dimensions (5:7, 7:5, 1:1)
const formatOptions: { id: ImageFormat; label: string; width: number; height: number }[] = [
  { id: '5:7', label: '5:7', width: 25, height: 35 },
  { id: '1:1', label: '1:1', width: 30, height: 30 },
  { id: '7:5', label: '7:5', width: 35, height: 25 },
]

// Accepted file types
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif']

// Initialize cropper when image is ready
function initCropper() {
  if (!imageRef.value || cropper) return

  cropper = new CropperJS(imageRef.value, {
    aspectRatio: store.aspectRatio,
    viewMode: 1, // Restrict crop box to canvas
    dragMode: 'move', // Move the image, not the crop box
    autoCropArea: 1, // Full crop area
    cropBoxMovable: false,
    cropBoxResizable: false,
    toggleDragModeOnDblclick: false,
    guides: false,
    center: false,
    highlight: false,
    background: false,
    responsive: true,
    restore: false,
    checkCrossOrigin: true,
    checkOrientation: false,
    ready() {
      // Restore saved state if available
      if (store.cropCoordinates && store.zoomLevel > 0) {
        restoreCropState()
      } else {
        // Set initial zoom to fit
        resetToInitialState()
      }
      // Generate initial preview
      generatePreview()
      // Mark as ready to show the cropper
      isCropperReady.value = true
    },
    cropend() {
      if (!isRestoringCrop.value) {
        saveCropState()
        generatePreviewDebounced()
      }
    },
    zoom(event) {
      // Prevent zoom beyond limits
      const newRatio = event.detail.ratio
      if (newRatio < minZoom || newRatio > maxZoom) {
        event.preventDefault()
        return
      }

      if (!isRestoringCrop.value) {
        // Sync slider with zoom
        const zoomPercent = Math.round(((newRatio - minZoom) / (maxZoom - minZoom)) * 100)
        store.setZoomLevel(Math.max(0, Math.min(100, zoomPercent)))
        saveCropState()
        generatePreviewDebounced()
      }
    },
  })
}

// Calculate zoom limits based on image and container
function calculateZoomLimits() {
  if (!cropper) return

  const containerData = cropper.getContainerData()
  const imageData = cropper.getImageData()

  // Calculate the zoom ratio to fit the image in the container
  const fitRatio = Math.min(
    containerData.width / imageData.naturalWidth,
    containerData.height / imageData.naturalHeight
  )

  // Set zoom limits: min = fit ratio, max = 3x fit ratio
  minZoom = fitRatio
  maxZoom = fitRatio * 3
}

// Reset to initial state (fit image, zoom 0%)
function resetToInitialState() {
  if (!cropper) return

  calculateZoomLimits()

  // Set to fit ratio so image fills the container
  cropper.zoomTo(minZoom)

  const containerData = cropper.getContainerData()
  const imageData = cropper.getImageData()

  cropper.moveTo(
    (containerData.width - imageData.naturalWidth * minZoom) / 2,
    (containerData.height - imageData.naturalHeight * minZoom) / 2
  )

  store.setZoomLevel(0)
}

// Handle zoom slider
function handleZoomSlider(e: Event) {
  if (!cropper) return

  const input = e.target as HTMLInputElement
  const value = Number(input.value)

  // Convert 0-100 to zoom ratio (1x to 3x)
  const zoomRatio = minZoom + (value / 100) * (maxZoom - minZoom)

  // Use zoomTo for absolute zoom
  cropper.zoomTo(zoomRatio)
  store.setZoomLevel(value)
}

// Save crop state for persistence
function saveCropState() {
  if (!cropper || isRestoringCrop.value) return

  const canvasData = cropper.getCanvasData()
  const imageData = cropper.getImageData()

  // Save canvas data for restoration
  store.setCropCoordinates({
    left: canvasData.left,
    top: canvasData.top,
    width: canvasData.width,
    height: canvasData.height,
  })
}

// Restore crop state from saved data
function restoreCropState() {
  if (!cropper || !store.cropCoordinates) return

  isRestoringCrop.value = true
  calculateZoomLimits()

  try {
    // Restore zoom level
    const zoomRatio = minZoom + (store.zoomLevel / 100) * (maxZoom - minZoom)
    cropper.zoomTo(zoomRatio)

    // Restore canvas position
    cropper.setCanvasData({
      left: store.cropCoordinates.left,
      top: store.cropCoordinates.top,
      width: store.cropCoordinates.width,
      height: store.cropCoordinates.height,
    })
  } finally {
    setTimeout(() => {
      isRestoringCrop.value = false
    }, 100)
  }
}

// Generate cropped preview (immediate - for initial load)
function generatePreview() {
  if (!cropper) return

  const canvas = cropper.getCroppedCanvas({
    maxWidth: 1200,
    maxHeight: 1200,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  })

  if (canvas) {
    canvas.toBlob((blob) => {
      if (blob) {
        store.setCroppedImage(blob)
      }
    }, 'image/jpeg', 0.95)
  }
}

// Debounced preview generation - waits until user stops editing
function generatePreviewDebounced() {
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer)
  }
  previewDebounceTimer = setTimeout(() => {
    generatePreview()
    previewDebounceTimer = null
  }, PREVIEW_DEBOUNCE_MS)
}

// Destroy cropper
function destroyCropper() {
  isCropperReady.value = false
  // Clear any pending debounced preview
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer)
    previewDebounceTimer = null
  }
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
}

// Handle file selection
function handleFileSelect() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
}

// Drag and drop handlers
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

// Process uploaded file
async function processFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    alert('Solo se aceptan imagenes PNG, JPEG o GIF')
    return
  }

  // If we're changing the image, reset text configuration
  if (isChangingImage.value) {
    store.setTitle('')
    store.setSubtitle('')
    isChangingImage.value = false
  }

  // Destroy existing cropper before setting new image
  destroyCropper()

  store.setImage(file)

  // Upload original image to S3 in background
  try {
    store.setIsUploadingToS3(true)
    const result = await uploadDesignImage(file, 'personaliza-original', 'custom-prints')
    store.setImageS3Url(result.url)
  } catch (error) {
    console.error('[PanelArchivo] Failed to upload original to S3:', error)
  } finally {
    store.setIsUploadingToS3(false)
  }
}

// Change image - marks that we're changing so text gets reset after new upload
function handleChangeImage() {
  isChangingImage.value = true
  fileInput.value?.click()
}

// Delete image and all configuration
function handleDeleteImage() {
  destroyCropper()
  store.clearImage()
  store.setTitle('')
  store.setSubtitle('')
  isChangingImage.value = false
}

// Format selection
function selectFormat(format: ImageFormat) {
  store.setImageFormat(format)
  store.setCropCoordinates(null)
  store.setZoomLevel(0)

  // Update cropper aspect ratio
  if (cropper) {
    cropper.setAspectRatio(store.aspectRatio)
    resetToInitialState()
    generatePreview()
  }
}

// Acknowledge size warning
function acknowledgeWarning() {
  store.acknowledgeSizeWarning()
}

// Watch for image source changes
watch(cropperImageSrc, (newSrc, oldSrc) => {
  if (newSrc && newSrc !== oldSrc) {
    // Destroy old cropper
    destroyCropper()

    // Wait for image to load then init cropper
    nextTick(() => {
      if (imageRef.value) {
        // If image already loaded, init immediately
        if (imageRef.value.complete) {
          initCropper()
        }
        // Otherwise wait for load event (handled by @load)
      }
    })
  }
})

// Cleanup on unmount
onBeforeUnmount(() => {
  destroyCropper()
})
</script>

<template>
  <div class="panel-archivo">
    <div class="panel-archivo__section">
      <h3 class="panel-archivo__title">
        <svg class="panel-archivo__title-icon" width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z"/>
          <path class="panel-archivo__title-icon-fill" d="M1 5.6C1 3.98985 1 3.18477 1.31336 2.56978C1.58899 2.02881 2.02881 1.58899 2.56978 1.31336C3.18477 1 3.98985 1 5.6 1H15.5667C17.1768 1 17.9819 1 18.5969 1.31336C19.1379 1.58899 19.5777 2.02881 19.8533 2.56978C20.1667 3.18477 20.1667 3.98985 20.1667 5.6V13.65C20.1667 15.2602 20.1667 16.0652 19.8533 16.6802C19.5777 17.2212 19.1379 17.661 18.5969 17.9366C17.9819 18.25 17.1768 18.25 15.5667 18.25H5.6C3.98985 18.25 3.18477 18.25 2.56978 17.9366C2.02881 17.661 1.58899 17.2212 1.31336 16.6802C1 16.0652 1 15.2602 1 13.65V5.6Z"/>
          <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Archivo
      </h3>
    </div>

    <!-- Upload zone (when no image) -->
    <div v-if="!cropperImageSrc" class="panel-archivo__upload-section">
      <div
        class="panel-archivo__upload-zone"
        :class="{ 'panel-archivo__upload-zone--dragging': isDragging }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="handleFileSelect"
      >
        <div class="panel-archivo__upload-icon">
          <img
            src="/personaliza-icons/icon/image-add.svg"
            alt="Upload"
            width="43"
            height="43"
          >
        </div>
        <p class="panel-archivo__upload-text">
          <span class="panel-archivo__upload-link">Carga</span> o arrastra un archivo aquí
        </p>
        <p class="panel-archivo__upload-hint">
          <span class="panel-archivo__upload-formats">PNG, JPEG, GIF </span>
          <span class="panel-archivo__upload-size">hasta 20MB</span>
        </p>
      </div>
      <button
        class="panel-archivo__upload-btn"
        @click="handleFileSelect"
      >
        <span>Cargar archivos</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.66699 13.3333L10.0003 10M10.0003 10L13.3337 13.3333M10.0003 10V17.5M16.667 13.9524C17.6849 13.1117 18.3337 11.8399 18.3337 10.4167C18.3337 7.88536 16.2816 5.83333 13.7503 5.83333C13.5682 5.83333 13.3979 5.73833 13.3054 5.58145C12.2187 3.73736 10.2124 2.5 7.91699 2.5C4.46521 2.5 1.66699 5.29822 1.66699 8.75C1.66699 10.4718 2.36372 12.0309 3.48945 13.1613" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif"
      class="panel-archivo__file-input"
      @change="handleFileChange"
    >

    <!-- Image uploaded state -->
    <template v-if="cropperImageSrc">
      <!-- Cropper -->
      <div class="panel-archivo__cropper-section">
        <div
          class="panel-archivo__cropper-container"
          :class="{ 'panel-archivo__cropper-container--ready': isCropperReady }"
        >
          <!-- Skeleton loading while cropper initializes -->
          <div v-if="!isCropperReady" class="panel-archivo__cropper-skeleton">
            <div class="panel-archivo__cropper-skeleton-shimmer" />
          </div>
          <img
            ref="imageRef"
            :src="cropperImageSrc"
            alt="Crop preview"
            class="panel-archivo__cropper-image"
            crossorigin="anonymous"
            @load="initCropper"
          >
          <!-- Delete button -->
          <button
            class="panel-archivo__delete-btn"
            type="button"
            aria-label="Eliminar imagen"
            @click="handleDeleteImage"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="panel-archivo__separator" />

      <!-- Format selector -->
      <div class="panel-archivo__section">
        <h3 class="panel-archivo__section-title">Formato de la imágen</h3>
        <div class="panel-archivo__formats">
          <button
            v-for="format in formatOptions"
            :key="format.id"
            :class="[
              'panel-archivo__format-card',
              { 'panel-archivo__format-card--active': store.imageFormat === format.id }
            ]"
            @click="selectFormat(format.id)"
          >
            <div
              class="panel-archivo__format-shape"
              :style="{ width: format.width + 'px', height: format.height + 'px' }"
            />
            <span class="panel-archivo__format-label">{{ format.label }}</span>
          </button>
        </div>
      </div>

      <!-- Zoom & Crop -->
      <div class="panel-archivo__section">
        <h3 class="panel-archivo__section-title">Zoom &amp; Crop</h3>
        <div
          class="panel-archivo__slider-wrapper"
          :style="{ '--progress': store.zoomLevel + '%', '--zoom': store.zoomLevel / 100 }"
        >
          <input
            type="range"
            min="0"
            max="100"
            :value="store.zoomLevel"
            class="panel-archivo__slider"
            @input="handleZoomSlider"
          >
          <span class="panel-archivo__slider-value">{{ store.zoomLevel }}%</span>
        </div>
      </div>

      <!-- Change image button -->
      <div class="panel-archivo__change-section">
        <button
          class="panel-archivo__change-btn"
          @click="handleChangeImage"
        >
          Cambiar imagen
        </button>
      </div>

      <!-- Size warning -->
      <div
        v-if="store.showSizeWarning"
        class="panel-archivo__warning"
      >
        <div class="panel-archivo__warning-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
          </svg>
        </div>
        <div class="panel-archivo__warning-content">
          <p class="panel-archivo__warning-title">Resolucion baja</p>
          <p class="panel-archivo__warning-text">
            Tu imagen tiene una resolucion menor a la recomendada para el tamano seleccionado.
            El resultado podria verse pixelado.
          </p>
          <label class="panel-archivo__warning-checkbox">
            <input
              type="checkbox"
              :checked="store.sizeWarningAcknowledged"
              @change="acknowledgeWarning"
            >
            <span>Entiendo y quiero continuar</span>
          </label>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.panel-archivo {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;

  @include mobile {
    padding-top: 0;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-inline: 20px;
  }

  &__separator {
    height: 1px;
    background-color: #e5e7eb;
    width: calc(100% - 40px);
    margin: 4px auto;
  }

  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title-icon {
    color: $color-brand;
    flex-shrink: 0;
    path:not(.omit-fill), rect:not(.omit-fill) {
      fill: $color-icon-fill;
    }
  }

  &__description {
    font-family: $font-primary;
    font-size: 14px;
    color: #717680;
    margin: 0;
    line-height: 1.4;
  }

  &__label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #414651;
  }

  // Upload section
  &__upload-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-inline: 20px;
  }

  // Upload zone
  &__upload-zone {
    padding: 24px 20px;
    background: white;
    border: 1px dashed #d5d7da;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 170px;
    cursor: pointer;
    transition: border-color $transition-fast, background-color $transition-fast, box-shadow $transition-fast;
    box-shadow: 0px 4px 6px -1px rgba(10, 13, 18, 0.1), 0px 1px 10px -2px $color-brand-light;

    &:hover,
    &--dragging {
      border-color: $color-brand;
      background: $color-brand-light;
    }
  }

  &__upload-icon {
    width: 43px;
    height: 43px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__upload-text {
    font-family: 'Lexend', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #2f3038;
    margin: 0;
    text-align: center;
    line-height: 24px;
  }

  &__upload-link {
    color: $color-brand;
    font-weight: 500;
  }

  &__upload-hint {
    font-family: 'Lexend', sans-serif;
    font-weight: 400;
    color: #2f3038;
    margin: 0;
    line-height: 24px;
  }

  &__upload-formats {
    font-size: 15px;
    font-weight: 500;
  }

  &__upload-size {
    font-size: 11px;
    font-weight: 400;
  }

  &__upload-btn {
    @include button-reset;
    width: 100%;
    padding: 10px 16px;
    background: #252b37;
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    color: white;
    line-height: 24px;
    cursor: pointer;
    transition: background-color $transition-fast;
    box-shadow: 0px 1px 2px 0px rgba(10, 13, 18, 0.05);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      box-shadow: inset 0px 0px 0px 1px rgba(10, 13, 18, 0.18), inset 0px -2px 0px 0px rgba(10, 13, 18, 0.05);
    }

    @include hover {
      background: #1a1f28;
    }

    svg {
      flex-shrink: 0;
    }
  }

  &__file-input {
    display: none;
  }

  // Section title
  &__section-title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
  }

  // Format selector
  &__formats {
    display: flex;
    gap: 10px;
  }

  &__format-card {
    @include button-reset;
    width: 54px;
    height: 75px;
    padding: 8px 10px;
    background: #f5f5f5;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    cursor: pointer;
    transition: background-color $transition-fast;

    &--active {
      background: $color-brand-light;

      .panel-archivo__format-shape {
        background: $color-brand;
      }

      .panel-archivo__format-label {
        color: $color-brand-hover;
      }
    }

    @include hover {
      &:not(.panel-archivo__format-card--active) {
        background: #ebebeb;
      }
    }
  }

  &__format-shape {
    background: #a4a7ae;
    border-radius: 2px;
    transition: background-color $transition-fast;
  }

  &__format-label {
    font-family: 'Lexend', sans-serif;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    color: #2f3038;
    text-align: center;
    transition: color $transition-fast;
  }

  // Slider (Zoom & Crop)
  &__slider-wrapper {
    position: relative;
    height: 56px;
    padding-top: 8px;
  }

  &__slider {
    width: 100%;
    height: 8px;
    appearance: none;
    background: #e9eaeb;
    border-radius: 9999px;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      border: 2px solid $color-brand;
      box-shadow: 0px 4px 6px -1px rgba(10, 13, 18, 0.1), 0px 2px 4px -2px rgba(10, 13, 18, 0.06);
      cursor: pointer;
      margin-top: -8px;
    }

    &::-moz-range-thumb {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      border: 2px solid $color-brand;
      box-shadow: 0px 4px 6px -1px rgba(10, 13, 18, 0.1), 0px 2px 4px -2px rgba(10, 13, 18, 0.06);
      cursor: pointer;
    }

    &::-webkit-slider-runnable-track {
      height: 8px;
      border-radius: 9999px;
      background: linear-gradient(to right, $color-brand var(--progress, 0%), #e9eaeb var(--progress, 0%));
    }
  }

  &__slider-value {
    position: absolute;
    left: var(--progress, 0%);
    top: 42px;
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-medium;
    line-height: 24px;
    color: #181d27;
    white-space: nowrap;
    transform: translateX(calc(-100% * var(--zoom)));
    pointer-events: none;
  }

  // Cropper
  &__cropper-section {
    padding-inline: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__cropper-container {
    position: relative;
    width: 100%;
    height: 170px;
    border-radius: 8px;
    overflow: hidden;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__cropper-skeleton {
    position: absolute;
    inset: 0;
    background: #2a2a2a;
    z-index: 5;
    overflow: hidden;
  }

  &__cropper-skeleton-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 100%
    );
    animation: cropper-shimmer 1.5s infinite;
  }

  @keyframes cropper-shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  &__delete-btn {
    @include button-reset;
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #414651;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
    transition: background-color $transition-fast, color $transition-fast;

    @include hover {
      background: #f5f5f5;
      color: #181d27;
    }
  }

  &__cropper-image {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  // Change image button
  &__change-section {
    padding-inline: 20px;
  }

  &__change-btn {
    @include button-reset;
    width: 100%;
    padding: 12px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: $color-brand;
    background: transparent;
    border: 1px solid $color-brand;
    border-radius: 8px;
    transition: background-color $transition-fast;

    @include hover {
      background: #fff8f2;
    }
  }

  // Size warning
  &__warning {
    margin-inline: 20px;
    padding: 16px;
    background: #fef3cd;
    border: 1px solid #f0ad4e;
    border-radius: 8px;
    display: flex;
    gap: 12px;
  }

  &__warning-icon {
    flex-shrink: 0;
    color: #856404;
  }

  &__warning-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__warning-title {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #856404;
    margin: 0;
  }

  &__warning-text {
    font-family: $font-primary;
    font-size: 13px;
    color: #856404;
    margin: 0;
    line-height: 1.4;
  }

  &__warning-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: $font-primary;
    font-size: 13px;
    color: #856404;
    cursor: pointer;

    input {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }
}

// Cropper.js overrides
:deep(.cropper-container) {
  width: 100% !important;
  height: 100% !important;
}

:deep(.cropper-view-box) {
  outline: none;
  border: 2px dashed white;
}

:deep(.cropper-face) {
  background-color: transparent;
}

:deep(.cropper-modal) {
  background-color: rgba(0, 0, 0, 0.5);
}

:deep(.cropper-line),
:deep(.cropper-point) {
  display: none;
}

:deep(.cropper-dashed) {
  display: none;
}
</style>
