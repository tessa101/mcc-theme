# Theme Backup and Portability Guide

This document provides a quick reference for the backup and portability system implemented for the Malibu Coffee Company Shopify theme.

## Quick Start

### For Current Store (Backup)
1. **Create backup**: Run `./scripts/backup-theme.sh`
2. **Document store info**: Copy `.store-info.example` to `STORE_INFO.md` and fill in details
3. **Push to remote**: `git push` (backup script does this automatically)

### For New Store (Deploy)
1. **Read**: `DEPLOYMENT.md` - Complete deployment guide
2. **Follow**: `RELAUNCH_CHECKLIST.md` - Step-by-step checklist
3. **Reference**: `DEPENDENCIES.md` - Required apps and tools
4. **Check**: `ASSETS.md` - Assets that need re-uploading

## File Overview

### Documentation Files
- **DEPLOYMENT.md** - Complete guide for deploying to a new store
- **RELAUNCH_CHECKLIST.md** - Detailed checklist for relaunching
- **DEPENDENCIES.md** - All required apps, tools, and dependencies
- **ASSETS.md** - Complete list of assets and shopify:// references
- **PREVENTING_CUSTOMIZER_SETTINGS_LOSS.md** - Settings backup and restoration guide

### Configuration Files
- **.env.example** - Template for theme IDs (copy to `.env`)
- **.store-info.example** - Template for documenting store information
- **mcc.sh** - Updated to use environment variables for theme IDs
- **.gitignore** - Updated to exclude store-specific information

### Scripts
- **scripts/backup-theme.sh** - Automated backup script

## Key Features

### Portability
- ✅ Theme IDs configurable via `.env` file (not hardcoded)
- ✅ Store-specific info documented separately (not in code)
- ✅ All code committed to git repository
- ✅ Complete documentation for new store deployment

### Security
- ✅ Sensitive files excluded from git (`.env`, `.shopify-cli.yml`)
- ✅ Store-specific info in separate file (gitignored)
- ✅ No API keys or secrets in codebase

### Backup
- ✅ Automated backup script with git tags
- ✅ All code and assets committed
- ✅ Settings preservation guide
- ✅ Asset reference documentation

## Workflow

### Daily Development
```bash
# Start development
./mcc.sh dev

# Make changes, test, then backup
./scripts/backup-theme.sh
```

### Before Major Changes
```bash
# Pull latest from Shopify
./mcc.sh pull:feature

# Create backup
./scripts/backup-theme.sh

# Make changes
# ... your work ...

# Commit and backup again
./scripts/backup-theme.sh
```

### Deploying to New Store
1. Follow `DEPLOYMENT.md` step-by-step
2. Use `RELAUNCH_CHECKLIST.md` to track progress
3. Reference `DEPENDENCIES.md` for required apps
4. Use `ASSETS.md` to identify assets to re-upload

## Environment Setup

### First Time Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your theme IDs
# FEATURE_ID=123456789012
# STAGING_ID=123456789013 (optional)
# PRODUCTION_ID=123456789014 (optional)
```

### Get Theme IDs
```bash
# List all themes in your store
shopify theme list

# Copy the numeric ID for each theme
```

## Backup Strategy

### Automated Backup
The `scripts/backup-theme.sh` script:
1. Pulls latest from Shopify (if FEATURE_ID is set)
2. Stages all changes
3. Creates a commit with timestamp
4. Creates a git tag (backup-YYYYMMDD-HHMMSS)
5. Pushes to remote repository

### Manual Backup
```bash
# Pull latest
./mcc.sh pull:feature

# Commit everything
git add -A
git commit -m "Manual backup: [description]"

# Push to remote
git push
```

### Restore from Backup
```bash
# List backup tags
git tag -l "backup-*"

# Checkout specific backup
git checkout backup-20251204-120000

# Or restore specific file
git checkout backup-20251204-120000 -- config/settings_data.json
```

## Store Information

### Documenting Current Store
1. Copy `.store-info.example` to `STORE_INFO.md`
2. Fill in all store details
3. Update when store configuration changes
4. **Note**: `STORE_INFO.md` is gitignored - it's for local reference only

### For New Store
- Use `.store-info.example` as template
- Document new store details
- Keep separate from code repository

## Important Notes

### What's Portable
- ✅ All theme code (Liquid, CSS, JS)
- ✅ Custom sections and snippets
- ✅ Theme structure and templates
- ✅ Local assets (in `assets/` directory)
- ✅ Settings as reference (needs manual configuration)

### What Needs Manual Setup
- ⚠️ Theme IDs (documented, not hardcoded)
- ⚠️ App block IDs (store-specific)
- ⚠️ `shopify://` asset references (need re-upload)
- ⚠️ Page and collection handles
- ⚠️ Store-specific settings

### Git Repository
- **Remote**: `git@github.com:tessa101/mcc-theme.git`
- **Branch**: Current working branch (check with `git branch`)
- **Backup**: All code committed and pushed to remote

## Troubleshooting

### Theme IDs Not Working
- Check `.env` file exists and has correct values
- Verify Shopify CLI is authenticated: `shopify auth status`
- List themes: `shopify theme list`

### Backup Script Fails
- Ensure you're in git repository
- Check git remote is configured: `git remote -v`
- Verify you have push permissions

### Settings Not Applying
- See `PREVENTING_CUSTOMIZER_SETTINGS_LOSS.md`
- Pull latest settings: `./mcc.sh pull:feature`
- Manually configure in Theme Editor

## Next Steps

1. **For Current Store**:
   - Run `./scripts/backup-theme.sh` regularly
   - Keep `STORE_INFO.md` updated
   - Commit settings after customizer changes

2. **For New Store**:
   - Read `DEPLOYMENT.md` thoroughly
   - Follow `RELAUNCH_CHECKLIST.md`
   - Reference all documentation files as needed

3. **Maintenance**:
   - Keep documentation updated
   - Add new assets to `ASSETS.md`
   - Update dependencies in `DEPENDENCIES.md`

## Support

For issues or questions:
- Review relevant documentation file
- Check git history: `git log`
- Check backup tags: `git tag -l "backup-*"`
- Review Shopify CLI docs: https://shopify.dev/docs/themes/tools/cli

