import { createApp } from "vue";
import { createPinia } from "pinia";
import { use } from "@daidr/minecraft-skin-renderer";
import { WebGLRendererPlugin } from "@daidr/minecraft-skin-renderer/webgl";
import { WebGPURendererPlugin } from "@daidr/minecraft-skin-renderer/webgpu";
import { PanoramaPlugin } from "@daidr/minecraft-skin-renderer/panorama";
import App from "./App.vue";
import "./styles/main.css";

// Register all plugins before Vue app mounts
use(WebGLRendererPlugin);
use(WebGPURendererPlugin);
use(PanoramaPlugin);

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
