<script setup lang="ts">
import { Cropper, RectangleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import type { ImageFormat } from '~/stores/personaliza'

const store = usePersonalizaStore()

// File input ref
const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<any>(null)

// Drag state
const isDragging = ref(false)

// Format options
const formatOptions: { id: ImageFormat; label: string; aspectRatio: number }[] = [
  { id: '1:1', label: 'Cuadrado', aspectRatio: 1 },
  { id: '4:3', label: 'Horizontal', aspectRatio: 4 / 3 },
  { id: '3:4', label: 'Vertical', aspectRatio: 3 / 4 },
]

// Accepted file types
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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
function processFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    alert('Solo se aceptan imagenes JPG, PNG o WEBP')
    return
  }

  store.setImage(file)
}

// Change image
function handleChangeImage() {
  store.clearImage()
  nextTick(() => {
    fileInput.value?.click()
  })
}

// Format selection
function selectFormat(format: ImageFormat) {
  store.setImageFormat(format)
  nextTick(() => {
    resizeStencil()
  })
}

// Zoom controls
function handleZoomIn() {
  if (cropperRef.value) {
    cropperRef.value.zoom(1.25)
  }
}

function handleZoomOut() {
  if (cropperRef.value) {
    cropperRef.value.zoom(0.8)
  }
}

// Handle zoom slider
function handleZoomSlider(e: Event) {
  const input = e.target as HTMLInputElement
  store.setZoomLevel(Number(input.value))
  // Apply zoom based on slider value
  if (cropperRef.value) {
    // Normalize zoom: 0 = 1x, 100 = 3x
    const zoomLevel = 1 + (Number(input.value) / 100) * 2
    cropperRef.value.setCoordinates((state: any) => {
      const { imageSize } = state
      const newWidth = imageSize.width / zoomLevel
      const newHeight = newWidth / store.aspectRatio
      return {
        width: newWidth,
        height: newHeight,
        left: (imageSize.width - newWidth) / 2,
        top: (imageSize.height - newHeight) / 2,
      }
    })
  }
}

// Resize stencil when format changes
async function resizeStencil() {
  const cropper = cropperRef.value
  if (!cropper) return

  cropper.reset()
  await new Promise(resolve => setTimeout(resolve, 100))

  cropper.setCoordinates(({ imageSize }: any) => {
    let width = imageSize.width
    let height = width / store.aspectRatio

    if (height > imageSize.height) {
      height = imageSize.height
      width = height * store.aspectRatio
    }

    return {
      left: (imageSize.width - width) / 2,
      top: (imageSize.height - height) / 2,
      width,
      height,
    }
  })
}

// Handle crop change to generate preview
function handleCropChange() {
  if (!cropperRef.value) return

  const { canvas } = cropperRef.value.getResult()
  if (!canvas) return

  canvas.toBlob((blob: Blob | null) => {
    if (blob) {
      store.setCroppedImage(blob)
    }
  }, 'image/jpeg', 0.95)
}

// Acknowledge size warning
function acknowledgeWarning() {
  store.acknowledgeSizeWarning()
}
</script>

