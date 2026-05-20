import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/dashboard": "http://localhost:3000",
      "/services": "http://localhost:3000",
      "/status": "http://localhost:3000",
      "/incidents": "http://localhost:3000",
      "/health": "http://localhost:3000",
      "/ready": "http://localhost:3000",
    },
  },
});
