# Investigation: Gallery Placement and Mobile Image Flash Issues

## Issues Found

### Issue 1: Gallery Still Cut Off / Pushed Up
- The `:has()` selector approach didn't fix the problem
- Possible causes:
  1. `:has()` selector not supported in all browsers or has specificity issues
  2. The spacing removal rule might still be applying despite the exclusion
  3. Grid alignment issue - items might be vertically centered instead of top-aligned

### Issue 2: Mobile Hero Image (4th Image) Flashing
- The mobile hero image (`product.media[3]`) is flashing over the whole page on load
- Current CSS:
  - Desktop: `display: none` (line 125)
  - Mobile: `display: block` (line 1808)
- Possible causes:
  1. Image visible briefly before CSS loads (FOUC - Flash of Unstyled Content)
  2. CSS conflict causing it to appear on desktop
  3. Z-index issue causing it to appear over everything
  4. The image has `loading="lazy"` which might cause delayed loading and flashing

## Investigation Findings

### Current CSS for Mobile Hero:
```css
.product-hero-mobile {
  display: none;  /* Desktop default */
}

@media (max-width: 768px) {
  .product-hero-mobile {
    display: block;  /* Mobile only */
  }
}
```

### Current Spacing Removal Rule:
```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type:not(:has(.mcc-product)),
```
- Uses `:has()` selector which might not work in all browsers
- Might have specificity issues

### Grid Alignment:
- `.product-container` now has `align-items: start` (added in fix)
- But gallery might still be cut off if section spacing is removed

## Proposed Solutions

### For Mobile Image Flash:
1. Add `visibility: hidden` to desktop default (more aggressive than display: none)
2. Add `!important` to ensure it's hidden
3. Consider adding inline style or moving CSS earlier in load order
4. Check if there's a z-index issue

### For Gallery Placement:
1. Use a more reliable method than `:has()` - maybe add a class to product sections
2. Or use a CSS-only approach with higher specificity
3. Add explicit padding-top to `.mcc-product` section as fallback
4. Verify the spacing removal rule is actually being excluded

