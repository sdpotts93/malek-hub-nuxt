# Studio Malek - Editing Tools Platform

## Project Overview

A platform with 3 customizable poster/design editing tools connected to Shopify, hosted on Cloudflare. Each tool allows users to create personalized designs that can be purchased through a shared Shopify cart.

### Live Domain
- **Production**: `https://hub.studiomalek.com`
- **Main Store**: `https://studiomalek.com` (separate Shopify instance)

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Nuxt 3** | Vue.js meta-framework (SSR/SSG) |
| **Vue 3** | Composition API with `<script setup>` |
| **Shopify Storefront API** | Cart management, product data, checkout |
| **Node.js** | Server-side runtime |
| **Cloudflare Pages** | Hosting & deployment |
| **SCSS** | Styling with BEM notation |
| **NuxtImg** | Image optimization (required for ALL images) |
| **Pinia** | State management |
| **TypeScript** | Type safety (optional but recommended) |

---

## Project Structure

```
/
├── assets/
│   ├── scss/
│   │   ├── _variables.scss      # Colors, spacing, typography
│   │   ├── _mixins.scss         # Breakpoints, utilities
│   │   ├── _reset.scss          # CSS reset
│   │   └── main.scss            # Global styles
│   └── images/
│       ├── birth-poster/        # Birth poster tool assets
│       │   ├── babies/          # Baby illustration PNGs
│       │   ├── frames/          # Frame style images
│       │   └── icons/           # Tool-specific icons
│       ├── moments/             # Moments tool assets
│       ├── personaliza/         # Personaliza tool assets
│       └── shared/              # Shared icons, logos
├── components/
│   ├── shared/                  # Cross-tool components
│   │   ├── TheHeader.vue
│   │   ├── CartSidebar.vue
│   │   ├── HistoryPanel.vue
│   │   ├── MobileNavWrapper.vue
│   │   ├── BottomNavbar.vue
│   │   └── SidebarNavigation.vue
│   ├── birth-poster/            # Birth poster specific
│   │   ├── BabyCanvas.vue       # Generated image preview
│   │   ├── PanelGeneral.vue
│   │   ├── PanelDiseno.vue
│   │   ├── PanelDatos.vue
│   │   ├── PanelMedidas.vue
│   │   ├── PanelMarco.vue
│   │   └── AddToCartSection.vue
│   ├── moments/                 # Moments specific
│   └── personaliza/             # Personaliza specific
├── composables/
│   ├── useShopifyCart.ts        # Shopify cart operations
│   ├── useDesignHistory.ts      # Design save/load
│   └── useCanvasRenderer.ts     # Canvas/image generation
├── pages/
│   ├── index.vue                # Landing/tool selector
│   ├── birth-poster.vue         # Birth poster tool
│   ├── moments.vue              # Moments tool (TBD)
│   └── personaliza.vue          # Personaliza tool (TBD)
├── stores/
│   ├── cart.ts                  # Shared cart state
│   ├── birthPoster.ts           # Birth poster state
│   ├── moments.ts               # Moments state
│   └── personaliza.ts           # Personaliza state
├── server/
│   └── api/
│       └── shopify/             # Shopify API routes
├── types/
│   └── index.ts                 # TypeScript interfaces
└── nuxt.config.ts
```

---

## Critical Layout Rules

### No Page Scroll
```scss
// ALL tool pages must follow this pattern
.tool-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  
  // Scroll happens INSIDE child elements only
  &__scrollable-area {
    overflow-y: auto;
    overflow-x: hidden;
  }
}
```

### Image Handling
**ALWAYS use `<NuxtImg>` for all images:**
```vue
<NuxtImg
  src="/images/birth-poster/baby-1.png"
  alt="Baby illustration"
  width="200"
  height="300"
  loading="lazy"
/>
```

---

## Responsive Breakpoints

Located in `assets/scss/_mixins.scss`:

