import 'dotenv/config'
import restart from 'vite-plugin-restart'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default {
    root: 'sources/', // Sources files (typically where index.html is)
    envDir: '../',  // Directory where the env file is located
    publicDir: '../static/', // Path from "root" to static assets (files that are served as they are)
    base: '/', // Public path (what's after the domain)
    server:
    {
        host: '0.0.0.0', // Listen on all interfaces for Replit
        port: 5000,
        strictPort: true,
        allowedHosts: true, // Allow all hosts (Replit proxy)
        open: false // Don't try to open browser
    },
    build:
    {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: false // Add sourcemap
    },
    plugins:
    [
        wasm(),
        topLevelAwait(),
        restart({ restart: [ '../static/**', ] }), // Restart server on static file change
        nodePolyfills(),
    ]
}
