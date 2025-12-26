# Preventing Customizer Settings Loss

## Problem

Shopify's `config/settings_data.json` file is auto-generated and can be overwritten, causing customizer settings to revert to defaults. This happens when:
- Making dev changes to blocks/sections
- Theme updates or deployments
- Random overwrites by Shopify's system
- Pulling from git without preserving local changes

## Solutions

### 1. Regular Git Commits (Recommended)

**Always commit `config/settings_data.json` after making customizer changes:**

```bash
# After making changes in Shopify customizer:
git add config/settings_data.json
git commit -m "Update customizer settings"
git push
```

**Before pulling from git:**
```bash
# Check if you have local customizer changes
git status config/settings_data.json

# If modified, commit them first
git add config/settings_data.json
git commit -m "Save local customizer settings before pull"
git pull
```

### 2. Backup Before Making Changes

Create a backup script to save settings before making dev changes:

```bash
#!/bin/bash
# backup-settings.sh
cp config/settings_data.json config/settings_data.json.backup
echo "Settings backed up to config/settings_data.json.backup"
```

### 3. Restore from Backup

If settings are lost, restore from backup:

```bash
cp config/settings_data.json.backup config/settings_data.json
# Then upload to Shopify or commit to git
```

### 4. Use Shopify CLI for Settings Management

If using Shopify CLI, you can pull settings:

```bash
shopify theme pull --only config/settings_data.json
```

### 5. Document Critical Settings

Keep a record of important customizer settings in a separate file:

```bash
# Create a settings reference
cat config/settings_data.json | jq '.current' > config/settings_reference.json
```

## Best Practices

1. **Commit settings after every customizer change** - Don't wait, commit immediately
2. **Pull settings before making dev changes** - Ensure you have latest settings
3. **Use feature branches** - Keep customizer changes separate from code changes
4. **Regular backups** - Create backups before major changes
5. **Document changes** - Note what settings were changed and why

## Workflow

### When Making Customizer Changes:
1. Make changes in Shopify customizer
2. Immediately commit `config/settings_data.json`
3. Push to git
4. Document what changed

### Before Making Dev Changes:
1. Pull latest from git (includes latest settings)
2. Make your code changes
3. Test that settings are preserved
4. Commit everything together

### If Settings Are Lost:
1. Check git history: `git log config/settings_data.json`
2. Restore from backup if available
3. Or restore from git: `git checkout HEAD -- config/settings_data.json`
4. Re-upload to Shopify if needed

## Deploying Settings to a New Store

When deploying the theme to a new Shopify store, the `config/settings_data.json` file can be used as a reference, but some settings will need manual configuration.

### Step 1: Upload Theme with Settings File

The `config/settings_data.json` file is included when you upload the theme:
```bash
./mcc.sh push:feature
# or
shopify theme push --theme $FEATURE_ID
```

### Step 2: Review Settings in Theme Editor

1. Open Theme Editor: `./mcc.sh editor:feature`
2. Navigate through all settings sections
3. Compare with values in `config/settings_data.json` (use as reference)

### Step 3: Update Store-Specific Settings

Some settings contain store-specific references that need updating:

**Logo and Images**:
- Logo: `shopify://shop_images/HearLogoSmall-03.png` - Upload logo and update reference
- Favicon: Upload and set in Theme Settings → Logo

**Color Schemes**:
- Review all color scheme values
- Adjust if brand colors differ for new store
- Test color contrast for accessibility

**Typography**:
- Font settings should work if using system fonts
- Custom fonts may need re-uploading if used

**Spacing and Layout**:
- Page width: Verify `page_width` value (default: 1600)
- Grid spacing: Review `spacing_grid_horizontal` and `spacing_grid_vertical`
- Section spacing: Review `spacing_sections`

**Button Styles**:
- Border thickness, opacity, radius
- Shadow settings
- These are design preferences and can be adjusted

**Card Styles**:
- Product cards, collection cards, blog cards
- Border, shadow, padding settings

### Step 4: Restore Critical Settings

Use `config/settings_data.json` as a reference to restore important settings:

```bash
# View current settings structure
cat config/settings_data.json | jq '.current' | less

# Extract specific setting groups
cat config/settings_data.json | jq '.current | {logo, logo_width, page_width}'
```

**Critical Settings to Verify**:
- Logo and logo width
- Page width
- Color schemes (especially scheme-1 and scheme-2)
- Button styles (border radius, shadows)
- Typography scale
- Animation preferences

### Step 5: Handle App Block References

The `config/settings_data.json` file contains app block references (e.g., `shopify://apps/...`). These will need to be updated:

1. Install required apps in new store (see `DEPENDENCIES.md`)
2. Add app blocks in Theme Editor
3. Note new app block IDs
4. Update `config/settings_data.json` with new IDs (or let Theme Editor update automatically)

**Note**: App block IDs are store-specific and will differ on new stores.

### Step 6: Test Settings

After configuring settings:
1. Preview theme: `./mcc.sh open:feature`
2. Test all pages and sections
3. Verify colors, spacing, and layout match expectations
4. Test responsive breakpoints
5. Verify animations work correctly

### Step 7: Commit Updated Settings

Once settings are configured for the new store:
```bash
# Pull latest settings from Shopify
./mcc.sh pull:feature

# Review changes
git diff config/settings_data.json

# Commit new store settings
git add config/settings_data.json
git commit -m "Update settings for new store deployment"
git push
```

### Settings That Must Be Manually Configured

These settings cannot be automatically transferred and must be set manually:

1. **Logo and Favicon** - Must be uploaded to new store
2. **App Block IDs** - Will be different on new store
3. **Asset References** - `shopify://` URLs need updating
4. **Page References** - Page handles may differ
5. **Collection References** - Collection handles may differ
6. **Store-Specific Content** - Any custom content blocks

### Using Settings as Template

For a completely new store, you can:
1. Use `config/settings_data.json` as a design reference
2. Manually configure settings in Theme Editor to match
3. Focus on critical design settings (colors, typography, spacing)
4. Let Shopify generate new `settings_data.json` with correct store references

## Important Notes

- `config/settings_data.json` is marked as "auto-generated" but should still be committed to git
- Shopify may overwrite this file during theme updates
- Always check git status before pulling to avoid losing local customizer changes
- Consider using `.gitattributes` to mark this file as important (though it's already tracked)
- When deploying to a new store, treat `config/settings_data.json` as a reference, not a direct copy
- Store-specific references (assets, pages, collections, apps) will need manual updating







