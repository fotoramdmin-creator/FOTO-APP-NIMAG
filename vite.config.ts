import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "Foto Estudio Ramírez",
        short_name: "Foto Ramírez",
        description: "Sistema interno Foto Estudio Ramírez",

        theme_color: "#36412e",
        background_color: "#F4F1EA",

        display: "standalone",
        orientation: "any",
        start_url: "/",

        icons: [
          {
            src: "/CDR.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/CDR.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
