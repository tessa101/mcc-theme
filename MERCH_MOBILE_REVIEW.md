# Merch Mobile Drawer & Gallery Interactions Review

## Overview
This document reviews the current implementation of the merch mobile drawer and gallery interactions and behaviors for the Shopify theme.

---

## 🎨 Gallery Implementation

### Current Structure
- **Location**: `snippets/mcc-merch-mobile-vertical-gallery.liquid`
- **Container**: `.mmv-gallery` with `data-mmvg` attribute
- **Scroll Track**: `.mmv-track` with `data-mmvg-track` attribute
- **Slides**: `.mmv-slide` elements with `data-mmvg-slide` and `data-media-id` attributes

### Gallery Features

#### 1. **Vertical Scrolling**
- Uses CSS `scroll-snap-type: y mandatory` for paginated scrolling
- Each slide takes 100% of gallery viewport height (`block-size: 100%`)
- `scroll-snap-stop: always` ensures strict paging on iOS
- Gallery height: `72vh` (good balance with peek drawer)

#### 2. **Media Support**
- ✅ Images (with responsive srcset)
- ✅ Videos (with controls)
- ✅ 3D Models (with camera controls)
- Lazy loading for images after the first 2

#### 3. **Variant→Media Mapping**
- Creates a JSON map (`VariantMediaMap-{{ section.id }}`) linking:
  - Variant IDs → Media IDs
  - Color names → Media IDs (case-insensitive)
- Used for automatic gallery navigation when variant changes

#### 4. **Color Metadata**
- Each slide stores `data-color-name` and `data-color-hex` when available
- Extracted from variant metafields or options

### Gallery Interactions (JavaScript)

#### Active Slide Detection
- Uses `IntersectionObserver` with thresholds: `[0.25, 0.5, 0.75, 0.98]`
- Tracks which slide is most visible
- Updates active state accordingly

#### Soft Snap Behavior
- After scroll settles (90ms delay), snaps to nearest slide boundary
- Uses `scrollTo` with smooth behavior
- Respects `data-mmvg-busy` flag to prevent snapping during programmatic scrolls

#### Indicator Bars (⚠️ MISSING)
**Issue**: The JavaScript references `data-mmvg-bar` elements, but they are **not rendered** in the HTML.

**Expected Behavior**:
- Bars should be clickable indicators on the right side
- Clicking a bar scrolls to corresponding slide
- Active bar highlighted with darker color and taller height

**Location**: CSS exists in `mcc-merch-mobile-vertical-gallery.liquid` (lines 158-191) but HTML markup is missing.

---

## 📱 Drawer Implementation

### Current Structure
- **Location**: `sections/product-merch-mobile.liquid`
- **Drawer Element**: `.mm-drawer` with `data-mm-drawer` attribute
- **Scroll Sheet**: `.mm-sheet` with `data-mm-sheet` attribute (single scroll container)
- **Handle**: `.mm-handle` with `data-mm-handle` attribute
- **Peek Header**: `.mm-peek` with `data-mm-peek` attribute

### Drawer States

#### 1. **Closed (Peek State)**
- Position: `translateY(calc(100% - var(--mm-peek-height)))`
- Shows ~200px peek at bottom (title, price, color, Add to Cart)
- Pointer events disabled except for handle/peek elements
- Does not block gallery interaction

#### 2. **Open (Full State)**
- Position: `translateY(0)`
- Full height (`100vh`)
- Sheet becomes scrollable
- Body/HTML locked (`mm-locked` class)
- Fully interactive

#### 3. **Interactive Threshold**
- `INTERACTIVE_Y = 140px` - drawer considered "open" when Y ≤ 140px
- This delays `is-open` class until truly near top (prevents premature state changes)

### Drawer Interactions (JavaScript)

#### Drag Gestures
**Controls**:
- `EDGE_PX = 60px` - pull-down zone at top of sheet
- `PROJ_MS = 700ms` - momentum projection time
- `PROJ_GAIN = 1.45` - extra glide multiplier
- `VEL_OPEN = -0.025 px/ms` - upward flick threshold
- `VEL_CLOSE = 0.035 px/ms` - downward flick threshold
- `SNAP_PEEK_PX = 36px` - snap tolerance near bottom

