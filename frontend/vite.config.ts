import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),

    electron({
      main: {
        // ✅ Electron main process entry
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron", // compiled to dist-electron/main.js
            rollupOptions: {
              // ✅ Do not bundle native modules or Google APIs
              external: ["keytar", "googleapis"],
            },
          },
        },
      },

      preload: {
        // ✅ Preload script (contextBridge)
        input: path.join(__dirname, "electron/preload.ts"),
        vite: {
          build: {
            outDir: "dist-electron", // compiled to dist-electron/preload.js
            rollupOptions: {
              output: {
                // 👇 Ensures consistent preload file name
                entryFileNames: "preload.js",
              },
            },
          },
        },
      },

      // Renderer only in dev mode
      renderer: process.env.NODE_ENV === "test" ? undefined : {},
    }),
  ],

  // ✅ Alias setup for cleaner imports
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  // ✅ Tailwind / PostCSS integration
  css: {
    postcss: path.resolve(__dirname, "postcss.config.cjs"),
  },

  // ✅ Output and build configuration
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },

  // ✅ Prevent Vite from trying to pre-bundle keytar/googleapis
  optimizeDeps: {
    exclude: ["keytar", "googleapis"],
  },

  // ✅ Local development server
  server: {
    port: 5173,
    strictPort: true,
    open: false,
    watch: {
      ignored: [
        "**/data/**", // ignore /data folder
        "!**/src/**",
      ],
    },
  },
});
