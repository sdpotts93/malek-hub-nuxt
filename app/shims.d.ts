// Type declarations for external modules without types

declare module 'vue-advanced-cropper' {
  import { DefineComponent } from 'vue'

  export interface CropperResult {
    coordinates: {
      left: number
      top: number
      width: number
      height: number
    }
    canvas?: HTMLCanvasElement
    image: {
      width: number
      height: number
      transforms: {
        rotate: number
        flip: { horizontal: boolean; vertical: boolean }
      }
    }
    visibleArea: {
      left: number
      top: number
      width: number
      height: number
    } | null
  }

  export interface CropperRef {
    getResult(): CropperResult
    zoom(factor: number): void
    move(left: number, top: number): void
    rotate(angle: number): void
    flip(horizontal: boolean, vertical: boolean): void
    reset(): void
    refresh(): void
  }

  export const Cropper: DefineComponent<{
    src?: string
    stencilComponent?: DefineComponent
    stencilProps?: Record<string, unknown>
    imageRestriction?: 'stencil' | 'none' | 'fit-area' | 'fill-area'
    autoZoom?: boolean
    transitions?: boolean
  }, {}, {}, {}, {}, {}, {}, {
    ready: () => void
    change: (result: CropperResult) => void
    error: () => void
  }>

  export const RectangleStencil: DefineComponent<{
    handlers?: Record<string, unknown>
    aspectRatio?: number
    resizable?: boolean
    movable?: boolean
    minAspectRatio?: number
    maxAspectRatio?: number
  }>

  export const CircleStencil: DefineComponent<{
    handlers?: Record<string, unknown>
    aspectRatio?: number
    resizable?: boolean
    movable?: boolean
  }>
}

type TrackAddToCartPayload = {
  price: number
  formattedPrice?: string
  productId?: string
  variantId?: string
  currency?: string
}

declare module '#app' {
  interface NuxtApp {
    $trackAddToCart?: (payload: TrackAddToCartPayload) => void
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $trackAddToCart?: (payload: TrackAddToCartPayload) => void
  }
}