**Drag Behaviors**:
1. **Handle/Peek**: Always start drag
2. **Sheet Edge**: Only if finger starts within 60px of top AND sheet is at scrollTop 0
3. **Peek Swipe Up**: From peek state, upward swipe anywhere in peek header opens drawer
4. **Takeover from Sheet**: If user swipes down while sheet is at top, take over drag

**Release Logic**:
1. **Tap (no movement)**: Toggle between open/closed
2. **Fast upward flick**: Always open
3. **Fast downward flick**: Always close
4. **Gentle release**: Project momentum, then pick nearest state (biased 40% toward peek to prevent sticking)

#### Rubberband Effect
- `FRICTION_EDGE = 0.28` - soft resistance at top/bottom boundaries
- Prevents hard stops, feels natural

#### Gesture Hygiene
- Handle/Peek: `touch-action: none` (drag only)
- Sheet: `touch-action: pan-y` (vertical scroll only)
- Prevents gesture conflicts

---

## 🔄 Integration Features

### Variant Change → Gallery Sync
**Location**: `assets/mcc-merch-mobile.js` (lines 455-594)

**Behavior**:
1. Listens for:
   - Direct picker inputs/selects (`options[Color]`)
   - Custom events (`variant:change`, `variant:changed`)
2. Looks up media ID from variant map
3. Scrolls gallery to matching media (`scrollToMedia()`)
4. Optional auto-minimize drawer (if `data-mm-autominimize="true"`)
5. Optional auto-restore drawer after delay (if `data-mm-autorestore` set)

**Busy Guard**:
- Sets `data-mmvg-busy="1"` during scroll
- Prevents soft snap from interfering
- Clears after scroll completes or timeout (700ms)

### Gallery → Peek Color Sync
**Location**: `assets/mcc-merch-mobile.js` (lines 596-689)

**Behavior**:
1. Reads color from variant picker
2. Reads hex from variant metafields (`custom.color_hex`)
3. Updates peek header:
   - Color name text
   - Color swatch background
4. Guards against numeric values (media IDs) being written to color name

**Event Sources**:
- Form change events
- `variant:change` / `variant:changed` events
- `gallery:slide` events (if color metadata provided)
- MutationObserver on variant ID input

### Add to Cart → Cart Drawer
**Location**: `assets/mcc-merch-mobile.js` (lines 691-754)

**Behavior**:
- Listens for `cart:updated` / `cart:change` events
- Fallback: intercepts form submissions to `/cart/add`
- Opens cart drawer automatically after add
- Supports Dawn cart drawer and custom implementations

---

## 🎯 Key Issues & Recommendations

### 🔴 Critical Issues

#### 1. **Missing Indicator Bars**
**Problem**: JavaScript expects `data-mmvg-bar` elements but they're not rendered.

**Fix Required**: Add indicator bars HTML to `mcc-merch-mobile-vertical-gallery.liquid`:
```liquid
<div class="mmv-indicators" data-indicators>
  {% for media in medias %}
    <button class="mmv-bar" 
            data-mmvg-bar 
            data-index="{{ forloop.index0 }}"
            aria-label="Go to image {{ forloop.index }}"
            aria-current="false">
    </button>
  {% endfor %}
</div>
```

#### 2. **Duplicate Gallery Initialization**
**Problem**: Gallery initialization code exists in both:
- `sections/product-merch-mobile.liquid` (lines 267-324)
- `assets/mcc-merch-mobile.js` (lines 394-453)

**Recommendation**: Remove from liquid file, keep only in JS file.

### 🟡 Potential Improvements

#### 1. **Drawer Transition Timing**
- Current: `360ms cubic-bezier(.16,1,.3,1)`
- Consider: Slightly faster for mobile (250-300ms)

#### 2. **Busy Guard Timeout**
- Current: `700ms` hard timeout
- Consider: Increase to `1000ms` for slower devices or longer scrolls

#### 3. **Intersection Observer Thresholds**
- Current: `[0.25, 0.5, 0.75, 0.98]`
- Consider: Add `1.0` for perfect center alignment

#### 4. **Z-Index Conflicts**
- Drawer: `z-index: 10020` (line 215 in CSS)
- Cart Drawer: `z-index: 12000` (line 429 in CSS)
- **Good**: Cart drawer properly above merch drawer

