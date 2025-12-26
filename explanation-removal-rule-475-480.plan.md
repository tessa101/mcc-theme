# Explanation: The Removal Rule at Lines 475-480

## What the Rule Does

```css
html:not(.mcc-merch-mode) .shopify-section:first-of-type,
html:not(.mcc-merch-mode) .shopify-section-header + .shopify-section,
html:not(.mcc-merch-mode) .collection .collection-hero {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
```

This rule **removes all top spacing** (both padding-top and margin-top) from:
1. The first section on the page (`.shopify-section:first-of-type`)
2. The section immediately after the header (`.shopify-section-header + .shopify-section`)
3. Collection hero elements (`.collection .collection-hero`)

## Why It's There

### Context: "Kill Dawn's Pushdown"

The comment at line 461 says: `/* MOBILE: kill Dawn's pushdown when NOT in merch-mode */`

**Dawn Theme's Automatic Behavior:**
- Dawn (the base theme) automatically adds spacing to push content down below fixed/sticky headers
- It uses CSS variables like `--header-bottom-position` to calculate spacing
- This prevents content from being hidden behind a fixed header
- Dawn adds this spacing automatically to `#MainContent` and first sections

**This Theme's Custom Behavior:**
- This custom theme wants to **manually control** spacing instead of using Dawn's automatic pushdown
- On mobile (when NOT in merch-mode), they want content to start at the very top
- The rule "kills" Dawn's automatic spacing by setting it to 0 with `!important`

### Why It Removes Padding/Margin

The rule removes **both** padding and margin because:
1. **Dawn might add either** - Dawn's automatic spacing could use padding OR margin depending on the element
2. **Complete removal** - To ensure NO spacing exists, both are removed
3. **!important ensures override** - The `!important` flag ensures this rule overrides Dawn's default spacing

## The Problem This Creates

**For most pages:** This works fine - content starts at the top as intended.

**For specific pages (collection, cart, page templates):** 
- The titles are getting cut off because there's NO spacing
- The fixed header covers the top of the content
- We need 120px of space, but the removal rule prevents us from adding it

## Why Our Fixes Haven't Worked

Every attempt to add spacing has failed because:
- The removal rule uses `!important` and targets the same elements
- CSS specificity: The removal rule comes AFTER our additions, so it wins
- The rule is too broad - it removes spacing from ALL first sections, not just the ones that don't need it

## The Solution Challenge

We need spacing on collection/cart/page templates, but:
- Can't add padding-top (removed by rule)
- Can't add margin-top (removed by rule)
- Can't modify the rule to exclude these templates (already tried, didn't work)
- Need a property that's NOT padding or margin

**That's why transform translateY or margin-bottom on header are better options** - they use properties that aren't affected by this removal rule.


