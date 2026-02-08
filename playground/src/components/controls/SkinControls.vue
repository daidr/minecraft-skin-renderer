<script setup lang="ts">
import { ref } from "vue";
import { useTexturesStore } from "../../stores/textures";
import { useSettingsStore } from "../../stores/settings";

const textures = useTexturesStore();
const settingsStore = useSettingsStore();

const skinUrl = ref("");
const skinFileRef = ref<HTMLInputElement>();

function loadSkinFromUrl() {
  const url = skinUrl.value.trim();
  if (!url) return;
  textures.skinSource = url;
}

function loadSkinFromFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  textures.skinSource = file;
}
</script>

<template>
  <section class="control-section">
    <h2>Skin</h2>
    <div class="control-group">
      <label for="skinUrl">Skin URL</label>
      <input
        v-model="skinUrl"
        type="text"
        id="skinUrl"
        placeholder="https://example.com/skin.png"
      />
      <button @click="loadSkinFromUrl">Load</button>
    </div>
    <div class="control-group">
      <label for="skinFile">Or upload file</label>
      <input
        ref="skinFileRef"
        type="file"
        id="skinFile"
        accept="image/png"
        @change="loadSkinFromFile"
      />
    </div>
    <div class="control-group">
      <label>
        <input type="checkbox" v-model="settingsStore.settings.slimModel" />
        Slim arms (Alex model)
      </label>
    </div>
  </section>
</template>
