<script setup lang="ts">
import { useViewerStore } from "../stores/viewer";
import { useSettingsStore } from "../stores/settings";

const viewerStore = useViewerStore();
const settingsStore = useSettingsStore();

const emit = defineEmits<{
  backendChange: [];
}>();

function onBackendChange(e: Event) {
  settingsStore.settings.backend = (e.target as HTMLSelectElement).value;
  emit("backendChange");
}
</script>

<template>
  <div class="backend-selector">
    <label for="backendSelect">Backend:</label>
    <select id="backendSelect" :value="settingsStore.settings.backend" @change="onBackendChange">
      <option value="auto">Auto</option>
      <option value="webgpu">WebGPU</option>
      <option value="webgl">WebGL</option>
    </select>
    <span class="backend-badge" :class="viewerStore.backendClass">
      {{ viewerStore.backendLabel }}
    </span>
  </div>
</template>

<style scoped>
.backend-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.backend-selector label {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.backend-selector select {
  height: 2rem;
  padding: 0 2rem 0 0.75rem;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--foreground);
  font-size: 0.875rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
}

.backend-badge {
  display: inline-flex;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  background: var(--muted);
  border: 1px solid var(--border);
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.backend-badge.webgpu {
  background: hsl(142 76% 36% / 0.15);
  border-color: hsl(142 76% 36% / 0.3);
  color: hsl(142 76% 36%);
}

.backend-badge.webgl {
  background: hsl(38 92% 50% / 0.15);
  border-color: hsl(38 92% 50% / 0.3);
  color: hsl(38 92% 50%);
}
</style>
