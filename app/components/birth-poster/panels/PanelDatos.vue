<script setup lang="ts">
import type { HoraNacimiento } from '~/types'

const store = useBirthPosterStore()

// Ref for nombre input to focus when error is shown
const nombreInput = ref<HTMLInputElement | null>(null)

// Track the last known trigger value to detect new triggers
const lastTriggerValue = ref(0)

// Focus nombre input helper
function focusNombreInput() {
  // Wait for panel/sheet animation to complete before focusing
  requestAnimationFrame(() => {
    if (nombreInput.value) {
      nombreInput.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
      nombreInput.value.focus()
    }
  })
}

// Check on mount if a focus was triggered before we mounted
onMounted(() => {
  if (store.nombreFocusTrigger > lastTriggerValue.value) {
    lastTriggerValue.value = store.nombreFocusTrigger
    focusNombreInput()
  }
})

// Watch focus trigger from store (only triggered by add-to-cart validation)
watch(() => store.nombreFocusTrigger, (newVal) => {
  if (newVal > lastTriggerValue.value) {
    lastTriggerValue.value = newVal
    focusNombreInput()
  }
})

// Generate altura options (15-58cm in 0.5cm increments)
// Max 58cm because the illustration area is 58.75cm on a 70cm print (1:1 scale)
const alturaOptions = Array.from({ length: 87 }, (_, i) => 15 + i * 0.5)

// Generate day options (1-31)
const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1)

// Month options in Spanish
const monthOptions = [
  { value: 0, label: 'Enero' },
  { value: 1, label: 'Febrero' },
  { value: 2, label: 'Marzo' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' },
  { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Septiembre' },
  { value: 9, label: 'Octubre' },
  { value: 10, label: 'Noviembre' },
  { value: 11, label: 'Diciembre' },
]

// Generate year options (1970 to current year)
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: currentYear - 1970 + 1 }, (_, i) => currentYear - i)

// Generate hour options (1-12)
const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)

// Generate minute options (0-59)
const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

// Computed values for fecha de nacimiento
const fechaDay = computed({
  get() {
    const date = store.currentBaby.fechaNacimiento
    return date ? new Date(date).getDate() : 1
  },
  set(value: number) {
    updateFecha({ day: value })
  },
})

const fechaMonth = computed({
  get() {
    const date = store.currentBaby.fechaNacimiento
    return date ? new Date(date).getMonth() : 0
  },
  set(value: number) {
    updateFecha({ month: value })
  },
})

const fechaYear = computed({
  get() {
    const date = store.currentBaby.fechaNacimiento
    return date ? new Date(date).getFullYear() : currentYear
  },
  set(value: number) {
    updateFecha({ year: value })
  },
})

function updateFecha(updates: { day?: number; month?: number; year?: number }) {
  const currentDate = store.currentBaby.fechaNacimiento
    ? new Date(store.currentBaby.fechaNacimiento)
    : new Date(currentYear, 0, 1)

  const day = updates.day ?? currentDate.getDate()
  const month = updates.month ?? currentDate.getMonth()
  const year = updates.year ?? currentDate.getFullYear()

  store.setBabyFechaNacimiento(new Date(year, month, day))
}

// Computed values for hora de nacimiento
const horaHour = computed({
  get() {
    return store.currentBaby.horaNacimiento?.hour ?? 12
  },
  set(value: number) {
    updateHora({ hour: value })
  },
})

const horaMinute = computed({
  get() {
    return store.currentBaby.horaNacimiento?.minute ?? 0
  },
  set(value: number) {
    updateHora({ minute: value })
  },
})

const horaPeriod = computed({
  get() {
    return store.currentBaby.horaNacimiento?.period ?? 'AM'
  },
  set(value: 'AM' | 'PM') {
    updateHora({ period: value })
  },
})

