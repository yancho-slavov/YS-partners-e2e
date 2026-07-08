# Live-Site Inspection Notes (Step 0)

Findings from manually scripted inspection of `https://dev.admin.avtoikonom.com`
(login: `test_qa_ex@example.com` / same as password) prior to writing any page
objects. This is a live, shared dev environment — other QA candidates'
automated test data (`QA Partner <timestamp>`, address "Sofia, Bulgaria") was
already visible in the Partners list at inspection time.

## Stack / framework signals

- React SPA built on **Ant Design** (`ant-*` classes, `rc-select`, `rc-menu`,
  `rc-virtual-list`). All custom dropdowns are AntD `Select` components, not
  native `<select>`.
- API host: `https://dev.api.avtoikonom.com` (e.g. `POST /admin/partner`).
- **UI language is not fixed.** The same account showed the entire app in
  Bulgarian in one inspection session and in English in a later session, with
  no explicit language action taken. This is presumably shared/account-level
  state on this shared dev environment. This is exactly why the assignment
  itself gives the Type value as "Service / Сервиз" — both forms are real.
  **Consequence: tests must not hardcode a single language's visible text**
  for anything that changes with locale (field labels, the Type option text,
  toast messages). Use language-tolerant matching (regex accepting both
  variants) or stable non-text anchors (IDs, DOM attributes) instead.

## Login (`/login`, redirects there automatically from `/`)

- Two bare `<input>`s, no `name`/`id`/`aria-label`/`<label for>` — the only
  reliable distinguishing attribute is `autocomplete`:
  - `input[autocomplete="email"]`
  - `input[autocomplete="current-password"]`
- Submit button: `button[type="submit"]`, visible text "Логин" / "Login".
- On success, redirects to `/requests` (the default landing page, NOT back to
  any originally-requested deep link — a deep link visited while unauthenticated
  is lost after login).

## Left sidebar navigation

Icon-only; each icon has a **hidden** (`display:none`) sibling
`<span id="{screen}-menu-item">` carrying the real (localized) label, e.g.:
`dashboard-menu-item`, `requests-menu-item`, `users-menu-item`,
`vehicles-menu-item`, `partners-menu-item`, `drivers-menu-item`,
`service-types-menu-item`, `reminders-menu-item`, `promotions-menu-item`,
`trainings-menu-item`, `logout-menu-item`.

Because the span itself is `display:none`, click its parent element:
`page.locator('#partners-menu-item').locator('..')`.

## Partners list (`/partners`)

- Search input: `#search-partners`.
- "Add Partner" button: visible text "Нов партньор" / "New Partner" (no
  stable id found beyond role+name).
- Table columns: Name, Address, Phone, Contact person, Services (chips),
  Subscription plan, actions.
- Row click navigates to a full detail page route:
  `/partners/details/pId:<uuid>` (not a modal).

## Create Partner form (opened via "Add Partner", an AntD Modal)

All fields below are marked **required** (red asterisk) in the real form —
this is a materially larger required-field set than the assignment's prompt
implied (which only called out Address and Type):

| Field | Selector | Notes |
|---|---|---|
| Name | `#name-field` | plain text input |
| Type | `#partner-type-field` | AntD select, see "AntD select gotcha" below. Options: raw values `carService` / `insurer`, visible labels "Сервиз"/"Service" and "Застраховател"/"Insurer" |
| Services | `#service-types-field` | AntD select, options are real service type names (e.g. "Шлайфане на глава") |
| Subscription plan | `#subscription-tier-field` | AntD select, options are tier names like "Automation Subscription Tier 65730" |
| Address | `#address-field` | **location autocomplete**, not free text — see below |
| Phone | `#phone-field` (+ country `select[name="phoneCountry"]`, defaults to Bulgaria) | type=tel, digits only; app prepends the `+359` country code itself |
| Contact person | `#contact-person-field` | plain text input |
| Description | `#description-field` | textarea |
| Logo | `input[type=file]` (accepts `.png,.jpg,.jpeg`) | **opens a nested crop modal**, see below |
| Hide in mobile app | checkbox `#checkbox-hide` | the one NOT required |

Save button: visible text "Запази" / "Save". **Not unique on the page** —
scope to the open modal: `.ant-modal-content` (use `.last()` or otherwise
scope to the currently-relevant modal) before finding the button, since
AntD leaves previous modal instances mounted.

### AntD select gotcha (Type / Services / Subscription plan)

Each AntD `Select` renders TWO parallel structures when open:
1. A **hidden** (`0x0`, `overflow:hidden`) `role="listbox"` containing
   `role="option"` divs with the **raw enum value** as text (e.g.
   `carService`, `insurer`) — this is what `getByRole('option')` matches,
   and it does NOT have the visible label, so `getByRole('option', { name:
   'Сервиз' })` will never resolve.
