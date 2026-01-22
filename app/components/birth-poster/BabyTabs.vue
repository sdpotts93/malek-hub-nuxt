<script setup lang="ts">
interface Props {
  // When true, always show the badge (used in unified tabs for desktop scrollable view)
  alwaysShowBadge?: boolean
  // Use underline tab style (like momentos PanelDiseno tabs)
  underline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  alwaysShowBadge: false,
  underline: false,
})

const store = useBirthPosterStore()

// Show badge if: always show is on, OR we're in datos panel (mobile behavior)
const shouldShowBadge = (babyIndex: number) => {
  if (!store.babyHasMissingData(babyIndex)) return false
  return props.alwaysShowBadge || store.activePanel === 'datos'
}
</script>

<template>
  <div :class="['baby-tabs', { 'baby-tabs--underline': props.underline }]">
    <button
      v-for="i in store.babyCount"
      :key="i"
      :class="[
        'baby-tabs__tab',
        { 'baby-tabs__tab--active': store.activeBabyTab === i - 1 }
      ]"
      @click="store.setActiveBabyTab(i - 1)"
    >
      <span class="baby-tabs__label">Bebé {{ i }}</span>
      <span
        v-if="shouldShowBadge(i - 1)"
        class="baby-tabs__badge"
      >!</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.baby-tabs {
  display: flex;
  border-radius: 0px;
  overflow: hidden;

  // Underline tab style (like momentos PanelDiseno tabs)
  &--underline {
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0;

    .baby-tabs__tab {
      min-height: unset;
      padding: 16px 0;
      font-size: 14px;
      font-weight: $font-weight-semibold;
      color: #717680;
      border: none;
      border-right: none;
      border-bottom: none;
      background: transparent;

      &:last-child {
        border-right: none;
      }

      @include hover {
        background: transparent;
        color: $color-brand;
      }

      &--active {
        background: transparent;
        color: #252b37;
        border-bottom: none;

        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: $color-brand;
        }

        @include hover {
          background: transparent;
          color: #252b37;
        }
      }
    }

    .baby-tabs__badge {
      position: static;
      display: inline-flex;
      width: 16px;
      height: 16px;
      margin-left: 4px;
      font-size: 10px;
      vertical-align: middle;
    }
  }

  &__tab {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 18px 16px;
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-bold;
    background: #f5f5f5;
    color: #414651;
    border-right: 1px solid #e9eaeb;
    transition: background-color $transition-fast, color $transition-fast, box-shadow $transition-fast;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border-bottom: 1px solid #e9eaeb;
    @include mobile {
      min-height: unset;
      padding: 12px 0;
    }

    &:last-child {
      border-right: none;
    }

    @include hover {
      background: #ebebeb;
    }

    &--active {
      background: transparent;
      color: $color-brand;
      border-right-color: #eaddd3;
      border-bottom: none;
      @include hover {
        background: transparent;
      }
    }
  }

  &__label {
    // Inherits font styles from parent
  }

  &__badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 13px;
    height: 13px;
    background: $color-error;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: $font-primary;
    font-size: 11px;
    font-weight: $font-weight-bold;
    color: #ffffff;
    line-height: 1;
    @include mobile {
      right: 12px;
    }
  }
}
</style>
