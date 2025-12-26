# Cleanup and Next Options for Title Padding Fix

## Complete List of Attempted Solutions (All Failed)

1. **CSS padding-top on #MainContent** - Overridden by removal rules
2. **CSS padding-top on inner wrappers** (.collection-hero__inner, cart-items > .page-width, etc.) - Overridden
3. **JavaScript with MutationObserver** - Caused flashing, removed
4. **Spacer divs with height** - Affected by removal rules
5. **Spacer divs with padding-top** - Affected by removal rules
6. **Modifying removal rule to exclude templates** - Didn't work
7. **CSS ::before pseudo-element** - Didn't work
8. **CSS padding-top on h1 elements** - Just tried, didn't work

## Root Cause Analysis

The aggressive removal rule at lines 475-480 in `layout/theme.liquid`:
```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
```

This rule is overriding ALL attempts to add spacing, regardless of:
- Where we add it (MainContent, sections, inner wrappers, h1 elements)
- How we add it (padding, margin, spacer divs, ::before pseudo-elements)

## Remaining Viable Options

### Option 1: Transform translateY (Recommended)
- Use `transform: translateY(120px)` on the first section's content
- Transform doesn't affect layout flow, so removal rules won't affect it
- Visual movement without fighting padding/margin rules

### Option 2: Position Relative with Top
- Use `position: relative; top: 120px` on content wrappers
- Moves elements visually without affecting layout
- May have z-index considerations

### Option 3: Min-Height on Sections
- Add `min-height: calc(100vh + 120px)` or similar
- Ensures sections have minimum space
- Less precise but might work

### Option 4: Body/HTML Padding
- Add padding to `body` or `html` element for affected templates
- Higher in the cascade, might not be overridden
- Could affect entire page layout

### Option 5: Margin-Bottom on Header
- Instead of pushing content down, push header up
- Add `margin-bottom: 120px` to header on affected templates
- Different approach - moves header instead of content

### Option 6: CSS Custom Properties (Variables)
- Use CSS variables that can be overridden
- Set `--title-spacing: 120px` and use it
- Might still be overridden by !important rules

### Option 7: Position Absolute Spacer
- Create absolutely positioned spacer element
- `position: absolute; top: 0; height: 120px`
- Separate from normal flow

## Cleanup Needed

### Files to Clean Up:

1. **layout/theme.liquid** (lines 483-492):
   - Remove the failed h1 padding approach
   - Currently: padding-top on h1 elements (didn't work)

2. **Plan files to delete**:
   - `fix-title-padding-h1-elements.plan.md` (failed approach)
   - `fix-title-padding-modify-removal-rule.plan.md` (failed approach)
   - `fix-title-padding-next-approach.plan.md` (failed approach)
   - `fix-title-padding-on-specific-pages.plan.md` (failed ::before approach)

## Recommended Next Step

**Try Option 1: Transform translateY**

This is the most promising because:
- Transform properties are separate from padding/margin
- Won't be affected by the removal rules
- Creates visual space without layout conflicts
- Used successfully elsewhere in the codebase (merch drawer, animations)

Implementation would be:
```liquid
{%- if template.name == 'collection' or template.name == 'cart' or (template.name == 'page' and template != 'index') -%}
@media (max-width: 767px) {
  html:not(.mcc-merch-mode) .shopify-section:first-of-type > * {
    transform: translateY(120px);
  }
}
{%- endif -%}
```

Or target specific content wrappers:
```liquid
html:not(.mcc-merch-mode) .collection-hero,
html:not(.mcc-merch-mode) cart-items,
html:not(.mcc-merch-mode) .shopify-section:has(.main-page-title) {
  transform: translateY(120px);
}
```


