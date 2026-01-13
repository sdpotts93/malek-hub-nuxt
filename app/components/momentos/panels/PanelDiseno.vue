<script setup lang="ts">
import type { MomentosFormat, MomentosImageCount, DisenoTabType } from '~/stores/momentos'
import { IMAGE_COUNTS, MARGIN_COLORS, MAX_IMAGES, MAX_IMAGE_SIZE_MB, generateId } from '~/stores/momentos'

const store = useMomentosStore()

// Library section ref for scrolling
const librarySectionRef = ref<HTMLElement | null>(null)

// Lightbox state
const lightboxImage = ref<string | null>(null)
const isLightboxOpen = computed(() => lightboxImage.value !== null)

// Watch for empty cell selection to switch to imagenes tab and scroll to library
watch(() => store.selectedCellId, (cellId) => {
  if (cellId) {
    const cell = store.getCellById(cellId)
    if (cell && !cell.imageId) {
      // Switch to imagenes tab if not already
      if (store.activeDisenoTab !== 'imagenes') {
        store.setActiveDisenoTab('imagenes')
      }
      // Scroll to library section after tab switch
      nextTick(() => {
        librarySectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }
})

// Check if we should show the "select image" indicator
const showSelectImageIndicator = computed(() => {
  if (!store.selectedCellId) return false
  const cell = store.getCellById(store.selectedCellId)
  return cell && !cell.imageId
})

// Open lightbox with high res image
function openLightbox(imageUrl: string) {
  lightboxImage.value = imageUrl
}

// Close lightbox
function closeLightbox() {
  lightboxImage.value = null
}
const { uploadDesignImage } = useS3Upload()

// Tabs
const tabs: { id: DisenoTabType; label: string }[] = [
  { id: 'diseno', label: 'Diseño' },
  { id: 'imagenes', label: 'Imágenes' },
]

// Format options
const formatOptions: { id: MomentosFormat; label: string }[] = [
  { id: 'square', label: 'Cuadrado' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
]

// Get available image counts for current format
const availableImageCounts = computed(() => IMAGE_COUNTS[store.format])

// File input ref
const fileInput = ref<HTMLInputElement | null>(null)

// Drag state for upload zone
const isDragging = ref(false)

// Drag state for content area overlay (when dragging files from outside)
const isDraggingOverContent = ref(false)
const dragCounter = ref(0) // Counter to handle nested elements

// Autofill modal state
const showAutofillModal = ref(false)
const pendingAutofillImages = ref<string[]>([])
const autofillStartIndex = ref(0)

// Upload a single file
async function uploadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    console.warn('[PanelDiseno] Invalid file type:', file.type)
    return
  }

  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    console.warn('[PanelDiseno] File too large:', file.size)
    alert(`El archivo es demasiado grande. Tamaño máximo: ${MAX_IMAGE_SIZE_MB}MB`)
    return
  }

  if (store.uploadedImages.length >= MAX_IMAGES) {
    alert(`Has alcanzado el límite de ${MAX_IMAGES} imágenes`)
    return
  }

  const id = generateId()

  // Create blob URL for immediate preview
  const blobUrl = URL.createObjectURL(file)

  // Get image dimensions
  const dimensions = await getImageDimensions(blobUrl)

  // Create uploaded image entry
  const uploadedImage = {
    id,
    file,
    lowResUrl: blobUrl, // Will be replaced after resize
    mediumResUrl: blobUrl, // Will be replaced after resize
    highResUrl: blobUrl,
    width: dimensions.width,
    height: dimensions.height,
    uploadProgress: 0,
    isUploading: true,
  }

  store.addUploadedImage(uploadedImage)

  try {
    // Generate resized versions
    const [lowResBlob, mediumResBlob] = await Promise.all([
      resizeImage(file, 200),
      resizeImage(file, 2000),
    ])

    // Upload all three versions to S3
    const [lowResResult, mediumResResult, highResResult] = await Promise.all([
      uploadDesignImage(lowResBlob, 'momentos-low', 'momentos-malek'),
      uploadDesignImage(mediumResBlob, 'momentos-med', 'momentos-malek'),
      uploadDesignImage(file, 'momentos-high', 'momentos-malek'),
    ])

    // Update with S3 URLs
    store.updateUploadedImage(id, {
      s3LowResUrl: lowResResult.url,
      s3MediumResUrl: mediumResResult.url,
      s3HighResUrl: highResResult.url,
      lowResUrl: lowResResult.url,
      mediumResUrl: mediumResResult.url,
      highResUrl: highResResult.url,
      uploadProgress: 100,
      isUploading: false,
    })

    // Revoke blob URL
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('[PanelDiseno] Upload failed:', error)
    // Keep the blob URL for preview even if S3 upload fails
    store.updateUploadedImage(id, {
      uploadProgress: 100,
      isUploading: false,
    })
  }
}

// Get image dimensions from URL
function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = url
  })
}

