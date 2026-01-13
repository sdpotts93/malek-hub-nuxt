<script setup lang="ts">
import type { MomentosPanelType } from '~/stores/momentos'

interface Props {
  activePanel: MomentosPanelType
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'image-assigned'): void
}>()
</script>

<template>
  <div class="design-panel-wrapper">
    <Transition name="fade" mode="out-in">
      <MomentosPanelsPanelDiseno v-if="activePanel === 'diseno'" key="diseno" @image-assigned="emit('image-assigned')" />
      <MomentosPanelsPanelMedidas v-else-if="activePanel === 'medidas'" key="medidas" />
      <MomentosPanelsPanelMarco v-else-if="activePanel === 'marco'" key="marco" />
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.design-panel-wrapper {
  padding: 0px 0px 32px;

  @include mobile {
    padding: 0 0px 16px;
  }
}

// Panel transition
.fade-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;

  @include mobile {
    transition: opacity 0.15s ease-out;
  }
}

.fade-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;

  @include mobile {
    transition: opacity 0.1s ease-in;
  }
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);

  @include mobile {
    transform: none;
  }
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);

  @include mobile {
    transform: none;
  }
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
