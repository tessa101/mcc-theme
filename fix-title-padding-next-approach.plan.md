# Try Padding-Top on Spacer Div or Margin-Top on First Section

## Problem Analysis
- Spacer div with height approach didn't work
- Rule at line 475 removes margin-top from `.shopify-section:first-of-type`
- There's a duplicate spacer in theme.liquid (line 532) with display: none
- Need to try different approach: padding-top on spacer or margin-top on first section

## Recommended Solution
**Option 1: Use padding-top on spacer div instead of height**
- Change spacer div to use `padding-top` instead of `height`
- Padding is less likely to collapse than height

**Option 2: Add margin-top to first section**
- Override the rule at line 475 that removes margin from first section
- Add margin-top: 120px to first section on affected templates

## Implementation

### Option 1: Padding-Top on Spacer Div

Update spacer divs to use padding-top:
- Change inline style from `style="height: 0; width: 100%;"` 
- To: `style="padding-top: 0; width: 100%;"`

Update CSS:
```css
.title-padding-spacer {
  padding-top: 0;
  display: block;
}

@media (max-width: 767px) {
  .title-padding-spacer {
    padding-top: 120px !important;
  }
}
```

### Option 2: Margin-Top on First Section

Add CSS to override rule at line 475:
```css
@media (max-width: 767px) {
  html:not(.mcc-merch-mode) .shopify-section:first-of-type:has(.collection-hero),
  html:not(.mcc-merch-mode) .shopify-section:first-of-type:has(cart-items),
  html:not(.mcc-merch-mode) .shopify-section:first-of-type:has(.main-page-title) {
    margin-top: 120px !important;
  }
}
```


