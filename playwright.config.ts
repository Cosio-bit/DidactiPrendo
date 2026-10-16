import { defineConfig, devices } from '@playwright/test'

const puerto = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: `http://localhost:${puerto}`,
    // Pantalla típica de proyector en sala.
    viewport: { width: 1024, height: 768 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${puerto} --strictPort`,
    url: `http://localhost:${puerto}`,
    reuseExistingServer: !process.env.CI,
  },
})
