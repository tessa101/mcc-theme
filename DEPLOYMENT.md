# Theme Deployment Guide

This guide explains how to deploy the Malibu Coffee Company theme to a new Shopify store.

## Prerequisites

1. **Shopify CLI** installed and authenticated
   ```bash
   shopify version  # Check if installed
   shopify auth login  # Authenticate if needed
   ```

2. **Access to the new Shopify store** with theme development permissions

3. **Git repository** cloned locally
   ```bash
   git clone git@github.com:tessa101/mcc-theme.git
   cd mcc-theme
   ```

## Step 1: Get Theme IDs from New Store

1. List all themes in your store:
   ```bash
   shopify theme list
   ```

2. Identify or create themes:
   - **Feature/Development theme**: For active development (create a duplicate of live theme if needed)
   - **Staging theme** (optional): For QA/testing
   - **Production theme**: The live theme (usually named "Live theme")

3. Note the theme IDs (numeric values) for each theme

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your theme IDs:
   ```bash
   FEATURE_ID=123456789012
   # STAGING_ID=123456789013
   # PRODUCTION_ID=123456789014
   ```

3. Verify the configuration:
   ```bash
   ./mcc.sh dev  # Should start development server with your theme ID
   ```

## Step 3: Install Required Apps

Before deploying, ensure these apps are installed in the new store:

1. **Judge.me Reviews** - Required for product reviews
   - App block ID: `61ccd3b1-a9f2-4160-9fe9-4fec8413e5d8`
   - Used in: Product templates, footer

2. **Instafeed** - For Instagram feed integration
   - App block ID: `c447db20-095d-4a10-9725-b5977662c9d5`
   - Used in: Homepage, landing pages

3. **Recharge Subscriptions** - For subscription products
   - App block ID: `371eed76-0b44-4869-9813-730372ea378e`
   - Used in: Product templates (coffee, cold-brew)

4. **Klaviyo Reviews** - For product reviews
   - App block ID: `db20e365-d984-4ac4-9655-e1588d951ca9`
   - Used in: Product templates, homepage

5. **Klaviyo Email Marketing** - For email capture
   - App block ID: `2632fe16-c075-4321-a88b-50b567f42507`
   - Used in: Footer

6. **Simple Bundles Kits** - For bundle products
   - App block ID: `e553276b-36b2-446d-b80a-aa47fe5f96ac`
   - Used in: Footer

7. **Wishlist Hero** - For wishlist functionality
   - App block ID: `a9a5079b-59e8-47cb-b659-ecf1c60b9b72`
   - Used in: Footer, product templates

**Note**: App block IDs may change when installing apps on a new store. You'll need to update template files with the new block IDs after installation.

## Step 4: Upload Theme Files

1. Push theme to your feature theme:
   ```bash
   ./mcc.sh push:feature
   ```

   Or manually:
   ```bash
   shopify theme push --theme $FEATURE_ID
   ```

2. Verify upload was successful:
   ```bash
   ./mcc.sh open:feature
   ```

## Step 5: Handle Shopify Asset References

The theme contains references to assets using `shopify://` URLs. These need to be re-uploaded to the new store:

### Images (`shopify://shop_images/`)
- `HearLogoSmall-03.png` - Main logo
- `BlueCan_png.webp` - Homepage hero image
- `Vintage.webp`, `Kristys.webp`, `Johns.png`, `SURF.png` - Partner logos
- `malibu_coffee_art.png` - Artwork image
- `Screenshot_2025-09-29_at_8.13.42_PM.png` - Landing page hero

### Videos (`shopify://files/videos/`)
- `kling_20251209_H265_2.mp4` - Footer background video
- `footer_bg_comp_test1.mp4` - Footer background (alternative)

### Pages (`shopify://pages/`)
- `wholesale` - Wholesale page
- `partnerships` - Partnerships page
- `contact` - Contact page

### Collections (`shopify://collections/`)
- `all` - All products collection
- `beans` - Beans collection

**Action Required**: After uploading the theme, go to the Theme Editor and update all `shopify://` references to point to the correct assets/pages/collections in your new store.

## Step 6: Configure Theme Settings

1. Open the theme in the Theme Editor:
   ```bash
   ./mcc.sh editor:feature
   ```

2. Restore settings from `config/settings_data.json`:
   - The settings file is included in the theme
   - Some settings may need manual adjustment for the new store
   - See `PREVENTING_CUSTOMIZER_SETTINGS_LOSS.md` for details

3. Critical settings to verify:
   - Logo and favicon
   - Color schemes
   - Typography settings
   - Button styles
   - Page width and spacing

## Step 7: Update App Block IDs

After installing apps, the app block IDs in templates may need updating:

1. Check template files for `shopify://apps/` references
2. In the Theme Editor, add the app blocks to sections
3. Note the new block IDs from the theme editor
4. Update template JSON files with new block IDs

**Templates that use app blocks**:
- `templates/product.json`
- `templates/product.coffee.json`
- `templates/product.cold-brew.json`
- `templates/product.merch.json`
- `templates/index.json`
- `config/settings_data.json` (footer app blocks)

## Step 8: Test Critical Functionality

1. **Product pages**: Verify all product types work (coffee, cold-brew, merch)
2. **Reviews**: Check Judge.me and Klaviyo reviews display correctly
3. **Subscriptions**: Test Recharge subscription widgets
4. **Collections**: Verify collection pages load correctly
5. **Cart and checkout**: Test full purchase flow
6. **Mobile responsiveness**: Test on mobile devices
7. **Custom sections**: Test all MCC custom sections

## Step 9: Deploy to Production

Once testing is complete:

1. Push to production theme (if separate from feature):
   ```bash
   shopify theme push --theme $PRODUCTION_ID
   ```

2. Or publish the feature theme as live:
   ```bash
   shopify theme publish --theme $FEATURE_ID
   ```

## Troubleshooting

### Theme IDs not working
- Verify you're authenticated: `shopify auth status`
- Check theme IDs are correct: `shopify theme list`
- Ensure `.env` file exists and has correct values

### App blocks not displaying
- Verify apps are installed in the store
- Check app block IDs match between template and installed app
- Re-add app blocks in Theme Editor if needed

### Assets not loading
- Upload missing assets to Shopify Files/Images
- Update `shopify://` references in Theme Editor
- Check asset file names match exactly

### Settings not applying
- Pull latest settings: `./mcc.sh pull:feature`
- Manually configure critical settings in Theme Editor
- Refer to `config/settings_data.json` for reference values

## Additional Resources

- [Shopify CLI Documentation](https://shopify.dev/docs/themes/tools/cli)
- [Theme Development Guide](https://shopify.dev/docs/themes)
- See `RELAUNCH_CHECKLIST.md` for a complete checklist
- See `DEPENDENCIES.md` for full dependency list

