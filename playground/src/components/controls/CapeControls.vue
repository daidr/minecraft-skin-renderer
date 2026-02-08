<script setup lang="ts">
import { ref } from "vue";
import { useTexturesStore } from "../../stores/textures";
import { useSettingsStore } from "../../stores/settings";

const textures = useTexturesStore();
const settingsStore = useSettingsStore();

const capeUrl = ref("");

function loadCapeFromUrl() {
  const url = capeUrl.value.trim();
  if (!url) return;
  textures.capeSource = url;
  if (settingsStore.settings.backEquipment === "none") {
    settingsStore.settings.backEquipment = "cape";
  }
}

function loadCapeFromFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  textures.capeSource = file;
  if (settingsStore.settings.backEquipment === "none") {
    settingsStore.settings.backEquipment = "cape";
  }
}

function removeCape() {
  textures.clearCape();
  settingsStore.settings.backEquipment = "none";
}
</script>

<template>
  <section class="control-section">
    <h2>Cape / Elytra</h2>
    <div class="control-group">
      <label for="capeUrl">Cape URL</label>
      <input
        v-model="capeUrl"
        type="text"
        id="capeUrl"
        placeholder="https://example.com/cape.png"
      />
      <button @click="loadCapeFromUrl">Load</button>
    </div>
    <div class="control-group">
      <label for="capeFile">Or upload file</label>
      <input type="file" id="capeFile" accept="image/png" @change="loadCapeFromFile" />
    </div>
    <div class="control-group">
      <label for="backEquipment">Display</label>
      <select id="backEquipment" v-model="settingsStore.settings.backEquipment">
        <option value="none">None</option>
        <option value="cape">Cape</option>
        <option value="elytra">Elytra</option>
      </select>
    </div>
    <button @click="removeCape">Remove Cape</button>
  </section>
</template>
