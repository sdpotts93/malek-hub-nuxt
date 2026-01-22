<script setup lang="ts">
import type { MomentosFormat, MomentosImageCount, DisenoTabType } from '~/stores/momentos'
import { IMAGE_COUNTS, MARGIN_COLORS, MAX_IMAGES, MAX_IMAGE_SIZE_MB, generateId } from '~/stores/momentos'

const store = useMomentosStore()

// Emit event when image is assigned to cell (for mobile to close bottom sheet)
const emit = defineEmits<{
  (e: 'image-assigned'): void
}>()

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

// Check if we should show the "select image" indicator (for empty OR filled cells)
const showSelectImageIndicator = computed(() => {
  if (!store.selectedCellId) return false
  const cell = store.getCellById(store.selectedCellId)
  return cell !== undefined
})

// Check if the selected cell already has an image (to show "cambiar" vs "agregar")
const selectedCellHasImage = computed(() => {
  if (!store.selectedCellId) return false
  const cell = store.getCellById(store.selectedCellId)
  return cell?.imageId !== null && cell?.imageId !== undefined
})

// Check if any images have size warnings
const hasImageWarnings = computed(() => {
  for (const [, warning] of store.imageWarnings) {
    if (warning) return true
  }
  return false
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

// Preserve selected cell ID across file dialog (in case store selection gets cleared)
const savedSelectedCellId = ref<string | null>(null)

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
  // Save the selected cell ID before opening file dialog (it might get cleared)
  savedSelectedCellId.value = store.selectedCellId
  fileInput.value?.click()
}

// Handle "Cargar Archivos" button - switch to images tab and open file selector
function handleCargarArchivos() {
  store.setActiveDisenoTab('imagenes')
  // Use nextTick to ensure tab switch happens first
  nextTick(() => {
    handleFileSelect()
  })
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) {
    input.value = ''
    savedSelectedCellId.value = null
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

  if (uploadedIds.length === 0) {
    savedSelectedCellId.value = null
    return
  }

  // Use saved cell ID (store selection might have been cleared)
  const targetCellId = savedSelectedCellId.value

  // Single image: auto-populate selected cell if empty
  if (uploadedIds.length === 1) {
    const imageId = uploadedIds[0]
    if (imageId && targetCellId) {
      const selectedCell = store.getCellById(targetCellId)
      if (selectedCell && !selectedCell.imageId) {
        store.setImageToCell(targetCellId, imageId)
        store.selectCell(null)
      }
    }
    savedSelectedCellId.value = null
    return
  }

  // Multiple images: show autofill modal only if there are empty cells
  if (store.emptyCellCount > 0) {
    pendingAutofillImages.value = uploadedIds
    // Determine start index based on selected cell
    if (targetCellId) {
      const cellIndex = store.canvasCells.findIndex(c => c.id === targetCellId)
      autofillStartIndex.value = cellIndex >= 0 ? cellIndex : 0
    } else {
      autofillStartIndex.value = 0
    }
    showAutofillModal.value = true
  }
  savedSelectedCellId.value = null
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

  // Queue S3 upload (throttled to prevent overwhelming the endpoint)
  queueUpload(id, file, blobUrl)

  return id
}

// Upload queue to prevent overwhelming the Lambda endpoint
const uploadQueue: Array<{ id: string; file: File; blobUrl: string }> = []
const isProcessingQueue = ref(false)
const MAX_CONCURRENT_UPLOADS = 2 // Limit concurrent image uploads (each has 3 requests)
let activeUploads = 0

// Add to upload queue instead of uploading immediately
function queueUpload(id: string, file: File, blobUrl: string) {
  uploadQueue.push({ id, file, blobUrl })
  processUploadQueue()
}

// Process upload queue with concurrency limit
async function processUploadQueue() {
  if (isProcessingQueue.value && activeUploads >= MAX_CONCURRENT_UPLOADS) return

  isProcessingQueue.value = true

  while (uploadQueue.length > 0 && activeUploads < MAX_CONCURRENT_UPLOADS) {
    const item = uploadQueue.shift()
    if (!item) continue

    activeUploads++
    uploadToS3WithRetry(item.id, item.file, item.blobUrl)
      .finally(() => {
        activeUploads--
        // Process next item when done
        if (uploadQueue.length > 0) {
          processUploadQueue()
        } else if (activeUploads === 0) {
          isProcessingQueue.value = false
        }
      })
  }
}

// Handle S3 upload with retry logic
async function uploadToS3WithRetry(id: string, file: File, blobUrl: string, retries = 2) {
  try {
    const [lowResBlob, mediumResBlob] = await Promise.all([
      resizeImage(file, 200),
      resizeImage(file, 2000),
    ])

    // Upload sequentially to avoid overwhelming the endpoint
    const lowResResult = await uploadDesignImage(lowResBlob, 'momentos-low', 'momentos-malek')
    const mediumResResult = await uploadDesignImage(mediumResBlob, 'momentos-med', 'momentos-malek')
    const highResResult = await uploadDesignImage(file, 'momentos-high', 'momentos-malek')

    // Store S3 URLs for persistence, but KEEP blob URLs for display
    // This ensures thumbnail generation works reliably (blob URLs don't need CORS)
    // Blob URLs will be cleaned up when the page unloads or image is deleted
    store.updateUploadedImage(id, {
      s3LowResUrl: lowResResult.url,
      s3MediumResUrl: mediumResResult.url,
      s3HighResUrl: highResResult.url,
      // DON'T replace display URLs - keep using blob URLs for the canvas
      // lowResUrl, mediumResUrl, highResUrl stay as blob URLs
      uploadProgress: 100,
      isUploading: false,
    })

    // DON'T revoke blob URL - we're still using it for display
    // It will be cleaned up when the image is deleted or page unloads
  } catch (error) {
    if (retries > 0) {
      console.warn(`[PanelDiseno] Upload failed, retrying... (${retries} left)`)
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
      return uploadToS3WithRetry(id, file, blobUrl, retries - 1)
    }
    console.error('[PanelDiseno] Upload failed after retries:', error)
    // Keep blob URL on failure - image can still be used locally
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

async function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files) {
    // Process dropped files through the same upload flow as file input
    for (const file of Array.from(files)) {
      await uploadFileAndGetId(file)
    }
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

  // Multiple images: show autofill modal only if there are empty cells
  if (store.emptyCellCount > 0) {
    pendingAutofillImages.value = uploadedIds
    if (store.selectedCellId) {
      const cellIndex = store.canvasCells.findIndex(c => c.id === store.selectedCellId)
      autofillStartIndex.value = cellIndex >= 0 ? cellIndex : 0
    } else {
      autofillStartIndex.value = 0
    }
    showAutofillModal.value = true
  }
}

// Custom drag preview element
const dragPreviewRef = ref<HTMLElement | null>(null)
const dragPreviewImage = ref<string | null>(null)

// Pre-create the empty drag image (must be in DOM and loaded)
const emptyDragImg = ref<HTMLImageElement | null>(null)
onMounted(() => {
  const img = new Image(1, 1)
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  img.style.position = 'absolute'
  img.style.top = '-9999px'
  img.style.left = '-9999px'
  document.body.appendChild(img)
  emptyDragImg.value = img
})

onUnmounted(() => {
  if (emptyDragImg.value && emptyDragImg.value.parentNode) {
    emptyDragImg.value.parentNode.removeChild(emptyDragImg.value)
  }
})

// Handle drag start for image library
function handleImageDragStart(e: DragEvent, imageId: string) {
  e.dataTransfer?.setData('imageId', imageId)
  store.setDraggingImageId(imageId)

  // Get the image URL for the preview
  const image = store.uploadedImages.find(img => img.id === imageId)
  if (image) {
    dragPreviewImage.value = image.lowResUrl
  }

  // Hide the default drag ghost using pre-loaded image
  if (emptyDragImg.value && e.dataTransfer) {
    e.dataTransfer.setDragImage(emptyDragImg.value, 0, 0)
  }

  // Position the custom preview at cursor
  nextTick(() => {
    updateDragPreviewPosition(e.clientX, e.clientY)
  })

  // Add global drag listeners
  document.addEventListener('drag', onGlobalDrag)
  document.addEventListener('dragend', onGlobalDragEnd)
}

// Update preview position during drag
function onGlobalDrag(e: DragEvent) {
  // e.clientX/Y can be 0 at the end of drag
  if (e.clientX !== 0 || e.clientY !== 0) {
    updateDragPreviewPosition(e.clientX, e.clientY)
  }
}

// Clean up on drag end
function onGlobalDragEnd() {
  document.removeEventListener('drag', onGlobalDrag)
  document.removeEventListener('dragend', onGlobalDragEnd)
  dragPreviewImage.value = null
}

// Position the drag preview element
function updateDragPreviewPosition(x: number, y: number) {
  if (dragPreviewRef.value) {
    dragPreviewRef.value.style.left = `${x}px`
    dragPreviewRef.value.style.top = `${y}px`
  }
}

// Handle drag end for image library
function handleImageDragEnd() {
  store.setDraggingImageId(null)
  dragPreviewImage.value = null
}

// Remove image from library
function handleRemoveImage(imageId: string) {
  store.removeUploadedImage(imageId)
}

// Handle clicking on library image to assign to selected cell or next empty cell
function handleImageClick(imageId: string) {
  // Check if there's a selected cell waiting for an image
  if (store.selectedCellId) {
    const selectedCell = store.getCellById(store.selectedCellId)
    // Assign image to the cell (whether empty or replacing existing)
    if (selectedCell) {
      store.setImageToCell(store.selectedCellId, imageId)
      store.selectCell(null) // Deselect after assignment
      emit('image-assigned') // Notify parent to close mobile sheet
    }
  } else {
    // No cell selected - find the first empty cell and assign the image
    // Don't close the mobile sheet so user can keep adding images
    const emptyCell = store.canvasCells.find(cell => cell.imageId === null)
    if (emptyCell) {
      store.setImageToCell(emptyCell.id, imageId)
    }
  }
}

// Tooltip state for warning badges (teleported to body to escape overflow)
const tooltipState = ref<{
  visible: boolean
  text: string
  position: { top: number; left: number }
}>({ visible: false, text: '', position: { top: 0, left: 0 } })

function showTooltip(event: MouseEvent, text: string) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  tooltipState.value = {
    visible: true,
    text,
    position: {
      top: rect.top + rect.height / 2,
      left: rect.right + 8
    }
  }
}

function hideTooltip() {
  tooltipState.value.visible = false
}

// Count how many times each image is used in the canvas
const imageUsageCount = computed(() => {
  const counts = new Map<string, number>()
  for (const cell of store.canvasCells) {
    if (cell.imageId) {
      counts.set(cell.imageId, (counts.get(cell.imageId) || 0) + 1)
    }
  }
  return counts
})

// Get usage count for a specific image
function getImageUsageCount(imageId: string): number {
  return imageUsageCount.value.get(imageId) || 0
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

// Rellenar (Fill) modal state
const showRellenarModal = ref(false)
const rellenarFilter = ref<'all' | 'used' | 'unused'>('all')
const rellenarSelectedImages = ref<string[]>([])

// Computed: filtered images for Rellenar modal
const rellenarFilteredImages = computed(() => {
  if (rellenarFilter.value === 'all') {
    return store.uploadedImages
  } else if (rellenarFilter.value === 'used') {
    return store.uploadedImages.filter(img => getImageUsageCount(img.id) > 0)
  } else {
    return store.uploadedImages.filter(img => getImageUsageCount(img.id) === 0)
  }
})

// Open Rellenar modal
function openRellenarModal() {
  rellenarSelectedImages.value = []
  rellenarFilter.value = 'all'
  showRellenarModal.value = true
}

// Close Rellenar modal
function closeRellenarModal() {
  showRellenarModal.value = false
  rellenarSelectedImages.value = []
}

// Toggle image selection in Rellenar modal (limited to empty cell count)
function toggleRellenarImage(imageId: string) {
  const index = rellenarSelectedImages.value.indexOf(imageId)
  if (index > -1) {
    rellenarSelectedImages.value.splice(index, 1)
  } else {
    // Only allow selection if we haven't reached the limit
    if (rellenarSelectedImages.value.length < store.emptyCellCount) {
      rellenarSelectedImages.value.push(imageId)
    }
  }
}

// Check if selection limit is reached
const isSelectionLimitReached = computed(() => {
  return rellenarSelectedImages.value.length >= store.emptyCellCount
})

// Get the projected usage count (current + 1 if selected)
function getProjectedUsageCount(imageId: string): number {
  const currentCount = getImageUsageCount(imageId)
  const isSelected = rellenarSelectedImages.value.includes(imageId)
  return isSelected ? currentCount + 1 : currentCount
}

// Select all visible images in Rellenar modal (up to empty cell limit)
function selectAllRellenarImages() {
  const maxSelections = store.emptyCellCount
  rellenarSelectedImages.value = rellenarFilteredImages.value
    .slice(0, maxSelections)
    .map(img => img.id)
}

// Rellenar modal tooltip state (separate from main tooltip)
const rellenarTooltipState = ref<{
  visible: boolean
  text: string
  position: { top: number; left: number }
}>({ visible: false, text: '', position: { top: 0, left: 0 } })

function showRellenarTooltip(event: MouseEvent, text: string) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  rellenarTooltipState.value = {
    visible: true,
    text,
    position: {
      top: rect.top + rect.height / 2,
      left: rect.right + 8
    }
  }
}

function hideRellenarTooltip() {
  rellenarTooltipState.value.visible = false
}

// Confirm Rellenar and fill empty cells
function confirmRellenar() {
  const selectedIds = rellenarSelectedImages.value
  let imageIndex = 0

  // Fill empty cells in order with selected images
  for (const cell of store.canvasCells) {
    if (imageIndex >= selectedIds.length) break
    const imageId = selectedIds[imageIndex]
    if (cell && imageId && !cell.imageId) {
      store.setImageToCell(cell.id, imageId)
      imageIndex++
    }
  }

  closeRellenarModal()
  emit('image-assigned') // Close mobile slider after autofill
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
        <h3 class="panel-diseno__title panel-diseno__title--always-visible">Formato</h3>
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
        <h3 class="panel-diseno__title panel-diseno__title--always-visible">Número de imágenes</h3>
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

      <!-- Upload button - opens images tab and file selector -->
      <div class="panel-diseno__section">
        <button
          class="panel-diseno__change-btn"
          @click="handleCargarArchivos"
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

      <!-- Margin color (always available) -->
      <div class="panel-diseno__section panel-diseno__section--pr0">
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
      <!-- Drop overlay (inside content area only) -->
      <Transition name="drop-overlay">
        <div
          v-if="isDraggingOverContent"
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
          <h3 class="panel-diseno__title panel-diseno__title--always-visible">
            <svg width="20" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z" fill="currentColor"/>
              <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Imágenes
          </h3>
          <div class="panel-diseno__library-actions">
            <span class="panel-diseno__count">{{ store.uploadedImages.length }}</span>
            <button
              v-if="store.uploadedImages.length > 0 && store.emptyCellCount > 0"
              class="panel-diseno__change-btn panel-diseno__change-btn--small"
              @click="openRellenarModal"
            >
              Rellenar
            </button>
          </div>
        </div>

        <!-- Select image indicator -->
        <div v-if="showSelectImageIndicator && store.uploadedImages.length > 0" class="panel-diseno__select-hint">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ selectedCellHasImage ? 'Selecciona una imagen para cambiar' : 'Selecciona una imagen para agregar' }}</span>
        </div>

        <!-- Warning banner for small images -->
        <div v-if="hasImageWarnings" class="panel-diseno__size-warning">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>
            Algunas imágenes son pequeñas para el tamaño seleccionado.
            Recomendado: {{ store.minimumImagePixels.width }}x{{ store.minimumImagePixels.height }}px
          </span>
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
              { 'panel-diseno__library-item--selectable': store.selectedCellId !== null || store.emptyCellCount > 0 },
              { 'panel-diseno__library-item--dragging': store.draggingImageId === img.id },
              { 'panel-diseno__library-item--over-canvas': store.draggingImageId === img.id && store.isDraggingOverCanvas },
              { 'panel-diseno__library-item--warning': store.imageWarnings.get(img.id) },
              { 'panel-diseno__library-item--in-canvas': getImageUsageCount(img.id) > 0 }
            ]"
            draggable="true"
            @dragstart="handleImageDragStart($event, img.id)"
            @dragend="handleImageDragEnd"
            @click="handleImageClick(img.id)"
          >
            <img
              :src="img.lowResUrl"
              :alt="`Imagen ${img.id}`"
              class="panel-diseno__library-image"
            >
            <!-- Overlay for images already in canvas -->
            <div
              v-if="getImageUsageCount(img.id) > 0 && !store.selectedCellId"
              class="panel-diseno__library-overlay"
            />
            <div v-if="img.isUploading" class="panel-diseno__library-loading">
              <div class="panel-diseno__library-progress" :style="{ width: img.uploadProgress + '%' }" />
            </div>
            <!-- Warning badge for small images -->
            <div
              v-if="store.imageWarnings.get(img.id)"
              class="panel-diseno__library-warning"
              @click.stop
              @mouseenter="showTooltip($event, store.imageWarnings.get(img.id) || '')"
              @mouseleave="hideTooltip"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 5V7.5M7 9.5H7.005M6.11 2.182L1.262 10.5C1.18148 10.6391 1.13893 10.7962 1.13854 10.9563C1.13815 11.1164 1.17994 11.2738 1.25979 11.4132C1.33964 11.5527 1.45487 11.6694 1.59343 11.7511C1.732 11.8327 1.88905 11.8764 2.049 11.878H11.951C12.111 11.8764 12.268 11.8327 12.4066 11.7511C12.5451 11.6694 12.6604 11.5527 12.7402 11.4132C12.8201 11.2738 12.8619 11.1164 12.8615 10.9563C12.8611 10.7962 12.8185 10.6391 12.738 10.5L7.89 2.182C7.80777 2.0465 7.69168 1.9341 7.55335 1.85614C7.41501 1.77817 7.25892 1.73731 7.1 1.73731C6.94108 1.73731 6.78499 1.77817 6.64665 1.85614C6.50832 1.9341 6.39223 2.0465 6.31 2.182H6.11Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <!-- Usage count badge (shown when no cell selected and image is in canvas) -->
            <div
              v-if="getImageUsageCount(img.id) > 0 && !store.selectedCellId"
              class="panel-diseno__library-count"
            >
              {{ getImageUsageCount(img.id) }}
            </div>
            <!-- Drag indicator icon -->
            <div class="panel-diseno__library-drag-indicator">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="m12 22l-4.25-4.25l1.425-1.425L11 18.15V13H5.875L7.7 14.8l-1.45 1.45L2 12l4.225-4.225L7.65 9.2L5.85 11H11V5.85L9.175 7.675L7.75 6.25L12 2l4.25 4.25l-1.425 1.425L13 5.85V11h5.125L16.3 9.2l1.45-1.45L22 12l-4.25 4.25l-1.425-1.425L18.15 13H13v5.125l1.8-1.825l1.45 1.45z"/>
              </svg>
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
              Has subido {{ pendingAutofillImages.length }} imágenes y tienes {{ store.emptyCellCount }} {{ store.emptyCellCount === 1 ? 'espacio vacío' : 'espacios vacíos' }}. ¿Quieres rellenar automáticamente?
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

    <!-- Rellenar Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showRellenarModal"
          class="panel-diseno__modal-overlay"
          @click="closeRellenarModal"
        >
          <div class="panel-diseno__rellenar-modal" @click.stop>
            <!-- Header -->
            <div class="panel-diseno__rellenar-header">
              <h3 class="panel-diseno__rellenar-title">Seleccionar fotos</h3>
              <div class="panel-diseno__rellenar-header-actions">
                <button
                  class="panel-diseno__rellenar-skip"
                  @click="closeRellenarModal"
                >
                  Cancelar
                </button>
                <button
                  class="panel-diseno__rellenar-confirm"
                  :disabled="rellenarSelectedImages.length === 0"
                  @click="confirmRellenar"
                >
                  Rellenar
                </button>
              </div>
            </div>

            <!-- Filters -->
            <div class="panel-diseno__rellenar-filters">
              <div class="panel-diseno__rellenar-filter-dropdown">
                <select v-model="rellenarFilter" class="panel-diseno__rellenar-select">
                  <option value="all">Todas ({{ store.uploadedImages.length }})</option>
                  <option value="unused">Sin usar ({{ store.uploadedImages.filter(img => getImageUsageCount(img.id) === 0).length }})</option>
                  <option value="used">Usadas ({{ store.uploadedImages.filter(img => getImageUsageCount(img.id) > 0).length }})</option>
                </select>
              </div>
              <button
                class="panel-diseno__rellenar-select-all"
                @click="selectAllRellenarImages"
              >
                Seleccionar todo
              </button>
            </div>

            <!-- Image Grid -->
            <div class="panel-diseno__rellenar-grid-container">
              <div v-if="rellenarFilteredImages.length === 0" class="panel-diseno__rellenar-empty">
                <p>No hay imágenes que coincidan con el filtro seleccionado.</p>
              </div>
              <div v-else class="panel-diseno__rellenar-grid">
                <div
                  v-for="img in rellenarFilteredImages"
                  :key="img.id"
                  :class="[
                    'panel-diseno__rellenar-item',
                    { 'panel-diseno__rellenar-item--selected': rellenarSelectedImages.includes(img.id) },
                    { 'panel-diseno__rellenar-item--warning': store.imageWarnings.get(img.id) },
                    { 'panel-diseno__rellenar-item--disabled': isSelectionLimitReached && !rellenarSelectedImages.includes(img.id) }
                  ]"
                  @click="toggleRellenarImage(img.id)"
                >
                  <img
                    :src="img.lowResUrl"
                    :alt="`Imagen ${img.id}`"
                    class="panel-diseno__rellenar-image"
                  >
                  <!-- Warning badge (same style as imagenes tab) -->
                  <div
                    v-if="store.imageWarnings.get(img.id)"
                    class="panel-diseno__rellenar-warning"
                    @click.stop
                    @mouseenter="showRellenarTooltip($event, store.imageWarnings.get(img.id) || '')"
                    @mouseleave="hideRellenarTooltip"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 5V7.5M7 9.5H7.005M6.11 2.182L1.262 10.5C1.18148 10.6391 1.13893 10.7962 1.13854 10.9563C1.13815 11.1164 1.17994 11.2738 1.25979 11.4132C1.33964 11.5527 1.45487 11.6694 1.59343 11.7511C1.732 11.8327 1.88905 11.8764 2.049 11.878H11.951C12.111 11.8764 12.268 11.8327 12.4066 11.7511C12.5451 11.6694 12.6604 11.5527 12.7402 11.4132C12.8201 11.2738 12.8619 11.1164 12.8615 10.9563C12.8611 10.7962 12.8185 10.6391 12.738 10.5L7.89 2.182C7.80777 2.0465 7.69168 1.9341 7.55335 1.85614C7.41501 1.77817 7.25892 1.73731 7.1 1.73731C6.94108 1.73731 6.78499 1.77817 6.64665 1.85614C6.50832 1.9341 6.39223 2.0465 6.31 2.182H6.11Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <!-- Usage count badge (shows projected count when selected) -->
                  <div
                    v-if="getProjectedUsageCount(img.id) > 0"
                    :class="[
                      'panel-diseno__rellenar-usage',
                      { 'panel-diseno__rellenar-usage--selected': rellenarSelectedImages.includes(img.id) }
                    ]"
                  >
                    {{ getProjectedUsageCount(img.id) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="panel-diseno__rellenar-footer">
              <div class="panel-diseno__rellenar-status">
                <span class="panel-diseno__rellenar-count-badge">{{ rellenarSelectedImages.length }}</span>
                <span class="panel-diseno__rellenar-status-text">
                  {{ rellenarSelectedImages.length === 1 ? 'Foto seleccionada' : 'Fotos seleccionadas' }}
                </span>
                <span class="panel-diseno__rellenar-remaining">
                  {{ store.emptyCellCount - rellenarSelectedImages.length }} {{ (store.emptyCellCount - rellenarSelectedImages.length) === 1 ? 'faltante' : 'faltantes' }}
                </span>
              </div>
              <!-- Reserved slots for empty cells with selected thumbnails -->
              <div class="panel-diseno__rellenar-thumbs">
                <!-- Show all slots up to emptyCellCount -->
                <template v-for="index in store.emptyCellCount" :key="index">
                  <!-- Filled slot -->
                  <div
                    v-if="rellenarSelectedImages[index - 1]"
                    class="panel-diseno__rellenar-thumb"
                  >
                    <img
                      :src="store.uploadedImages.find(img => img.id === rellenarSelectedImages[index - 1])?.lowResUrl"
                      :alt="`Seleccionada ${index}`"
                    >
                    <!-- Warning badge on thumbnail -->
                    <div
                      v-if="rellenarSelectedImages[index - 1] && store.imageWarnings.get(rellenarSelectedImages[index - 1]!)"
                      class="panel-diseno__rellenar-thumb-warning"
                    >
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 5V7.5M7 9.5H7.005M6.11 2.182L1.262 10.5C1.18148 10.6391 1.13893 10.7962 1.13854 10.9563C1.13815 11.1164 1.17994 11.2738 1.25979 11.4132C1.33964 11.5527 1.45487 11.6694 1.59343 11.7511C1.732 11.8327 1.88905 11.8764 2.049 11.878H11.951C12.111 11.8764 12.268 11.8327 12.4066 11.7511C12.5451 11.6694 12.6604 11.5527 12.7402 11.4132C12.8201 11.2738 12.8619 11.1164 12.8615 10.9563C12.8611 10.7962 12.8185 10.6391 12.738 10.5L7.89 2.182C7.80777 2.0465 7.69168 1.9341 7.55335 1.85614C7.41501 1.77817 7.25892 1.73731 7.1 1.73731C6.94108 1.73731 6.78499 1.77817 6.64665 1.85614C6.50832 1.9341 6.39223 2.0465 6.31 2.182H6.11Z" stroke="#d97706" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <!-- Empty placeholder slot -->
                  <div
                    v-else
                    class="panel-diseno__rellenar-thumb panel-diseno__rellenar-thumb--empty"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Rellenar Modal Tooltip -->
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="rellenarTooltipState.visible"
          class="panel-diseno__tooltip"
          :style="{
            top: rellenarTooltipState.position.top + 'px',
            left: rellenarTooltipState.position.left + 'px'
          }"
        >
          {{ rellenarTooltipState.text }}
        </div>
      </Transition>
    </Teleport>

    <!-- Custom Drag Preview -->
    <Teleport to="body">
      <div
        v-if="dragPreviewImage"
        ref="dragPreviewRef"
        :class="[
          'panel-diseno__drag-preview',
          { 'panel-diseno__drag-preview--over-canvas': store.isDraggingOverCanvas }
        ]"
      >
        <img :src="dragPreviewImage" alt="Drag preview" class="panel-diseno__drag-preview-image">
        <div class="panel-diseno__drag-preview-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="m12 22l-4.25-4.25l1.425-1.425L11 18.15V13H5.875L7.7 14.8l-1.45 1.45L2 12l4.225-4.225L7.65 9.2L5.85 11H11V5.85L9.175 7.675L7.75 6.25L12 2l4.25 4.25l-1.425 1.425L13 5.85V11h5.125L16.3 9.2l1.45-1.45L22 12l-4.25 4.25l-1.425-1.425L18.15 13H13v5.125l1.8-1.825l1.45 1.45z"/>
          </svg>
        </div>
      </div>
    </Teleport>

    <!-- Teleported Tooltip for Warning Badges -->
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="tooltipState.visible"
          class="panel-diseno__tooltip"
          :style="{
            top: tooltipState.position.top + 'px',
            left: tooltipState.position.left + 'px'
          }"
        >
          {{ tooltipState.text }}
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
    font-weight: $font-weight-semibold;
    color: #717680;
    position: relative;
    transition: color $transition-fast;

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
    @include mobile {
      display: none;
    }

    &--always-visible {
      @include mobile {
        display: flex;
      }
    }
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

  // Format style buttons - segmented control style
  &__styles {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
    gap: 0;
  }

  &__style-btn {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 12px;
    font-family: $font-primary;
    font-size: 15px;
    font-weight: $font-weight-bold;
    color: #181d27;
    text-align: center;
    position: relative;

    &--active {
      background: #ffffff;
      border: 1px solid #d5d7da;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
      z-index: 1;
      border-radius: 8px;
    }
  }

  // Image count buttons
  // Image count buttons - segmented control style
  &__image-counts {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
    gap: 0;
  }

  &__count-btn {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 12px;
    font-family: $font-primary;
    font-size: 15px;
    font-weight: $font-weight-bold;
    color: #181d27;
    text-align: center;
    position: relative;

    &--active {
      background: #ffffff;
      border: 1px solid #d5d7da;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
      z-index: 1;
      border-radius: 8px;
    }
  }

  // Change/Upload button
  &__change-btn {
    @include button-reset;
    width: 100%;
    padding: 10px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #414651;
    background: #ffffff;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
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
      background: #f5f5f5;
    }
  }

  // Margin buttons - segmented control style
  &__margin-buttons {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
    gap: 0;
  }

  &__margin-btn {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 12px;
    font-family: $font-primary;
    font-size: 15px;
    font-weight: $font-weight-bold;
    color: #181d27;
    text-align: center;
    position: relative;

    &--active {
      background: #ffffff;
      border: 1px solid #d5d7da;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
      z-index: 1;
      border-radius: 8px;
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
    background: #ffffff;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #414651;
    cursor: pointer;
    transition: background-color $transition-fast;

    @include hover {
      background: #f5f5f5;
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

  // Size warning banner
  &__size-warning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: #fffbeb;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    color: #92400e;
    font-family: $font-primary;
    font-size: 12px;
    line-height: 1.4;

    svg {
      flex-shrink: 0;
      margin-top: 1px;
      color: #d97706;
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
    border: 1px solid #d5d7da;
    transition: outline $transition-fast, box-shadow $transition-fast, border-color $transition-fast;

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

    // When this item is being dragged
    &--dragging {
      opacity: 0.7;
    }

    // When dragging over canvas - show active state
    &--over-canvas {
      border-color: $color-brand;
      box-shadow: 0 4px 12px rgba($color-brand, 0.3);
      opacity: 1;
    }
  }

  // Drag indicator icon in bottom-right corner
  // Hidden by default - only visible on the drag ghost image
  &__library-drag-indicator {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888888;
    pointer-events: none;
    opacity: 0; // Hidden by default - only shown on drag ghost via JS
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
    z-index: 2;

    .panel-diseno__library-item:hover & {
      opacity: 1;
    }

    // Always visible on mobile (no hover state)
    @include mobile {
      opacity: 1;
    }

    @include hover {
      background: #f5f5f5;
      color: #181d27;
    }
  }

  // Warning badge for small images (tooltip is teleported to body to escape overflow)
  &__library-warning {
    position: absolute;
    bottom: 4px;
    left: 4px;
    width: 22px;
    height: 22px;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;
    z-index: 2;

    svg {
      width: 12px;
      height: 12px;
    }
  }

  // Warning state for library items with small images
  &__library-item--warning {
    border-color: #f59e0b;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 2px solid #f59e0b;
      border-radius: 7px;
      pointer-events: none;
    }
  }

  // Overlay for images already in canvas
  &__library-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    pointer-events: none;
    z-index: 1;
  }

  // Usage count badge in bottom-right corner
  &__library-count {
    position: absolute;
    bottom: 4px;
    right: 4px;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    background: $color-brand;
    color: white;
    font-family: $font-primary;
    font-size: 12px;
    font-weight: $font-weight-bold;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
    z-index: 2;

    .panel-diseno__library-item:hover & {
      opacity: 1;
    }

    // Always visible on mobile (no hover state)
    @include mobile {
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

  // Library actions container
  &__library-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  // Small variant for change button
  &__change-btn--small {
    width: auto;
    padding: 6px 12px;
    font-size: 12px;
  }

  // Rellenar modal (full-screen)
  &__rellenar-modal {
    position: fixed;
    inset: 0;
    background: white;
    display: flex;
    flex-direction: column;
    z-index: $z-modal + 1;
  }

  &__rellenar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  &__rellenar-title {
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-bold;
    color: #181d27;
    margin: 0;
  }

  &__rellenar-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__rellenar-skip {
    @include button-reset;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: $color-brand;
    padding: 8px 16px;
    cursor: pointer;

    @include hover {
      opacity: 0.8;
    }
  }

  &__rellenar-confirm {
    @include button-reset;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: white;
    background: $color-brand;
    padding: 8px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color $transition-fast;

    &:disabled {
      background: #d5d7da;
      cursor: not-allowed;
    }

    @include hover {
      &:not(:disabled) {
        background: darken($color-brand, 8%);
      }
    }
  }

  &__rellenar-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  &__rellenar-filter-dropdown {
    position: relative;
  }

  &__rellenar-select {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #414651;
    background: white;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    padding: 8px 32px 8px 12px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23414651' d='M2.5 4.5L6 8L9.5 4.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;

    &:focus {
      outline: none;
      border-color: $color-brand;
    }
  }

  &__rellenar-select-all {
    @include button-reset;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #414651;
    background: #f5f5f5;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color $transition-fast;

    @include hover {
      background: #ebebeb;
    }
  }

  &__rellenar-grid-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  &__rellenar-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #717680;
    font-family: $font-primary;
    font-size: 14px;

    p {
      margin: 0;
    }
  }

  &__rellenar-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(8, 1fr);
    }
  }

  &__rellenar-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: #f5f5f5;
    border: 3px solid transparent;
    transition: border-color $transition-fast, box-shadow $transition-fast, opacity $transition-fast;

    &--selected {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    &--warning {
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border: 2px solid #f59e0b;
        border-radius: 5px;
        pointer-events: none;
      }
    }

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        border-color: transparent;
      }
    }

    @include hover {
      &:not(.panel-diseno__rellenar-item--disabled) {
        border-color: #93c5fd;
      }
    }
  }

  &__rellenar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  // Warning badge (same style as imagenes tab)
  &__rellenar-warning {
    position: absolute;
    bottom: 4px;
    left: 4px;
    width: 22px;
    height: 22px;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;
    z-index: 2;
    cursor: help;

    svg {
      width: 12px;
      height: 12px;
    }
  }

  &__rellenar-usage {
    position: absolute;
    bottom: 6px;
    right: 6px;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    background: $color-brand;
    color: white;
    font-family: $font-primary;
    font-size: 11px;
    font-weight: $font-weight-bold;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: background-color $transition-fast;

    // When image is selected, show pulsing animation to indicate it will be added
    &--selected {
      background: #3b82f6;
      animation: pulse-usage 1.5s ease-in-out infinite;
    }
  }

  @keyframes pulse-usage {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  &__rellenar-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;
    flex-shrink: 0;
  }

  &__rellenar-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__rellenar-count-badge {
    min-width: 24px;
    height: 24px;
    padding: 0 8px;
    background: $color-brand;
    color: white;
    font-family: $font-primary;
    font-size: 12px;
    font-weight: $font-weight-bold;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__rellenar-status-text {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #181d27;
  }

  &__rellenar-remaining {
    font-family: $font-primary;
    font-size: 14px;
    color: #f59e0b;
    margin-left: auto;
  }

  &__rellenar-thumbs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d5d7da;
      border-radius: 2px;
    }
  }

  &__rellenar-thumb {
    position: relative;
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 6px;
    overflow: hidden;
    border: 2px solid #3b82f6;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &--more {
      background: #f5f5f5;
      border-color: #d5d7da;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: $font-primary;
      font-size: 11px;
      font-weight: $font-weight-semibold;
      color: #717680;
    }

    &--empty {
      background: #f5f5f5;
      border: 2px dashed #d5d7da;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #a1a1aa;
    }
  }

  &__rellenar-thumb-warning {
    position: absolute;
    top: 2px;
    left: 2px;
    z-index: 2;
    width: 14px;
    height: 14px;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;

    svg {
      width: 8px;
      height: 8px;
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

  .panel-diseno__modal,
  .panel-diseno__rellenar-modal {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .panel-diseno__modal {
    transform: scale(0.95);
  }

  .panel-diseno__rellenar-modal {
    transform: translateY(20px);
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

// Custom drag preview (teleported to body - needs :global for scoped styles)
:global(.panel-diseno__drag-preview) {
  position: fixed;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10000;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid #9ca3af;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

// Green state when over canvas droppable area
:global(.panel-diseno__drag-preview--over-canvas) {
  border-color: #5bb98c;
  box-shadow: 0 4px 16px rgba(91, 185, 140, 0.4);
}

:global(.panel-diseno__drag-preview--over-canvas .panel-diseno__drag-preview-indicator) {
  color: #5bb98c;
  background: rgba(255, 255, 255, 1);
}

:global(.panel-diseno__drag-preview-image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:global(.panel-diseno__drag-preview-indicator) {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: color 0.15s ease, background-color 0.15s ease;
}

// Teleported tooltip (needs :global since it's outside scoped component)
:global(.panel-diseno__tooltip) {
  position: fixed;
  transform: translateY(-50%);
  background: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Lexend', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  max-width: 280px;
  z-index: 10001;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  // Arrow pointing left
  &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: #1f2937;
    border-left: none;
  }
}

// Tooltip transition
:global(.tooltip-enter-active),
:global(.tooltip-leave-active) {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

:global(.tooltip-enter-from),
:global(.tooltip-leave-to) {
  opacity: 0;
  transform: translateY(-50%) translateX(-4px);
}
</style>
