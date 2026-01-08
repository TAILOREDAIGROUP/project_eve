# End-to-End Tests

This directory contains the E2E test suite for Project EVE, built with [Playwright](https://playwright.dev/).

## Structure

- `fixtures/`: Test fixtures and data.
- `pages/`: Page Object Models (POM).
- `tests/`: Spec files.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configure environment**:
    Ensure you have a `.env` file in the `frontend/` directory with the following variables:
    ```
    OPENROUTER_API_KEY=your-key
    NEXT_PUBLIC_SUPABASE_URL=your-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    ```

3.  **Install Browsers**:
    ```bash
    npx playwright install chromium
    ```

## Running Tests

-   **Run all tests**:
    ```bash
    npm run test:e2e
    ```

-   **Run tests in UI mode**:
    ```bash
    npm run test:e2e:ui
    ```

-   **Run specific test**:
    ```bash
    npx playwright test e2e/tests/core-features.spec.ts
    ```

## Best Practices

-   **POM**: Use Page Object Models in `e2e/pages/` for reusable selectors and actions.
-   **Stability**: Use `expect(locator).toContainText()` or other web-first assertions that auto-retry.
-   **Data Isolation**: Tests use a specific `TENANT_ID` to avoid clashing with real user data.