```scss
$breakpoints: (
  xxxs: 'screen and (max-width: 380px)',
  xxs: 'screen and (max-width: 479px)',
  xs: 'screen and (max-width: 767px)',
  s: 'screen and (max-width: 991px)',
  smd: 'screen and (max-width: 1024px)',
  md: 'screen and (max-width: 1280px)',
  xl: 'screen and (max-width: 1440px)',
  xxl: 'screen and (max-width: 1600px)',
  short: 'screen and (max-height: 550px)',
  hover: '(hover: hover)',
  reduce-motion: '(prefers-reduced-motion: reduce)'
) !default;

@mixin media-breakpoint($breakpointName) {
  $mediaQuery: map-get($breakpoints, $breakpointName);
  @if ($mediaQuery == null) {
    @content
  } @else {
    @media #{$mediaQuery} {
      @content
    }
  }
}
```

### Usage in Vue Components
```vue
<style lang="scss" scoped>
@import '@/assets/scss/_mixins.scss';

.birth-poster {
  display: grid;
  grid-template-columns: 80px 1fr 300px;
  
  @include media-breakpoint('md') {
    grid-template-columns: 60px 1fr 250px;
  }
  
  @include media-breakpoint('xs') {
    display: flex;
    flex-direction: column;
  }
}
</style>
```

---

## BEM Naming Convention

Follow strict BEM notation:

```scss
// Block
.birth-poster { }

// Element (double underscore)
.birth-poster__sidebar { }
.birth-poster__canvas { }
.birth-poster__panel { }

// Modifier (double dash)
.birth-poster__panel--active { }
.birth-poster__button--disabled { }

// Nested elements - flatten, don't nest BEM
// ❌ WRONG
.birth-poster__sidebar__nav { }

// ✅ CORRECT
.birth-poster__sidebar-nav { }
```

---

## Shopify Integration

### Cart Strategy for Subdomain

Since this runs on `hub.studiomalek.com` while the main store is on `studiomalek.com`:

```typescript
// composables/useShopifyCart.ts
const CART_STORAGE_KEY = 'studiomalek_hub_cart_id';
const SHOPIFY_DOMAIN = 'your-store.myshopify.com';
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

// Store cart ID in localStorage with domain-specific key
// This keeps hub cart separate from main store cart
```

### Cart Operations

```typescript
interface CartOperations {
  createCart(): Promise<string>;           // Returns cartId
  getCart(cartId: string): Promise<Cart>;
  addToCart(cartId: string, lines: CartLine[]): Promise<Cart>;
  updateCart(cartId: string, lines: CartLine[]): Promise<Cart>;
  removeFromCart(cartId: string, lineIds: string[]): Promise<Cart>;
  getCheckoutUrl(cartId: string): Promise<string>;
}
```

### Product Variants for Birth Poster

Sizes depend on baby count:
- **1-2 babies**: 30x40, 40x50, 50x70, 70x100 (vertical)
- **3-4 babies**: 40x30, 50x40, 70x50, 100x70 (horizontal)

Frame styles: 4 predefined options from Studio Malek catalog

---

## Birth Poster Tool Specification

### Route: `/birth-poster`

### Canvas Preview Structure

The generated poster image (@https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7273&m=dev) has two customizable sections:

1. **BABY EDIT** - The baby illustration in the center (PNG with color filter applied)
2. **TEXT EDIT** - The text below the illustration with baby data

### State Structure

```typescript
interface BirthPosterState {
  // General settings (not in design, but needed)
  babyCount: 1 | 2 | 3 | 4;
  backgroundColor: string;
  
  // Per-baby settings (array based on babyCount)
  babies: BabyConfig[];
  
  // Poster settings
  posterSize: PosterSize;
  frameStyle: FrameStyle | null;
  
  // UI state
  activePanel: 'general' | 'diseno' | 'datos' | 'medidas' | 'marco';
  activeBabyTab: number; // 0-indexed, for multi-baby tabs in diseño and datos
}

interface BabyConfig {
  // Design (Diseño)
  orientation: 'derecha' | 'izquierda'; // Changes available style images
  style: string; // Selected baby illustration style ID
  illustrationColor: string; // CSS filter value for baby PNG
  
  // Data (Datos)
  nombre: string;
  altura: number; // in cm
  peso: number | null; // in grams, optional
  fechaNacimiento: Date | null; // optional
  lugarNacimiento: string | null; // optional
}

type PosterSize = 
  | '30x40' | '40x50' | '50x70' | '70x100'  // 1-2 babies
  | '40x30' | '50x40' | '70x50' | '100x70'; // 3-4 babies
```