// Resize image to max dimension
async function resizeImage(file: File, maxDimension: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      // Calculate new dimensions
      let { width, height } = img
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width
          width = maxDimension
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height
          height = maxDimension
        }
      }

      // If image is already smaller, return original
      if (width >= img.width && height >= img.height) {
        resolve(file)
        return
      }

      canvas.width = width
      canvas.height = height
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        0.9
      )
    }
    img.src = URL.createObjectURL(file)
  })
}

// Handle file selection
function handleFileSelect() {
  fileInput.value?.click()
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) {
    input.value = ''
    return
  }

  const fileArray = Array.from(files)

  // Upload all files first
  const uploadedIds: string[] = []
  for (const file of fileArray) {
    const id = await uploadFileAndGetId(file)
    if (id) uploadedIds.push(id)
  }

  // Reset input so the same file can be selected again
  input.value = ''

  if (uploadedIds.length === 0) return

  // Single image: auto-populate selected cell if empty
  if (uploadedIds.length === 1) {
    const imageId = uploadedIds[0]
    if (imageId && store.selectedCellId) {
      const selectedCell = store.getCellById(store.selectedCellId)
      if (selectedCell && !selectedCell.imageId) {
        store.setImageToCell(store.selectedCellId, imageId)
        store.selectCell(null)
      }
    }
    return
  }

  // Multiple images: show autofill modal
  pendingAutofillImages.value = uploadedIds
  // Determine start index based on selected cell
  if (store.selectedCellId) {
    const cellIndex = store.canvasCells.findIndex(c => c.id === store.selectedCellId)
    autofillStartIndex.value = cellIndex >= 0 ? cellIndex : 0
  } else {
    autofillStartIndex.value = 0
  }
  showAutofillModal.value = true
}

// Upload file and return the generated ID
async function uploadFileAndGetId(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) {
    console.warn('[PanelDiseno] Invalid file type:', file.type)
    return null
  }

  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    console.warn('[PanelDiseno] File too large:', file.size)
    alert(`El archivo es demasiado grande. Tamaño máximo: ${MAX_IMAGE_SIZE_MB}MB`)
    return null
  }

  if (store.uploadedImages.length >= MAX_IMAGES) {
    alert(`Has alcanzado el límite de ${MAX_IMAGES} imágenes`)
    return null
  }

  const id = generateId()

  // Create blob URL for immediate preview
  const blobUrl = URL.createObjectURL(file)

  // Get image dimensions
  const dimensions = await getImageDimensions(blobUrl)

  // Create uploaded image entry
  const uploadedImage = {
    id,
    file,
    lowResUrl: blobUrl,
    mediumResUrl: blobUrl,
    highResUrl: blobUrl,
    width: dimensions.width,
    height: dimensions.height,
    uploadProgress: 0,
    isUploading: true,
  }

  store.addUploadedImage(uploadedImage)

  // Start S3 upload in background (don't await)
  uploadToS3InBackground(id, file, blobUrl)

  return id
}

