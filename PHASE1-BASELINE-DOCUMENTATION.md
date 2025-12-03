# Phase 1: Baseline Documentation - Header Spacing Control

**Date:** Created as baseline before implementing header spacing consolidation
**Branch:** `fix/consolidate-header-spacing`

## Current State Summary

### Header Configuration

**File:** `sections/header-group.json`
- `margin_bottom`: **0** (currently no spacing below header)
- `padding_top`: **0**
- `padding_bottom`: **4**

**File:** `sections/header.liquid` (lines 84-93)
- Uses `section.settings.margin_bottom` for spacing
- Mobile: `margin-bottom: {{ section.settings.margin_bottom | times: 0.75 | round: 0 }}px`
- Desktop (≥750px): `margin-bottom: {{ section.settings.margin_bottom }}px`
- Currently results in 0px margin-bottom on all breakpoints

### Section Padding Defaults

All section files have default `padding_top: 36px`:
- `sections/main-page.liquid`: padding_top default 36px, padding_bottom default 36px
- `sections/main-cart-items.liquid`: padding_top default 36px, padding_bottom default 36px
- `sections/main-login.liquid`: padding_top default 36px, padding_bottom default 36px
- `sections/main-account.liquid`: padding_top default 36px, padding_bottom default 36px
- `sections/main-addresses.liquid`: padding_top default 36px, padding_bottom default 36px

### Current ::before Implementation

**File:** `layout/theme.liquid` (lines 553-648)

**Mobile (max-width: 767px):**
- Collection pages: `::before` adds 60px height
- Cart pages: `::before` adds 60px height
- Page templates: `::before` adds 60px height
- Login page: `::before` adds 80px height (inconsistent!)

**Desktop (min-width: 768px):**
- Collection pages: `::before` adds 60px height
- Cart pages: `::before` adds 60px height
- Page templates: `::before` adds 60px height
- Login page: `::before` adds 80px height (inconsistent!)

**Section Padding Removal:**
- Removes `padding-top` from sections containing:
  - `.collection-hero` (collection pages)
  - `cart-items` (cart page)
  - `.main-page-title` (page templates)
  - `.customer.login` or `#login` (login page)

### Spacing Removal Rules

**File:** `layout/theme.liquid` (lines 530-551)

**Mobile only (max-width: 767px):**
- Sets `--header-bottom-position: 0px !important` on body
- Removes padding/margin from `#MainContent` (except collection, cart, page templates)
- Removes padding/margin from first section after header (except product sections)

### Issues Identified

1. **Inconsistent spacing**: Login page uses 80px while others use 60px
2. **Dispersed control**: Spacing controlled in multiple places (header settings, section settings, override rules)
3. **Theme editor vulnerability**: Settings can be changed in theme editor, causing inconsistencies
4. **Fragile approach**: `::before` pseudo-elements can be overridden
5. **Missing pages**: Account and Addresses pages not explicitly handled in `::before` rules

### Pages Affected

- Collection pages (Coffee, Merch)
- Cart page
- Page templates (About, Contact, Privacy, etc.)
- Login page
- Account page
- Addresses page
- Order pages

## Next Steps

1. Phase 2: Hard-code header margin-bottom to 60px
2. Phase 3: Remove section padding conflicts
3. Phase 4: Remove ::before approach
4. Phase 5: Final testing

