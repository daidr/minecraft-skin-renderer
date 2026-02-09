<script setup lang="ts">
import { useRender2dStore } from "../../stores/render2d";

const render2d = useRender2dStore();
</script>

<template>
  <section class="control-section">
    <h2>Render Type</h2>
    <div class="control-group">
      <label for="renderTypeSelect">Type</label>
      <select id="renderTypeSelect" v-model="render2d.renderType">
        <option value="avatar">Avatar (Head)</option>
        <option value="front">Front View</option>
        <option value="back">Back View</option>
        <option value="side">Side View</option>
        <option value="isometric">2.5D Isometric</option>
        <option value="halfBody">Half Body</option>
        <option value="bigHead">Big Head</option>
      </select>
    </div>
  </section>
</template>