2. The **actual visible, clickable** list: plain `div.ant-select-item-option`
   elements (no `role`) with a `label="<visible text>"` attribute and the
   visible text as a nested span.

**Correct locator pattern**: after opening the field, scope to the
currently-open popup and match on the visible item:
```ts
page.locator('.ant-select-item-option:visible').filter({ hasText: /Сервиз|Service/ })
```
The `:visible` filter is required — AntD keeps previously-opened dropdown
popups mounted (hidden) in the DOM, so an unscoped `.ant-select-item-option`
selector can match a stale, already-closed dropdown's option instead of the
one currently open, causing "element is not visible" click failures.

### Address field is a location autocomplete, not free text

Typing into `#address-field` triggers a Google-Maps-backed suggestion list
(after ~1s debounce) and a live map/pin preview beneath the field. **A
suggestion must be clicked** — the underlying `location` (lat,lng string) is
only populated in the save payload once a suggestion is selected; free-typed
text alone was not verified to populate `location`. Typing "Sofia, Bulgaria"
produces a suggestion literally rendered as "SofiaBulgaria" (name + region
concatenated with no separator in the DOM text) as the first option.

### Logo upload opens a nested crop modal

Selecting a file via `input[type=file]` immediately opens a second AntD
modal titled "Редактирай снимка" / "Edit photo" with its **own** "Запази"/
"Save" button. That crop modal's Save must be clicked first (confirming the
crop) — only then does control return to the main Partner form, whose own
Save can then be clicked. Skipping the crop-modal confirmation (or clicking
it too fast, before the canvas/File processing finishes) resulted in the
main form submitting `"logo":"data:,"` (an empty data URI) and the backend
rejecting the whole request with `400 {"code":2,"info":"unable to create a
partner"}` and a generic toast "Нещо се обърка" / "Something went wrong" —
this was reproduced and confirmed as the root cause, not a flake. A ~1s wait
after both the file input `setInputFiles()` call and the crop-modal Save
click was sufficient for it to succeed reliably in manual runs.

A minimal valid (non-1×1) placeholder PNG is required as a test fixture —
an extremely trivial 1×1 pixel image was observed to also produce an empty
`logo` data URI (silently), so the fixture image should have real,
non-degenerate dimensions (a 128×128 solid-color PNG was used successfully).

### Confirmed successful create (for reference)

Request: `POST https://dev.api.avtoikonom.com/admin/partner` →
`200 OK`, response body includes a generated `uuid`, and all submitted
fields echoed back. No visible success toast was observed (the error path
does show a toast — `.ant-message` with text "Нещо се обърка" — but on
success no `.ant-message`/`.ant-notification` text was present at the time
checked, possibly because it auto-dismisses quickly). **Reliable success
signals**: HTTP 200 with a `uuid` in the response, the modal closing, and
the new partner being findable afterward via the list search and/or its
detail page — this validates the plan's existing approach of re-reading
persisted state rather than trusting a toast.

## Partner detail page (`/partners/details/pId:<uuid>`)

Clean, readable field layout suitable for independent validation-by-reload:
Name + Type (as page heading/subheading), phone, contact person, address
(with lat/lng shown as plain text beneath), description, services (chips),
subscription plan. Confirms persisted values can be read back without
needing to reopen the edit form.

## Edit / Delete

An actions trigger exists on the detail page's "Partner" card: `#action-button`
(an `<img>`, positioned top-right of the card — click its position or ensure
the parent is targeted since it's an image, not wrapped in a labeled button).
Clicking it opens an AntD menu with two real, stable-ID items:
- `#edit-button` (text "Edit")
- `#delete-button` (text "Delete")

**Delete capability is confirmed to exist** — this means the update-lifecycle
and validation specs *can* clean up after themselves. The exact Edit-modal
pre-fill behavior (whether it reuses the same `#name-field`-style ids) and
the Delete confirmation dialog's exact copy/selectors were not fully
re-verified in a final automated pass due to an intermittent page-load issue
late in inspection (time-boxed rather than chased further) — these will be
confirmed directly while implementing `partner-update.spec.ts` (Task 6) and
the optional teardown hook, and this note will be updated if anything differs
from the assumption that Edit reuses the create form's field ids.

## Required-field validation behavior

Not yet exercised in this inspection pass (deferred to `partner-validation.spec.ts`
implementation, Task 7) — will observe and document the actual inline error
presentation (text, `aria-invalid`, etc.) at that point rather than guess it here.

## Test data implications

- This is a live, shared, multi-candidate dev environment with no visible
  automatic cleanup. Generated partner names should be clearly prefixed
  (`QA-E2E-...`) for identifiability, per the plan.
- A real logo image fixture file is required (`test-data/fixtures/partner-logo.png`,
  128×128 solid color, generated programmatically — not a 1×1 pixel).