---

### Sidebar Navigation

Figma reference: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7093&m=dev

When selecting an option in the sidebar, a different section of the **Design Panel Wrapper** (@https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7118&m=dev) is shown.

---

### Panel Options Detail

#### OPTION: General (NOT in Figma design - must be added)

This panel is important but not designed yet. Contains:
- **Número de bebés** - Select 1, 2, 3, or 4 babies
- **Color de fondo** - Background color selector (moved FROM diseño panel)

**IMPORTANT - Multi-baby behavior:** 
When user selects **more than 1 baby**, a tab system (Bebé 1, Bebé 2, etc.) MUST appear in:
- **Diseño panel** - to configure each baby's orientation, style, and illustration color separately
- **Datos panel** - to configure each baby's name, height, weight, birth date, and birth place separately

This tab system applies to **BOTH desktop and mobile** layouts.

---

#### OPTION: Diseño

Figma nav item: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7095&m=dev

Shows **Design Container** (@https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7120&m=dev) content:

**⚠️ If babyCount > 1:** Show baby tabs (Bebé 1, Bebé 2, etc.) at top of this panel. Each tab configures that specific baby's design.

| Field | Behavior |
|-------|----------|
| **Orientación** | "Derecha" or "Izquierda" - changes which style images are shown in Estilos grid (@https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7134&m=dev) |
| **Estilos** | Grid of baby illustration options (changes based on orientation) |
| **Color de la ilustración** | Changes the color of the baby in BABY EDIT section. Use CSS filter on PNG since it's a black design |
| ~~Color de fondo~~ | **REMOVED** - moved to General panel |

---

#### OPTION: Datos

Figma reference: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7197&m=dev

Shows **Datos del bebé** section. All fields affect TEXT EDIT section of the poster.

**⚠️ If babyCount > 1:** Show baby tabs (Bebé 1, Bebé 2, etc.) at top of this panel. Each tab configures that specific baby's data.

| Field | TEXT EDIT Output |
|-------|------------------|
| **Nombre** | Added after "SCALE 1:1 OF..." → `SCALE 1:1 OF {nombre}` |
| **Altura** | Shows as height → `{altura} cm` (e.g., "51 cm") |
| **Peso** (optional) | If specified, added after altura → ` / {peso} gramos` |
| **Fecha de nacimiento** (optional) | If specified, added after peso/altura → ` / 30 de junio de 2025` |
| **Lugar de nacimiento** (optional) | If specified, added after fecha → ` / Mexico City` |

**Full TEXT EDIT example:**
```
SCALE 1:1 OF Lucas
51 cm / 3400 gramos / 30 de junio de 2025 / Mexico City
```

---

#### OPTION: Medidas

Figma reference: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7228&m=dev

Shows **Medidas del poster** section:

| Field | Options |
|-------|---------|
| **Medidas del poster sin marcos** | Sizes from store, depends on baby count: |
| | • 1-2 babies: 30x40, 40x50, 50x70, 70x100 |
| | • 3-4 babies: 40x30, 50x40, 70x50, 100x70 |
| ~~Marialuisa~~ | **REMOVED** - delete this section |

---

#### OPTION: Marco

Figma reference: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7240&m=dev

Shows **Marco** section:

| Field | Options |
|-------|---------|
| **Estilo de marco** | 4 predefined frame types that Studio Malek sells |

---

#### OPTION: Extras

**OMIT FOR NOW** - do not implement this panel.

---

### Add to Cart Section

Figma reference: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-16617&m=dev (Frame 47815)