#### 5. **Pointer Events Logic**
- Current: Drawer has `pointer-events: none` when closed, except handle/peek
- **Good**: Prevents blocking gallery when peeking

---

## 📊 Interaction Flow Diagrams

### Opening Drawer
```
User taps peek/handle
  ↓
startDrag() called
  ↓
moveDrag() tracks finger
  ↓
User releases
  ↓
endDrag() calculates:
  - Velocity (fast flick?)
  - Position (near top/bottom?)
  - Momentum projection
  ↓
animateTo(targetY)
  ↓
syncInteractive() sets is-open class
```

### Changing Variant
```
User selects color variant
  ↓
Form change event fires
  ↓
handleColorChange(colorName)
  ↓
Lookup media ID in map
  ↓
setBusy(true)
  ↓
scrollToMedia(mediaId)
  ↓
IntersectionObserver watches for 90% visibility
  ↓
setBusy(false)
  ↓
Optional: Auto-minimize drawer
  ↓
Optional: Auto-restore after delay
```

### Gallery Scroll
```
User scrolls gallery
  ↓
Scroll event fires
  ↓
If busy flag set → skip snap
  ↓
Else: Clear settleTimer
  ↓
After 90ms of no scroll:
  Calculate nearest slide boundary
  ↓
scrollTo({top: nearest, behavior: 'smooth'})
  ↓
IntersectionObserver detects slide change
  ↓
Update active bar indicator
```

---

## 🧪 Testing Recommendations

### Gallery Tests
- [ ] Vertical scroll snaps to each slide correctly
- [ ] Indicator bars (when added) highlight active slide
- [ ] Clicking indicator bar scrolls to correct slide
- [ ] Variant change scrolls gallery to matching media
- [ ] Soft snap doesn't interfere during programmatic scrolls
- [ ] Works with images, videos, and 3D models

### Drawer Tests
- [ ] Drag handle opens/closes smoothly
- [ ] Tap peek header toggles drawer
- [ ] Pull down from top edge closes drawer
- [ ] Fast flicks trigger correct state
- [ ] Gentle releases pick nearest state (biased to peek)
- [ ] Rubberband effect feels natural at boundaries
- [ ] Drawer doesn't block gallery when peeking
- [ ] Sheet scrolls independently when drawer is open
- [ ] Body lock prevents background scroll when open

### Integration Tests
- [ ] Variant change updates peek color/price
- [ ] Variant change scrolls gallery (if media mapped)
- [ ] Gallery scroll updates peek color (if metadata exists)
- [ ] Add to cart opens cart drawer
- [ ] Cart drawer appears above merch drawer (z-index)
- [ ] Multiple rapid interactions don't conflict

---

## 📝 Code Quality Notes

### Strengths
✅ Clean separation of concerns (gallery vs drawer vs sync)
✅ Proper use of IntersectionObserver for performance
✅ Busy guards prevent race conditions
✅ Case-insensitive color matching
✅ Guards against numeric values in color names
✅ Respects reduced motion preferences
✅ Proper ARIA attributes and accessibility

### Areas for Improvement
⚠️ Duplicate gallery initialization code
⚠️ Missing indicator bars HTML
⚠️ Some commented-out code could be cleaned up
⚠️ Hard-coded z-index values (consider CSS variables)
⚠️ Magic numbers (e.g., `90ms`, `140px`) could be constants

---

## 🚀 Next Steps

1. **Add indicator bars HTML** to gallery snippet
2. **Remove duplicate initialization** from liquid file
3. **Test on real devices** (iOS Safari, Android Chrome)
4. **Consider adding** visual feedback during busy state
5. **Document** custom drawer attributes (`data-mm-autominimize`, `data-mm-autorestore`)

---

## 📚 Related Files

- `sections/product-merch-mobile.liquid` - Main section file
- `snippets/mcc-merch-mobile-vertical-gallery.liquid` - Gallery markup
- `snippets/mcc-merch-mobile-peek.liquid` - Peek header markup
- `assets/mcc-merch-mobile.js` - All JavaScript logic
- `assets/mcc-merch-mobile.css` - All styling

