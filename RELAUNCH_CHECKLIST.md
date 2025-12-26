# Relaunch Checklist

Complete checklist for relaunching the Malibu Coffee Company theme on a new Shopify store.

## Pre-Deployment

### Code Preparation
- [ ] All code committed to git repository
- [ ] Latest changes pulled from Shopify: `./mcc.sh pull:feature`
- [ ] All uncommitted files reviewed and committed
- [ ] Git repository backed up (pushed to remote)
- [ ] Documentation files up to date

### Store Setup
- [ ] New Shopify store created or existing store prepared
- [ ] Store admin access confirmed
- [ ] Theme development permissions granted
- [ ] Store URL documented in `STORE_INFO.md`

## Theme IDs Setup

- [ ] List themes: `shopify theme list`
- [ ] Create or identify development theme
- [ ] Create or identify staging theme (optional)
- [ ] Note production/live theme ID
- [ ] Create `.env` file from `.env.example`
- [ ] Add theme IDs to `.env` file
- [ ] Verify `.env` configuration: `./mcc.sh dev` (should start without errors)

## App Installation

Install all required apps from Shopify App Store:

- [ ] **Judge.me Reviews** installed
- [ ] **Instafeed** installed
- [ ] **Recharge Subscriptions** installed
- [ ] **Klaviyo Reviews** installed
- [ ] **Klaviyo Email Marketing & SMS** installed
- [ ] **Simple Bundles Kits** installed
- [ ] **Wishlist Hero** installed

**After installation**: Note new app block IDs (they may differ from original store)

## Theme Upload

- [ ] Upload theme to development theme: `./mcc.sh push:feature`
- [ ] Verify upload completed successfully
- [ ] Open theme preview: `./mcc.sh open:feature`
- [ ] Confirm theme loads without errors

## Asset Management

### Upload Images to Shopify
- [ ] Logo: `HearLogoSmall-03.png` → Shopify Files
- [ ] Hero image: `BlueCan_png.webp` → Shopify Files
- [ ] Partner logos: `Vintage.webp`, `Kristys.webp`, `Johns.png`, `SURF.png` → Shopify Files
- [ ] Artwork: `malibu_coffee_art.png` → Shopify Files
- [ ] Landing hero: `Screenshot_2025-09-29_at_8.13.42_PM.png` → Shopify Files

### Upload Videos to Shopify
- [ ] Footer video: `kling_20251209_H265_2.mp4` → Shopify Files
- [ ] Alternative footer video: `footer_bg_comp_test1.mp4` → Shopify Files (if needed)

### Upload Rive Animations
- [ ] `mcc_footer_crop.riv` → Shopify Files (primary animation)
- [ ] `mcc_footer_expanded.riv` → Shopify Files (backup)
- [ ] `mcc_footer_artboard.riv` → Shopify Files (backup)

**Note**: Rive files should be in `assets/` directory and will be included in theme upload, but verify they're accessible.

### Update Asset References
- [ ] Open Theme Editor: `./mcc.sh editor:feature`
- [ ] Update all `shopify://shop_images/` references to new asset URLs
- [ ] Update all `shopify://files/videos/` references to new video URLs
- [ ] Verify all images and videos display correctly

## Page Setup

Create required pages in Shopify admin:

- [ ] **Wholesale** page created
- [ ] **Partnerships** page created
- [ ] **Contact** page created

Update page references in theme:
- [ ] Update `shopify://pages/wholesale` references
- [ ] Update `shopify://pages/partnerships` references
- [ ] Update `shopify://pages/contact` references

## Collection Setup

- [ ] **All products** collection exists (usually auto-created)
- [ ] **Beans** collection created (if needed)
- [ ] Verify collection handles match theme references

## Theme Configuration

### Settings Restoration
- [ ] Open Theme Editor: `./mcc.sh editor:feature`
- [ ] Review `config/settings_data.json` for reference values
- [ ] Configure logo and favicon
- [ ] Set color schemes
- [ ] Configure typography (fonts, sizes)
- [ ] Set button styles and border radius
- [ ] Configure page width and spacing
- [ ] Set animation preferences
- [ ] Configure card styles

