import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        // minify: 'esbuild',
        // target: "esnext",
        // chunkSizeWarningLimit: 1000000000000000,
        // rollupOptions: {
        //     output: {
        //         format: "iife",
        //         manualChunks: () => "index",
        //         inlineDynamicImports: false,
        //     },
        // }
        // optimizeDeps: {
        //     exclude: [
        //         "@dimforge/rapier2d/rapier_wasm2d_bg.wasm"
        //     ]
    },
    // plugins: [
    // wasm(),
    // topLevelAwait()
    // ],
    // worker: {
    // Not needed with vite-plugin-top-level-await >= 1.3.0
    // format: "es",
    // inlineDynamicImports: true,
    // rollupOptions: {
    //     output: {
    //         inlineDynamicImports: true
    //     }
    // },
    // optimizeDeps: {
    //     exclude: [
    //         "@dimforge/rapier2d/rapier_wasm2d_bg.wasm"
    //     ]
    // },
    // plugins: [
    //     // wasm(),
    //     // topLevelAwait()
    // ]
    // }
});
