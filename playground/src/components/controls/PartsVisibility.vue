<script setup lang="ts">
import { PART_NAMES } from "@daidr/minecraft-skin-renderer";
import { useSettingsStore } from "../../stores/settings";

const settingsStore = useSettingsStore();

const partLabels: Record<string, string> = {
  head: "Head",
  body: "Body",
  leftArm: "Left Arm",
  rightArm: "Right Arm",
  leftLeg: "Left Leg",
  rightLeg: "Right Leg",
};

function showAllParts() {
  for (const part of PART_NAMES) {
    const visibility = settingsStore.settings.partsVisibility[part];
    if (visibility) {
      visibility.inner = true;
      visibility.outer = true;
    }
  }
}

function hideAllOuter() {
  for (const part of PART_NAMES) {
    const visibility = settingsStore.settings.partsVisibility[part];
    if (visibility) {
      visibility.outer = false;
    }
  }
}
</script>

<template>
  <section class="control-section">
    <h2>Parts Visibility</h2>
    <div class="parts-grid">
      <div v-for="part in PART_NAMES" :key="part" class="part-row">
        <span class="part-label">{{ partLabels[part] }}</span>
        <label>
          <input type="checkbox" v-model="settingsStore.settings.partsVisibility[part]!.inner" />
          Inner
        </label>
        <label>
          <input type="checkbox" v-model="settingsStore.settings.partsVisibility[part]!.outer" />
          Outer
        </label>
      </div>
    </div>
    <div class="button-group">
      <button @click="showAllParts">Show All</button>
      <button @click="hideAllOuter">Hide All Outer</button>
    </div>
  </section>
</template>

<style scoped>
.parts-grid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.part-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--muted);
  border-radius: var(--radius);
}

.part-row:hover {
  background: var(--accent);
}

.part-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.part-row label {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  white-space: nowrap;
  margin-bottom: 0;
}

.part-row input[type="checkbox"] {
  margin-right: 0.25rem;
}
</style>
