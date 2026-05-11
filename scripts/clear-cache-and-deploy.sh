#!/bin/bash
# Deploy to Vercel with FULL cache clear
set -e
echo "Clearing all caches..."
rm -rf .vite node_modules/.vite node_modules/.cache
rm -rf dist/ dist/public/
rm -rf *.tsbuildinfo .tsbuildinfo
npm cache clean --force 2>/dev/null || true
echo "Building..."
NODE_ENV=production npm run build
echo "Deploying to Vercel..."
vercel --prod --force --yes
echo "Purging CDN cache..."
vercel cache purge 2>/dev/null || echo "Note: Install Vercel CLI to auto-purge CDN"
echo "Done! Check: vercel.com/dashboard"