**This section is ALWAYS visible** on top of the Design Panel (above whichever panel content is shown). Contains:
- Total price (with strikethrough original price)
- "Agregar al carrito" button
- Shipping info ("Envío Gratuito 3-5 días")
- Reviews indicator

---

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STUDIO    │      Personaliza      Birth Poster      Momentos    🔔  🛒 │
│  MALEK     │                          (active)                          │
├──────┬─────┴─────────────────┬─────────────────────────────┬────────────┤
│      │ ┌───────────────────┐ │                             │  < ⏱      │
│ [✏️] │ │ ADD TO CART SECT  │ │                             ├────────────┤
│Diseño│ │ Total $3,250 $1,350│ │                             │ ┌────────┐ │
│      │ │ [Agregar al carrito]│ │                             │ │ thumb1 │ │
│ [✏️] │ └───────────────────┘ │                             │ └────────┘ │
│Datos │ ┌───────────────────┐ │      CANVAS PREVIEW         │ ┌────────┐ │
│      │ │                   │ │     (Generated Poster)      │ │ thumb2 │ │
│ [📏] │ │  ACTIVE PANEL     │ │                             │ └────────┘ │
│Medidas│ │  CONTENT HERE     │ │    ┌─────────────────┐     │ ┌────────┐ │
│      │ │  (scrollable)     │ │    │   BABY EDIT     │     │ │ thumb3 │ │
│ [🖼] │ │                   │ │    │   (illustration) │     │ └────────┘ │
│Marco │ │                   │ │    └─────────────────┘     │ ┌────────┐ │
│      │ │                   │ │    TEXT EDIT               │ │ thumb4 │ │
│ [~~]│ │                   │ │    SCALE 1:1 OF...         │ └────────┘ │
│Extra │ │                   │ │    51 cm / ...             │            │
│(omit)│ └───────────────────┘ │                             │            │
└──────┴───────────────────────┴─────────────────────────────┴────────────┘

SIDEBAR   DESIGN PANEL            CANVAS AREA                 HISTORY
(icons)   (add-to-cart + panel)   (centered poster)           (thumbnails)
```

**Grid Structure:**
```scss
.birth-poster {
  display: grid;
  grid-template-columns: 80px 380px 1fr 220px;
  grid-template-rows: auto 1fr;
  height: 100dvh;
  
  &__header { grid-column: 1 / -1; }
  &__sidebar { grid-row: 2; }
  &__panel-wrapper { 
    grid-row: 2; 
    display: flex;
    flex-direction: column;
  }
  &__add-to-cart { flex-shrink: 0; } // Always visible at top
  &__panel-content { flex: 1; overflow-y: auto; }
  &__canvas { grid-row: 2; display: flex; align-items: center; justify-content: center; }
  &__history { grid-row: 2; }
}
```

---

### History Panel

Figma reference: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7060&m=dev

Located to the right of the canvas. Shows history of designs created in the past.

**States:**
- **Minimized**: Collapsed bar showing thumbnails vertically
- **Maximized**: Expanded panel with larger thumbnails and options

**Behavior:**
- Designs are saved per-tool (birth-poster history is separate from moments history)
- Ask user if they want to save the design before navigating away
- Storage: localStorage or IndexedDB (you can decide best approach)

---

### Cart Sidebar

Figma reference: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-7088&m=dev

**Shared by all 3 tools.** No detailed design exists, so create a side panel that slides in from the right.

**Cart Storage:**
- Store `cartId` in localStorage or cookies
- Note: Main store is on `studiomalek.com`, this platform is on `hub.studiomalek.com`
- Need to handle Shopify cart isolation between domains

---

### Mobile Layout

#### Bottom Navbar

Figma reference: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-11970&m=dev

Fixed at bottom. When selecting an option (Diseño, Datos, Medidas, Marco), the **Sidebar Section** (@https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-11825&m=dev) of the **Mobile Nav Wrapper** slides in from below.

Same panel content rules apply as desktop - only show the relevant section based on selection.

#### History Icon (Mobile)

Figma icon: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26509-4145&m=dev

When selected, **Mobile Nav Wrapper** (@https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26490-12450&m=dev) slides in from below. **Covers even the bottom navbar.**

#### Home Icon (Mobile)

Figma icon: @https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26509-4156&m=dev

When selected, **Mobile Nav Wrapper** (@https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-?node-id=26509-4165&m=dev) slides in from below. **Covers even the bottom navbar.**

```
┌──────────────────────────────┐
│ STUDIO        🏠  ⏱  🛒     │
│ MALEK                        │
├──────────────────────────────┤
│                              │
│       CANVAS PREVIEW         │
│      ┌─────────────────┐     │
│      │   BABY EDIT     │     │
│      └─────────────────┘     │
│      TEXT EDIT               │
│      SCALE 1:1 OF...         │
│                              │
├──────────────────────────────┤
│ ════════ (drag handle) ═════ │
│                              │
│  [ACTIVE PANEL CONTENT]      │
│  (scrollable)                │
│                              │
├──────────────────────────────┤
│ [✏️    ] [✏️    ] [📏    ] [🖼] │
│ Diseño   Datos   Medidas Marco│
└──────────────────────────────┘

