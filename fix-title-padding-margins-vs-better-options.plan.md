# Why Margins Won't Work & Better Alternatives

## Why Margins Won't Work

The removal rule at lines 475-480 removes **BOTH** padding AND margin:

```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type {
  padding-top: 0 !important;
  margin-top: 0 !important;  /* ← Also removes margins! */
}
```

So trying `margin-top` on sections will fail for the same reason `padding-top` failed - the rule explicitly removes it with `!important`.

## Better Options Than Margins

### Option 1: Transform translateY (BEST - Recommended)
**Why it's better:**
- Transform is completely separate from padding/margin
- Won't be affected by the removal rules
- Used successfully elsewhere in codebase (merch drawer, animations)
- Creates visual space without layout conflicts

**Implementation:**
```liquid
{%- if template.name == 'collection' or template.name == 'cart' or (template.name == 'page' and template != 'index') -%}
@media (max-width: 767px) {
  html:not(.mcc-merch-mode) .shopify-section:first-of-type > * {
    transform: translateY(120px);
  }
}
{%- endif -%}
```

### Option 2: Margin-Bottom on Header
**Why it's better:**
- Header isn't targeted by the removal rule
- Pushes content down by pushing header up
- Different approach - affects header instead of content

**Implementation:**
```liquid
{%- if template.name == 'collection' or template.name == 'cart' or (template.name == 'page' and template != 'index') -%}
@media (max-width: 767px) {
  html:not(.mcc-merch-mode) .shopify-section-header {
    margin-bottom: 120px !important;
  }
}
{%- endif -%}
```

### Option 3: Position Relative with Top
**Why it's better:**
- Position properties are separate from padding/margin
- Moves elements visually without affecting layout flow
- Similar to transform but uses positioning

**Implementation:**
```liquid
{%- if template.name == 'collection' or template.name == 'cart' or (template.name == 'page' and template != 'index') -%}
@media (max-width: 767px) {
  html:not(.mcc-merch-mode) .collection-hero,
  html:not(.mcc-merch-mode) cart-items,
  html:not(.mcc-merch-mode) .shopify-section:has(.main-page-title) {
    position: relative;
    top: 120px;
  }
}
{%- endif -%}
```

## Recommendation

**Try Option 1 (Transform translateY) first** because:
1. Transform is completely independent of padding/margin
2. Won't be affected by any removal rules
3. Already proven to work in this codebase
4. Clean, CSS-only solution

If that doesn't work, try **Option 2 (Margin-bottom on header)** as a fallback.

## Summary

- ❌ **Margins on sections**: Won't work (removed by same rule)
- ✅ **Transform translateY**: Best option (separate from padding/margin)
- ✅ **Margin-bottom on header**: Good alternative (header not targeted)
- ✅ **Position relative**: Good alternative (separate property)


