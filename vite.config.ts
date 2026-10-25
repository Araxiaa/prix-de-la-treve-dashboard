import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : le site fonctionne sur GitHub Pages quel que soit le nom du dépôt (https://<compte>.github.io/<depot>/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2020', sourcemap: false },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
