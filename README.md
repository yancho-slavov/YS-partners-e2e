# Partners Module E2E Suite

Playwright + TypeScript end-to-end test suite for the **Partners** module of a FinTech admin platform (`https://dev.admin.avtoikonom.com`). Covers the full entity lifecycle — login → create Partner → validate → update → validate — plus required-field negative/boundary coverage, wired into CI.

## Prerequisites

- Node.js 22+
- Access to `https://dev.admin.avtoikonom.com` (shared dev environment)

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then fill in real values
```

`.env` needs:

```
BASE_URL=<provided URL>
QA_EMAIL=<provided test account email>
QA_PASSWORD=<provided test account password>
```

## Running

```bash
npm test              # headless, chromium
npm run test:headed   # headed, chromium
npm run test:ui       # Playwright UI mode
npm run test:report   # open the last HTML report
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
```

Run a single spec: `npx playwright test tests/partners/partner-create.spec.ts`

## Project structure

```
tests/
  setup/auth.setup.ts        - logs in once, saves storageState for reuse
  login/login.spec.ts        - login + logout, kept under explicit test coverage
  partners/
    partner-create.spec.ts   - create + independently re-validate
    partner-update.spec.ts   - full lifecycle: create -> validate -> update -> validate
    partner-validation.spec.ts - one case per required field (@negative)
  fixtures/base-fixtures.ts  - Playwright test extended with page objects + fresh test data
pages/                       - Page Object Model (base.page.ts holds shared AntD-quirk helpers)
test-data/                   - constants, unique-data factory, logo fixture
docs/inspection-notes.md     - raw findings from Step 0 live-site inspection
.github/workflows/e2e.yml    - CI: install, run chromium, upload report/traces
```

## CI

`.github/workflows/e2e.yml` runs on push/PR to `main`/`master`. It needs three **repository secrets**: `BASE_URL`, `QA_EMAIL`, `QA_PASSWORD` (Settings → Secrets and variables → Actions). Verified working via a live successful run.

## Key architectural decisions

- **Page Object Model + Playwright fixtures** (`tests/fixtures/base-fixtures.ts`): page objects and a fresh `partnerData` object are injected as test arguments rather than instantiated inline, keeping specs focused on behavior.
- **Shared login via `storageState`**: `auth.setup.ts` runs once as its own Playwright project and every other spec reuses its session — except `login.spec.ts`/logout, which deliberately override `storageState` to keep the login/logout flow itself under real test coverage rather than assuming it away.
- **`BasePage` centralizes recurring AntD quirks** discovered on this app: `activeSelectDropdown` and `activeModal` both scope to the *last* matching element, because this AntD-based app leaves previously-closed dropdown popups and modals mounted (hidden) in the DOM rather than removing them — an unscoped selector can silently grab a stale element from something you already closed.
- **Unique test data per run** (`test-data/partner-factory.ts`): every generated Partner name is prefixed `QA-E2E-` with a timestamp+uuid suffix, so repeated runs never collide and generated data stays identifiable on this shared dev environment (used by multiple candidates in parallel — other `QA Partner ...`-style records were already present at inspection time).
- **Validation depth over trusting the UI**: every create/update test re-navigates and either reloads or opens a fresh detail view before asserting — never trusting a save button click or a toast alone. This was directly justified by a real bug found during inspection (see Deviations).
- **Chromium-only scope, by deliberate agreement, not a limitation discovered along the way**: `playwright.config.ts` defines a `setup` project and a `chromium` project only. All locators are still written engine-agnostically (`getByRole`, IDs, no `nth-child`), so extending to firefox/webkit later is additive, not a rewrite (see the commented-out example in `playwright.config.ts`).

## Deviations found from the assignment description

Real inspection (`docs/inspection-notes.md`) surfaced several things that differ from - or go well beyond - what the assignment brief described:

- **Required fields are far more numerous than "Address and Type."** The real create form requires: Name, Type, Services, Subscription plan, Address, Phone, Contact person, Description, and Logo (an image upload). `partner-validation.spec.ts` covers all nine.
- **The Type field is a custom AntD combobox, not a native `<select>`** - and it renders a *hidden* ARIA-only listbox with raw enum values (`carService`, `insurer`) completely separate from the *visible*, clickable option list. Matching by `getByRole('option', { name: ... })` silently targets the wrong (invisible) element; the real interaction has to target the visible `.ant-select-item-option` list, scoped to whichever dropdown popup is currently open (not just any `:visible` match - AntD keeps closed popups mounted).
- **Address is a live Google-Maps-style autocomplete**, not a free-text field - a suggestion must actually be clicked for the location (lat/lng) to be captured; typing the address alone was not sufficient.
- **Uploading the Logo opens a second, nested "edit photo" crop modal** with its own Save button. Confirming that crop modal too fast (before the canvas finished processing the image) reproduced a real `400` response from the API with an empty `"logo":"data:,"` payload - this was an actual bug hit and fixed during implementation, not a hypothetical.
- **This app's UI language (Bulgarian/English) is not fixed per account**, and was observed to flip unpredictably - sometimes within seconds, on the same logged-in account, with no explicit action taken. This directly explains the assignment's own "Service / Сервиз" dual wording. It also broke an early version of the required-field validation test, which matched the Bulgarian error text only; the fix moved to a language-independent CSS class anchor instead (see below).
- **No `data-testid`/`data-cy` hooks anywhere in the app.** Locators had to fall back to plain element IDs (most fields, confirmed real and stable), AntD's own internal DOM structure (select dropdowns, modals), and in exactly one place - the required-field inline error text - an unstable CSS-module class name (`.svY0B`), because neither a role, an id, nor reliable text was available there (text flips language; there's no ARIA role or test id on that element). This is documented as a known fragility: if the app is rebuilt with a different CSS-module hash, `partner-validation.spec.ts`'s error-visibility assertions would need that one selector updated.
- **Edit/Delete exist** via an actions menu on the Partner detail page (`#action-button` → `#edit-button`/`#delete-button`), confirmed live. Edit reopens the exact same form, pre-filled - including the phone field pre-filled as the fully-formatted `+359 88 812 3456` rather than raw digits, which is why the update spec uses a narrow `updateNameAndDescription()` method instead of re-running the full `fillForm()`.

## Assumptions

- Services and Subscription plan: any available option is selected (the assignment doesn't mandate a specific value for either), consistently the first option in whatever list is currently rendered.
- The Logo fixture is a generated 128×128 solid-color placeholder PNG (`test-data/fixtures/partner-logo.png`) - a 1×1 pixel image was tried first and found to silently fail (empty data URI), so a non-degenerate image was used instead.
- Post-login landing page is `/requests`; this is what `auth.setup.ts` waits for before saving `storageState`.

## Known limitation / not done

- **No automated cleanup of created test Partners.** Delete capability was confirmed to exist, but wiring an `afterEach` teardown wasn't completed for this submission - repeated runs (locally and in CI) accumulate `QA-E2E-...`-prefixed Partner records on the shared dev environment. They're clearly identifiable and safe to bulk-delete manually if needed.

## What I'd improve or extend with more time

- Wire up the confirmed delete capability as an `afterEach` teardown so runs stay self-cleaning.
- Attempt the firefox/webkit stretch goal (config projects are scaffolded and commented out, ready to enable).
- Do a full session specifically in English UI mode to capture the real English validation wording, and build a small bilingual-text-lookup helper instead of relying on the CSS-class fallback for the one selector that needs it.
- Add a couple of equivalence-partitioning cases beyond "blank" (e.g. an over-length name, an invalid phone format) if the API enforces those.
