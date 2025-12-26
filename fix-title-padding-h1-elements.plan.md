# Fix Title Padding by Adding Padding to H1 Elements

## Problem Analysis

- All previous attempts have failed:
  1. CSS padding-top on #MainContent - overridden
  2. CSS padding-top on inner wrappers - overridden  
  3. JavaScript with MutationObserver - caused flashing
  4. Spacer divs - affected by removal rules
  5. Modifying removal rule - didn't work
  6. CSS ::before pseudo-element - didn't work

- The removal rules at line 475-480 target sections and MainContent
- H1 title elements are deeper in the DOM and may not be affected by these rules
- Adding padding-top directly to the h1 elements themselves could work

## Recommended Solution

**Add padding-top directly to the h1 title elements**:

- Target `.collection-hero__title` for collection pages
- Target `.title--primary` for cart page
- Target `.main-page-title` for page templates
- These elements are deep in the DOM structure and may escape the removal rules

## Implementation

### File to Update:

**layout/theme.liquid** (replace lines 483-493):

Remove the ::before approach and replace with:

```liquid
/* Add title padding directly to h1 elements for collection, cart, and page templates */
{%- if template.name == 'collection' or template.name == 'cart' or (template.name == 'page' and template != 'index') -%}
@media (max-width: 767px) {
  html:not(.mcc-merch-mode) .collection-hero__title,
  html:not(.mcc-merch-mode) cart-items .title--primary,
  html:not(.mcc-merch-mode) .main-page-title {
    padding-top: 120px !important;
  }
}
{%- endif -%}
```

## Benefits

- Targets elements deep in the DOM that may not be affected by section-level removal rules
- Direct approach - adds space exactly where the title is
- Simple CSS-only solution
- No JavaScript or HTML changes needed
- Specific selectors reduce chance of conflicts

## How It Works

- `.collection-hero__title` - the h1 on collection pages
- `.title--primary` - the h1 on cart page (inside cart-items)
- `.main-page-title` - the h1 on page templates
- Padding is applied directly to these elements, pushing them down
- Only applies on mobile (max-width: 767px) and when not in merch-mode