### App Block Configuration
- [ ] Add Judge.me Reviews blocks to product templates
- [ ] Add Instafeed block to homepage
- [ ] Add Recharge subscription widgets to product templates
- [ ] Add Klaviyo Reviews blocks where needed
- [ ] Add Klaviyo email capture to footer
- [ ] Add Simple Bundles block to footer
- [ ] Add Wishlist Hero blocks where needed
- [ ] Note new app block IDs
- [ ] Update template JSON files with new block IDs (if different from original)

### Custom Sections Configuration
- [ ] Configure MCC Landing Hero section
- [ ] Configure MCC Landing Available (partner logos)
- [ ] Configure MCC Landing Instagram section
- [ ] Configure MCC Landing Newsletter section
- [ ] Configure MCC Landing Footer (video background, links)

## Testing

### Functional Testing
- [ ] **Homepage** loads correctly
- [ ] **Product pages** (coffee) display correctly
- [ ] **Product pages** (cold-brew) display correctly
- [ ] **Product pages** (merch) display correctly
- [ ] **Collection pages** load correctly
- [ ] **Cart** functionality works
- [ ] **Checkout** process completes
- [ ] **Search** functionality works

### App Integration Testing
- [ ] **Judge.me Reviews** display on product pages
- [ ] **Klaviyo Reviews** display on product pages
- [ ] **Recharge Subscriptions** widget works on product pages
- [ ] **Instafeed** displays on homepage
- [ ] **Wishlist** functionality works
- [ ] **Email capture** (Klaviyo) works in footer

### Responsive Testing
- [ ] **Desktop** (1920px, 1440px, 1280px) - all pages
- [ ] **Tablet** (768px, 1024px) - all pages
- [ ] **Mobile** (375px, 414px) - all pages
- [ ] **Touch interactions** work correctly
- [ ] **Navigation** works on mobile

### Browser Testing
- [ ] **Chrome** (desktop and mobile)
- [ ] **Safari** (desktop and mobile)
- [ ] **Firefox** (desktop)
- [ ] **Edge** (desktop)

### Performance Testing
- [ ] Page load times acceptable (< 3 seconds)
- [ ] Images optimized and loading correctly
- [ ] Videos loading and playing correctly
- [ ] Rive animations loading and playing correctly
- [ ] No console errors in browser

## Documentation

- [ ] Update `STORE_INFO.md` with new store details
- [ ] Document new app block IDs
- [ ] Document any customizations made
- [ ] Note any issues encountered and resolutions

## Pre-Launch

- [ ] All testing completed and passed
- [ ] All assets uploaded and referenced correctly
- [ ] All apps configured and working
- [ ] Theme settings configured
- [ ] Content reviewed (copy, images, links)
- [ ] SEO settings configured (meta tags, descriptions)
- [ ] Analytics tracking codes added (if applicable)

## Launch

- [ ] Push to production theme (if separate): `shopify theme push --theme $PRODUCTION_ID`
- [ ] Or publish development theme: `shopify theme publish --theme $FEATURE_ID`
- [ ] Verify live site loads correctly
- [ ] Test critical user flows on live site
- [ ] Monitor for errors or issues

## Post-Launch

- [ ] Monitor site for 24-48 hours
- [ ] Check analytics for errors
- [ ] Verify all apps functioning correctly
- [ ] Test customer-facing features
- [ ] Document any post-launch fixes needed
- [ ] Update `STORE_INFO.md` with production theme ID

## Rollback Plan

If issues are discovered:

- [ ] Identify the issue
- [ ] Determine if quick fix is possible
- [ ] If not, rollback to previous theme version
- [ ] Document issue and resolution
- [ ] Re-test before re-launching

## Additional Notes

- Keep a backup of the previous theme before making changes
- Test in development theme before pushing to production
- Document any store-specific customizations
- Keep `STORE_INFO.md` updated with current configuration

