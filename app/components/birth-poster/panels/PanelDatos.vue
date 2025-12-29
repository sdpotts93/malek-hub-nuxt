<script setup lang="ts">
import type { HoraNacimiento } from '~/types'

const store = useBirthPosterStore()

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
    <h3 class="panel-datos__title">Datos del bebé</h3>

    <!-- Baby Tabs (if multiple babies) -->
    <BirthPosterBabyTabs v-if="store.babyCount > 1" class="panel-datos__tabs" />

    <!-- Nombre -->
    <div class="panel-datos__field">
      <label class="panel-datos__label" for="nombre">
        Nombre
        <span class="panel-datos__required">*</span>
      </label>
      <input
        id="nombre"
        type="text"
        class="panel-datos__input"
        :value="store.currentBaby.nombre"
        placeholder="Nombre del bebé"
        @input="store.setBabyNombre(($event.target as HTMLInputElement).value)"
      >
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
    <label class="panel-datos__checkbox">
      <input
        type="checkbox"
        :checked="store.showScale"
        @change="store.setShowScale(($event.target as HTMLInputElement).checked)"
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
        @input="store.setBabyLugarNacimiento(($event.target as HTMLInputElement).value || null)"
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-datos {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-inline: 20px;

  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
  }

  &__tabs {
    margin-bottom: 8px;
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
      border-color: #db6800;
      box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05), 0 0 0 3px rgba(219, 104, 0, 0.1);
    }
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
      border-color: #db6800;
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
      accent-color: #db6800;
      cursor: pointer;
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