<template>
  <div class="panel-archivo">
    <div class="panel-archivo__section">
      <h3 class="panel-archivo__title">
        <svg class="panel-archivo__title-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" x2="12" y1="3" y2="15"/>
        </svg>
        Sube tu imagen
      </h3>
      <p class="panel-archivo__description">
        Arrastra tu imagen o haz clic para seleccionar
      </p>
    </div>

    <!-- Upload zone (when no image) -->
    <div
      v-if="!store.hasImage"
      class="panel-archivo__upload-zone"
      :class="{ 'panel-archivo__upload-zone--dragging': isDragging }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="handleFileSelect"
    >
      <div class="panel-archivo__upload-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" x2="12" y1="3" y2="15"/>
        </svg>
      </div>
      <p class="panel-archivo__upload-text">
        <span class="panel-archivo__upload-link">Clic para subir</span>
        o arrastra y suelta
      </p>
      <p class="panel-archivo__upload-hint">PNG, JPG o WEBP</p>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="panel-archivo__file-input"
      @change="handleFileChange"
    >

    <!-- Image uploaded state -->
    <template v-if="store.hasImage">
      <!-- Format selector -->
      <div class="panel-archivo__section">
        <label class="panel-archivo__label">Formato</label>
        <div class="panel-archivo__formats">
          <button
            v-for="format in formatOptions"
            :key="format.id"
            :class="[
              'panel-archivo__format-btn',
              { 'panel-archivo__format-btn--active': store.imageFormat === format.id }
            ]"
            @click="selectFormat(format.id)"
          >
            {{ format.label }}
          </button>
        </div>
      </div>

      <!-- Cropper -->
      <div class="panel-archivo__cropper-section">
        <div class="panel-archivo__cropper-container">
          <Cropper
            ref="cropperRef"
            :src="store.imageUrl!"
            :stencil-component="RectangleStencil"
            :stencil-props="{
              handlers: {},
              aspectRatio: store.aspectRatio,
              resizable: false,
              movable: false
            }"
            :image-restriction="'stencil'"
            :resize-image="{
              adjustStencil: false
            }"
            @ready="resizeStencil"
            @change="handleCropChange"
          />
        </div>

        <!-- Zoom controls -->
        <div class="panel-archivo__zoom">
          <button
            class="panel-archivo__zoom-btn"
            aria-label="Alejar"
            @click="handleZoomOut"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
              <path d="M8 11h6"/>
            </svg>
          </button>
          <input
            type="range"
            min="0"
            max="100"
            :value="store.zoomLevel"
            class="panel-archivo__zoom-slider"
            @input="handleZoomSlider"
          >
          <button
            class="panel-archivo__zoom-btn"
            aria-label="Acercar"
            @click="handleZoomIn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
              <path d="M11 8v6"/>
              <path d="M8 11h6"/>
            </svg>
          </button>
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

  // Upload zone
  &__upload-zone {
    margin-inline: 20px;
    padding: 32px 20px;
    background: #fafafa;
    border: 2px dashed #e9eaeb;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color $transition-fast, background-color $transition-fast;

    &:hover,
    &--dragging {
      border-color: $color-brand;
      background: #fff8f2;
    }
  }

  &__upload-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #717680;
  }

  &__upload-text {
    font-family: $font-primary;
    font-size: 14px;
    color: #535861;
    margin: 0;
    text-align: center;
  }

  &__upload-link {
    color: $color-brand;
    font-weight: $font-weight-semibold;
  }

  &__upload-hint {
    font-family: $font-primary;
    font-size: 12px;
    color: #717680;
    margin: 0;
  }

  &__file-input {
    display: none;
  }

  // Format selector
  &__formats {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__format-btn {
    @include button-reset;
    flex: 1;
    padding: 10px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    background: #f5f5f5;
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;

    &--active {
      background: #fff0e5;
      color: $color-brand;
    }

    @include hover {
      background: #ebebeb;

      &.panel-archivo__format-btn--active {
        background: #fff0e5;
      }
    }
  }

  // Cropper
  &__cropper-section {
    padding-inline: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__cropper-container {
    width: 100%;
    aspect-ratio: 1;
    max-height: 300px;
    border-radius: 8px;
    overflow: hidden;
    background: #1a1a1a;
  }

  // Zoom controls
  &__zoom {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__zoom-btn {
    @include button-reset;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #414651;
    transition: background-color $transition-fast;

    @include hover {
      background: #ebebeb;
    }
  }

  &__zoom-slider {
    flex: 1;
    height: 4px;
    appearance: none;
    background: #e9eaeb;
    border-radius: 2px;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: $color-brand;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: $color-brand;
      cursor: pointer;
      border: none;
    }
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

// Cropper overrides
:deep(.vue-advanced-cropper__background) {
  background-color: #1a1a1a;
}

:deep(.vue-rectangle-stencil) {
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px dashed rgba(255, 255, 255, 0.6);
    pointer-events: none;
  }
}
</style>
