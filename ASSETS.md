# Asset Reference Guide

This document lists all assets referenced in the theme, including those using `shopify://` URLs that need to be re-uploaded when deploying to a new store.

## Local Assets (Included in Theme)

These assets are stored in the `assets/` directory and are automatically included when the theme is uploaded.

### Rive Animations
- `mcc_footer_crop.riv` - **Primary footer kelp animation** (used in production)
- `mcc_footer_expanded.riv` - Alternative footer animation
- `mcc_footer_artboard.riv` - Footer artboard animation

**Usage**: Referenced in `sections/mcc-landing-footer.liquid`
**Note**: The cropped version is the primary animation used. Canvas is offset via CSS to crop artboard below footer.

### Images (Local)
- `can-back.png` - Can rotation image (back)
- `can-front.png` - Can rotation image (front)
- `sidebar_push_up_small_screens-*.png` - Sidebar UI images
- `sidebar_slide-*.png` - Sidebar UI images
- Various other UI and product images

### Videos (Local)
- `footer_bg_16.9-2.mp4` - Footer background video (alternative)
- `footer_bg_16.9-2x.mp4` - Footer background video (retina)

**Note**: These local videos may not be used if `shopify://files/videos/` references are used instead.

## Shopify Asset References (Require Re-upload)

These assets are referenced using `shopify://` URLs and must be uploaded to the new Shopify store's Files/Images section.

### Images (`shopify://shop_images/`)

#### Logo
- `HearLogoSmall-03.png`
  - **Used in**: `config/settings_data.json` (main logo)
  - **Location**: Theme Settings → Logo
  - **Action**: Upload to Shopify Files → Images, then update reference in Theme Editor

#### Homepage Images
- `BlueCan_png.webp`
  - **Used in**: `templates/index.json` (homepage hero section)
  - **Action**: Upload to Shopify Files → Images, update in Theme Editor

#### Partner/Retailer Logos
- `Vintage.webp`
  - **Used in**: `templates/index.json` (partner logos section)
- `Kristys.webp`
  - **Used in**: `templates/index.json` (partner logos section)
- `Johns.png`
  - **Used in**: `templates/index.json` (partner logos section)
- `SURF.png`
  - **Used in**: `templates/index.json` (partner logos section)
- **Action**: Upload all partner logos to Shopify Files → Images, update in Theme Editor

#### Artwork
- `malibu_coffee_art.png`
  - **Used in**: `templates/index.json` (artwork section)
  - **Action**: Upload to Shopify Files → Images, update in Theme Editor

#### Landing Page Images
- `Screenshot_2025-09-29_at_8.13.42_PM.png`
  - **Used in**: `templates/page.landing-mcc.json` (landing page hero)
  - **Action**: Upload to Shopify Files → Images, update in Theme Editor

### Videos (`shopify://files/videos/`)

- `kling_20251209_H265_2.mp4`
  - **Used in**: 
    - `templates/index.json` (footer section)
    - `sections/footer-group.json` (footer background)
  - **Action**: Upload to Shopify Files → Videos, update in Theme Editor

- `footer_bg_comp_test1.mp4`
  - **Used in**: `sections/footer-group.json` (footer background, alternative)
  - **Action**: Upload to Shopify Files → Videos, update in Theme Editor (if using this version)

### Pages (`shopify://pages/`)

These are page handles, not assets, but need to be created in the new store:

- `wholesale`
  - **Used in**: 
    - `templates/index.json` (footer links)
    - `sections/footer-group.json` (footer links)
  - **Action**: Create "Wholesale" page in Shopify admin, ensure handle is `wholesale`

- `partnerships`
  - **Used in**: 
    - `templates/index.json` (footer links)
    - `sections/footer-group.json` (footer links)
  - **Action**: Create "Partnerships" page in Shopify admin, ensure handle is `partnerships`

- `contact`
  - **Used in**: 
    - `templates/index.json` (footer links)
    - `sections/footer-group.json` (footer links)
  - **Action**: Create "Contact" page in Shopify admin, ensure handle is `contact`

### Collections (`shopify://collections/`)

- `all`
  - **Used in**: `templates/index.json` (button link)
  - **Action**: Usually auto-created by Shopify, verify it exists

- `beans`
  - **Used in**: `sections/header-group.json` (navigation link)
  - **Action**: Create "Beans" collection in Shopify admin, ensure handle is `beans`

## Asset Upload Workflow for New Store

### Step 1: Prepare Assets
1. Collect all images listed above from original store or source files
2. Collect all videos listed above
3. Ensure file names match exactly (case-sensitive)

### Step 2: Upload to Shopify
1. Go to Shopify Admin → Content → Files
2. Upload images to appropriate folders (or root)
3. Upload videos to Files section
4. Note the new file URLs (they'll be different from original store)

### Step 3: Update Theme References
1. Open Theme Editor: `./mcc.sh editor:feature`
2. Navigate to each section/template that uses `shopify://` references
3. Update image/video pickers to select newly uploaded assets
4. Update page/collection links to point to correct pages/collections
5. Save changes

### Step 4: Verify
1. Preview theme: `./mcc.sh open:feature`
2. Check all images display correctly
3. Check all videos play correctly
4. Test all page links work
5. Test all collection links work

## Finding Asset References

To find all `shopify://` references in the codebase:

```bash
grep -r "shopify://" templates/ sections/ config/
```

## Asset Backup

To export a list of all assets for reference:

```bash
# List all shopify:// references
grep -r "shopify://" templates/ sections/ config/ > asset-references.txt

# List all local assets
find assets/ -type f -name "*.png" -o -name "*.jpg" -o -name "*.webp" -o -name "*.mp4" -o -name "*.riv" > local-assets.txt
```

## Notes

- `shopify://` URLs are store-specific and will not work on a new store
- All `shopify://` references must be updated in the Theme Editor after uploading assets
- File names are case-sensitive - ensure exact matches
- Some assets may be in subdirectories in Shopify Files - adjust paths accordingly
- Rive animation files are included in theme upload and should work automatically
- Local assets in `assets/` directory are automatically included in theme upload

## Quick Reference: Files to Upload

### Images (Upload to Shopify Files → Images)
- HearLogoSmall-03.png
- BlueCan_png.webp
- Vintage.webp
- Kristys.webp
- Johns.png
- SURF.png
- malibu_coffee_art.png
- Screenshot_2025-09-29_at_8.13.42_PM.png

### Videos (Upload to Shopify Files → Videos)
- kling_20251209_H265_2.mp4
- footer_bg_comp_test1.mp4 (if using)

### Pages (Create in Shopify Admin)
- Wholesale (handle: `wholesale`)
- Partnerships (handle: `partnerships`)
- Contact (handle: `contact`)

### Collections (Create in Shopify Admin)
- Beans (handle: `beans`)
- All (usually auto-created)

