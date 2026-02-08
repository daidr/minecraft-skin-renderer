<script setup lang="ts">
import { useRender2dStore } from "../../stores/render2d";

const render2d = useRender2dStore();
</script>

<template>
  <section v-show="render2d.renderType === 'bigHead'" class="control-section">
    <h2>Big Head Options</h2>
    <div class="control-group">
      <label for="borderSlider">
        Border: <span>{{ render2d.bigHeadBorderWidth }}px</span>
      </label>
      <input
        type="range"
        id="borderSlider"
        min="0"
        max="5"
        step="1"
        v-model.number="render2d.bigHeadBorderWidth"
      />
    </div>
    <div class="control-group">
      <label for="borderColorInput">Border Color</label>
      <input type="color" id="borderColorInput" v-model="render2d.bigHeadBorderColor" />
    </div>
  </section>
</template>
