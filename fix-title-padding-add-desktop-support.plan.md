# Add Desktop Support for Title Padding

## Problem Analysis

- Current CSS (lines 485-491) only applies on mobile: `@media (max-width: 767px)`
- Header is fixed on both mobile AND desktop (`.header-wrapper` has `position: fixed`)
- Titles are being cut off on desktop because there's no spacing
- The removal rule at lines 475-480 only applies on mobile, so desktop might work differently

## Current State

**Mobile (working):**
- Removal rule applies (lines 475-480) - removes padding/margin
- Our fix applies (lines 485-491) - adds padding to h1 elements
- Result: Working ✅

**Desktop (not working):**
- Removal rule does NOT apply (only mobile)
- Our fix does NOT apply (only mobile)
- Result: Titles cut off ❌

## Recommended Solution

**Add desktop styles to the existing fix:**

The removal rule doesn't apply on desktop, so we have two options:

1. **Option A: Add desktop media query** - Apply the same h1 padding on desktop
2. **Option B: Remove mobile-only restriction** - Apply padding on all screen sizes

Since the header is fixed on both mobile and desktop, we need spacing on both.

## Implementation

### File to Update:

**layout/theme.liquid** (lines 483-492):

Change from mobile-only to include desktop:

```liquid
/* Add title padding directly to h1 elements for collection, cart, and page templates */
{%- if template.name == 'collection' or template.name == 'cart' or (template.name == 'page' and template != 'index') -%}
/* Mobile */
@media (max-width: 767px) {
  html:not(.mcc-merch-mode) .collection-hero__title,
  html:not(.mcc-merch-mode) cart-items .title--primary,
  html:not(.mcc-merch-mode) .main-page-title {
    padding-top: 120px !important;
  }
}

/* Desktop */
@media (min-width: 768px) {
  html:not(.mcc-merch-mode) .collection-hero__title,
  html:not(.mcc-merch-mode) cart-items .title--primary,
  html:not(.mcc-merch-mode) .main-page-title {
    padding-top: 120px !important;
  }
}
{%- endif -%}
```

Or simpler - remove the media query restriction entirely:

```liquid
/* Add title padding directly to h1 elements for collection, cart, and page templates */
{%- if template.name == 'collection' or template.name == 'cart' or (template.name == 'page' and template != 'index') -%}
html:not(.mcc-merch-mode) .collection-hero__title,
html:not(.mcc-merch-mode) cart-items .title--primary,
html:not(.mcc-merch-mode) .main-page-title {
  padding-top: 120px !important;
}
{%- endif -%}
```

## Benefits

- Fixes desktop title cutoff issue
- Maintains mobile fix that's already working
- Simple addition - just extend the existing rule
- No conflicts since removal rule doesn't apply on desktop

## How It Works

- On desktop, the removal rule (lines 475-480) doesn't apply (mobile-only)
- So padding on h1 elements should work without conflicts
- Header is fixed on desktop too, so spacing is needed
- Same 120px spacing for consistency