// Handle S3 upload in background
async function uploadToS3InBackground(id: string, file: File, blobUrl: string) {
  try {
    const [lowResBlob, mediumResBlob] = await Promise.all([
      resizeImage(file, 200),
      resizeImage(file, 2000),
    ])

    const [lowResResult, mediumResResult, highResResult] = await Promise.all([
      uploadDesignImage(lowResBlob, 'momentos-low', 'momentos-malek'),
      uploadDesignImage(mediumResBlob, 'momentos-med', 'momentos-malek'),
      uploadDesignImage(file, 'momentos-high', 'momentos-malek'),
    ])

    store.updateUploadedImage(id, {
      s3LowResUrl: lowResResult.url,
      s3MediumResUrl: mediumResResult.url,
      s3HighResUrl: highResResult.url,
      lowResUrl: lowResResult.url,
      mediumResUrl: mediumResResult.url,
      highResUrl: highResResult.url,
      uploadProgress: 100,
      isUploading: false,
    })

    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('[PanelDiseno] Upload failed:', error)
    store.updateUploadedImage(id, {
      uploadProgress: 100,
      isUploading: false,
    })
  }
}

// Handle autofill confirmation
function handleAutofillConfirm() {
  const startIndex = autofillStartIndex.value
  const imageIds = pendingAutofillImages.value

  // Fill cells starting from startIndex
  let imageIndex = 0
  for (let i = startIndex; i < store.canvasCells.length && imageIndex < imageIds.length; i++) {
    const cell = store.canvasCells[i]
    const imageId = imageIds[imageIndex]
    if (cell && imageId && !cell.imageId) {
      store.setImageToCell(cell.id, imageId)
      imageIndex++
    }
  }

  // Close modal and reset
  showAutofillModal.value = false
  pendingAutofillImages.value = []
  store.selectCell(null)
}

// Handle autofill cancel
function handleAutofillCancel() {
  showAutofillModal.value = false
  pendingAutofillImages.value = []
}

// Drag and drop handlers for upload zone
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
  const files = e.dataTransfer?.files
  if (files) {
    Array.from(files).forEach(uploadFile)
  }
}

// Panel-level drag handlers (for showing overlay when dragging files)
function onPanelDragEnter(e: DragEvent) {
  // Only show overlay if on imagenes tab and dragging files
  if (store.activeDisenoTab !== 'imagenes') return
  if (!e.dataTransfer?.types.includes('Files')) return

  dragCounter.value++
  isDraggingOverContent.value = true
}

function onPanelDragLeave(e: DragEvent) {
  if (store.activeDisenoTab !== 'imagenes') return

  // Only hide if leaving the panel entirely
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const panel = e.currentTarget as HTMLElement
  if (!relatedTarget || !panel.contains(relatedTarget)) {
    isDraggingOverContent.value = false
    dragCounter.value = 0
  }
}

function onPanelDrop(e: DragEvent) {
  if (store.activeDisenoTab !== 'imagenes') return

  isDraggingOverContent.value = false
  dragCounter.value = 0
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    handleFilesFromDrop(Array.from(files))
  }
}

// Handle files dropped on content area
async function handleFilesFromDrop(files: File[]) {
  const uploadedIds: string[] = []
  for (const file of files) {
    const id = await uploadFileAndGetId(file)
    if (id) uploadedIds.push(id)
  }

  if (uploadedIds.length === 0) return

  // Single image: auto-populate selected cell if empty
  if (uploadedIds.length === 1) {
    const imageId = uploadedIds[0]
    if (imageId && store.selectedCellId) {
      const selectedCell = store.getCellById(store.selectedCellId)
      if (selectedCell && !selectedCell.imageId) {
        store.setImageToCell(store.selectedCellId, imageId)
        store.selectCell(null)
      }
    }
    return
  }

  // Multiple images: show autofill modal
  pendingAutofillImages.value = uploadedIds
  if (store.selectedCellId) {
    const cellIndex = store.canvasCells.findIndex(c => c.id === store.selectedCellId)
    autofillStartIndex.value = cellIndex >= 0 ? cellIndex : 0
  } else {
    autofillStartIndex.value = 0
  }
  showAutofillModal.value = true
}

// Handle drag start for image library
function handleImageDragStart(e: DragEvent, imageId: string) {
  e.dataTransfer?.setData('imageId', imageId)
}

// Remove image from library
function handleRemoveImage(imageId: string) {
  store.removeUploadedImage(imageId)
}

// Handle clicking on library image to assign to selected cell
function handleImageClick(imageId: string) {
  // Check if there's a selected cell waiting for an image
  if (store.selectedCellId) {
    const selectedCell = store.getCellById(store.selectedCellId)
    // Only assign if the cell is empty (no image yet)
    if (selectedCell && !selectedCell.imageId) {
      store.setImageToCell(store.selectedCellId, imageId)
      store.selectCell(null) // Deselect after assignment
    }
  }
}

