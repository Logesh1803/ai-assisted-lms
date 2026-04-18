#!/bin/bash
set -e

PROJECT_DIR="/home/logesh/Personal-MCA/ai-assisted-lms"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "===> Deploying ThinkBloom LMS..."

cd "$PROJECT_DIR"

# 1. Create log directories for PM2
mkdir -p apps/api/logs apps/web/logs apps/worker/logs

# 2. Install dependencies
echo "===> Installing dependencies..."
yarn install --frozen-lockfile

# 3. Generate Prisma client
echo "===> Generating Prisma client..."
yarn prisma:system:generate

# 4. Build all apps
echo "===> Building all apps..."
yarn build

# 5. Copy Next.js standalone static assets (required step for standalone output)
echo "===> Copying Next.js static assets..."
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public 2>/dev/null || true

# 6. Set up Nginx configs
echo "===> Configuring Nginx..."
sudo cp nginx/lms-api.conf "$NGINX_SITES/lms-api.conf"
sudo cp nginx/lms-web.conf "$NGINX_SITES/lms-web.conf"

# Enable sites (symlinks)
sudo ln -sf "$NGINX_SITES/lms-api.conf"  "$NGINX_ENABLED/lms-api.conf"
sudo ln -sf "$NGINX_SITES/lms-web.conf"  "$NGINX_ENABLED/lms-web.conf"

# Remove default Nginx site if present
sudo rm -f "$NGINX_ENABLED/default"

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# 7. Start/restart PM2 apps
echo "===> Starting PM2 processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 8. Auto-start PM2 on system reboot
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | bash 2>/dev/null || true

echo ""
echo "===> Deployment complete!"
echo "     Frontend : http://thinkblooms.in"
echo "     API      : http://api.thinkblooms.in"
echo "     API Docs : http://api.thinkblooms.in/api/docs"
echo ""
echo "     PM2 status: pm2 status"
echo "     PM2 logs:   pm2 logs"
