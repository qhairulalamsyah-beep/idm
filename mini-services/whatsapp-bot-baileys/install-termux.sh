#!/bin/bash

# ========================================
# IDM WhatsApp Bot - Quick Install Script
# Untuk Termux (Android)
# ========================================

echo "🤖 IDM WhatsApp Bot Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if running in Termux
if ! command -v pkg &> /dev/null; then
    echo "❌ Script ini hanya untuk Termux!"
    exit 1
fi

# Update packages
echo "📦 Updating packages..."
pkg update && pkg upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
pkg install nodejs git python build-essential binutils -y

# Create bot directory
echo "📁 Creating bot directory..."
mkdir -p ~/bot
cd ~/bot

# Clone repository if not exists
if [ ! -d "idm" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/qhairulalamsyah-beep/idm.git
else
    echo "📥 Updating repository..."
    cd idm
    git pull
    cd ..
fi

# Enter bot directory
cd idm/mini-services/whatsapp-bot-baileys

# Install npm dependencies
echo "📦 Installing node dependencies..."
npm install

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Install selesai!"
echo ""
echo "🚀 Untuk menjalankan bot:"
echo "   cd ~/bot/idm/mini-services/whatsapp-bot-baileys"
echo "   npm start"
echo ""
echo "📱 Scan QR Code dengan WhatsApp untuk login"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
