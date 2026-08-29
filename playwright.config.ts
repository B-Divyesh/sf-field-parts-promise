import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // The container-runtime claim launches the compiled Rust server. Compile it
  // before individual test timeouts begin so a cold Cargo target cannot make
  // a runtime assertion flaky.
  globalSetup: './e2e/global-setup.ts',
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
        'npm run build:web && npm run preview -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI
    },
    {
      command:
        'cargo build --manifest-path server/Cargo.toml --locked && test_data_dir=$(mktemp -d); PORT=4174 STATIC_DIR=dist DATABASE_URL="sqlite://$test_data_dir/app.db?mode=rwc" AUTH_TEST_SECRET=playwright-test-secret-at-least-32-bytes server/target/debug/parts-promise-api',
      url: 'http://127.0.0.1:4174/health',
      reuseExistingServer: !process.env.CI
    }
  ]
});
