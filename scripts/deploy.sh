#!/usr/bin/env bash
set -e

BRANCH="${1:-dev1}"

export PATH=/usr/local/bin:/usr/bin:/bin:$PATH
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🚀 [1/5] Moving to project directory..."
cd /home/ubuntu/quizz-app

echo "📥 [2/5] Fetching latest changes for branch: $BRANCH..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "📦 [3/5] Installing dependencies with cached store..."
pnpm install --frozen-lockfile --prefer-offline

echo "⚡ [4/5] Building applications with Turborepo..."
pnpm turbo run build

echo "🔄 [5/5] Performing Zero-Downtime PM2 reload..."
pm2 reload ecosystem.config.js --update-env || pm2 restart ecosystem.config.js --update-env

echo "✅ [SUCCESS] Deployment completed successfully for branch: $BRANCH!"
