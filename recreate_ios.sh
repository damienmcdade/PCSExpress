#!/bin/bash
set -e
cd /Users/damiengantt-mcdade/Desktop/PCSExpress/pcs-express

echo "==> Removing ios directory..."
rm -rf ios

echo "==> Adding iOS platform fresh..."
npx cap add ios

echo "==> Syncing web assets..."
npx cap sync ios

echo "==> Done! Listing new public/assets:"
ls ios/App/App/public/assets/
