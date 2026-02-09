<script setup lang="ts">
import { useRender2dStore } from "../../stores/render2d";

const render2d = useRender2dStore();
</script>

<template>
  <section class="control-section">
    <h2>Render Options</h2>
    <div class="control-group">
      <label for="render2dScale">
        Scale: <span>{{ render2d.scale }}x</span>
      </label>
      <input
        type="range"
        id="render2dScale"
        min="1"
        max="32"
        step="1"
        v-model.number="render2d.scale"
      />
    </div>
    <div class="control-group">
      <label>
        <input type="checkbox" v-model="render2d.showOverlay" />
        Show overlay layer
      </label>
    </div>
    <div class="control-group">
      <label>
        <input type="checkbox" v-model="render2d.overlayInflated" />
        Inflated overlay (3D-like)
      </label>
    </div>
  </section>
</template>
