# Theme Dependencies

This document lists all dependencies required for the Malibu Coffee Company Shopify theme.

## Shopify CLI

**Required Version**: Latest stable version

**Installation**:
```bash
# macOS
brew tap shopify/shopify
brew install shopify-cli

# Or via npm
npm install -g @shopify/cli @shopify/theme
```

**Verification**:
```bash
shopify version
shopify theme --version
```

**Documentation**: [Shopify CLI Docs](https://shopify.dev/docs/themes/tools/cli)

## Base Theme

**Theme**: Dawn
**Version**: 15.4.0
**Author**: Shopify

This theme is based on Shopify's Dawn theme. The base theme files are included in this repository.

## Third-Party Apps

The following Shopify apps must be installed in the store for full functionality:

### 1. Judge.me Reviews
- **Purpose**: Product reviews and ratings
- **App Block IDs Used**:
  - `61ccd3b1-a9f2-4160-9fe9-4fec8413e5d8` (preview_badge)
  - `61ccd3b1-a9f2-4160-9fe9-4fec8413e5d8` (review_widget)
  - `61ccd3b1-a9f2-4160-9fe9-4fec8413e5d8` (judgeme_core)
- **Used In**:
  - Product templates (product.json, product.coffee.json, product.cold-brew.json, product.merch.json)
  - Footer (config/settings_data.json)
- **Installation**: Install from Shopify App Store
- **Note**: Block IDs may differ on new stores - update template files after installation

### 2. Instafeed
- **Purpose**: Instagram feed integration
- **App Block ID**: `c447db20-095d-4a10-9725-b5977662c9d5`
- **Used In**:
  - Homepage (templates/index.json)
  - Landing pages
- **Installation**: Install from Shopify App Store

### 3. Recharge Subscriptions
- **Purpose**: Subscription product functionality
- **App Block IDs Used**:
  - `371eed76-0b44-4869-9813-730372ea378e` (subscription-widget-v2)
  - `371eed76-0b44-4869-9813-730372ea378e` (storefront-experiences)
  - `371eed76-0b44-4869-9813-730372ea378e` (recharge-theme)
- **Used In**:
  - Product templates (product.coffee.json, product.cold-brew.json)
  - Footer (config/settings_data.json)
- **Installation**: Install from Shopify App Store or Recharge dashboard

### 4. Klaviyo Reviews
- **Purpose**: Product reviews and ratings
- **App Block IDs Used**:
  - `db20e365-d984-4ac4-9655-e1588d951ca9` (product-reviews)
  - `db20e365-d984-4ac4-9655-e1588d951ca9` (featured-reviews-carousel)
- **Used In**:
  - Product templates (product.json, product.coffee.json, product.cold-brew.json)
  - Homepage (templates/index.json)
- **Installation**: Install from Shopify App Store

### 5. Klaviyo Email Marketing & SMS
- **Purpose**: Email capture and marketing
- **App Block ID**: `2632fe16-c075-4321-a88b-50b567f42507` (klaviyo-onsite-embed)
- **Used In**:
  - Footer (config/settings_data.json)
- **Installation**: Install from Shopify App Store

### 6. Simple Bundles Kits
- **Purpose**: Product bundle functionality
- **App Block ID**: `e553276b-36b2-446d-b80a-aa47fe5f96ac` (simple-bundles-v2)
- **Used In**:
  - Footer (config/settings_data.json)
- **Installation**: Install from Shopify App Store

### 7. Wishlist Hero
- **Purpose**: Wishlist/favorites functionality
- **App Block IDs Used**:
  - `a9a5079b-59e8-47cb-b659-ecf1c60b9b72` (customize-style-block)
  - `a9a5079b-59e8-47cb-b659-ecf1c60b9b72` (collection-embed)
  - `a9a5079b-59e8-47cb-b659-ecf1c60b9b72` (app-embed)
- **Used In**:
  - Footer (config/settings_data.json)
  - Product templates (product.merch.json)
- **Installation**: Install from Shopify App Store

## Custom Sections

The theme includes custom sections built specifically for MCC:

### MCC Landing Sections
- `mcc-landing-hero` - Hero section for landing pages
- `mcc-landing-available` - Partner/availability logos section
- `mcc-landing-instagram` - Instagram feed section
- `mcc-landing-newsletter` - Newsletter signup section
- `mcc-landing-footer` - Footer with video background

### MCC Product Sections
- `product-merch` - Custom product template for merchandise
- `product-coffee` - Custom product template for coffee products
- `product-cold-brew` - Custom product template for cold brew products

**Location**: `sections/` directory

## Custom Snippets

Custom Liquid snippets used throughout the theme:

- `mcc-product-form.liquid` - Custom product form
- `mcc-merch-product-form.liquid` - Merchandise product form
- And many more in `snippets/` directory

## Asset Dependencies

### Rive Animations
- `mcc_footer_crop.riv` - Footer kelp animation (primary, used in production)
- `mcc_footer_expanded.riv` - Alternative footer animation
- `mcc_footer_artboard.riv` - Footer artboard animation

**Location**: `assets/` directory
**Usage**: Referenced in `sections/mcc-landing-footer.liquid`

### Images
All images are stored in `assets/` directory. Some images are also referenced via `shopify://shop_images/` URLs which need to be uploaded to the Shopify store.

### Videos
- Footer background videos stored in `assets/` and referenced via `shopify://files/videos/`

## JavaScript Dependencies

The theme uses vanilla JavaScript (no external JS libraries required). Custom JavaScript files:

- `loop_bundle.js` - Bundle product functionality
- Various inline scripts in Liquid templates

## CSS Dependencies

- Custom CSS files in `assets/` directory
- Base Dawn theme CSS (included)
- No external CSS frameworks required

## Browser Support

The theme supports modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Dependencies

For local development:
- Git (for version control)
- Shopify CLI (for theme development)
- Text editor or IDE (VS Code recommended)

## Deployment Dependencies

For deployment to a new store:
- Access to Shopify store admin
- Theme development permissions
- All required apps installed (see Third-Party Apps above)

## Version Compatibility

- **Shopify CLI**: Latest stable version
- **Shopify API**: Compatible with current Shopify platform
- **Liquid**: Shopify Liquid (latest)

## Notes

- App block IDs are store-specific. When deploying to a new store, you'll need to:
  1. Install the apps
  2. Add app blocks in the Theme Editor
  3. Note the new block IDs
  4. Update template JSON files with new IDs

- Some `shopify://` asset references will need to be updated when deploying to a new store. See `ASSETS.md` for a complete list.

- The theme is designed to work without all apps installed, but some features will be disabled if apps are missing.