function updateHora(updates: Partial<HoraNacimiento>) {
  const currentHora = store.currentBaby.horaNacimiento ?? { hour: 12, minute: 0, period: 'AM' as const }
  store.setBabyHoraNacimiento({
    hour: updates.hour ?? currentHora.hour,
    minute: updates.minute ?? currentHora.minute,
    period: updates.period ?? currentHora.period,
  })
}

// Handle peso input - only allow digits, max 4
function handlePesoInput(event: Event) {
  const input = event.target as HTMLInputElement
  // Remove any non-digit characters
  let value = input.value.replace(/\D/g, '')
  // Limit to 4 digits
  if (value.length > 4) {
    value = value.slice(0, 4)
  }
  input.value = value
  store.setBabyPeso(value ? Number(value) : null)
}

// Prevent non-numeric keys for peso
function handlePesoKeydown(event: KeyboardEvent) {
  // Allow: backspace, delete, tab, escape, enter, arrow keys
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
  if (allowedKeys.includes(event.key)) return

  // Allow Ctrl/Cmd + A, C, V, X
  if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return

  // Block 'e', 'E', '+', '-', '.'
  if (['e', 'E', '+', '-', '.'].includes(event.key)) {
    event.preventDefault()
    return
  }

  // Block if not a digit
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

// Format minute for display (with leading zero)
function formatMinute(minute: number): string {
  return minute.toString().padStart(2, '0')
}
</script>

<template>
  <div class="panel-datos">
    <!-- Baby Tabs (if multiple babies) -->
    <BirthPosterBabyTabs v-if="store.babyCount > 1" class="panel-datos__tabs" />

    <h3 class="panel-datos__title">
      <svg class="panel-datos__title-icon" width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.3334 7.66665L1.91675 21.0833M17.2501 14.375H8.62508M6.32508 18.2083H12.7816C13.016 18.2083 13.1332 18.2083 13.2435 18.1818C13.3413 18.1584 13.4348 18.1196 13.5205 18.0671C13.6172 18.0078 13.7001 17.925 13.8658 17.7592L18.6876 12.9375C18.9166 12.7085 19.0311 12.594 19.1232 12.4926C21.1167 10.2995 21.1167 6.95047 19.1232 4.75737C19.0311 4.65599 18.9166 4.54149 18.6876 4.31249C18.4586 4.08348 18.3441 3.96898 18.2427 3.87683C16.0496 1.88334 12.7006 1.88334 10.5075 3.87683C10.4061 3.96898 10.2916 4.08348 10.0626 4.31248L5.24085 9.13422C5.07511 9.29996 4.99223 9.38283 4.93297 9.47955C4.88042 9.56529 4.8417 9.65877 4.81823 9.75655C4.79175 9.86685 4.79175 9.98405 4.79175 10.2184V16.675C4.79175 17.2117 4.79175 17.4801 4.8962 17.6851C4.98808 17.8654 5.13469 18.012 5.31501 18.1039C5.52001 18.2083 5.78836 18.2083 6.32508 18.2083Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Datos del bebé
    </h3>

    <!-- Nombre -->
    <div class="panel-datos__field">
      <label class="panel-datos__label" for="nombre">
        Nombre
        <span class="panel-datos__required">*</span>
      </label>
      <input
        id="nombre"
        ref="nombreInput"
        type="text"
        :class="['panel-datos__input', { 'panel-datos__input--error': store.currentBabyHasNombreError }]"
        :value="store.currentBaby.nombre"
        placeholder="Nombre del bebé"
        maxlength="20"
        @input="store.setBabyNombre(($event.target as HTMLInputElement).value)"
      >
      <span v-if="store.currentBabyHasNombreError" class="panel-datos__error-message">
        Es necesario este campo
      </span>
      <span v-else class="panel-datos__hint">Máx. 20 caracteres</span>
    </div>

    <!-- Separator -->
    <div class="panel-datos__separator" />

    <!-- Altura y Peso (same row) -->
    <div class="panel-datos__row">
      <!-- Altura -->
      <div class="panel-datos__field panel-datos__field--half">
        <label class="panel-datos__label" for="altura">
          Altura
          <span class="panel-datos__required">*</span>
        </label>
        <div class="panel-datos__select-wrapper">
          <select
            id="altura"
            class="panel-datos__select"
            :value="store.currentBaby.altura"
            @change="store.setBabyAltura(Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="cm in alturaOptions" :key="cm" :value="cm">
              {{ cm }} cm
            </option>
          </select>
        </div>
      </div>

      <!-- Peso -->
      <div class="panel-datos__field panel-datos__field--half">
        <label class="panel-datos__label" for="peso">
          Peso
          <span class="panel-datos__optional">(opcional)</span>
        </label>
        <div class="panel-datos__input-group">
          <input
            id="peso"
            type="text"
            inputmode="numeric"
            class="panel-datos__input"
            :value="store.currentBaby.peso ?? ''"
            maxlength="4"
            placeholder="ej. 3400"
            @input="handlePesoInput"
            @keydown="handlePesoKeydown"
          >
          <span class="panel-datos__unit">g</span>
        </div>
      </div>
    </div>

    <!-- Show Scale Checkbox -->
    <label
      :class="[
        'panel-datos__checkbox',
        { 'panel-datos__checkbox--disabled': !store.isScaleSize }
      ]"
    >
      <input
        type="checkbox"
        :checked="store.currentBaby.showScale"
        :disabled="!store.isScaleSize"
        @change="store.setBabyShowScale(($event.target as HTMLInputElement).checked)"
      >
      <span class="panel-datos__checkbox-label">Mostrar texto: "Escala 1:1"</span>
    </label>

    <!-- Separator -->
    <div class="panel-datos__separator" />

    <!-- Fecha de nacimiento -->
    <div class="panel-datos__field">
      <label class="panel-datos__label">
        Fecha de nacimiento
        <span class="panel-datos__optional">(opcional)</span>
      </label>
      <div class="panel-datos__date-row">
        <!-- Day -->
        <div class="panel-datos__select-wrapper panel-datos__select-wrapper--day">
          <select
            class="panel-datos__select"
            :value="fechaDay"
            @change="fechaDay = Number(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="day in dayOptions" :key="day" :value="day">
              {{ day }}
            </option>
          </select>
        </div>

        <!-- Month -->
        <div class="panel-datos__select-wrapper panel-datos__select-wrapper--month">
          <select
            class="panel-datos__select"
            :value="fechaMonth"
            @change="fechaMonth = Number(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="month in monthOptions" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>

        <!-- Year -->
        <div class="panel-datos__select-wrapper panel-datos__select-wrapper--year">
          <select
            class="panel-datos__select"
            :value="fechaYear"
            @change="fechaYear = Number(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="year in yearOptions" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Hora de nacimiento -->
    <div class="panel-datos__field">
      <label class="panel-datos__label">
        Hora de nacimiento
        <span class="panel-datos__optional">(opcional)</span>
      </label>
      <div class="panel-datos__time-row">
        <!-- Hour -->
        <div class="panel-datos__select-wrapper panel-datos__select-wrapper--hour">
          <select
            class="panel-datos__select"
            :value="horaHour"
            @change="horaHour = Number(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="hour in hourOptions" :key="hour" :value="hour">
              {{ hour }}
            </option>
          </select>
        </div>

        <span class="panel-datos__time-separator">:</span>

        <!-- Minute -->
        <div class="panel-datos__select-wrapper panel-datos__select-wrapper--minute">
          <select
            class="panel-datos__select"
            :value="horaMinute"
            @change="horaMinute = Number(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="minute in minuteOptions" :key="minute" :value="minute">
              {{ formatMinute(minute) }}
            </option>
          </select>
        </div>

        <!-- AM/PM -->
        <div class="panel-datos__select-wrapper panel-datos__select-wrapper--period">
          <select
            class="panel-datos__select"
            :value="horaPeriod"
            @change="horaPeriod = ($event.target as HTMLSelectElement).value as 'AM' | 'PM'"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Separator -->
    <div class="panel-datos__separator" />

    <!-- Lugar de nacimiento -->
    <div class="panel-datos__field">
      <label class="panel-datos__label" for="lugar">
        Lugar de nacimiento
        <span class="panel-datos__optional">(opcional)</span>
      </label>
      <input
        id="lugar"
        type="text"
        class="panel-datos__input"
        :value="store.currentBaby.lugarNacimiento ?? ''"
        placeholder="ej. Ciudad de México"
        maxlength="20"
        @input="store.setBabyLugarNacimiento(($event.target as HTMLInputElement).value || null)"
      >
      <span class="panel-datos__hint">Máx. 20 caracteres</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-datos {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-inline: 20px;
  padding-top: 20px;
  @include mobile {
    padding-top: 0;
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

  &__tabs {
    margin-inline: -20px;
    margin-top: -20px;
    margin-bottom: 8px;
    @include mobile {
      border-top-right-radius: 8px;
      border-top-left-radius: 8px;
      border-top: 1px solid #e9eaeb;
      margin-left: -20px;
      margin-right: -20px;
      margin-top: 0;
    }
  }

  &__separator {
    height: 1px;
    background-color: #e5e7eb;
    margin: 4px 0;
  }

  &__row {
    display: flex;
    gap: 12px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &--half {
      flex: 1;
      min-width: 0;
    }
  }

  &__label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #414651;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__required {
    color: #ef4444;
  }

  &__optional {
    font-weight: $font-weight-normal;
    color: #717680;
    font-size: 12px;
  }

  &__input {
    @include input-reset;
    width: 100%;
    padding: 10px 14px;
    background: #ffffff;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
    font-family: $font-primary;
    font-size: 16px;
    color: #2f3038;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &::placeholder {
      color: #717680;
    }

    &:focus {
      border-color: $color-brand;
      box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05), 0 0 0 3px rgba(219, 104, 0, 0.1);
    }

    &--error {
      border-color: #ef4444;

      &:focus {
        border-color: #ef4444;
        box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05), 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }
  }

  &__error-message {
    font-family: $font-primary;
    font-size: 12px;
    color: #ef4444;
    margin-top: 4px;
  }

  &__hint {
    font-family: $font-primary;
    font-size: 12px;
    color: #9ca3af;
    margin-top: 2px;
  }

  &__input-group {
    position: relative;
    display: flex;
    align-items: center;

    .panel-datos__input {
      padding-right: 32px;
    }
  }

  &__unit {
    position: absolute;
    right: 14px;
    color: #717680;
    font-family: $font-primary;
    font-size: 16px;
    pointer-events: none;
  }

  &__select-wrapper {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid #717680;
      pointer-events: none;
    }

    &--day {
      flex: 0 0 70px;
    }

    &--month {
      flex: 1;
    }

    &--year {
      flex: 0 0 90px;
    }

    &--hour,
    &--minute {
      flex: 0 0 75px;
    }

    &--period {
      flex: 0 0 75px;
    }
  }

  &__select {
    @include input-reset;
    width: 100%;
    padding: 10px 32px 10px 14px;
    background: #ffffff;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
    font-family: $font-primary;
    font-size: 16px;
    color: #2f3038;
    cursor: pointer;
    appearance: none;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:focus {
      border-color: $color-brand;
      box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05), 0 0 0 3px rgba(219, 104, 0, 0.1);
    }
  }

  &__date-row {
    display: flex;
    gap: 8px;
  }

  &__time-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__time-separator {
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-medium;
    color: #414651;
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: $color-brand;
      cursor: pointer;
    }

    &--disabled {
      cursor: not-allowed;
      opacity: 0.5;

      input[type="checkbox"] {
        cursor: not-allowed;
      }
    }
  }

  &__checkbox-label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-normal;
    color: #414651;
  }
}
</style>