// When History (⏱) or Home (🏠) selected:
// Mobile Nav Wrapper covers ENTIRE screen including bottom navbar
```

---

### Multi-Baby Tab System (Desktop & Mobile)

**This applies to BOTH desktop and mobile layouts.**

When `babyCount > 1` (selected in General panel), tabs appear in **BOTH Diseño and Datos** panels:

```vue
<template>
  <div class="panel-diseno">
    <!-- Baby tabs - REQUIRED when babyCount > 1 -->
    <div v-if="store.babyCount > 1" class="panel-diseno__tabs">
      <button
        v-for="i in store.babyCount"
        :key="i"
        :class="['panel-diseno__tab', { 'panel-diseno__tab--active': store.activeBabyTab === i - 1 }]"
        @click="store.activeBabyTab = i - 1"
      >
        Bebé {{ i }}
      </button>
    </div>
    
    <div class="panel-diseno__content">
      <!-- Panel content for selected baby (store.babies[store.activeBabyTab]) -->
    </div>
  </div>
</template>
```

**On Desktop:** Tabs appear at top of the panel content area (below Add to Cart section)
**On Mobile:** Tabs appear at top of the bottom sheet content for Diseño/Datos panels

---

### Baby Illustration Color

The baby illustrations are PNGs with black design. Apply CSS filter to change color:

```scss
.baby-canvas__illustration {
  // Example: convert black to a specific color
  filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(190deg) brightness(95%) contrast(101%);
}
```

Use a color-to-filter converter or maintain predefined color options with their filter values.

---

## Design History System

Each tool has its own history of saved designs. Details covered in Birth Poster specification above.

```typescript
interface SavedDesign {
  id: string;
  tool: 'birth-poster' | 'moments' | 'personaliza';
  createdAt: Date;
  updatedAt: Date;
  thumbnail: string; // Base64 or blob URL
  state: BirthPosterState | MomentsState | PersonalizaState;
}

// composables/useDesignHistory.ts
const HISTORY_KEY = 'studiomalek_design_history';
const MAX_SAVED_DESIGNS = 20;
```

---

## Shared Cart Sidebar

Shared by all 3 tools. Slides in from right side of screen. Details in Birth Poster specification above.

```vue
<template>
  <Transition name="slide-right">
    <aside v-if="isOpen" class="cart-sidebar">
      <div class="cart-sidebar__header">
        <h2>Tu Carrito</h2>
        <button @click="close" class="cart-sidebar__close">×</button>
      </div>
      
      <div class="cart-sidebar__items">
        <CartItem v-for="item in cartItems" :key="item.id" :item="item" />
      </div>
      
      <div class="cart-sidebar__footer">
        <div class="cart-sidebar__total">
          Total: {{ formatPrice(total) }}
        </div>
        <button @click="checkout" class="cart-sidebar__checkout">
          Proceder al pago
        </button>
      </div>
    </aside>
  </Transition>
  <div v-if="isOpen" class="cart-sidebar__overlay" @click="close" />
