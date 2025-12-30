import { defineStore } from 'pinia'
import type { UIState } from '~/types'

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    isCartOpen: false,
    isHistoryOpen: false,
    isMobileMenuOpen: false,
    isMobileNavWrapperOpen: false,
    mobileNavWrapperContent: null,
    isLoading: false,
    toasts: [],
  }),

  getters: {
    // Check if any overlay is open
    hasOverlay(state): boolean {
      return state.isCartOpen || state.isMobileNavWrapperOpen
    },
  },

  actions: {
    // Cart sidebar
    openCart() {
      this.closeAllOverlays()
      this.isCartOpen = true
    },

    closeCart() {
      this.isCartOpen = false
    },

    toggleCart() {
      if (this.isCartOpen) {
        this.closeCart()
      } else {
        this.openCart()
      }
    },

    // History panel (desktop)
    openHistory() {
      this.isHistoryOpen = true
    },

    closeHistory() {
      this.isHistoryOpen = false
    },

    toggleHistory() {
      this.isHistoryOpen = !this.isHistoryOpen
    },

    // Mobile menu
    openMobileMenu() {
      this.isMobileMenuOpen = true
    },

    closeMobileMenu() {
      this.isMobileMenuOpen = false
    },

    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen
    },

    // Mobile nav wrapper (full screen overlay for History/Home)
    openMobileNavWrapper(content: 'history' | 'home') {
      this.mobileNavWrapperContent = content
      this.isMobileNavWrapperOpen = true
    },

    closeMobileNavWrapper() {
      this.isMobileNavWrapperOpen = false
      // Delay clearing content until after animation completes (300ms)
      setTimeout(() => {
        if (!this.isMobileNavWrapperOpen) {
          this.mobileNavWrapperContent = null
        }
      }, 300)
    },

    // Close all overlays
    closeAllOverlays() {
      this.isCartOpen = false
      this.isMobileMenuOpen = false
      this.isMobileNavWrapperOpen = false
      // Delay clearing content until after animation completes (300ms)
      setTimeout(() => {
        if (!this.isMobileNavWrapperOpen) {
          this.mobileNavWrapperContent = null
        }
      }, 300)
    },

    // Loading state
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    // Handle escape key
    handleEscape() {
      if (this.isCartOpen) {
        this.closeCart()
      } else if (this.isMobileNavWrapperOpen) {
        this.closeMobileNavWrapper()
      } else if (this.isMobileMenuOpen) {
        this.closeMobileMenu()
      }
    },
  },
})
