#!/usr/bin/env bash
# Theme Backup Script
# Pulls latest from Shopify, commits all changes, creates backup tag, and pushes to remote

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}→ Starting theme backup process...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

# Check if .env exists and load theme IDs
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  FEATURE_ID="${FEATURE_ID:-}"
fi

# Pull latest from Shopify if FEATURE_ID is set
if [ -n "$FEATURE_ID" ]; then
  echo -e "${YELLOW}→ Pulling latest from Shopify (theme: $FEATURE_ID)...${NC}"
  if command -v shopify &> /dev/null; then
    shopify theme pull --theme "$FEATURE_ID" || {
      echo -e "${YELLOW}Warning: Could not pull from Shopify. Continuing with local files...${NC}"
    }
  else
    echo -e "${YELLOW}Warning: Shopify CLI not found. Skipping pull from Shopify...${NC}"
  fi
else
  echo -e "${YELLOW}→ FEATURE_ID not set in .env. Skipping Shopify pull...${NC}"
fi

# Check for uncommitted changes
if git diff --quiet && git diff --cached --quiet; then
  echo -e "${YELLOW}→ No uncommitted changes found${NC}"
else
  echo -e "${GREEN}→ Staging all changes...${NC}"
  git add -A
  
  # Show what will be committed
  echo -e "${YELLOW}→ Changes to be committed:${NC}"
  git status --short
  
  # Create commit
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  COMMIT_MSG="Backup: Theme snapshot at $TIMESTAMP"
  
  echo -e "${GREEN}→ Creating commit...${NC}"
  git commit -m "$COMMIT_MSG" || {
    echo -e "${RED}Error: Failed to create commit${NC}"
    exit 1
  }
fi

# Create backup tag
TIMESTAMP_TAG=$(date +"%Y%m%d-%H%M%S")
TAG_NAME="backup-$TIMESTAMP_TAG"

echo -e "${GREEN}→ Creating backup tag: $TAG_NAME${NC}"
git tag -a "$TAG_NAME" -m "Theme backup: $TIMESTAMP_TAG" || {
  echo -e "${RED}Error: Failed to create tag${NC}"
  exit 1
}

# Push to remote
echo -e "${GREEN}→ Pushing to remote repository...${NC}"
git push origin HEAD || {
  echo -e "${RED}Error: Failed to push commits${NC}"
  exit 1
}

# Push tags
echo -e "${GREEN}→ Pushing tags...${NC}"
git push origin "$TAG_NAME" || {
  echo -e "${YELLOW}Warning: Failed to push tag (may already exist)${NC}"
}

echo -e "${GREEN}✓ Backup complete!${NC}"
echo -e "${GREEN}  Commit: $(git rev-parse --short HEAD)${NC}"
echo -e "${GREEN}  Tag: $TAG_NAME${NC}"
echo -e "${GREEN}  Remote: $(git remote get-url origin)${NC}"

# List recent backup tags
echo -e "\n${YELLOW}Recent backup tags:${NC}"
git tag -l "backup-*" | tail -5

