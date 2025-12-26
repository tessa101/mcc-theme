# Modify Padding Removal Rule to Exclude Affected Sections

## Problem Analysis

- The rule at line 475-480 aggressively removes padding/margin from `.shopify-section:first-of-type` with `!important`
- This rule is overriding all our attempts to add padding
- Current approach tries to add padding after the removal, but the removal rule is too aggressive
- Solution: Modify the removal rule itself to exclude the affected sections

## Recommended Solution

**Modify the removal rule at line 475 to exclude affected sections**:

Instead of removing padding from ALL first sections, exclude:
- Sections containing `.collection-hero` (collection pages)
- Sections containing `cart-items` (cart page)  
- Sections containing `.main-page-title` (page templates like About/Contact)

This way, the removal rule won't apply to these sections, allowing padding to work naturally.

## Implementation

### File to Update:

**layout/theme.liquid** (lines 475-480):

Change from:
```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type,
html:not(.mcc-merch-mode) .shopify-section-header + .shopify-section,
html:not(.mcc-merch-mode) .collection .collection-hero {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
```

To:
```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type:not(:has(.collection-hero)):not(:has(cart-items)):not(:has(.main-page-title)),
html:not(.mcc-merch-mode) .shopify-section-header + .shopify-section:not(:has(.collection-hero)):not(:has(cart-items)):not(:has(.main-page-title)),
html:not(.mcc-merch-mode) .collection .collection-hero:not(:has(.collection-hero)) {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
```

Wait, the third selector `.collection .collection-hero` doesn't make sense with `:not(:has(.collection-hero))`. Let me refine this.

Actually, simpler approach - use `:not()` with more specific selectors:

```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type:not(:has(.collection-hero)):not(:has(cart-items)):not(:has(.main-page-title)),
html:not(.mcc-merch-mode) .shopify-section-header + .shopify-section:not(:has(.collection-hero)):not(:has(cart-items)):not(:has(.main-page-title)) {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

/* Keep the collection-hero rule but only for non-collection templates */
{%- if template.name != 'collection' -%}
html:not(.mcc-merch-mode) .collection .collection-hero {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
{%- endif -%}
```

Actually, even simpler - we can use Liquid conditionals to exclude affected templates entirely from the removal rule:

```css
/* Strip any top spacing on first section/MainContent (covers collection + product) */
/* Exclude collection, cart, and page templates from section padding removal */
{%- if template.name != 'collection' and template.name != 'cart' and not (template.name == 'page' and template != 'index') -%}
html:not(.mcc-merch-mode) .shopify-section:first-of-type,
html:not(.mcc-merch-mode) .shopify-section-header + .shopify-section,
html:not(.mcc-merch-mode) .collection .collection-hero {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
{%- endif -%}
```

This is the cleanest approach - use Liquid to conditionally exclude the entire removal rule for affected templates.

Then we can add simple padding rules for the affected templates:

```css
/* Add title padding for collection, cart, and page templates */
{%- if template.name == 'collection' or template.name == 'cart' or (template.name == 'page' and template != 'index') -%}
@media (max-width: 767px) {
  html:not(.mcc-merch-mode) .shopify-section:first-of-type {
    padding-top: 120px !important;
  }
}
{%- endif -%}
```

## Benefits

- Removes the conflict at the source (the removal rule)
- Cleaner CSS without fighting existing rules
- Uses Liquid conditionals which are reliable
- Simple padding rule can now work without conflicts
- No JavaScript needed
- No spacer divs needed


