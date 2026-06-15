#!/bin/bash
set -e

echo "===> Uninstalling ThinkBloom LMS system dependencies..."
echo "     This removes only packages installed for this project."
echo ""

# 1. Stop and remove Cloudflare Tunnel
echo "===> [1/5] Removing Cloudflare Tunnel..."
if command -v cloudflared &>/dev/null; then
    sudo systemctl stop cloudflared 2>/dev/null || true
    sudo systemctl disable cloudflared 2>/dev/null || true
    sudo cloudflared service uninstall 2>/dev/null || true
    sudo apt-get remove --purge -y cloudflared 2>/dev/null || true
    sudo rm -f /etc/apt/sources.list.d/cloudflared.list
    sudo rm -f /usr/share/keyrings/cloudflare-main.gpg
    sudo rm -rf /etc/cloudflared
    rm -rf "$HOME/.cloudflared"
    echo "     cloudflared removed."
else
    echo "     cloudflared not found — skipping."
fi

# 2. Stop and remove Nginx
echo "===> [2/5] Removing Nginx..."
if command -v nginx &>/dev/null; then
    sudo systemctl stop nginx 2>/dev/null || true
    sudo systemctl disable nginx 2>/dev/null || true
    sudo apt-get remove --purge -y nginx nginx-common nginx-full 2>/dev/null || true
    sudo apt-get autoremove -y 2>/dev/null || true
    sudo rm -rf /etc/nginx
    echo "     Nginx removed."
else
    echo "     Nginx not found — skipping."
fi

# 3. Stop and remove PM2
echo "===> [3/5] Removing PM2..."
if command -v pm2 &>/dev/null; then
    pm2 kill 2>/dev/null || true
    pm2 unstartup systemd 2>/dev/null || true
    npm uninstall -g pm2 2>/dev/null || true
    echo "     PM2 removed."
else
    echo "     PM2 not found — skipping."
fi

# 4. Remove Yarn (global)
echo "===> [4/5] Removing Yarn..."
if command -v yarn &>/dev/null; then
    npm uninstall -g yarn 2>/dev/null || true
    corepack disable 2>/dev/null || true
    echo "     Yarn removed."
else
    echo "     Yarn not found — skipping."
fi

# 5. Remove Node.js + npm
echo "===> [5/5] Removing Node.js + npm..."
read -rp "     Remove Node.js and npm from system? [y/N] " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
    if command -v node &>/dev/null; then
        sudo apt-get remove --purge -y nodejs npm 2>/dev/null || true
        sudo apt-get autoremove -y 2>/dev/null || true
        echo "     Node.js + npm removed."
    else
        echo "     Node.js not found via apt — skipping."
        echo "     If installed via nvm, run: nvm uninstall $(node -v 2>/dev/null || echo '<version>')"
    fi
else
    echo "     Skipped Node.js removal."
fi

echo ""
echo "===> Uninstall complete!"
echo "     To also delete the project folder, run:"
echo "     rm -rf /home/loki/Downloads/personal/ai-assisted-lms"
echo ""
