# Project Spongebob - Kelp Implementation - Quick Reference Summary

## Asset Delivery Recommendation

**DELIVER AS GROUPED SVG FILES:**

1. `kelp-left-group.svg` - All left-side kelp/vegetation as one grouped SVG
2. `kelp-right-group.svg` - All right-side kelp/vegetation as one grouped SVG

**Why Grouped:**
- ✅ Easy placement (1-2 hours vs 4-8 hours for individual pieces)
- ✅ Maintains exact positioning relationships
- ✅ Simpler code (2 elements vs many)
- ✅ Better performance
- ✅ Designer controls positioning in design tool

**Designer Checklist:**
- [ ] Export left-side kelp as single SVG file
- [ ] Export right-side kelp as single SVG file
- [ ] **Group strands that wave together** (stalk + leaves = one group)
- [ ] **Keep separate groups for independent strands**
- [ ] Add `id` or `class` to each strand group (e.g., `kelp-strand-1`)
- [ ] Maintain exact positioning from design
- [ ] Transparent backgrounds
- [ ] Optimize paths (remove unnecessary nodes)
- [ ] Keep files under 100KB each

**SVG Internal Structure:**
- Group by meaningful units (strands that should wave together)
- Keep separate groups for strands that wave independently
- Use inline SVG (not img tags) to enable per-strand animation delays

**Leaf-Level Structure:**
- ✅ **Flatten leaves to single paths** (not groups with multiple paths)
- ✅ Simpler = easier to animate, better performance
- ✅ One `<path>` per leaf, not a `<g>` with multiple paths
- Designer should flatten/combine paths before export

**Off-Screen Elements:**
- ✅ **Include full kelp extent** in SVG (don't clip to viewport)
- ✅ Use `viewBox` to define coordinate system
- ✅ CSS handles positioning and overflow clipping
- ✅ Anchor SVG to footer bottom corners
- ✅ Use negative margins or transforms if kelp extends beyond footer
- Designer should note: "Kelp extends X pixels left/right/top of artboard"

## Placement Complexity

**With Grouped Assets: EASY (1-2 hours)**
- Two absolute-positioned containers
- Simple bottom-anchored positioning
- Minimal CSS required

**With Individual Pieces: MODERATE-HARD (4-8 hours)**
- Each strand needs individual positioning
- Complex coordinate matching
- More maintenance burden

## Wave Animation - YES, It's Possible

**Technique:** Combined CSS transforms
- `rotate()` - swaying motion
- `translateX()` - horizontal wave propagation
- `skewY()` - creates the "bend" effect
- `transform-origin: bottom center` - pivots from seabed

**Complexity:** Moderate (achievable with CSS, no JS needed)

**Example:**
```css
@keyframes kelpWave {
  0%, 100% { transform: rotate(-3deg) translateX(-2px) skewY(1deg); }
  25% { transform: rotate(4deg) translateX(8px) skewY(-2deg); }
  50% { transform: rotate(-2deg) translateX(-5px) skewY(1.5deg); }
  75% { transform: rotate(3deg) translateX(6px) skewY(-1deg); }
}
```

## Mobile Strategy

**Desktop (≥769px):** Video + animated kelp overlays
**Mobile (≤768px):** Video only (current behavior)

Hide kelp on mobile to keep it simple and performant.

## Overlay Animation Toggle

**Setting:** `enable_desktop_overlay_animation` (checkbox in MCC Landing — Footer section settings)

**Purpose:** Master switch to disable all footer overlay animation layers (Rive, GSAP, Perlin noise) on desktop, allowing video-only footer display.

**Behavior:**
- When **enabled** (default): All overlay animations render and execute (Rive canvas, GSAP animations, Perlin noise scripts)
- When **disabled**: Only video background is shown; no overlay markup or animation scripts are rendered/executed

**Location:** Shopify customizer → MCC Landing — Footer section → "Enable desktop overlay animation" checkbox

**Note:** This setting is the single source of truth for enabling/disabling footer overlay animation layers. The video background setting (`use_video_background`) remains independent and controls whether video or image background is used.

## Implementation Time Estimate

**Total: 4-6 hours**
- Structure setup: 1 hour
- Animation: 2-3 hours  
- Refinement: 1-2 hours

## Key Files to Modify

- `sections/mcc-landing-footer.liquid` - Add kelp containers and styling
- Assets folder - Add `kelp-left-group.svg` and `kelp-right-group.svg`

## Next Steps

1. Designer delivers grouped SVG files
2. Developer adds kelp containers to footer
3. Implement wave animation CSS
4. Test and refine positioning/timing
5. Hide on mobile breakpoint