// Color scroll container ref
const colorScrollRef = ref<HTMLElement | null>(null)

function scrollColors(direction: 'left' | 'right') {
  if (!colorScrollRef.value) return
  const scrollAmount = 100
  colorScrollRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  })
}
</script>

<template>
  <div
    class="panel-diseno"
    @dragenter="onPanelDragEnter"
    @dragover.prevent
    @dragleave="onPanelDragLeave"
    @drop.prevent="onPanelDrop"
  >
    <!-- Drop overlay (at panel level to cover visible area only) -->
    <Transition name="drop-overlay">
      <div
        v-if="isDraggingOverContent && store.activeDisenoTab === 'imagenes'"
        class="panel-diseno__drop-overlay"
      >
        <div class="panel-diseno__drop-zone">
          <div class="panel-diseno__drop-icon">
            <img
              src="/personaliza-icons/icon/image-add.svg"
              alt="Upload"
              width="43"
              height="43"
            >
          </div>
          <p class="panel-diseno__drop-text">Suelta tus archivos aquí</p>
          <p class="panel-diseno__drop-hint">
            <span class="panel-diseno__drop-formats">PNG, JPEG, GIF </span>
            <span class="panel-diseno__drop-size">hasta {{ MAX_IMAGE_SIZE_MB }}MB</span>
          </p>
        </div>
      </div>
    </Transition>

    <!-- Tabs -->
    <div class="panel-diseno__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'panel-diseno__tab',
          { 'panel-diseno__tab--active': store.activeDisenoTab === tab.id }
        ]"
        @click="store.setActiveDisenoTab(tab.id)"
      >
        {{ tab.label }}
        <!-- Warning badge for imagenes tab when cells are empty -->
        <span
          v-if="tab.id === 'imagenes' && store.emptyCellCount > 0"
          class="panel-diseno__tab-warning"
        >!</span>
      </button>
    </div>

    <!-- Tab: Diseño -->
    <div v-if="store.activeDisenoTab === 'diseno'" class="panel-diseno__content">
      <!-- Format selector -->
      <div class="panel-diseno__section">
        <h3 class="panel-diseno__title">Formato</h3>
        <div class="panel-diseno__styles">
          <button
            v-for="format in formatOptions"
            :key="format.id"
            :class="[
              'panel-diseno__style-btn',
              { 'panel-diseno__style-btn--active': store.format === format.id }
            ]"
            @click="store.setFormat(format.id)"
          >
            {{ format.label }}
          </button>
        </div>
      </div>

      <!-- Image count selector -->
      <div class="panel-diseno__section">
        <h3 class="panel-diseno__title">Número de imágenes</h3>
        <div class="panel-diseno__image-counts">
          <button
            v-for="count in availableImageCounts"
            :key="count"
            :class="[
              'panel-diseno__count-btn',
              { 'panel-diseno__count-btn--active': store.imageCount === count }
            ]"
            @click="store.setImageCount(count as MomentosImageCount)"
          >
            {{ count }}
          </button>
        </div>
      </div>

      <!-- Separator -->
      <div class="panel-diseno__separator" />

      <!-- Upload button - opens images tab -->
      <div class="panel-diseno__section">
        <button
          class="panel-diseno__change-btn"
          @click="store.setActiveDisenoTab('imagenes')"
        >
          Cargar Archivos
          <svg width="20" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z" fill="currentColor"/>
            <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Separator -->
      <div class="panel-diseno__separator" />

      <!-- Margin selector -->
      <div class="panel-diseno__section">
        <label class="panel-diseno__label panel-diseno__label--with-icon">
          <svg class="panel-diseno__label-icon" width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.4583 3.39583L9.625 7.22917L5.79167 3.39583" fill="currentColor" fill-opacity="0.2"/>
            <path d="M13.4583 17.7708L9.625 13.9375L5.79167 17.7708" fill="currentColor" fill-opacity="0.2"/>
            <path d="M1 10.5833H18.25M9.625 1V7.22917M9.625 7.22917L13.4583 3.39583M9.625 7.22917L5.79167 3.39583M9.625 20.1667V13.9375M9.625 13.9375L13.4583 17.7708M9.625 13.9375L5.79167 17.7708" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Margen
        </label>
        <div class="panel-diseno__margin-buttons">
          <button
            :class="[
              'panel-diseno__margin-btn',
              { 'panel-diseno__margin-btn--active': store.hasMargin }
            ]"
            @click="store.setHasMargin(true)"
          >
            Con margen
          </button>
          <button
            :class="[
              'panel-diseno__margin-btn',
              { 'panel-diseno__margin-btn--active': !store.hasMargin }
            ]"
            @click="store.setHasMargin(false)"
          >
            Sin margen
          </button>
        </div>
      </div>

      <!-- Margin color (only if margin is enabled) -->
      <div v-if="store.hasMargin" class="panel-diseno__section panel-diseno__section--pr0">
        <div class="panel-diseno__color-header">
          <label class="panel-diseno__label">Color del fondo</label>
          <div class="panel-diseno__color-nav">
            <button
              class="panel-diseno__nav-btn"
              aria-label="Scroll left"
              @click="scrollColors('left')"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              class="panel-diseno__nav-btn"
              aria-label="Scroll right"
              @click="scrollColors('right')"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div ref="colorScrollRef" class="panel-diseno__colors-scroll">
          <div class="panel-diseno__colors">
            <button
              v-for="color in MARGIN_COLORS"
              :key="color.id"
              :class="[
                'panel-diseno__color-btn',
                { 'panel-diseno__color-btn--active': store.marginColor === color.hex }
              ]"
              :style="{ backgroundColor: color.hex }"
              :aria-label="color.name"
              :title="color.name"
              @click="store.setMarginColor(color.hex)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Imágenes -->
    <div
      v-if="store.activeDisenoTab === 'imagenes'"
      class="panel-diseno__content"
    >
      <!-- Upload zone (only show if no images uploaded) -->
      <div v-if="store.uploadedImages.length === 0" class="panel-diseno__upload-section">
        <div
          class="panel-diseno__upload-zone"
          :class="{ 'panel-diseno__upload-zone--dragging': isDragging }"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @click="handleFileSelect"
        >
          <div class="panel-diseno__upload-icon">
            <img
              src="/personaliza-icons/icon/image-add.svg"
              alt="Upload"
              width="43"
              height="43"
            >
          </div>
          <p class="panel-diseno__upload-text">
            <span class="panel-diseno__upload-link">Carga</span> o arrastra archivos aquí
          </p>
          <p class="panel-diseno__upload-hint">
            <span class="panel-diseno__upload-formats">PNG, JPEG, GIF </span>
            <span class="panel-diseno__upload-size">hasta {{ MAX_IMAGE_SIZE_MB }}MB</span>
          </p>
        </div>
      </div>

      <!-- Upload button (when images exist) -->
      <div v-else class="panel-diseno__upload-section panel-diseno__upload-section--compact">
        <button
          class="panel-diseno__upload-btn"
          @click="handleFileSelect"
        >
          <span>Cargar archivos</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.66699 13.3333L10.0003 10M10.0003 10L13.3337 13.3333M10.0003 10V17.5M16.667 13.9524C17.6849 13.1117 18.3337 11.8399 18.3337 10.4167C18.3337 7.88536 16.2816 5.83333 13.7503 5.83333C13.5682 5.83333 13.3979 5.73833 13.3054 5.58145C12.2187 3.73736 10.2124 2.5 7.91699 2.5C4.46521 2.5 1.66699 5.29822 1.66699 8.75C1.66699 10.4718 2.36372 12.0309 3.48945 13.1613" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Separator -->
      <div class="panel-diseno__separator" />

      <!-- Image library -->
      <div ref="librarySectionRef" class="panel-diseno__section">
        <div class="panel-diseno__library-header">
          <h3 class="panel-diseno__title">
            <svg width="20" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z" fill="currentColor"/>
              <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Imágenes disponibles
          </h3>
          <span class="panel-diseno__count">{{ store.uploadedImages.length }}</span>
        </div>

        <!-- Select image indicator -->
        <div v-if="showSelectImageIndicator && store.uploadedImages.length > 0" class="panel-diseno__select-hint">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Selecciona una imagen para el espacio vacío</span>
        </div>

        <div v-if="store.uploadedImages.length === 0" class="panel-diseno__empty">
          <p>No hay imágenes subidas, sube imágenes para empezar a crear tu collage.</p>
        </div>

        <div v-else class="panel-diseno__library-grid">
          <div
            v-for="img in store.uploadedImages"
            :key="img.id"
            :class="[
              'panel-diseno__library-item',
              { 'panel-diseno__library-item--selectable': store.selectedCellId && store.getCellById(store.selectedCellId)?.imageId === null }
            ]"
            draggable="true"
            @dragstart="handleImageDragStart($event, img.id)"
            @click="handleImageClick(img.id)"
          >
            <img
              :src="img.lowResUrl"
              :alt="`Imagen ${img.id}`"
              class="panel-diseno__library-image"
            >
            <div v-if="img.isUploading" class="panel-diseno__library-loading">
              <div class="panel-diseno__library-progress" :style="{ width: img.uploadProgress + '%' }" />
            </div>
            <!-- Magnifying glass button -->
            <button
              class="panel-diseno__library-zoom"
              aria-label="Ver imagen en grande"
              @click.stop="openLightbox(img.highResUrl || img.mediumResUrl)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 13L10.1 10.1M11.6667 6.33333C11.6667 9.27885 9.27885 11.6667 6.33333 11.6667C3.38781 11.6667 1 9.27885 1 6.33333C1 3.38781 3.38781 1 6.33333 1C9.27885 1 11.6667 3.38781 11.6667 6.33333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              class="panel-diseno__library-delete"
              aria-label="Eliminar imagen"
              @click.stop="handleRemoveImage(img.id)"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif"
      multiple
      class="panel-diseno__file-input"
      @change="handleFileChange"
    >

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div
          v-if="isLightboxOpen"
          class="panel-diseno__lightbox"
          @click="closeLightbox"
        >
          <button
            class="panel-diseno__lightbox-close"
            aria-label="Cerrar"
            @click="closeLightbox"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <img
            :src="lightboxImage!"
            alt="Imagen ampliada"
            class="panel-diseno__lightbox-image"
            @click.stop
          >
        </div>
      </Transition>
    </Teleport>

    <!-- Autofill Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAutofillModal"
          class="panel-diseno__modal-overlay"
          @click="handleAutofillCancel"
        >
          <div class="panel-diseno__modal" @click.stop>
            <div class="panel-diseno__modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 8L12 4M12 4L8 8M12 4L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="panel-diseno__modal-title">Rellenar collage automáticamente</h3>
            <p class="panel-diseno__modal-text">
              Has subido {{ pendingAutofillImages.length }} imágenes. ¿Quieres rellenar automáticamente los espacios vacíos del collage?
            </p>
            <div class="panel-diseno__modal-actions">
              <button
                class="panel-diseno__modal-btn panel-diseno__modal-btn--secondary"
                @click="handleAutofillCancel"
              >
                No, gracias
              </button>
              <button
                class="panel-diseno__modal-btn panel-diseno__modal-btn--primary"
                @click="handleAutofillConfirm"
              >
                Sí, rellenar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.panel-diseno {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  &__tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    margin: 0 20px;
  }

  &__tab {
    @include button-reset;
    flex: 1;
    padding: 16px 0;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #717680;
    position: relative;
    transition: color $transition-fast;

    &--active {
      color: #252b37;
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: $color-brand;
      }
    }

    @include hover {
      color: $color-brand;
    }
  }

  &__tab-warning {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: 4px;
    background: #dc2626;
    color: white;
    font-size: 10px;
    font-weight: $font-weight-bold;
    border-radius: 50%;
    vertical-align: middle;
  }

  &__content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 20px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;

    @include mobile {
      padding-top: 16px;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-inline: 20px;

    &--pr0 {
      padding-right: 0;
    }
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

  &__label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #414651;

    &--with-icon {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  &__label-icon {
    color: $color-brand;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }

  // Format style buttons
  &__styles {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__style-btn {
    @include button-reset;
    @include flex-center;
    flex: 1;
    min-height: 40px;
    padding: 8px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    background: #f5f5f5;
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;

    &--active {
      background: $color-brand-light;
      color: $color-brand;
      border-right: 1px solid #dedede;
      border-left: 1px solid #dedede;

      &:last-child {
        border-right: none;
      }

      &:first-child {
        border-left: none;
      }
    }

    &:last-child {
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }

    &:first-child {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    @include hover {
      background: #ebebeb;

      &.panel-diseno__style-btn--active {
        background: $color-brand-light;
      }
    }
  }

  // Image count buttons
  &__image-counts {
    display: flex;
    gap: 8px;
  }

  &__count-btn {
    @include button-reset;
    @include flex-center;
    min-width: 48px;
    min-height: 40px;
    padding: 8px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    background: #f5f5f5;
    color: #414651;
    border-radius: 8px;
    transition: background-color $transition-fast, color $transition-fast;

    &--active {
      background: $color-brand-light;
      color: $color-brand;
      border: 1px solid $color-brand;
    }

    @include hover {
      background: #ebebeb;

      &.panel-diseno__count-btn--active {
        background: $color-brand-light;
      }
    }
  }

  // Change/Upload button
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color $transition-fast;

    svg {
      width: 18px;
      height: 18px;
    }

    @include hover {
      background: $color-brand-light;
    }
  }

  // Margin buttons
  &__margin-buttons {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__margin-btn {
    @include button-reset;
    @include flex-center;
    flex: 1;
    min-height: 40px;
    padding: 8px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    background: #f5f5f5;
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;
    border-right: 1px solid #d5d7da;

    &:last-child {
      border-right: none;
    }

    &--active {
      background: $color-brand-light;
      color: $color-brand;
      border-right-color: $color-border;
    }

    @include hover {
      background: #ebebeb;

      &.panel-diseno__margin-btn--active {
        background: $color-brand-light;
      }
    }
  }

  // Color picker
  &__color-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 20px;
  }

  &__color-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fafafa;
    border-radius: 5px;
    padding: 4px 5px;
  }

  &__nav-btn {
    @include button-reset;
    @include flex-center;
    width: 14px;
    height: 14px;
    cursor: pointer;

    svg {
      display: block;
      stroke: $color-brand;
    }

    @include hover {
      opacity: 0.7;
    }
  }

  &__colors-scroll {
    overflow-x: auto;
    overflow-y: visible;
    padding: 8px 0;
    margin: -8px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__colors {
    display: flex;
    gap: 14px;
    padding-left: 6px;

    &::after {
      content: '';
      min-width: 20px;
      flex-shrink: 0;
    }
  }

  &__color-btn {
    @include button-reset;
    @include flex-center;
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 100px;
    border: 1px solid $color-border;
    transition: box-shadow $transition-fast;
    position: relative;
    flex-shrink: 0;

    @include hover {
      opacity: 0.9;
    }

    &--active {
      box-shadow: 0 0 0 3px #ffffff, 0 0 0 5.5px #000000;
    }
  }

  // Drop overlay (shown when dragging files over content)
  // Positioned at panel level to cover only visible area
  &__drop-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.97);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  &__drop-zone {
    width: 100%;
    height: 100%;
    background: $color-brand-light;
    border: 2px dashed $color-brand;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  &__drop-icon {
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

  &__drop-text {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    color: $color-brand;
    margin: 0;
    text-align: center;
  }

  &__drop-hint {
    font-family: $font-primary;
    font-weight: 400;
    color: #717680;
    margin: 0;
    font-size: 12px;
  }

  &__drop-formats {
    font-weight: 500;
  }

  // Upload section
  &__upload-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-inline: 20px;
  }

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
    min-height: 140px;
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
    font-size: 14px;
    font-weight: 500;
    color: #2f3038;
    margin: 0;
    text-align: center;
  }

  &__upload-link {
    color: $color-brand;
    font-weight: 500;
  }

  &__upload-hint {
    font-family: 'Lexend', sans-serif;
    font-weight: 400;
    color: #717680;
    margin: 0;
    font-size: 12px;
  }

  &__upload-formats {
    font-weight: 500;
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
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: white;
    cursor: pointer;
    transition: background-color $transition-fast;

    @include hover {
      background: #1a1f28;
    }
  }

  &__file-input {
    display: none;
  }

  // Auto-fill button
  &__autofill-btn {
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
      background: $color-brand-light;
    }
  }

  // Image library
  &__library-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__count {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: $color-brand;
  }

  &__empty {
    text-align: center;
    padding: 24px;
    color: #717680;

    p {
      margin: 0;
      font-family: $font-primary;
      font-size: 14px;
    }
  }

  &__empty-hint {
    margin-top: 8px !important;
    font-size: 12px !important;
    opacity: 0.7;
  }

  &__library-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  &__library-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    cursor: grab;
    background: #f5f5f5;
    transition: outline $transition-fast, box-shadow $transition-fast;

    &:active {
      cursor: grabbing;
    }

    // When a cell is selected and waiting for an image
    &--selectable {
      cursor: pointer;
      outline: 2px solid transparent;

      @include hover {
        outline: 2px solid $color-brand;
        box-shadow: 0 2px 8px rgba($color-brand, 0.25);
      }
    }
  }

  &__library-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__library-loading {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(0, 0, 0, 0.2);
  }

  &__library-progress {
    height: 100%;
    background: $color-brand;
    transition: width 0.3s ease;
  }

  &__library-delete {
    @include button-reset;
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #414651;
    cursor: pointer;
    opacity: 0;
    transition: opacity $transition-fast, background-color $transition-fast;

    .panel-diseno__library-item:hover & {
      opacity: 1;
    }

    @include hover {
      background: #f5f5f5;
      color: #181d27;
    }
  }

  // Select image indicator (info blue style)
  &__select-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #eff6ff; // Info blue light
    border: 1px solid #3b82f6; // Info blue
    border-radius: 8px;
    color: #1e40af; // Info blue dark text
    font-family: $font-primary;
    font-size: 13px;
    font-weight: $font-weight-medium;
    animation: pulse-hint 2s ease-in-out infinite;

    svg {
      flex-shrink: 0;
      color: #3b82f6; // Info blue for icon
    }
  }

  @keyframes pulse-hint {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  // Magnifying glass zoom button
  &__library-zoom {
    @include button-reset;
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #414651;
    cursor: pointer;
    opacity: 0;
    transition: opacity $transition-fast, background-color $transition-fast;

    .panel-diseno__library-item:hover & {
      opacity: 1;
    }

    @include hover {
      background: $color-brand-light;
      color: $color-brand;
    }
  }

  // Lightbox
  &__lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: $z-modal + 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    cursor: zoom-out;
  }

  &__lightbox-close {
    @include button-reset;
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: background-color $transition-fast;

    @include hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &__lightbox-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
    cursor: default;
  }

  // Modal
  &__modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: $z-modal;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  &__modal {
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  &__modal-icon {
    width: 48px;
    height: 48px;
    background: $color-brand-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: $color-brand;
  }

  &__modal-title {
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-semibold;
    color: #181d27;
    margin: 0 0 8px;
  }

  &__modal-text {
    font-family: $font-primary;
    font-size: 14px;
    color: #535862;
    margin: 0 0 24px;
    line-height: 1.5;
  }

  &__modal-actions {
    display: flex;
    gap: 12px;
  }

  &__modal-btn {
    @include button-reset;
    flex: 1;
    padding: 12px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color $transition-fast;

    &--secondary {
      background: #f5f5f5;
      color: #414651;

      @include hover {
        background: #ebebeb;
      }
    }

    &--primary {
      background: $color-brand;
      color: white;

      @include hover {
        background: darken($color-brand, 8%);
      }
    }
  }
}

// Lightbox transition
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

// Modal transition
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .panel-diseno__modal {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .panel-diseno__modal {
    transform: scale(0.95);
  }
}

// Drop overlay transition
.drop-overlay-enter-active,
.drop-overlay-leave-active {
  transition: opacity 0.2s ease;

  .panel-diseno__drop-zone {
    transition: transform 0.2s ease;
  }
}

.drop-overlay-enter-from,
.drop-overlay-leave-to {
  opacity: 0;

  .panel-diseno__drop-zone {
    transform: scale(0.95);
  }
}
</style>
