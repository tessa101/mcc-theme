# Investigation: Gallery Image 103px Height Clipping

## Problem
The main product image (`#main-product-image`) in `.gallery-main` is being clipped to 103px height instead of respecting the `min-height: 400px` on `.gallery-grid`.

## Root Cause Analysis

### Current CSS Configuration
```css
.gallery-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 4fr 1fr;
  gap: 2px;
  width: 100%;
  position: relative;
  aspect-ratio: 1.6 / 1;
  min-height: 400px;
  max-height: 1000px;
}
```

### The Issue
When `aspect-ratio: 1.6 / 1` is applied to a grid container:
- The height is calculated as: `height = width / 1.6`
- If the width is constrained to ~165px, then: `height = 165 / 1.6 = 103.125px`
- The `min-height: 400px` should override this, but it appears to not be working

### Possible Causes

1. **Width Constraint**: The `.gallery-grid` or its parent (`.product-gallery` or `.product-main`) might be getting a very narrow width (~165px), causing the aspect-ratio to calculate 103px height.

2. **CSS Specificity Conflict**: The `min-height: 400px` might be overridden by a more specific selector, or the `aspect-ratio` is taking precedence.

3. **Browser Behavior**: Some browsers may apply `aspect-ratio` before checking `min-height`, causing the 103px to be set before min-height can take effect.

4. **Grid Template Rows Conflict**: The `grid-template-rows: 4fr 1fr` combined with `aspect-ratio` might be causing unexpected behavior where the grid height is constrained to the aspect-ratio calculation.

### Investigation Findings

- No CSS rules found that explicitly set `height: 103px` or similar
- `.product-gallery` has `width: 100%` - should not constrain width
- `.product-main` has `min-width: 0` - allows shrinking but shouldn't cause 165px width
- `.product-container` uses `grid-template-columns: 5fr 3fr` - should give `.product-main` adequate width
- Both `assets/mcc-product-styles.css` and `assets/mcc-layout-coffee.css` have the same `aspect-ratio: 1.6/1; min-height: 400px` rules

### Solution Approach

The fix should ensure that `min-height: 400px` takes precedence over the aspect-ratio calculation. Options:

1. **Use `height` instead of relying on aspect-ratio**: Calculate height based on width using CSS calc, but ensure min-height is respected
2. **Remove aspect-ratio and use explicit height calculation**: Use `height: max(400px, calc(100% / 1.6))` or similar
3. **Force min-height with !important**: Add `min-height: 400px !important` to ensure it overrides aspect-ratio
4. **Use container queries or different approach**: If width is being constrained, fix the width constraint first

### Investigation Results

1. **No JavaScript interference**: No JS is setting inline styles on `.gallery-grid` or `.gallery-main`
2. **No explicit 103px rules**: No CSS rules found that set `height: 103px` or `width: 165px`
3. **CSS Configuration**: Both `assets/mcc-product-styles.css` and `assets/mcc-layout-coffee.css` have:
   - `aspect-ratio: 1.6 / 1`
   - `min-height: 400px`
   - `grid-template-rows: 4fr 1fr`
4. **Width constraints**: `.product-main` has `min-width: 0` (allows shrinking), but no explicit width constraints found

### Root Cause

The issue is that `aspect-ratio: 1.6 / 1` calculates height as `width / 1.6`. If the width is constrained to ~165px (possibly due to layout collapse or grid column sizing), the height becomes 103px. The `min-height: 400px` should prevent this, but:

- **CSS Spec Behavior**: When `aspect-ratio` is set, browsers may calculate the height first based on width, and `min-height` may not override the aspect-ratio calculation in all scenarios
- **Grid Interaction**: The combination of `grid-template-rows: 4fr 1fr` with `aspect-ratio` might cause the grid to respect the aspect-ratio height before checking min-height

### Recommended Fix

**Option 1 (Recommended)**: Replace `aspect-ratio` with explicit height calculation that respects min-height:
```css
.gallery-grid {
  /* Remove aspect-ratio */
  height: max(400px, calc(100% / 1.6));
  /* Keep min-height as fallback */
  min-height: 400px;
}
```

**Option 2**: Use `!important` on min-height to force it to override aspect-ratio:
```css
.gallery-grid {
  aspect-ratio: 1.6 / 1;
  min-height: 400px !important;
}
```

**Option 3**: Remove aspect-ratio and use padding-bottom technique for aspect ratio:
```css
.gallery-grid {
  position: relative;
  padding-bottom: calc(100% / 1.6);
  min-height: 400px;
}
.gallery-grid::before {
  content: '';
  display: block;
  padding-bottom: calc(100% / 1.6);
}
```

**Option 4**: Fix width constraint first (if width is the issue), then verify min-height works.

### Next Steps

1. Check computed width of `.gallery-grid` in browser dev tools to confirm if it's ~165px
2. If width is constrained, investigate why `.product-main` or `.product-container` is narrow
3. If width is fine, implement Option 1 (replace aspect-ratio with explicit height calculation)

