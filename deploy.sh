#!/bin/bash

echo "--- Building Backend for Production ---"
# Navigate to the backend directory, run the build, then navigate back.
(cd backend && npm run build)

if [ $? -ne 0 ]; then
  echo "Error: Backend build failed. Aborting deployment."
  exit 1
fi

echo "Backend build successful."


# --- IMPORTANT ---
# EDIT THIS VARIABLE to the correct path of your deployment staging directory.
DEPLOY_STAGING_DIR="/Users/raphael/Documents/air-dome-deploy-staging"

# --- SCRIPT ---

echo "--- Deployment Script Started ---"

# Expand the tilde to the user's home directory
DEPLOY_STAGING_DIR=$(eval echo "$DEPLOY_STAGING_DIR")
SOURCE_DIR=$(pwd)

echo "Source directory: $SOURCE_DIR"
echo "Deployment staging directory: $DEPLOY_STAGING_DIR"

# Exit if the staging directory doesn't exist
if [ ! -d "$DEPLOY_STAGING_DIR" ]; then
  echo "Error: Deployment staging directory not found at $DEPLOY_STAGING_DIR"
  echo "Please create the directory and clone your deployment repository into it."
  exit 1
fi

echo "--- Cleaning Staging Directory ---"
echo "Contents before cleaning:"
ls -la "$DEPLOY_STAGING_DIR"

# Remove old files from staging to ensure a clean copy
rm -rf "$DEPLOY_STAGING_DIR/backend"
rm -rf "$DEPLOY_STAGING_DIR/nginx"
rm -f "$DEPLOY_STAGING_DIR/docker-compose.yml"
rm -f "$DEPLOY_STAGING_DIR/mosquitto.conf"

echo "Contents after cleaning:"
ls -la "$DEPLOY_STAGING_DIR"

echo "--- Copying Files ---"

# Function to check for copy errors
copy_with_check() {
  cp -r "$1" "$2"
  if [ $? -ne 0 ]; then
    echo "Error: Failed to copy $1 to $2"
    exit 1
  fi
}

copy_with_check ./backend "$DEPLOY_STAGING_DIR/"
copy_with_check ./nginx "$DEPLOY_STAGING_DIR/"
copy_with_check ./docker-compose.yml "$DEPLOY_STAGING_DIR/"
copy_with_check ./mosquitto.conf "$DEPLOY_STAGING_DIR/"

echo "--- Verifying Copy ---"
echo "Contents of staging directory after copy:"
ls -la "$DEPLOY_STAGING_DIR"



echo ""
echo "----------------------------------------"
echo "File copy complete."
echo "Next steps:"
echo "1. cd \"$DEPLOY_STAGING_DIR\""
echo "2. git add ."
echo "3. git commit -m \"Your deployment message\""
echo "4. git push"
echo "----------------------------------------"
