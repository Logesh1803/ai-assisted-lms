#!/bin/bash
set -e

PROJECT_DIR="/home/loki/Downloads/personal/ai-assisted-lms"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "===> Deploying ThinkBloom LMS..."

cd "$PROJECT_DIR"

# 0a. Ensure PM2 is installed globally
if ! command -v pm2 &>/dev/null; then
    echo "===> PM2 not found — installing globally via npm..."
    npm install -g pm2
fi

# 0b. Ensure cloudflared is installed (direct .deb — avoids repo codename issues)
if ! command -v cloudflared &>/dev/null; then
    echo "===> cloudflared not found — installing..."
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb \
        -o /tmp/cloudflared.deb
    sudo dpkg -i /tmp/cloudflared.deb
    rm -f /tmp/cloudflared.deb
fi

# 0c. Ensure Yarn is available (via corepack)
if ! command -v yarn &>/dev/null; then
    echo "===> Yarn not found — enabling via corepack..."
    corepack enable
    corepack prepare yarn@4.11.0 --activate
fi

# 1. Create log directories for PM2 (owned by the real user, not root)
REAL_USER="${SUDO_USER:-$USER}"
mkdir -p apps/api/logs apps/web/logs apps/worker/logs
chown -R "$REAL_USER:$REAL_USER" apps/api/logs apps/web/logs apps/worker/logs

# 2. Install dependencies
echo "===> Installing dependencies..."
yarn install --frozen-lockfile

# 3. Fix ownership of any root-owned build artifacts, then generate Prisma client
echo "===> Fixing file ownership..."
for dir in libs/data-sources/generated apps/web/.next apps/api/dist apps/worker/dist; do
    if [ -d "$dir" ]; then
        chown -R "$REAL_USER:$REAL_USER" "$dir" 2>/dev/null || \
        sudo chown -R "$REAL_USER:$REAL_USER" "$dir"
    fi
done

echo "===> Generating Prisma client..."
yarn prisma:system:generate

# 4. Build all apps
echo "===> Building all apps..."
yarn build

# 5. Copy Next.js standalone static assets (required step for standalone output)
echo "===> Copying Next.js static assets..."
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public 2>/dev/null || true

# 6. Set up Nginx configs (only if nginx is installed on this system)
if command -v nginx &>/dev/null && [ -d "$NGINX_SITES" ]; then
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
else
    echo "===> Nginx not found on this machine — skipping Nginx config."
    echo "     (nginx/ configs are kept in project for server deployment)"
fi

# 7. Start/restart PM2 apps
echo "===> Starting PM2 processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 8. Auto-start PM2 on system reboot
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | bash 2>/dev/null || true

# 9. Start Cloudflare Tunnel (as a systemd service so it survives reboots)
echo "===> Starting Cloudflare Tunnel..."
CLOUDFLARED_CONFIG="$PROJECT_DIR/cloudflared/config.yml"
if [ ! -f "$CLOUDFLARED_CONFIG" ]; then
    echo "     cloudflared/config.yml not found — skipping."
elif grep -q "<TUNNEL_ID>" "$CLOUDFLARED_CONFIG"; then
    echo ""
    echo "  !! Cloudflare Tunnel not configured yet. Run these once to set it up:"
    echo ""
    echo "     cloudflared tunnel login"
    echo "     cloudflared tunnel create thinkblooms"
    echo "     # Copy the printed Tunnel ID, then edit cloudflared/config.yml"
    echo "     # Replace <TUNNEL_ID> with the real ID in both fields"
    echo "     cloudflared tunnel route dns thinkblooms thinkblooms.in"
    echo "     cloudflared tunnel route dns thinkblooms www.thinkblooms.in"
    echo "     cloudflared tunnel route dns thinkblooms api.thinkblooms.in"
    echo "     # Then re-run: sudo bash deploy.sh"
    echo ""
else
    sudo mkdir -p /etc/cloudflared
    sudo cp "$CLOUDFLARED_CONFIG" /etc/cloudflared/config.yml
    sudo cloudflared service install
    sudo systemctl enable cloudflared
    sudo systemctl restart cloudflared
    echo "     Cloudflare tunnel started (systemd service: cloudflared)"
fi

echo ""
echo "===> Deployment complete!"
echo "     Frontend : http://thinkblooms.in"
echo "     API      : http://api.thinkblooms.in"
echo "     API Docs : http://api.thinkblooms.in/api/docs"
echo ""
echo "     PM2 status: pm2 status"
echo "     PM2 logs:   pm2 logs"
