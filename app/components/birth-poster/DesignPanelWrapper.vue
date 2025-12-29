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
  padding: 16px 0px 32px;

  @include mobile {
    padding: 16px 0px;
  }
}
</style>
