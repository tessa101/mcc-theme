# Investigation: Coffee/Cold Brew Left Panel Placement Issue

## Problem
- The entire left side (gallery + content) is being pushed UP
- The gallery is cut off at the top
- Affects both coffee and cold brew product pages

## Root Cause Identified

### The Issue
Commit `3f1565f` ("Fix title padding on collection, cart, and page templates") modified spacing removal rules to fix collection/cart/page templates, but **product templates were NOT excluded** from the spacing removal.

### Before Commit 3f1565f
- All templates (including product) had spacing removed from `#MainContent` and `.shopify-section:first-of-type`
- Product pages relied on `.product-container` margin-top: 80px for spacing

### After Commit 3f1565f
- Collection/cart/page templates were excluded from `#MainContent` spacing removal
- Collection/cart/page templates got `::before` pseudo-elements to add spacing back
- **Product templates were NOT excluded** - they still have spacing removed
- `.shopify-section:first-of-type` rule still applies to ALL templates including product

### Current State in `layout/theme.liquid`

**Lines 468-473:** Excludes collection/cart/page from `#MainContent` removal, but product is NOT excluded:
```liquid
{%- if template.name != 'collection' and template.name != 'cart' and not (template.name == 'page' and template != 'index') -%}
html:not(.mcc-merch-mode) #MainContent {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
{%- endif -%}
```

**Lines 475-480:** Removes spacing from first section - applies to ALL templates including product:
```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type,
html:not(.mcc-merch-mode) .shopify-section-header + .shopify-section,
html:not(.mcc-merch-mode) .collection .collection-hero {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
```

**Lines 483-505:** Adds `::before` pseudo-elements for collection/cart/page, but **product is NOT included**

### Why Content Appears "Pushed Up"
1. The `.shopify-section:first-of-type` rule removes ALL top spacing from the product section
2. The `.mcc-product` section has no top spacing (removed by the rule)
3. The `.product-container` margin-top: 80px is the only spacing, but if the section itself is pulled up, this may not be sufficient
4. The gallery gets cut off because the entire left panel starts too high

## Solution Options

### Option 1: Exclude Product Templates from Section Removal Rule (Recommended)
Modify line 475 to exclude product templates:
```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type:not(:has(.mcc-product)),
```
OR add product to the exclusion list in a different way.

### Option 2: Add ::before Pseudo-element for Product Templates
Similar to collection/cart/page templates, add spacing back using ::before:
```css
html:not(.mcc-merch-mode) .shopify-section:has(.mcc-product)::before {
  content: '';
  display: block;
  height: 80px; /* or appropriate height */
  width: 100%;
  background: transparent;
  pointer-events: none;
}
```

### Option 3: Increase .product-container Margin-Top
Increase the margin-top on `.product-container` to compensate for removed section spacing, but this is a workaround rather than fixing the root cause.

## Recommended Fix
**Option 1** is recommended because:
- It fixes the root cause (spacing removal)
- It's consistent with how collection/cart/page templates were fixed
- It allows `.product-container` margin-top to work as intended
- It's cleaner than adding pseudo-elements

## Files to Modify
- `layout/theme.liquid` - Exclude product templates from spacing removal rules

