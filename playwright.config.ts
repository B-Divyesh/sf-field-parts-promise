import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Service workers share an origin cache during a browser run. Serial claim
  // evidence keeps the offline cold-reload fixture independent and repeatable.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } }
    }
  ],
  webServer: [
    {
      command:
        'VITE_E2E_AUTH=1 npm run build:web && npm run preview -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 600_000
    },
    {
      command:
        'cargo build --manifest-path server/Cargo.toml --locked && test_data_dir=$(mktemp -d); PORT=4174 STATIC_DIR=dist DATA_DIR="$test_data_dir" AUTH_TEST_SECRET=playwright-test-secret-at-least-32-bytes METRICS_TOKEN=playwright-metrics-secret SOCIOBOT_BILLING_BASE_URL=https://pilot-api.sociobot.in server/target/debug/parts-promise-api',
      url: 'http://127.0.0.1:4174/health',
      reuseExistingServer: !process.env.CI,
      // A clean stable-Rust compile takes several minutes in the verifier.
      timeout: 600_000
    }
  ]
});
