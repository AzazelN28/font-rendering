import glsl from "vite-plugin-glsl"
import { defineConfig } from "vite"

export default defineConfig({
    resolve: {
        alias: {
            '~': '/src'
        }
    },
    plugins: [glsl()]
})