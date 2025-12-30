<script setup lang="ts">
import type { PanelType } from '~/types'

interface Props {
  activePanel: PanelType
}

defineProps<Props>()
</script>

<template>
  <div class="design-panel-wrapper">
    <Transition name="fade" mode="out-in">
      <BirthPosterPanelsPanelGeneral v-if="activePanel === 'general'" key="general" />
      <BirthPosterPanelsPanelDiseno v-else-if="activePanel === 'diseno'" key="diseno" />
      <BirthPosterPanelsPanelDatos v-else-if="activePanel === 'datos'" key="datos" />
      <BirthPosterPanelsPanelMedidas v-else-if="activePanel === 'medidas'" key="medidas" />
      <BirthPosterPanelsPanelMarco v-else-if="activePanel === 'marco'" key="marco" />
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

// Panel transition - smooth crossfade with subtle slide (desktop only)
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