</template>
```

---

---

## Tools Status

| Tool | Route | Status |
|------|-------|--------|
| Birth Poster | `/birth-poster` | ✅ Designed |
| Moments | `/moments` | ⏳ Not started |
| Personaliza | `/personaliza` | ⏳ Not started |

---

## Environment Variables

```env
# .env
SHOPIFY_STOREFRONT_TOKEN=your_token
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NUXT_PUBLIC_SITE_URL=https://hub.studiomalek.com
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare
npm run deploy
```

---

## Key Implementation Notes

1. **Canvas Generation**: Use HTML Canvas or a library like `html2canvas` to generate the poster preview. Consider using `fabric.js` for more complex canvas manipulation.

2. **Image Downloads**: When adding to cart, generate a high-resolution version of the design and either store it or send the configuration to Shopify as line item properties.

3. **Color Filters**: For changing illustration colors, maintain a mapping of color names to CSS filter values, or use a library like `color` to calculate filters dynamically.

4. **Save Prompt**: Use `beforeunload` event and Vue Router navigation guards to prompt users before leaving with unsaved changes.

5. **Shopify Cart Isolation**: Since hub runs on a subdomain, use a separate localStorage key for cart ID. Consider using Shopify's cart attributes to identify hub orders.

---

## Figma Reference

Design file: `STUDIO-MALEK-DEV--Draf-`
Base URL: `https://www.figma.com/design/66P0BwfNIJkg16j0FiANcy/STUDIO-MALEK-DEV--Draf-`

### Desktop Views
| Element | Node ID | URL |
|---------|---------|-----|
| Main desktop view | `26490-7074` | `?node-id=26490-7074&m=dev` |
| Generated poster (BABY EDIT + TEXT EDIT) | `26490-7273` | `?node-id=26490-7273&m=dev` |
| Sidebar navigation | `26490-7093` | `?node-id=26490-7093&m=dev` |
| Diseño nav item | `26490-7095` | `?node-id=26490-7095&m=dev` |
| Design panel wrapper | `26490-7118` | `?node-id=26490-7118&m=dev` |
| Design container (Diseño panel) | `26490-7120` | `?node-id=26490-7120&m=dev` |
| Baby style options | `26490-7134` | `?node-id=26490-7134&m=dev` |
| Datos del bebé panel | `26490-7197` | `?node-id=26490-7197&m=dev` |
| Medidas del poster panel | `26490-7228` | `?node-id=26490-7228&m=dev` |
| Marco panel | `26490-7240` | `?node-id=26490-7240&m=dev` |
| Add to cart section (Frame 47815) | `26490-16617` | `?node-id=26490-16617&m=dev` |
| Cart | `26490-7088` | `?node-id=26490-7088&m=dev` |
| History panel | `26490-7060` | `?node-id=26490-7060&m=dev` |

### Mobile Views
| Element | Node ID | URL |
|---------|---------|-----|
| Bottom navbar | `26490-11970` | `?node-id=26490-11970&m=dev` |
| Sidebar section (bottom sheet) | `26490-11825` | `?node-id=26490-11825&m=dev` |
| History icon | `26509-4145` | `?node-id=26509-4145&m=dev` |
| Mobile Nav Wrapper (history) | `26490-12450` | `?node-id=26490-12450&m=dev` |
| Home icon | `26509-4156` | `?node-id=26509-4156&m=dev` |
| Mobile Nav Wrapper (home) | `26509-4165` | `?node-id=26509-4165&m=dev` |

---

## AI Assistant Notes

When working on this project:

1. Always use `<NuxtImg>` for images, never raw `<img>` tags
2. Follow BEM naming strictly
3. Use the provided breakpoint mixin for all responsive styles
4. Ensure no page-level scroll - all scrolling within elements
5. Keep cart logic in the shared composable for all tools
6. Check `babyCount` before rendering tab interfaces
7. Validate that poster sizes match baby count constraints
8. Mobile panels slide from bottom, cart slides from right